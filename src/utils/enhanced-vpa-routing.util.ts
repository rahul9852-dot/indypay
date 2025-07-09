import * as dayjs from "dayjs";
import * as utc from "dayjs/plugin/utc";
import * as timezone from "dayjs/plugin/timezone";
import { Repository } from "typeorm";
import { Cache } from "cache-manager";
import { appConfig } from "@/config/app.config";
import { CustomLogger, LoggerPlaceHolder } from "@/logger";
import { PayInOrdersEntity } from "@/entities/payin-orders.entity";
import { PAYMENT_STATUS } from "@/enums/payment.enum";
import {
  VPAHealthMetrics,
  VPATransactionRecord,
} from "@/interface/common.interface";
import { VPARoute, VPARoutingResult } from "@/utils/vpa-routing.util";
import { todayStartDate } from "@/utils/date.utils";

// Extend dayjs with the required plugins
dayjs.extend(utc);
dayjs.extend(timezone);

const {
  utkarsh: { vpas, vpaRouting },
} = appConfig();

export class EnhancedVPARoutingService {
  private readonly logger = new CustomLogger(EnhancedVPARoutingService.name);
  private currentRoundRobinIndex = 0;
  private vpaMetrics: Map<string, VPAHealthMetrics> = new Map();
  private circuitBreakerState: Map<
    string,
    { failures: number; lastFailure: Date; isOpen: boolean }
  > = new Map();
  private rateLimitCounters: Map<string, { count: number; resetTime: Date }> =
    new Map();
  private cacheManager: Cache | null = null;
  private payInOrdersRepository: Repository<PayInOrdersEntity> | null = null;
  private transactionRecords: Map<string, VPATransactionRecord> = new Map();
  private lastDailyResetDate: string | null = null; // Track when daily reset was last performed

  constructor(
    cacheManager?: Cache,
    payInOrdersRepository?: Repository<PayInOrdersEntity>,
  ) {
    this.cacheManager = cacheManager || null;
    this.payInOrdersRepository = payInOrdersRepository || null;

    // Initialize with default values, load cache/historical data asynchronously
    this.initializeDefaultMetrics();
  }

  setCacheManager(cacheManager: Cache) {
    this.cacheManager = cacheManager;
  }

  setPayInOrdersRepository(repository: Repository<PayInOrdersEntity>) {
    if (!repository) {
      this.logger.error(
        "PayInOrders repository is null - this will cause issues!",
      );

      return;
    }

    this.payInOrdersRepository = repository;

    // Trigger historical data loading if repository is now available
    if (this.vpaMetrics.size > 0) {
      this.loadHistoricalMetrics().catch((error) => {
        this.logger.error(
          `Failed to load historical metrics after repository injection: ${error.message}`,
        );
      });
    }
  }

  /**
   * Check if service is properly initialized
   */
  isServiceHealthy(): boolean {
    const hasRepository = this.payInOrdersRepository !== null;
    const hasCache = this.cacheManager !== null;
    const hasMetrics = this.vpaMetrics.size > 0;

    return hasRepository && hasCache && hasMetrics;
  }

  /**
   * Debug method to check what data is available
   */
  async debugDataAvailability() {
    this.logger.info("=== VPA Service Debug Information ===");

    // Check repository
    if (this.payInOrdersRepository) {
      try {
        const count = await this.payInOrdersRepository.count();
        this.logger.info(`Database has ${count} payin orders`);
      } catch (error) {
        this.logger.error(`Failed to count payin orders: ${error.message}`);
      }
    } else {
      this.logger.error("Repository is null!");
    }

    // Check cache
    if (this.cacheManager) {
      try {
        const cachedMetrics = await this.cacheManager.get("vpa_metrics");
        this.logger.info(`Cache has metrics: ${!!cachedMetrics}`);
      } catch (error) {
        this.logger.error(`Failed to check cache: ${error.message}`);
      }
    } else {
      this.logger.error("Cache manager is null!");
    }

    // Check metrics
    this.logger.info(`Memory has ${this.vpaMetrics.size} VPA metrics`);
    this.vpaMetrics.forEach((metrics, vpa) => {
      this.logger.info(
        `VPA ${vpa}: ${metrics.totalTransactions} transactions, ${metrics.successCount} success, ${metrics.failureCount} failures`,
      );
    });

    // Check configured VPAs vs metrics
    const configuredVPAs = vpas?.map((v) => v.vpa) || [];
    const metricsVPAs = Array.from(this.vpaMetrics.keys());

    this.logger.info(`Configured VPAs: ${configuredVPAs.join(", ")}`);
    this.logger.info(`VPAs with metrics: ${metricsVPAs.join(", ")}`);

    const onlyInMetrics = metricsVPAs.filter(
      (vpa) => !configuredVPAs.includes(vpa),
    );
    const onlyInConfig = configuredVPAs.filter(
      (vpa) => !metricsVPAs.includes(vpa),
    );

    if (onlyInMetrics.length > 0) {
      this.logger.info(
        `VPAs only in metrics (historical): ${onlyInMetrics.join(", ")}`,
      );
    }
    if (onlyInConfig.length > 0) {
      this.logger.info(
        `VPAs only in config (no metrics): ${onlyInConfig.join(", ")}`,
      );
    }

    this.logger.info("=== End Debug Information ===");
  }

  /**
   * Manually trigger cache and historical data loading
   */
  async refreshMetrics() {
    this.logger.info("Manually refreshing VPA metrics from cache and database");
    await this.loadCacheAndHistoricalData();
    await this.checkAndResetDailyMetricsIfNeeded();
  }

  /**
   * Get current IST date in YYYY-MM-DD format for consistent date comparison
   * Uses the existing date.utils.ts todayStartDate() method
   */
  private getCurrentISTDate(): string {
    return dayjs(todayStartDate()).format("YYYY-MM-DD");
  }

  /**
   * Get last daily reset date for debugging
   */
  getLastDailyResetDate(): string | null {
    return this.lastDailyResetDate;
  }

  /**
   * Get IST date from a Date object
   */
  private getISTDateFromDate(date: Date): string {
    return dayjs(date).tz("Asia/Kolkata").format("YYYY-MM-DD");
  }

  /**
   * Check if two dates are the same day in IST timezone
   */
  private isSameISTDay(date1: Date, date2: Date): boolean {
    const istDate1 = this.getISTDateFromDate(date1);
    const istDate2 = this.getISTDateFromDate(date2);

    return istDate1 === istDate2;
  }

  /**
   * Initialize default metrics for all VPAs
   */
  private initializeDefaultMetrics() {
    if (!vpas) {
      this.logger.warn("No VPAs configured");

      return;
    }

    vpas.forEach((vpa) => {
      if (!this.vpaMetrics.has(vpa.vpa)) {
        this.vpaMetrics.set(vpa.vpa, {
          vpa: vpa.vpa,
          successCount: 0,
          failureCount: 0,
          totalTransactions: 0,
          averageResponseTime: 0,
          lastSuccessTime: new Date(),
          lastFailureTime: new Date(),
          isHealthy: true,
          healthScore: 100,
          // Real-time metrics
          dailySuccessCount: 0,
          dailyFailureCount: 0,
          dailyTotalAmount: 0,
          lastTransactionTime: new Date(),
          // Historical data
          weeklySuccessCount: 0,
          weeklyFailureCount: 0,
          monthlySuccessCount: 0,
          monthlyFailureCount: 0,
          // Volume tracking for limits
          dailyTransactionCount: 0,
          dailyVolumeLimit: vpa.maxDailyAmount || 2000000, // Use environment config or default to 20L
          dailyTransactionLimit: vpa.maxDailyTransactions || 5000, // Use environment config or default to 5000
          isVolumeLimitReached: false,
          isTransactionLimitReached: false,
          volumeLimitPercentage: 0,
          transactionLimitPercentage: 0,
        });
      }
    });

    // Check if daily metrics need to be reset
    this.checkAndResetDailyMetricsIfNeeded();
  }

  /**
   * Load cache and historical data asynchronously
   */
  private async loadCacheAndHistoricalData() {
    try {
      // First try to load from cache
      await this.initializeMetrics();

      // Check if daily metrics need to be reset after loading from cache
      await this.checkAndResetDailyMetricsIfNeeded();

      // Then load historical data if repository is available
      if (this.payInOrdersRepository) {
        await this.loadHistoricalMetrics();
      }
    } catch (error) {
      this.logger.warn(
        `Failed to load cache/historical data: ${error.message}`,
      );
    }
  }

  /**
   * Load metrics from cache with proper serialization handling
   */
  private async initializeMetrics() {
    try {
      if (this.cacheManager) {
        const cachedData = await this.cacheManager.get<any>("vpa_metrics");

        if (cachedData && typeof cachedData === "object") {
          // Handle both old format (direct metrics object) and new format (with lastDailyResetDate)
          let metricsObject: any;
          let lastDailyResetDate: string | null = null;

          if (cachedData.metrics) {
            // New format with lastDailyResetDate
            metricsObject = cachedData.metrics;
            lastDailyResetDate = cachedData.lastDailyResetDate;
          } else {
            // Old format - direct metrics object
            metricsObject = cachedData;
            lastDailyResetDate = null; // Will be initialized in checkAndResetDailyMetricsIfNeeded
          }

          // Convert plain object back to Map
          const metricsMap = new Map<string, VPAHealthMetrics>();

          Object.entries(metricsObject).forEach(
            ([vpa, metricsData]: [string, any]) => {
              // Convert date strings back to Date objects
              const metrics: VPAHealthMetrics = {
                ...metricsData,
                lastSuccessTime: new Date(metricsData.lastSuccessTime),
                lastFailureTime: new Date(metricsData.lastFailureTime),
                lastTransactionTime: new Date(metricsData.lastTransactionTime),
              };
              metricsMap.set(vpa, metrics);
            },
          );

          this.vpaMetrics = metricsMap;
          this.lastDailyResetDate = lastDailyResetDate;
          this.logger.info(
            `Loaded VPA metrics from cache: ${metricsMap.size} VPAs, lastDailyResetDate: ${this.lastDailyResetDate}`,
          );

          // Ensure all configured VPAs are present
          vpas?.forEach((vpa) => {
            if (!this.vpaMetrics.has(vpa.vpa)) {
              this.logger.info(`Adding missing VPA to metrics: ${vpa.vpa}`);
              this.vpaMetrics.set(vpa.vpa, {
                vpa: vpa.vpa,
                successCount: 0,
                failureCount: 0,
                totalTransactions: 0,
                averageResponseTime: 0,
                lastSuccessTime: new Date(),
                lastFailureTime: new Date(),
                isHealthy: true,
                healthScore: 100,
                dailySuccessCount: 0,
                dailyFailureCount: 0,
                dailyTotalAmount: 0,
                lastTransactionTime: new Date(),
                weeklySuccessCount: 0,
                weeklyFailureCount: 0,
                monthlySuccessCount: 0,
                monthlyFailureCount: 0,
                // Volume tracking for limits
                dailyTransactionCount: 0,
                dailyVolumeLimit: vpa.maxDailyAmount || 2000000, // Use environment config or default to 20L
                dailyTransactionLimit: vpa.maxDailyTransactions || 5000, // Use environment config or default to 5000
                isVolumeLimitReached: false,
                isTransactionLimitReached: false,
                volumeLimitPercentage: 0,
                transactionLimitPercentage: 0,
              });
            }
          });

          return;
        } else {
          this.logger.info("No cached metrics found, initializing defaults");
        }
      }
    } catch (error) {
      this.logger.warn(
        `Failed to load metrics from cache: ${error.message}, using defaults`,
      );
    }

    // Only initialize if metrics are empty
    if (this.vpaMetrics.size === 0) {
      // Initialize with real data if available
      vpas?.forEach((vpa) => {
        this.vpaMetrics.set(vpa.vpa, {
          vpa: vpa.vpa,
          successCount: 0,
          failureCount: 0,
          totalTransactions: 0,
          averageResponseTime: 0,
          lastSuccessTime: new Date(),
          lastFailureTime: new Date(),
          isHealthy: true,
          healthScore: 100,
          dailySuccessCount: 0,
          dailyFailureCount: 0,
          dailyTotalAmount: 0,
          lastTransactionTime: new Date(),
          weeklySuccessCount: 0,
          weeklyFailureCount: 0,
          monthlySuccessCount: 0,
          monthlyFailureCount: 0,
          // Volume tracking for limits
          dailyTransactionCount: 0,
          dailyVolumeLimit: vpa.maxDailyAmount || 2000000, // Use environment config or default to 20L
          dailyTransactionLimit: vpa.maxDailyTransactions || 5000, // Use environment config or default to 5000
          isVolumeLimitReached: false,
          isTransactionLimitReached: false,
          volumeLimitPercentage: 0,
          transactionLimitPercentage: 0,
        });
      });

      this.lastDailyResetDate = this.getCurrentISTDate(); // Initialize lastDailyResetDate
      this.logger.info("Initialized VPA metrics from defaults");
    }
  }

  /**
   * Save metrics to cache with proper serialization
   */
  private async saveMetricsToCache() {
    if (!this.cacheManager) {
      this.logger.warn("Cache manager not available, skipping metrics save");

      return;
    }

    try {
      // Convert Map to plain object for proper serialization
      const metricsObject: Record<string, VPAHealthMetrics> = {};
      this.vpaMetrics.forEach((metrics, vpa) => {
        metricsObject[vpa] = metrics;
      });

      // Save metrics and lastDailyResetDate together
      const cacheData = {
        metrics: metricsObject,
        lastDailyResetDate: this.lastDailyResetDate,
      };

      // Save with longer TTL for metrics persistence (7 days instead of 24 hours)
      await this.cacheManager.set("vpa_metrics", cacheData, 604800000); // 7 days

      this.logger.debug(
        `Saved ${this.vpaMetrics.size} VPA metrics to cache with lastDailyResetDate: ${this.lastDailyResetDate}`,
      );
    } catch (error) {
      this.logger.error(`Failed to save metrics to cache: ${error.message}`);
    }
  }

  /**
   * Load historical metrics from database (optimized for performance)
   */
  private async loadHistoricalMetrics() {
    if (!this.payInOrdersRepository) {
      this.logger.warn(
        "PayInOrders repository not available, skipping historical metrics",
      );

      return;
    }

    try {
      // Get last 3 days instead of 7 days for much better performance
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      // Highly optimized query with minimal data fetch
      const historicalData = await this.payInOrdersRepository
        .createQueryBuilder("payin")
        .select([
          "payin.intent",
          "payin.amount",
          "payin.status",
          "payin.createdAt",
          "payin.successAt",
          "payin.failureAt",
        ])
        .where("payin.createdAt >= :date", { date: threeDaysAgo })
        .andWhere("payin.intent IS NOT NULL")
        .andWhere("payin.intent LIKE '%pa=%'") // Pre-filter for VPA transactions
        .orderBy("payin.createdAt", "DESC")
        .limit(5000) // Reduced limit for better performance
        .getMany();

      // Process historical data to build metrics
      const vpaStats = new Map<
        string,
        {
          successCount: number;
          failureCount: number;
          totalAmount: number;
          totalTransactions: number;
          lastTransaction: Date;
          averageResponseTime: number;
        }
      >();

      let processedCount = 0;

      this.logger.info(`Historical data: ${JSON.stringify(historicalData)}`);

      historicalData.forEach((transaction) => {
        // Extract VPA from payment intent (upi://pay?pa=VPA&...)
        const vpaMatch = transaction.intent?.match(/pa=([^&]+)/);
        if (!vpaMatch) return;

        const vpa = vpaMatch[1];
        processedCount++;
        const stats = vpaStats.get(vpa) || {
          successCount: 0,
          failureCount: 0,
          totalAmount: 0,
          totalTransactions: 0,
          lastTransaction: new Date(0),
          averageResponseTime: 0,
        };

        stats.totalTransactions++;
        stats.totalAmount += transaction.amount || 0;
        stats.lastTransaction = new Date(
          Math.max(
            stats.lastTransaction.getTime(),
            transaction.createdAt.getTime(),
          ),
        );

        // Calculate response time if we have success/failure timestamps
        if (
          transaction.status === PAYMENT_STATUS.SUCCESS &&
          transaction.successAt
        ) {
          const responseTime =
            transaction.successAt.getTime() - transaction.createdAt.getTime();
          stats.averageResponseTime =
            (stats.averageResponseTime * stats.successCount + responseTime) /
            (stats.successCount + 1);
          stats.successCount++;
        } else if (
          transaction.status === PAYMENT_STATUS.FAILED &&
          transaction.failureAt
        ) {
          const responseTime =
            transaction.failureAt.getTime() - transaction.createdAt.getTime();
          stats.averageResponseTime =
            (stats.averageResponseTime * stats.failureCount + responseTime) /
            (stats.failureCount + 1);
          stats.failureCount++;
        }

        vpaStats.set(vpa, stats);
      });

      // Merge historical data with existing metrics (IMPORTANT: Don't overwrite recent data)
      vpaStats.forEach((stats, vpa) => {
        const existingMetrics = this.vpaMetrics.get(vpa);
        if (existingMetrics) {
          // CRITICAL FIX: Only update if historical data is more recent OR if we have no recent data
          const isHistoricalMoreRecent =
            stats.lastTransaction > existingMetrics.lastTransactionTime;
          const hasNoRecentData = existingMetrics.totalTransactions === 0;
          const isHistoricalDataOlder =
            stats.lastTransaction < existingMetrics.lastTransactionTime;

          // Don't overwrite recent metrics with older historical data
          if (isHistoricalDataOlder) {
            this.logger.debug(
              `Skipping historical data for ${vpa} - existing data is more recent`,
            );

            return;
          }

          if (isHistoricalMoreRecent || hasNoRecentData) {
            this.logger.info(
              `Updating metrics for ${vpa} with historical data: ${stats.totalTransactions} transactions`,
            );

            existingMetrics.totalTransactions = stats.totalTransactions;
            existingMetrics.successCount = stats.successCount;
            existingMetrics.failureCount = stats.failureCount;
            existingMetrics.averageResponseTime = stats.averageResponseTime;
            existingMetrics.lastTransactionTime = stats.lastTransaction;

            // Update health score
            existingMetrics.healthScore =
              this.calculateHealthScore(existingMetrics);
            existingMetrics.isHealthy = existingMetrics.healthScore > 30;

            this.vpaMetrics.set(vpa, existingMetrics);
          }
        } else {
          // Create new metrics for VPA not in current config
          this.logger.info(
            `Creating new metrics for historical VPA: ${vpa} with ${stats.totalTransactions} transactions`,
          );

          this.vpaMetrics.set(vpa, {
            vpa,
            successCount: stats.successCount,
            failureCount: stats.failureCount,
            totalTransactions: stats.totalTransactions,
            averageResponseTime: stats.averageResponseTime,
            lastSuccessTime: new Date(),
            lastFailureTime: new Date(),
            isHealthy: true,
            healthScore: 100,
            dailySuccessCount: 0,
            dailyFailureCount: 0,
            dailyTotalAmount: 0,
            lastTransactionTime: stats.lastTransaction,
            weeklySuccessCount: 0,
            weeklyFailureCount: 0,
            monthlySuccessCount: 0,
            monthlyFailureCount: 0,
            // Volume tracking for limits
            dailyTransactionCount: 0,
            dailyVolumeLimit: (() => {
              const vpaConfig = vpas?.find((v) => v.vpa === vpa);

              return vpaConfig?.maxDailyAmount || 2000000; // Use environment config or default to 20L
            })(),
            dailyTransactionLimit: (() => {
              const vpaConfig = vpas?.find((v) => v.vpa === vpa);

              return vpaConfig?.maxDailyTransactions || 5000; // Use environment config or default to 5000
            })(),
            isVolumeLimitReached: false,
            isTransactionLimitReached: false,
            volumeLimitPercentage: 0,
            transactionLimitPercentage: 0,
          });
        }
      });

      // Save updated metrics to cache with longer TTL
      await this.saveMetricsToCache();

      // Only log if there's significant data
      if (processedCount > 0) {
        this.logger.info(
          `Historical metrics loaded: ${processedCount} transactions for ${vpaStats.size} VPAs`,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to load historical metrics: ${error.message}`);
    }
  }

  async selectVPA(
    userId?: string,
    amount?: number,
    orderId?: string,
  ): Promise<VPARoutingResult> {
    if (!vpas || vpas.length === 0) {
      this.logger.warn("No VPAs configured, using fallback");

      return this.createFallbackResult("No VPAs configured");
    }

    // Get healthy and available VPAs
    const availableVPAs = await this.getAvailableVPAs(amount);

    if (availableVPAs.length === 0) {
      this.logger.warn("No available VPAs found, using fallback");

      return this.createFallbackResult("No available VPAs");
    }

    // Apply routing strategy
    const result = await this.applyRoutingStrategy(
      availableVPAs,
      userId,
      amount,
      orderId,
    );

    // Record transaction start for metrics tracking
    if (orderId) {
      this.recordTransactionStart(
        orderId,
        result.selectedVpa,
        amount || 0,
        userId,
      );
    }

    // Update usage metrics
    await this.updateUsageMetrics(result.selectedVpa);

    return result;
  }

  /**
   * Record transaction start for metrics tracking
   */
  private recordTransactionStart(
    orderId: string,
    vpa: string,
    amount: number,
    userId?: string,
  ) {
    const record: VPATransactionRecord = {
      orderId,
      vpa,
      amount,
      userId: userId || "unknown",
      status: PAYMENT_STATUS.PENDING,
      createdAt: new Date(),
    };

    this.transactionRecords.set(orderId, record);

    // Store in cache for webhook processing
    if (this.cacheManager) {
      this.cacheManager.set(`vpa_transaction_${orderId}`, record, 3600000); // 1 hour
    }

    this.logger.debug(
      `Recorded transaction start: orderId=${orderId}, vpa=${vpa}, amount=${amount}`,
    );
  }

  /**
   * Process payment webhook and update real metrics
   */
  async processPaymentWebhook(
    orderId: string,
    status: PAYMENT_STATUS,
    responseTime?: number,
  ) {
    try {
      this.logger.info(
        `Processing webhook: orderId=${orderId}, status=${status}, responseTime=${responseTime}ms`,
      );

      // Get transaction record
      let record = this.transactionRecords.get(orderId);

      if (!record && this.cacheManager) {
        this.logger.debug(
          `Transaction record not in memory, checking cache for orderId: ${orderId}`,
        );
        record = await this.cacheManager.get<VPATransactionRecord>(
          `vpa_transaction_${orderId}`,
        );
      }

      if (!record) {
        this.logger.warn(`No transaction record found for orderId: ${orderId}`);
        this.logger.debug(
          `Available transaction records: ${Array.from(this.transactionRecords.keys()).join(", ")}`,
        );

        // Try to find the VPA from the database as fallback
        if (this.payInOrdersRepository) {
          try {
            const payinOrder = await this.payInOrdersRepository.findOne({
              where: { orderId },
              select: [
                "intent",
                "amount",
                "status",
                "createdAt",
                "successAt",
                "failureAt",
              ],
            });

            if (payinOrder && payinOrder.intent) {
              const vpaMatch = payinOrder.intent.match(/pa=([^&]+)/);
              if (vpaMatch) {
                const vpa = vpaMatch[1];
                this.logger.info(
                  `Found VPA ${vpa} from database for orderId: ${orderId}`,
                );

                // Update metrics directly from database data
                if (status === PAYMENT_STATUS.SUCCESS) {
                  await this.recordSuccess(
                    vpa,
                    responseTime || 0,
                    payinOrder.amount || 0,
                  );
                } else if (status === PAYMENT_STATUS.FAILED) {
                  await this.recordFailure(vpa, payinOrder.amount || 0);
                }

                this.logger.info(
                  `Updated metrics from database: orderId=${orderId}, vpa=${vpa}, status=${status}`,
                );

                return;
              }
            }
          } catch (dbError) {
            this.logger.error(
              `Failed to query database for orderId ${orderId}: ${dbError.message}`,
            );
          }
        }

        return;
      }

      // Update record
      record.status = status;
      record.completedAt = new Date();
      record.responseTime = responseTime;

      this.logger.info(
        `Found transaction record: vpa=${record.vpa}, amount=${record.amount}, status=${status}`,
      );

      // Update real metrics based on actual payment status
      if (status === PAYMENT_STATUS.SUCCESS) {
        await this.recordSuccess(record.vpa, responseTime || 0, record.amount);
      } else if (status === PAYMENT_STATUS.FAILED) {
        await this.recordFailure(record.vpa, record.amount);
      }

      // Clean up
      this.transactionRecords.delete(orderId);
      if (this.cacheManager) {
        this.cacheManager.del(`vpa_transaction_${orderId}`);
      }

      this.logger.info(
        `Processed webhook: orderId=${orderId}, status=${status}, vpa=${record.vpa}, responseTime=${responseTime}ms`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process webhook for orderId: ${orderId}: ${error.message}`,
      );
    }
  }

  private async getAvailableVPAs(amount?: number): Promise<VPARoute[]> {
    const activeVPAs = vpas?.filter((vpa) => vpa.isActive) || [];
    const availableVPAs: VPARoute[] = [];

    for (const vpa of activeVPAs) {
      const isHealthy = await this.isVPAHealthy(vpa.vpa);
      const isNotRateLimited = await this.checkRateLimit(vpa.vpa);
      const isCircuitBreakerClosed = this.isCircuitBreakerClosed(vpa.vpa);
      const isWithinLimits = await this.isVPAWithinLimits(vpa.vpa, amount);

      if (
        isHealthy &&
        isNotRateLimited &&
        isCircuitBreakerClosed &&
        isWithinLimits
      ) {
        availableVPAs.push(vpa);
      }
    }

    return availableVPAs;
  }

  private async isVPAHealthy(vpa: string): Promise<boolean> {
    const metrics = this.vpaMetrics.get(vpa);
    if (!metrics) return true;

    const healthScore = this.calculateHealthScore(metrics);
    const isHealthy = healthScore > 30; // Lowered threshold for more lenient health checks

    return isHealthy;
  }

  /**
   * Check if VPA has reached its daily volume or transaction limits
   */
  private async isVPAWithinLimits(
    vpa: string,
    amount?: number,
  ): Promise<boolean> {
    const metrics = this.vpaMetrics.get(vpa);
    if (!metrics) return true;

    // Get real-time daily metrics from database
    const dailyMetrics = await this.calculateDailyMetricsFromDatabase(vpa);

    // Check transaction count limit (applies to ALL transactions - success + failure)
    if (dailyMetrics.dailyTransactionCount >= metrics.dailyTransactionLimit) {
      this.logger.warn(
        `VPA ${vpa} has reached daily transaction limit: ${dailyMetrics.dailyTransactionCount}/${metrics.dailyTransactionLimit}`,
      );

      return false;
    }

    // Check volume limit (applies ONLY to successful transactions)
    if (dailyMetrics.dailyTotalAmount >= metrics.dailyVolumeLimit) {
      this.logger.warn(
        `VPA ${vpa} has reached daily volume limit: ${dailyMetrics.dailyTotalAmount}/${metrics.dailyVolumeLimit}`,
      );

      return false;
    }

    // Check if this transaction would exceed limits
    if (amount) {
      const newDailyTransactions = dailyMetrics.dailyTransactionCount + 1;

      // Transaction count limit applies to ALL transactions
      if (newDailyTransactions > metrics.dailyTransactionLimit) {
        this.logger.warn(
          `VPA ${vpa} would exceed daily transaction limit: ${newDailyTransactions}/${metrics.dailyTransactionLimit}`,
        );

        return false;
      }

      // Volume limit applies ONLY to successful transactions
      // We can't predict if this transaction will succeed, so we check conservatively
      // If the current volume + amount would exceed limit, we exclude the VPA
      const newDailyAmount = dailyMetrics.dailyTotalAmount + amount;
      if (newDailyAmount > metrics.dailyVolumeLimit) {
        this.logger.warn(
          `VPA ${vpa} would exceed daily volume limit if successful: ${newDailyAmount}/${metrics.dailyVolumeLimit}`,
        );

        return false;
      }
    }

    return true;
  }

  /**
   * Calculate health score based on success rate and response time
   */
  private calculateHealthScore(metrics: VPAHealthMetrics): number {
    if (metrics.totalTransactions === 0) {
      return 100; // Default score for new VPAs
    }

    // Calculate success rate
    const successRate = metrics.successCount / metrics.totalTransactions;

    // Special handling for VPAs with no failures
    let successRateScore;
    if (metrics.failureCount === 0) {
      // If no failures, give a high score based on success rate
      // Even 0% success rate gets 50 points if no failures
      successRateScore = 50 + successRate * 50;
    } else {
      // If there are failures, use the original calculation
      successRateScore = successRate * 100;
    }

    // Calculate response time score (penalize very slow responses)
    const responseTimeScore = Math.max(
      0,
      100 - Math.min(metrics.averageResponseTime / 1000, 100), // Cap at 100 seconds
    );

    // Weighted average: 60% success rate, 40% response time
    const finalScore = successRateScore * 0.6 + responseTimeScore * 0.4;

    return Math.max(0, Math.min(100, finalScore)); // Ensure score is between 0-100
  }

  /**
   * Check rate limiting for VPA
   */
  private async checkRateLimit(vpa: string): Promise<boolean> {
    const vpaConfig = vpas?.find((v) => v.vpa === vpa);
    const rateLimit = vpaConfig?.rateLimitPerMinute || 1000; // Default 1000 per minute

    const counter = this.rateLimitCounters.get(vpa);
    const now = new Date();

    if (!counter || now > counter.resetTime) {
      this.rateLimitCounters.set(vpa, {
        count: 1,
        resetTime: new Date(now.getTime() + 60000), // 1 minute from now
      });

      return true;
    }

    if (counter.count >= rateLimit) {
      this.logger.warn(`Rate limit exceeded for VPA: ${vpa}`);

      return false;
    }

    counter.count++;

    return true;
  }

  /**
   * Check if circuit breaker is closed
   */
  private isCircuitBreakerClosed(vpa: string): boolean {
    const state = this.circuitBreakerState.get(vpa);
    if (!state) return true; // Default to closed

    const vpaConfig = vpas?.find((v) => v.vpa === vpa);
    const threshold = vpaConfig?.circuitBreakerThreshold || 5;
    const timeoutMs = vpaConfig?.timeoutMs || 30000; // 30 seconds

    // Check if circuit breaker should be reset
    if (state.isOpen && Date.now() - state.lastFailure.getTime() > timeoutMs) {
      state.isOpen = false;
      state.failures = 0;
      this.logger.info(`Circuit breaker reset for VPA: ${vpa}`);
    }

    return !state.isOpen;
  }

  private async applyRoutingStrategy(
    availableVPAs: VPARoute[],
    userId?: string,
    amount?: number,
    orderId?: string,
  ): Promise<VPARoutingResult> {
    this.logger.info(`Applying routing strategy: ${vpaRouting.strategy}`);
    switch (vpaRouting.strategy) {
      case "round_robin":
        return this.enhancedRoundRobinStrategy(availableVPAs);
      case "load_balance":
        return this.enhancedLoadBalanceStrategy(availableVPAs, amount);
      case "user_based":
        return this.enhancedUserBasedStrategy(availableVPAs, userId);
      case "amount_based":
        return this.enhancedAmountBasedStrategy(availableVPAs, amount);
      case "priority_based":
        return this.enhancedPriorityBasedStrategy(availableVPAs);
      case "health_based":
        return this.healthBasedStrategy(availableVPAs);
      case "adaptive":
        return this.adaptiveStrategy(availableVPAs, userId, amount);
      default:
        return this.enhancedRoundRobinStrategy(availableVPAs);
    }
  }

  // Round Robin Strategy
  private async enhancedRoundRobinStrategy(
    vpas: VPARoute[],
  ): Promise<VPARoutingResult> {
    // Sort by health score for better distribution
    const sortedVPAs = [...vpas].sort((a, b) => {
      const aMetrics = this.vpaMetrics.get(a.vpa);
      const bMetrics = this.vpaMetrics.get(b.vpa);
      const aScore = aMetrics ? this.calculateHealthScore(aMetrics) : 100;
      const bScore = bMetrics ? this.calculateHealthScore(bMetrics) : 100;

      return bScore - aScore; // Higher score first
    });

    const selectedVpa =
      sortedVPAs[this.currentRoundRobinIndex % sortedVPAs.length];
    this.currentRoundRobinIndex =
      (this.currentRoundRobinIndex + 1) % sortedVPAs.length;

    const metrics = this.vpaMetrics.get(selectedVpa.vpa);

    return {
      selectedVpa: selectedVpa.vpa,
      strategy: "enhanced_round_robin",
      reason: `Selected VPA ${selectedVpa.vpa} (round-robin index: ${this.currentRoundRobinIndex})`,
      metadata: {
        healthScore: metrics?.healthScore || 100,
        currentLoad: metrics?.totalTransactions || 0,
        lastUsed: new Date(),
        successRate: metrics
          ? metrics.successCount / Math.max(metrics.totalTransactions, 1)
          : 1,
      },
    };
  }

  // Health-based strategy - always use the healthiest VPA
  private async healthBasedStrategy(
    vpas: VPARoute[],
  ): Promise<VPARoutingResult> {
    let bestVPA = vpas[0];
    let bestScore = 0;

    for (const vpa of vpas) {
      const metrics = this.vpaMetrics.get(vpa.vpa);
      const healthScore = metrics ? this.calculateHealthScore(metrics) : 100;

      if (healthScore > bestScore) {
        bestScore = healthScore;
        bestVPA = vpa;
      }
    }

    return {
      selectedVpa: bestVPA.vpa,
      strategy: "health_based",
      reason: `Selected VPA ${bestVPA.vpa} (health score: ${bestScore.toFixed(2)})`,
      metadata: {
        healthScore: bestScore,
        currentLoad: this.vpaMetrics.get(bestVPA.vpa)?.totalTransactions || 0,
        lastUsed: new Date(),
        successRate:
          this.vpaMetrics.get(bestVPA.vpa)?.successCount /
            Math.max(
              this.vpaMetrics.get(bestVPA.vpa)?.totalTransactions || 1,
              1,
            ) || 1,
      },
    };
  }

  // Adaptive strategy - combines health, priority, and load
  private async adaptiveStrategy(
    vpas: VPARoute[],
    userId?: string,
    amount?: number,
  ): Promise<VPARoutingResult> {
    this.logger.info(`Applying adaptive strategy`);
    // Score each VPA based on multiple factors
    const scoredVPAs = vpas.map((vpa) => {
      const metrics = this.vpaMetrics.get(vpa.vpa);
      const healthScore = metrics ? this.calculateHealthScore(metrics) : 100;
      const priorityScore = (10 - vpa.priority) * 10;
      const loadScore = Math.max(
        0,
        100 - (metrics?.totalTransactions || 0) / 10,
      );

      const totalScore =
        healthScore * 0.4 + priorityScore * 0.3 + loadScore * 0.3;

      return { vpa, score: totalScore };
    });

    this.logger.info(`Scored VPAs: ${JSON.stringify(scoredVPAs)}`);

    const bestVPA = scoredVPAs.reduce((best, current) =>
      current.score > best.score ? current : best,
    );

    this.logger.info(`Selected VPA: ${bestVPA.vpa.vpa}`);
    this.logger.info(`Selected VPA score: ${bestVPA.score.toFixed(2)}`);
    this.logger.info(`Selected VPA priority: ${bestVPA.vpa.priority}`);

    return {
      selectedVpa: bestVPA.vpa.vpa,
      strategy: "adaptive",
      reason: `Selected VPA ${bestVPA.vpa.vpa} (adaptive score: ${bestVPA.score.toFixed(2)})`,
      metadata: {
        healthScore: this.vpaMetrics.get(bestVPA.vpa.vpa)
          ? this.calculateHealthScore(this.vpaMetrics.get(bestVPA.vpa.vpa)!)
          : 100,
        currentLoad:
          this.vpaMetrics.get(bestVPA.vpa.vpa)?.totalTransactions || 0,
        lastUsed: new Date(),
        successRate:
          this.vpaMetrics.get(bestVPA.vpa.vpa)?.successCount /
            Math.max(
              this.vpaMetrics.get(bestVPA.vpa.vpa)?.totalTransactions || 1,
              1,
            ) || 1,
      },
    };
  }

  // Enhanced versions of existing strategies
  private async enhancedLoadBalanceStrategy(
    vpas: VPARoute[],
    amount?: number,
  ): Promise<VPARoutingResult> {
    return this.enhancedRoundRobinStrategy(vpas);
  }

  private async enhancedUserBasedStrategy(
    vpas: VPARoute[],
    userId?: string,
  ): Promise<VPARoutingResult> {
    return this.enhancedRoundRobinStrategy(vpas);
  }

  private async enhancedAmountBasedStrategy(
    vpas: VPARoute[],
    amount?: number,
  ): Promise<VPARoutingResult> {
    return this.enhancedRoundRobinStrategy(vpas);
  }

  private async enhancedPriorityBasedStrategy(
    vpas: VPARoute[],
  ): Promise<VPARoutingResult> {
    return this.enhancedRoundRobinStrategy(vpas);
  }

  // Update usage metrics for a VPA (only for tracking VPA selection, not actual transactions)
  private async updateUsageMetrics(vpa: string) {
    const metrics = this.vpaMetrics.get(vpa);
    if (metrics) {
      // NOTE: Do NOT increment totalTransactions here
      // totalTransactions should only be incremented when actual payment is attempted
      // This method is called when VPA is selected for payment link generation

      // Only update last used time for routing purposes
      metrics.lastTransactionTime = new Date();
      this.vpaMetrics.set(vpa, metrics);

      // Save metrics to cache
      await this.saveMetricsToCache();
    }
  }

  // Record success for a VPA with real data
  async recordSuccess(vpa: string, responseTime: number, amount = 0) {
    // Check if daily metrics need to be reset before updating
    await this.checkAndResetDailyMetricsIfNeeded();

    const metrics = this.vpaMetrics.get(vpa);
    if (metrics) {
      metrics.successCount++;
      metrics.totalTransactions++;
      metrics.lastSuccessTime = new Date();
      metrics.lastTransactionTime = new Date();
      // Don't increment daily metrics in memory - they will be calculated from database
      metrics.weeklySuccessCount++;
      metrics.monthlySuccessCount++;

      // Update average response time
      const totalTime =
        metrics.averageResponseTime * (metrics.totalTransactions - 1) +
        responseTime;
      metrics.averageResponseTime = totalTime / metrics.totalTransactions;

      // Update health score
      metrics.healthScore = this.calculateHealthScore(metrics);
      metrics.isHealthy = metrics.healthScore > 30; // Lowered threshold

      this.vpaMetrics.set(vpa, metrics);

      // Save metrics to cache
      await this.saveMetricsToCache();

      // Reset circuit breaker failures
      const circuitState = this.circuitBreakerState.get(vpa);
      if (circuitState) {
        circuitState.failures = 0;
        circuitState.isOpen = false;
      }

      this.logger.info(
        `Recorded SUCCESS for VPA ${vpa}: responseTime=${responseTime}ms, amount=${amount}, newHealthScore=${metrics.healthScore.toFixed(2)}`,
      );
    }
  }

  // Record failure for a VPA with real data
  async recordFailure(vpa: string, amount = 0) {
    // Check if daily metrics need to be reset before updating
    await this.checkAndResetDailyMetricsIfNeeded();

    const metrics = this.vpaMetrics.get(vpa);
    if (metrics) {
      metrics.failureCount++;
      metrics.totalTransactions++;
      metrics.lastFailureTime = new Date();
      metrics.lastTransactionTime = new Date();
      // Don't increment daily metrics in memory - they will be calculated from database
      metrics.weeklyFailureCount++;
      metrics.monthlyFailureCount++;
      metrics.healthScore = this.calculateHealthScore(metrics);
      metrics.isHealthy = metrics.healthScore > 30; // Lowered threshold

      this.vpaMetrics.set(vpa, metrics);

      // Save metrics to cache
      await this.saveMetricsToCache();

      // Update circuit breaker
      const circuitState = this.circuitBreakerState.get(vpa) || {
        failures: 0,
        lastFailure: new Date(),
        isOpen: false,
      };
      circuitState.failures++;
      circuitState.lastFailure = new Date();

      const vpaConfig = vpas?.find((v) => v.vpa === vpa);
      const threshold = vpaConfig?.circuitBreakerThreshold || 5;

      if (circuitState.failures >= threshold) {
        circuitState.isOpen = true;
        this.logger.warn(`Circuit breaker opened for VPA: ${vpa}`);
      }

      this.circuitBreakerState.set(vpa, circuitState);

      this.logger.info(
        `Recorded FAILURE for VPA ${vpa}: amount=${amount}, newHealthScore=${metrics.healthScore.toFixed(2)}`,
      );
    }
  }

  // Get comprehensive VPA statistics with real data
  async getEnhancedVPAStats(): Promise<any> {
    // Check service health first
    if (!this.isServiceHealthy()) {
      this.logger.warn("VPA service is not healthy - returning basic stats");

      return {
        error: "Service not properly initialized",
        totalVPAs: vpas?.length || 0,
        activeVPAs: this.getActiveVPAs().length,
        healthMetrics: [],
      };
    }

    const activeVPAs = this.getActiveVPAs();

    // Filter health metrics to only include currently configured VPAs
    const configuredVpaSet = new Set(vpas?.map((v) => v.vpa) || []);
    const healthMetrics = Array.from(this.vpaMetrics.values()).filter(
      (metrics) => configuredVpaSet.has(metrics.vpa),
    );

    // Update daily metrics from database for all VPAs
    for (const vpa of activeVPAs) {
      await this.updateDailyMetricsFromDatabase(vpa.vpa);
    }

    // Get updated metrics after database calculation
    const updatedHealthMetrics = Array.from(this.vpaMetrics.values()).filter(
      (metrics) => configuredVpaSet.has(metrics.vpa),
    );

    // Validate metrics data
    const totalTransactions = updatedHealthMetrics.reduce(
      (sum, metric) => sum + metric.totalTransactions,
      0,
    );
    const totalSuccess = updatedHealthMetrics.reduce(
      (sum, metric) => sum + metric.successCount,
      0,
    );
    const totalFailure = updatedHealthMetrics.reduce(
      (sum, metric) => sum + metric.failureCount,
      0,
    );

    this.logger.info(
      `VPA Stats Summary: Total=${totalTransactions}, Success=${totalSuccess}, Failure=${totalFailure}`,
    );
    this.logger.info(`Health Metrics: ${LoggerPlaceHolder.Json}`, {
      healthMetrics: updatedHealthMetrics,
    });

    return {
      totalVPAs: vpas?.length || 0,
      activeVPAs: activeVPAs.length,
      currentRoundRobinIndex: this.currentRoundRobinIndex,
      routingStrategy: vpaRouting.strategy,
      circuitBreakers: Array.from(this.circuitBreakerState.entries()).map(
        ([vpa, state]) => ({
          vpa,
          isOpen: state.isOpen,
          failures: state.failures,
          lastFailure: state.lastFailure,
        }),
      ),
      healthMetrics: updatedHealthMetrics.map((metrics) => ({
        vpa: metrics.vpa,
        healthScore: metrics.healthScore,
        successRate:
          metrics.totalTransactions > 0
            ? metrics.successCount / metrics.totalTransactions
            : 1,
        totalTransactions: metrics.totalTransactions,
        averageResponseTime: metrics.averageResponseTime,
        isHealthy: metrics.healthScore > 50,
        dailySuccessCount: metrics.dailySuccessCount,
        dailyFailureCount: metrics.dailyFailureCount,
        dailyTotalAmount: metrics.dailyTotalAmount,
        lastTransactionTime: metrics.lastTransactionTime,
        weeklySuccessCount: metrics.weeklySuccessCount,
        weeklyFailureCount: metrics.weeklyFailureCount,
        monthlySuccessCount: metrics.monthlySuccessCount,
        monthlyFailureCount: metrics.monthlyFailureCount,
        // Volume limit tracking
        dailyTransactionCount: metrics.dailyTransactionCount,
        dailyVolumeLimit: metrics.dailyVolumeLimit,
        dailyTransactionLimit: metrics.dailyTransactionLimit,
        isVolumeLimitReached: metrics.isVolumeLimitReached,
        isTransactionLimitReached: metrics.isTransactionLimitReached,
        volumeLimitPercentage: metrics.volumeLimitPercentage,
        transactionLimitPercentage: metrics.transactionLimitPercentage,
      })),
      vpas: activeVPAs.map((vpa) => ({
        vpa: vpa.vpa,
        priority: vpa.priority,
        isActive: vpa.isActive,
        description: vpa.description,
        healthScore: this.vpaMetrics.get(vpa.vpa)?.healthScore || 100,
      })),
      realTimeData: {
        totalActiveTransactions: this.transactionRecords.size,
        lastUpdated: new Date(),
      },
    };
  }

  // Get all active VPAs
  getActiveVPAs(): VPARoute[] {
    return vpas?.filter((vpa) => vpa.isActive) || [];
  }

  private createFallbackResult(reason: string): VPARoutingResult {
    return {
      selectedVpa: appConfig().utkarsh.vpa,
      strategy: "fallback",
      reason,
    };
  }

  /**
   * Reset daily metrics (call this daily at midnight)
   * Note: This method is now deprecated since daily metrics are calculated from database
   */
  async resetDailyMetrics() {
    this.logger.info(
      "Daily metrics reset called - using database calculation instead",
    );

    // Update daily metrics from database for all VPAs
    const activeVPAs = this.getActiveVPAs();
    for (const vpa of activeVPAs) {
      await this.updateDailyMetricsFromDatabase(vpa.vpa);
    }

    // Save updated metrics to cache
    await this.saveMetricsToCache();

    this.lastDailyResetDate = this.getCurrentISTDate();
    this.logger.info("Updated daily VPA metrics from database");
  }

  /**
   * Check if daily metrics need to be reset (called on service initialization)
   * Note: This method is now deprecated since daily metrics are calculated from database
   */
  private async checkAndResetDailyMetricsIfNeeded() {
    const currentISTDate = this.getCurrentISTDate();

    if (this.lastDailyResetDate === null) {
      this.lastDailyResetDate = currentISTDate;
      this.logger.info("Daily metrics reset date not set, initializing.");

      return;
    }

    if (this.lastDailyResetDate !== currentISTDate) {
      this.logger.info(
        `Detected new day, updating daily metrics from database from ${this.lastDailyResetDate} to ${currentISTDate}`,
      );

      // Update daily metrics from database for all VPAs
      const activeVPAs = this.getActiveVPAs();
      for (const vpa of activeVPAs) {
        await this.updateDailyMetricsFromDatabase(vpa.vpa);
      }

      this.lastDailyResetDate = currentISTDate;

      // Save updated metrics to cache
      await this.saveMetricsToCache();
      this.logger.info(
        "Updated daily metrics from database and saved to cache",
      );
    } else {
      this.logger.info("Daily metrics are from today, no update needed");
    }
  }

  /**
   * Force refresh metrics from cache (useful for debugging)
   */
  async forceRefreshMetricsFromCache() {
    try {
      this.logger.info("Force refreshing metrics from cache...");

      if (!this.cacheManager) {
        this.logger.warn("Cache manager not available");

        return;
      }

      const cachedData = await this.cacheManager.get<any>("vpa_metrics");

      if (cachedData && typeof cachedData === "object") {
        // Handle both old format (direct metrics object) and new format (with lastDailyResetDate)
        let metricsObject: any;
        let lastDailyResetDate: string | null = null;

        if (cachedData.metrics) {
          // New format with lastDailyResetDate
          metricsObject = cachedData.metrics;
          lastDailyResetDate = cachedData.lastDailyResetDate;
        } else {
          // Old format - direct metrics object
          metricsObject = cachedData;
          lastDailyResetDate = null; // Will be initialized in checkAndResetDailyMetricsIfNeeded
        }

        // Convert plain object back to Map
        const metricsMap = new Map<string, VPAHealthMetrics>();

        Object.entries(metricsObject).forEach(
          ([vpa, metricsData]: [string, any]) => {
            // Convert date strings back to Date objects
            const metrics: VPAHealthMetrics = {
              ...metricsData,
              lastSuccessTime: new Date(metricsData.lastSuccessTime),
              lastFailureTime: new Date(metricsData.lastFailureTime),
              lastTransactionTime: new Date(metricsData.lastTransactionTime),
            };
            metricsMap.set(vpa, metrics);
          },
        );

        this.vpaMetrics = metricsMap;
        this.lastDailyResetDate = lastDailyResetDate;
        this.logger.info(
          `Force refreshed VPA metrics from cache: ${metricsMap.size} VPAs, lastDailyResetDate: ${this.lastDailyResetDate}`,
        );

        // Log current metrics for debugging
        this.vpaMetrics.forEach((metrics, vpa) => {
          this.logger.info(
            `VPA ${vpa}: ${metrics.totalTransactions} transactions, ${metrics.successCount} success, ${metrics.failureCount} failures, healthScore=${metrics.healthScore.toFixed(2)}`,
          );
        });
      } else {
        this.logger.warn("No cached metrics found");
      }
    } catch (error) {
      this.logger.error(
        `Failed to force refresh metrics from cache: ${error.message}`,
      );
    }
  }

  /**
   * Calculate daily metrics directly from database for a specific VPA
   * This ensures accuracy by always getting real-time data
   */
  private async calculateDailyMetricsFromDatabase(vpa: string): Promise<{
    dailySuccessCount: number;
    dailyFailureCount: number;
    dailyTotalAmount: number;
    dailyTransactionCount: number;
  }> {
    if (!this.payInOrdersRepository) {
      this.logger.warn(
        "PayInOrders repository not available for daily metrics calculation",
      );

      return {
        dailySuccessCount: 0,
        dailyFailureCount: 0,
        dailyTotalAmount: 0,
        dailyTransactionCount: 0,
      };
    }

    try {
      const today = todayStartDate();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Query for today's transactions for this specific VPA
      const todayTransactions = await this.payInOrdersRepository
        .createQueryBuilder("payin")
        .select(["payin.status", "payin.amount", "payin.createdAt"])
        .where("payin.createdAt >= :startDate", { startDate: today })
        .andWhere("payin.createdAt < :endDate", { endDate: tomorrow })
        .andWhere("payin.intent LIKE :vpaPattern", {
          vpaPattern: `%pa=${vpa}%`,
        })
        .getMany();

      let dailySuccessCount = 0;
      let dailyFailureCount = 0;
      let dailyTotalAmount = 0;
      let dailyTransactionCount = 0;

      todayTransactions.forEach((transaction) => {
        dailyTransactionCount++;

        if (transaction.status === PAYMENT_STATUS.SUCCESS) {
          dailySuccessCount++;
          dailyTotalAmount += transaction.amount || 0;
        } else if (transaction.status === PAYMENT_STATUS.FAILED) {
          dailyFailureCount++;
        }
        // Pending transactions only count toward transaction count, not success/failure
      });

      this.logger.debug(
        `Calculated daily metrics for VPA ${vpa}: ${dailySuccessCount} success, ${dailyFailureCount} failed, ${dailyTotalAmount} amount, ${dailyTransactionCount} total transactions`,
      );

      return {
        dailySuccessCount,
        dailyFailureCount,
        dailyTotalAmount,
        dailyTransactionCount,
      };
    } catch (error) {
      this.logger.error(
        `Failed to calculate daily metrics for VPA ${vpa}: ${error.message}`,
      );

      return {
        dailySuccessCount: 0,
        dailyFailureCount: 0,
        dailyTotalAmount: 0,
        dailyTransactionCount: 0,
      };
    }
  }

  /**
   * Update daily metrics for a VPA from database
   */
  private async updateDailyMetricsFromDatabase(vpa: string): Promise<void> {
    const metrics = this.vpaMetrics.get(vpa);
    if (!metrics) {
      this.logger.warn(`No metrics found for VPA ${vpa}`);

      return;
    }

    const dailyMetrics = await this.calculateDailyMetricsFromDatabase(vpa);

    // Update the metrics with real-time data
    metrics.dailySuccessCount = dailyMetrics.dailySuccessCount;
    metrics.dailyFailureCount = dailyMetrics.dailyFailureCount;
    metrics.dailyTotalAmount = dailyMetrics.dailyTotalAmount;
    metrics.dailyTransactionCount = dailyMetrics.dailyTransactionCount;

    // Recalculate percentages
    metrics.volumeLimitPercentage =
      (metrics.dailyTotalAmount / metrics.dailyVolumeLimit) * 100;

    metrics.transactionLimitPercentage =
      (metrics.dailyTransactionCount / metrics.dailyTransactionLimit) * 100;

    // Update limit flags
    metrics.isVolumeLimitReached =
      metrics.dailyTotalAmount >= metrics.dailyVolumeLimit;

    metrics.isTransactionLimitReached =
      metrics.dailyTransactionCount >= metrics.dailyTransactionLimit;

    this.vpaMetrics.set(vpa, metrics);

    this.logger.info(
      `Updated daily metrics for VPA ${vpa} from database: ${dailyMetrics.dailySuccessCount} success, ${dailyMetrics.dailyFailureCount} failed, ${dailyMetrics.dailyTotalAmount} amount`,
    );
  }
}

// Export singleton instance
export const enhancedVpaRoutingService = new EnhancedVPARoutingService();
