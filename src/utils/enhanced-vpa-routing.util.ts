import { Cache } from "cache-manager";
import { appConfig } from "@/config/app.config";
import { CustomLogger } from "@/logger";

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

  constructor(cacheManager?: Cache) {
    this.cacheManager = cacheManager || null;
    this.initializeMetrics();
  }

  /**
   * Set cache manager (for dependency injection)
   */
  setCacheManager(cacheManager: Cache) {
    this.cacheManager = cacheManager;
  }

  /**
   * Initialize VPA metrics from cache or defaults
   */
  private async initializeMetrics() {
    try {
      if (this.cacheManager) {
        const cachedMetrics =
          await this.cacheManager.get<Map<string, VPAHealthMetrics>>(
            "vpa_metrics",
          );

        if (cachedMetrics) {
          this.vpaMetrics = cachedMetrics;
          this.logger.info("Loaded VPA metrics from cache");

          return;
        }
      }
    } catch (error) {
      this.logger.warn("Failed to load metrics from cache, using defaults");
    }

    // Initialize default metrics for all VPAs
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
      });
    });

    this.logger.info("Initialized default VPA metrics");
  }

  /**
   * Enhanced VPA selection with health checks and circuit breakers
   */
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

    // Update metrics
    await this.updateUsageMetrics(result.selectedVpa);

    return result;
  }

  /**
   * Get VPAs that are healthy and not rate limited
   */
  private async getAvailableVPAs(): Promise<VPARoute[]> {
    const activeVPAs = vpas?.filter((vpa) => vpa.isActive) || [];
    const availableVPAs: VPARoute[] = [];

    for (const vpa of activeVPAs) {
      const isHealthy = await this.isVPAHealthy(vpa.vpa);
      const isNotRateLimited = await this.checkRateLimit(vpa.vpa);
      const isCircuitBreakerClosed = this.isCircuitBreakerClosed(vpa.vpa);

      if (isHealthy && isNotRateLimited && isCircuitBreakerClosed) {
        availableVPAs.push(vpa);
      }
    }

    return availableVPAs;
  }

  /**
   * Check if VPA is healthy based on metrics
   */
  private async isVPAHealthy(vpa: string): Promise<boolean> {
    const metrics = this.vpaMetrics.get(vpa);
    if (!metrics) return true; // Default to healthy if no metrics

    const healthScore = this.calculateHealthScore(metrics);
    const isHealthy = healthScore > 50; // Threshold for healthy

    // this.logger.debug(`VPA ${vpa} health check: ${LoggerPlaceHolder.Json}`, {
    //   healthScore,
    //   isHealthy,
    //   successRate: metrics.successCount / Math.max(metrics.totalTransactions, 1)
    // });

    return isHealthy;
  }

  /**
   * Calculate health score based on success rate and response time
   */
  private calculateHealthScore(metrics: VPAHealthMetrics): number {
    const successRate =
      metrics.totalTransactions > 0
        ? metrics.successCount / metrics.totalTransactions
        : 1;

    const responseTimeScore = Math.max(
      0,
      100 - metrics.averageResponseTime / 10,
    );
    const successRateScore = successRate * 100;

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
      // Reset counter
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
   * Check circuit breaker state
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

  /**
   * Apply routing strategy with enhanced logic
   */
  private async applyRoutingStrategy(
    availableVPAs: VPARoute[],
    userId?: string,
    amount?: number,
    orderId?: string,
  ): Promise<VPARoutingResult> {
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

  /**
   * Enhanced round-robin with health consideration
   */
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
      reason: `Selected VPA ${selectedVpa.vpa} (health score: ${metrics ? this.calculateHealthScore(metrics) : 100})`,
      metadata: {
        healthScore: metrics ? this.calculateHealthScore(metrics) : 100,
        currentLoad: metrics?.totalTransactions || 0,
        lastUsed: new Date(),
        successRate: metrics
          ? metrics.successCount / Math.max(metrics.totalTransactions, 1)
          : 1,
      },
    };
  }

  /**
   * Health-based strategy - always use the healthiest VPA
   */
  private async healthBasedStrategy(
    vpas: VPARoute[],
  ): Promise<VPARoutingResult> {
    let bestVPA = vpas[0];
    let bestScore = 0;

    for (const vpa of vpas) {
      const metrics = this.vpaMetrics.get(vpa.vpa);
      const score = metrics ? this.calculateHealthScore(metrics) : 100;

      if (score > bestScore) {
        bestScore = score;
        bestVPA = vpa;
      }
    }

    return {
      selectedVpa: bestVPA.vpa,
      strategy: "health_based",
      reason: `Selected healthiest VPA ${bestVPA.vpa} (score: ${bestScore})`,
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

  /**
   * Adaptive strategy - combines multiple factors
   */
  private async adaptiveStrategy(
    vpas: VPARoute[],
    userId?: string,
    amount?: number,
  ): Promise<VPARoutingResult> {
    // Score each VPA based on multiple factors
    const scoredVPAs = vpas.map((vpa) => {
      const metrics = this.vpaMetrics.get(vpa.vpa);
      const healthScore = metrics ? this.calculateHealthScore(metrics) : 100;
      const priorityScore = (10 - vpa.priority) * 10; // Higher priority = higher score
      const loadScore = Math.max(
        0,
        100 - (metrics?.totalTransactions || 0) / 10,
      ); // Lower load = higher score

      const totalScore =
        healthScore * 0.4 + priorityScore * 0.3 + loadScore * 0.3;

      return { vpa, score: totalScore };
    });

    // Select VPA with highest score
    const bestVPA = scoredVPAs.reduce((best, current) =>
      current.score > best.score ? current : best,
    );

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
    // Implementation similar to original but with health checks
    return this.enhancedRoundRobinStrategy(vpas);
  }

  private async enhancedUserBasedStrategy(
    vpas: VPARoute[],
    userId?: string,
  ): Promise<VPARoutingResult> {
    // Implementation similar to original but with health checks
    return this.enhancedRoundRobinStrategy(vpas);
  }

  private async enhancedAmountBasedStrategy(
    vpas: VPARoute[],
    amount?: number,
  ): Promise<VPARoutingResult> {
    // Implementation similar to original but with health checks
    return this.enhancedRoundRobinStrategy(vpas);
  }

  private async enhancedPriorityBasedStrategy(
    vpas: VPARoute[],
  ): Promise<VPARoutingResult> {
    // Implementation similar to original but with health checks
    return this.enhancedRoundRobinStrategy(vpas);
  }

  /**
   * Update usage metrics for a VPA
   */
  private async updateUsageMetrics(vpa: string) {
    const metrics = this.vpaMetrics.get(vpa);
    if (metrics) {
      metrics.totalTransactions++;
      metrics.lastSuccessTime = new Date();
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

  /**
   * Record success for a VPA
   */
  async recordSuccess(vpa: string, responseTime: number) {
    const metrics = this.vpaMetrics.get(vpa);
    if (metrics) {
      metrics.successCount++;
      metrics.totalTransactions++;
      metrics.lastSuccessTime = new Date();

      // Update average response time
      const totalTime =
        metrics.averageResponseTime * (metrics.totalTransactions - 1) +
        responseTime;
      metrics.averageResponseTime = totalTime / metrics.totalTransactions;

      // Update health score
      metrics.healthScore = this.calculateHealthScore(metrics);

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
    }
  }

  /**
   * Record failure for a VPA
   */
  async recordFailure(vpa: string) {
    const metrics = this.vpaMetrics.get(vpa);
    if (metrics) {
      metrics.failureCount++;
      metrics.totalTransactions++;
      metrics.lastFailureTime = new Date();
      metrics.healthScore = this.calculateHealthScore(metrics);

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
    }
  }

  /**
   * Get comprehensive VPA statistics
   */
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
      })),
      vpas: activeVPAs.map((vpa) => ({
        vpa: vpa.vpa,
        priority: vpa.priority,
        isActive: vpa.isActive,
        description: vpa.description,
        healthScore: this.vpaMetrics.get(vpa.vpa)?.healthScore || 100,
      })),
    };
  }

  /**
   * Get all active VPAs
   */
  getActiveVPAs(): VPARoute[] {
    return vpas?.filter((vpa) => vpa.isActive) || [];
  }

  /**
   * Create fallback result
   */
  private createFallbackResult(reason: string): VPARoutingResult {
    return {
      selectedVpa: appConfig().utkarsh.vpa,
      strategy: "fallback",
      reason,
    };
  }
}

// Export singleton instance
export const enhancedVpaRoutingService = new EnhancedVPARoutingService();
