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
    this.payInOrdersRepository = repository;
  }

  /**
   * Manually trigger cache and historical data loading
   */
  async refreshMetrics() {
    this.logger.info("Manually refreshing VPA metrics from cache and database");
    await this.loadCacheAndHistoricalData();
  }

  /**
   * Initialize with default metrics (non-blocking)
   */
  private initializeDefaultMetrics() {
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
      });
    });

    this.logger.info("Initialized default VPA metrics");

    // Load cache and historical data asynchronously
    this.loadCacheAndHistoricalData();
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
   * Load historical metrics from database
   */
  private async loadHistoricalMetrics() {
    if (!this.payInOrdersRepository) {
      this.logger.warn(
        "PayInOrders repository not available, skipping historical metrics",
      );

      return;
    }

    try {
      // Get last 30 days of transaction data
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      this.logger.info(
        `Loading historical metrics for last 30 days: ${thirtyDaysAgo.toISOString()}`,
      );

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
        .where("payin.createdAt >= :date", { date: thirtyDaysAgo })
        .andWhere("payin.intent IS NOT NULL")
        .getMany();

      this.logger.info(
        `Found ${historicalData.length} historical transactions for VPA analysis`,
      );

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
      const extractedVPAs = new Set<string>();

      historicalData.forEach((transaction) => {
        // Extract VPA from payment intent (upi://pay?pa=VPA&...)
        const vpaMatch = transaction.intent?.match(/pa=([^&]+)/);
        if (!vpaMatch) return;

        const vpa = vpaMatch[1];
        extractedVPAs.add(vpa);
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

      this.logger.info(
        `Processed ${processedCount} transactions, extracted ${extractedVPAs.size} unique VPAs: ${Array.from(extractedVPAs).join(", ")}`,
      );

      // Update metrics with historical data (only if no recent activity)
      vpaStats.forEach((stats, vpa) => {
        const existingMetrics = this.vpaMetrics.get(vpa);
        if (existingMetrics) {
          // Only update if there's no recent activity (older than 1 hour)
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
          const hasRecentActivity =
            existingMetrics.lastTransactionTime > oneHourAgo;

          if (!hasRecentActivity) {
            existingMetrics.successCount = stats.successCount;
            existingMetrics.failureCount = stats.failureCount;
            existingMetrics.totalTransactions = stats.totalTransactions;
            existingMetrics.dailySuccessCount = stats.successCount;
            existingMetrics.dailyFailureCount = stats.failureCount;
            existingMetrics.dailyTotalAmount = stats.totalAmount;
            existingMetrics.lastTransactionTime = stats.lastTransaction;
            existingMetrics.averageResponseTime = stats.averageResponseTime;
            existingMetrics.healthScore =
              this.calculateHealthScore(existingMetrics);
            existingMetrics.isHealthy = existingMetrics.healthScore > 50;
          } else {
            this.logger.debug(
              `Skipping historical update for ${vpa} - has recent activity`,
            );
          }
        }
      });

      this.logger.info(`Loaded historical metrics for ${vpaStats.size} VPAs`);
    } catch (error) {
      this.logger.error(`Failed to load historical metrics: ${error.message}`);
    }
  }

  private async initializeMetrics() {
    try {
      if (this.cacheManager) {
        const cachedMetrics =
          await this.cacheManager.get<Map<string, VPAHealthMetrics>>(
            "vpa_metrics",
          );

        if (cachedMetrics) {
          // Only update if we have cached data and current metrics are empty
          if (this.vpaMetrics.size === 0) {
            this.vpaMetrics = cachedMetrics;
            this.logger.info("Loaded VPA metrics from cache");
          } else {
            this.logger.info(
              "Skipping cache load - metrics already initialized",
            );
          }

          return;
        }
      }
    } catch (error) {
      this.logger.warn("Failed to load metrics from cache, using defaults");
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
        });
      });

      this.logger.info("Initialized VPA metrics from defaults");
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
    const availableVPAs = await this.getAvailableVPAs();

    this.logger.info(`Available VPAs: ${LoggerPlaceHolder.Json}`, {
      availableVPAs: availableVPAs.map((vpa) => vpa.vpa),
    });

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

  private async getAvailableVPAs(): Promise<VPARoute[]> {
    const activeVPAs = vpas?.filter((vpa) => vpa.isActive) || [];
    const availableVPAs: VPARoute[] = [];

    for (const vpa of activeVPAs) {
      const isHealthy = await this.isVPAHealthy(vpa.vpa);
      const isNotRateLimited = await this.checkRateLimit(vpa.vpa);
      const isCircuitBreakerClosed = this.isCircuitBreakerClosed(vpa.vpa);

      this.logger.debug(
        `VPA ${vpa.vpa} availability check: isHealthy=${isHealthy}, isNotRateLimited=${isNotRateLimited}, isCircuitBreakerClosed=${isCircuitBreakerClosed}`,
      );

      if (isHealthy && isNotRateLimited && isCircuitBreakerClosed) {
        availableVPAs.push(vpa);
      }
    }

    return availableVPAs;
  }

  private async isVPAHealthy(vpa: string): Promise<boolean> {
    const metrics = this.vpaMetrics.get(vpa);
    this.logger.debug(
      `VPA ${vpa} health check: metrics=${JSON.stringify(metrics)}`,
    );
    if (!metrics) return true;

    const healthScore = this.calculateHealthScore(metrics);
    const isHealthy = healthScore > 50;

    this.logger.debug(
      `VPA ${vpa} health check: healthScore=${healthScore}, isHealthy=${isHealthy}, totalTransactions=${metrics.totalTransactions}`,
    );

    return isHealthy;
  }

  /**
   * Calculate health score based on success rate and response time
   */
  private calculateHealthScore(metrics: VPAHealthMetrics): number {
    if (metrics.totalTransactions === 0) {
      return 100; // Default score for new VPAs
    }

    const successRate = metrics.successCount / metrics.totalTransactions;
    const responseTimeScore = Math.max(
      0,
      100 - metrics.averageResponseTime / 10,
    );
    const successRateScore = successRate * 100;

    this.logger.debug(
      `VPA ${metrics.vpa} health score calculation: successRate=${successRate}, responseTimeScore=${responseTimeScore}, successRateScore=${successRateScore},
      Final health score: ${successRateScore * 0.7 + responseTimeScore * 0.3}`,
    );

    return successRateScore * 0.7 + responseTimeScore * 0.3;
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
      ); // Lower load = higher score

      const totalScore =
        healthScore * 0.4 + priorityScore * 0.3 + loadScore * 0.3;

      return { vpa, score: totalScore };
    });

    this.logger.info(`Scored VPAs: ${JSON.stringify(scoredVPAs)}`);

    // Select VPA with highest score
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

  // Update usage metrics for a VPA
  private async updateUsageMetrics(vpa: string) {
    const metrics = this.vpaMetrics.get(vpa);
    if (metrics) {
      metrics.totalTransactions++;
      metrics.lastTransactionTime = new Date();
      this.vpaMetrics.set(vpa, metrics);

      // Cache metrics only if cache manager is available
      if (this.cacheManager) {
        try {
          await this.cacheManager.set("vpa_metrics", this.vpaMetrics, 3600000); // 1 hour
        } catch (error) {
          this.logger.warn(`Failed to cache VPA metrics: ${error.message}`);
        }
      }
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
      metrics.isHealthy = metrics.healthScore > 50;

      this.vpaMetrics.set(vpa, metrics);

      // Cache metrics only if cache manager is available
      if (this.cacheManager) {
        try {
          await this.cacheManager.set("vpa_metrics", this.vpaMetrics, 3600000);
        } catch (error) {
          this.logger.warn(`Failed to cache VPA metrics: ${error.message}`);
        }
      }

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
      metrics.dailyTotalAmount += amount;
      metrics.weeklyFailureCount++;
      metrics.monthlyFailureCount++;
      metrics.healthScore = this.calculateHealthScore(metrics);
      metrics.isHealthy = metrics.healthScore > 50;

      this.vpaMetrics.set(vpa, metrics);

      // Cache metrics only if cache manager is available
      if (this.cacheManager) {
        try {
          await this.cacheManager.set("vpa_metrics", this.vpaMetrics, 3600000);
        } catch (error) {
          this.logger.warn(`Failed to cache VPA metrics: ${error.message}`);
        }
      }

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
    const activeVPAs = this.getActiveVPAs();
    const healthMetrics = Array.from(this.vpaMetrics.values());

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

  // Reset daily metrics (call this daily at midnight)
  async resetDailyMetrics() {
    this.vpaMetrics.forEach((metrics) => {
      metrics.dailySuccessCount = 0;
      metrics.dailyFailureCount = 0;
      metrics.dailyTotalAmount = 0;
    });

    if (this.cacheManager) {
      await this.cacheManager.set("vpa_metrics", this.vpaMetrics, 3600000);
    }

    this.logger.info("Reset daily VPA metrics");
  }

  // Reset weekly metrics (call this weekly)
  async resetWeeklyMetrics() {
    this.vpaMetrics.forEach((metrics) => {
      metrics.weeklySuccessCount = 0;
      metrics.weeklyFailureCount = 0;
    });

    if (this.cacheManager) {
      await this.cacheManager.set("vpa_metrics", this.vpaMetrics, 3600000);
    }

    this.logger.info("Reset weekly VPA metrics");
  }

  // Reset monthly metrics (call this monthly)
  async resetMonthlyMetrics() {
    this.vpaMetrics.forEach((metrics) => {
      metrics.monthlySuccessCount = 0;
      metrics.monthlyFailureCount = 0;
    });

    if (this.cacheManager) {
      await this.cacheManager.set("vpa_metrics", this.vpaMetrics, 3600000);
    }

    this.logger.info("Reset monthly VPA metrics");
  }
}

// Export singleton instance
export const enhancedVpaRoutingService = new EnhancedVPARoutingService();
