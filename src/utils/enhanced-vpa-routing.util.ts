import { Repository } from "typeorm";
import { Cache } from "cache-manager";
import { appConfig } from "@/config/app.config";
import { CustomLogger, LoggerPlaceHolder } from "@/logger";
import { PayInOrdersEntity } from "@/entities/payin-orders.entity";
import { PAYMENT_STATUS } from "@/enums/payment.enum";

const {
  utkarsh: { vpas, vpaRouting },
} = appConfig();

export interface VPARoute {
  vpa: string;
  priority: number;
  maxDailyTransactions?: number;
  maxDailyAmount?: number;
  isActive: boolean;
  description?: string;
  // Enhanced properties
  healthCheckUrl?: string;
  timeoutMs?: number;
  retryAttempts?: number;
  circuitBreakerThreshold?: number;
  rateLimitPerMinute?: number;
}

export interface VPARoutingResult {
  selectedVpa: string;
  strategy: string;
  reason: string;
  metadata?: {
    healthScore?: number;
    currentLoad?: number;
    lastUsed?: Date;
    successRate?: number;
  };
}

export interface VPAHealthMetrics {
  vpa: string;
  successCount: number;
  failureCount: number;
  totalTransactions: number;
  averageResponseTime: number;
  lastSuccessTime: Date;
  lastFailureTime: Date;
  isHealthy: boolean;
  healthScore: number; // 0-100
  // Real-time metrics
  dailySuccessCount: number;
  dailyFailureCount: number;
  dailyTotalAmount: number;
  lastTransactionTime: Date;
  // Historical data
  weeklySuccessCount: number;
  weeklyFailureCount: number;
  monthlySuccessCount: number;
  monthlyFailureCount: number;
  // Volume tracking for limits
  dailyTransactionCount: number; // Total transactions today (success + failure)
  dailyVolumeLimit: number; // Max daily amount limit
  dailyTransactionLimit: number; // Max daily transaction count limit
  isVolumeLimitReached: boolean; // Whether daily volume limit is reached
  isTransactionLimitReached: boolean; // Whether daily transaction limit is reached
  volumeLimitPercentage: number; // Percentage of volume limit used (0-100)
  transactionLimitPercentage: number; // Percentage of transaction limit used (0-100)
}

export interface VPATransactionRecord {
  orderId: string;
  vpa: string;
  amount: number;
  userId: string;
  status: PAYMENT_STATUS;
  createdAt: Date;
  completedAt?: Date;
  responseTime?: number;
}

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
      this.logger.warn(
        `VPAs only in metrics (historical): ${onlyInMetrics.join(", ")}`,
      );
    }
    if (onlyInConfig.length > 0) {
      this.logger.warn(
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
    this.checkAndResetDailyMetricsIfNeeded();
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
          dailyVolumeLimit: vpa.maxDailyAmount || 2000000, // Default 20L
          dailyTransactionLimit: vpa.maxDailyTransactions || 5000, // Default 5000 transactions
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
        const cachedMetrics = await this.cacheManager.get<any>("vpa_metrics");

        if (cachedMetrics && typeof cachedMetrics === "object") {
          // Convert plain object back to Map
          const metricsMap = new Map<string, VPAHealthMetrics>();

          Object.entries(cachedMetrics).forEach(
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
          this.logger.info(
            `Loaded VPA metrics from cache: ${metricsMap.size} VPAs`,
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
                dailyVolumeLimit: vpa.maxDailyAmount || 2000000, // Default 20L
                dailyTransactionLimit: vpa.maxDailyTransactions || 5000, // Default 5000 transactions
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
          dailyVolumeLimit: vpa.maxDailyAmount || 2000000, // Default 20L
          dailyTransactionLimit: vpa.maxDailyTransactions || 5000, // Default 5000 transactions
          isVolumeLimitReached: false,
          isTransactionLimitReached: false,
          volumeLimitPercentage: 0,
          transactionLimitPercentage: 0,
        });
      });

      this.logger.info("Initialized VPA metrics from defaults");
    }
  }

  /**
   * Save metrics to cache with proper serialization
   */
  private async saveMetricsToCache() {
    if (!this.cacheManager) {
      return;
    }

    try {
      // Convert Map to plain object for proper serialization
      const metricsObject: Record<string, VPAHealthMetrics> = {};
      this.vpaMetrics.forEach((metrics, vpa) => {
        metricsObject[vpa] = metrics;
      });

      // Save with longer TTL for metrics persistence
      await this.cacheManager.set("vpa_metrics", metricsObject, 86400000); // 24 hours
    } catch (error) {
      this.logger.warn(`Failed to save metrics to cache: ${error.message}`);
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

      // Merge historical data with existing metrics (don't overwrite recent data)
      vpaStats.forEach((stats, vpa) => {
        const existingMetrics = this.vpaMetrics.get(vpa);
        if (existingMetrics) {
          // Only update if historical data is more recent or if we don't have recent data
          const isHistoricalMoreRecent =
            stats.lastTransaction > existingMetrics.lastTransactionTime;
          const hasNoRecentData = existingMetrics.totalTransactions === 0;

          if (isHistoricalMoreRecent || hasNoRecentData) {
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
            dailyVolumeLimit: 2000000, // Default 20L
            dailyTransactionLimit: 5000, // Default 5000 transactions
            isVolumeLimitReached: false,
            isTransactionLimitReached: false,
            volumeLimitPercentage: 0,
            transactionLimitPercentage: 0,
          });
        }
      });

      // Save updated metrics to cache
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
      // Get transaction record
      let record = this.transactionRecords.get(orderId);

      if (!record && this.cacheManager) {
        record = await this.cacheManager.get<VPATransactionRecord>(
          `vpa_transaction_${orderId}`,
        );
      }

      if (!record) {
        this.logger.warn(`No transaction record found for orderId: ${orderId}`);

        return;
      }

      // Update record
      record.status = status;
      record.completedAt = new Date();
      record.responseTime = responseTime;

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

    // Check transaction count limit (applies to ALL transactions - success + failure)
    if (metrics.isTransactionLimitReached) {
      this.logger.warn(
        `VPA ${vpa} has reached daily transaction limit: ${metrics.dailyTransactionCount}/${metrics.dailyTransactionLimit}`,
      );

      return false;
    }

    // Check volume limit (applies ONLY to successful transactions)
    if (metrics.isVolumeLimitReached) {
      this.logger.warn(
        `VPA ${vpa} has reached daily volume limit: ${metrics.dailyTotalAmount}/${metrics.dailyVolumeLimit}`,
      );

      return false;
    }

    // Check if this transaction would exceed limits
    if (amount) {
      const newDailyTransactions = metrics.dailyTransactionCount + 1;

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
      const newDailyAmount = metrics.dailyTotalAmount + amount;
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
   * Update volume limit tracking for a VPA (ONLY for successful transactions)
   */
  private updateVolumeLimitTracking(vpa: string, amount: number): void {
    const metrics = this.vpaMetrics.get(vpa);
    if (!metrics) return;

    // Update transaction count
    metrics.dailyTransactionCount++;

    // Update volume (ONLY for successful transactions)
    metrics.dailyTotalAmount += amount;

    // Calculate percentages
    metrics.volumeLimitPercentage =
      (metrics.dailyTotalAmount / metrics.dailyVolumeLimit) * 100;

    metrics.transactionLimitPercentage =
      (metrics.dailyTransactionCount / metrics.dailyTransactionLimit) * 100;

    // Check if limits are reached
    metrics.isVolumeLimitReached =
      metrics.dailyTotalAmount >= metrics.dailyVolumeLimit;

    metrics.isTransactionLimitReached =
      metrics.dailyTransactionCount >= metrics.dailyTransactionLimit;

    // Alert if approaching limits (80% threshold)
    if (
      metrics.volumeLimitPercentage >= 80 ||
      metrics.transactionLimitPercentage >= 80
    ) {
      this.logger.warn(
        `VPA ${vpa} approaching limits: volume=${metrics.volumeLimitPercentage.toFixed(2)}%, transactions=${metrics.transactionLimitPercentage.toFixed(2)}%`,
      );
    }

    // Alert if limits reached
    if (metrics.isVolumeLimitReached || metrics.isTransactionLimitReached) {
      this.logger.error(
        `VPA ${vpa} LIMIT REACHED: volume=${metrics.isVolumeLimitReached}, transactions=${metrics.isTransactionLimitReached}`,
      );
    }
  }

  /**
   * Update transaction count tracking for a VPA (for failed transactions)
   */
  private updateTransactionCountTracking(vpa: string): void {
    const metrics = this.vpaMetrics.get(vpa);
    if (!metrics) return;

    // Update transaction count (but NOT volume for failures)
    metrics.dailyTransactionCount++;

    // Calculate transaction percentage only
    metrics.transactionLimitPercentage =
      (metrics.dailyTransactionCount / metrics.dailyTransactionLimit) * 100;

    // Check if transaction limit is reached
    metrics.isTransactionLimitReached =
      metrics.dailyTransactionCount >= metrics.dailyTransactionLimit;

    // Alert if approaching transaction limit (80% threshold)
    if (metrics.transactionLimitPercentage >= 80) {
      this.logger.warn(
        `VPA ${vpa} approaching transaction limit: ${metrics.transactionLimitPercentage.toFixed(2)}%`,
      );
    }

    // Alert if transaction limit reached
    if (metrics.isTransactionLimitReached) {
      this.logger.error(
        `VPA ${vpa} TRANSACTION LIMIT REACHED: ${metrics.dailyTransactionCount}/${metrics.dailyTransactionLimit}`,
      );
    }
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
    const metrics = this.vpaMetrics.get(vpa);
    if (metrics) {
      metrics.successCount++;
      metrics.totalTransactions++;
      metrics.lastSuccessTime = new Date();
      metrics.lastTransactionTime = new Date();
      metrics.dailySuccessCount++;
      metrics.dailyTotalAmount += amount;
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

      // Update volume limit tracking
      this.updateVolumeLimitTracking(vpa, amount);

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
    const metrics = this.vpaMetrics.get(vpa);
    if (metrics) {
      metrics.failureCount++;
      metrics.totalTransactions++;
      metrics.lastFailureTime = new Date();
      metrics.lastTransactionTime = new Date();
      metrics.dailyFailureCount++;
      // NOTE: Do NOT add amount to dailyTotalAmount for failures
      // Only successful transactions should count toward volume limits
      metrics.weeklyFailureCount++;
      metrics.monthlyFailureCount++;
      metrics.healthScore = this.calculateHealthScore(metrics);
      metrics.isHealthy = metrics.healthScore > 30; // Lowered threshold

      // Update transaction count tracking (but NOT volume for failures)
      this.updateTransactionCountTracking(vpa);

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

    // Validate metrics data
    const totalTransactions = healthMetrics.reduce(
      (sum, metric) => sum + metric.totalTransactions,
      0,
    );
    const totalSuccess = healthMetrics.reduce(
      (sum, metric) => sum + metric.successCount,
      0,
    );
    const totalFailure = healthMetrics.reduce(
      (sum, metric) => sum + metric.failureCount,
      0,
    );

    this.logger.info(
      `VPA Stats Summary: Total=${totalTransactions}, Success=${totalSuccess}, Failure=${totalFailure}`,
    );
    this.logger.info(`Health Metrics: ${LoggerPlaceHolder.Json}`, {
      healthMetrics,
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
      healthMetrics: healthMetrics.map((metrics) => ({
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
   */
  async resetDailyMetrics() {
    this.vpaMetrics.forEach((metrics) => {
      metrics.dailySuccessCount = 0;
      metrics.dailyFailureCount = 0;
      metrics.dailyTotalAmount = 0;
      // Reset volume tracking
      metrics.dailyTransactionCount = 0;
      metrics.isVolumeLimitReached = false;
      metrics.isTransactionLimitReached = false;
      metrics.volumeLimitPercentage = 0;
      metrics.transactionLimitPercentage = 0;
    });

    // Save updated metrics to cache
    await this.saveMetricsToCache();

    this.logger.info("Reset daily VPA metrics and volume limits");
  }

  /**
   * Check if daily metrics need to be reset (called on service initialization)
   */
  private checkAndResetDailyMetricsIfNeeded() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Check if we have any metrics with daily data from a previous day
    let needsReset = false;

    this.vpaMetrics.forEach((metrics) => {
      if (metrics.lastTransactionTime) {
        const lastTransactionDate = new Date(metrics.lastTransactionTime);
        const lastTransactionDay = new Date(
          lastTransactionDate.getFullYear(),
          lastTransactionDate.getMonth(),
          lastTransactionDate.getDate(),
        );

        // If last transaction was on a different day, we need to reset daily metrics
        if (lastTransactionDay.getTime() !== today.getTime()) {
          needsReset = true;
        }
      }
    });

    if (needsReset) {
      this.logger.info(
        "Detected daily metrics from previous day, resetting daily counters",
      );
      this.vpaMetrics.forEach((metrics) => {
        metrics.dailySuccessCount = 0;
        metrics.dailyFailureCount = 0;
        metrics.dailyTotalAmount = 0;
        metrics.dailyTransactionCount = 0;
        metrics.isVolumeLimitReached = false;
        metrics.isTransactionLimitReached = false;
        metrics.volumeLimitPercentage = 0;
        metrics.transactionLimitPercentage = 0;
      });
    }
  }

  // Reset weekly metrics (call this weekly)
  async resetWeeklyMetrics() {
    this.vpaMetrics.forEach((metrics) => {
      metrics.weeklySuccessCount = 0;
      metrics.weeklyFailureCount = 0;
    });

    // Save updated metrics to cache
    await this.saveMetricsToCache();

    this.logger.info("Reset weekly VPA metrics");
  }

  // Reset monthly metrics (call this monthly)
  async resetMonthlyMetrics() {
    this.vpaMetrics.forEach((metrics) => {
      metrics.monthlySuccessCount = 0;
      metrics.monthlyFailureCount = 0;
    });

    // Save updated metrics to cache
    await this.saveMetricsToCache();

    this.logger.info("Reset monthly VPA metrics");
  }
}

// Export singleton instance
export const enhancedVpaRoutingService = new EnhancedVPARoutingService();
