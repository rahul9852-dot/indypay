import { Cache } from "cache-manager";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject } from "@nestjs/common";
import { VPAHealthMetrics } from "./enhanced-vpa-routing.util";
import { CustomLogger } from "@/logger";

export interface VPAAlert {
  id: string;
  vpa: string;
  type:
    | "health_degraded"
    | "circuit_breaker_opened"
    | "rate_limit_exceeded"
    | "high_failure_rate"
    | "response_time_slow";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  timestamp: Date;
  resolved: boolean;
  metadata?: any;
}

export interface VPAMonitoringConfig {
  healthCheckInterval: number; // seconds
  alertThresholds: {
    healthScoreMin: number;
    failureRateMax: number;
    responseTimeMax: number;
    circuitBreakerFailures: number;
  };
  notificationChannels: {
    email?: string[];
    slack?: string;
    webhook?: string;
  };
}

export class VPAMonitoringService {
  private readonly logger = new CustomLogger(VPAMonitoringService.name);
  private monitoringInterval: NodeJS.Timeout | null = null;
  private alerts: Map<string, VPAAlert> = new Map();
  private config: VPAMonitoringConfig;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    config?: Partial<VPAMonitoringConfig>,
  ) {
    this.config = {
      healthCheckInterval: 60, // 1 minute
      alertThresholds: {
        healthScoreMin: 50,
        failureRateMax: 0.1, // 10%
        responseTimeMax: 5000, // 5 seconds
        circuitBreakerFailures: 5,
      },
      notificationChannels: {
        email: [],
        slack: undefined,
        webhook: undefined,
      },
      ...config,
    };
  }

  /**
   * Start monitoring VPAs
   */
  async startMonitoring() {
    if (this.monitoringInterval) {
      this.logger.warn("Monitoring already started");

      return;
    }

    this.logger.info("Starting VPA monitoring service");

    this.monitoringInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, this.config.healthCheckInterval * 1000);
  }

  /**
   * Stop monitoring VPAs
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      this.logger.info("VPA monitoring service stopped");
    }
  }

  /**
   * Perform health checks on all VPAs
   */
  private async performHealthChecks() {
    try {
      if (!this.cacheManager) {
        this.logger.warn("Cache manager not available, skipping health checks");

        return;
      }

      const vpaMetrics =
        await this.cacheManager.get<Map<string, VPAHealthMetrics>>(
          "vpa_metrics",
        );
      if (!vpaMetrics) return;

      for (const [vpa, metrics] of vpaMetrics.entries()) {
        await this.checkVPAHealth(vpa, metrics);
      }

      // Check for resolved alerts
      await this.checkResolvedAlerts(vpaMetrics);
    } catch (error) {
      this.logger.error("Error performing health checks", error);
    }
  }

  /**
   * Check health of a specific VPA
   */
  private async checkVPAHealth(vpa: string, metrics: VPAHealthMetrics) {
    const alerts: VPAAlert[] = [];

    // Check health score
    if (metrics.healthScore < this.config.alertThresholds.healthScoreMin) {
      alerts.push({
        id: `health_${vpa}_${Date.now()}`,
        vpa,
        type: "health_degraded",
        severity: this.getSeverity(metrics.healthScore),
        message: `VPA ${vpa} health score is ${metrics.healthScore} (below threshold ${this.config.alertThresholds.healthScoreMin})`,
        timestamp: new Date(),
        resolved: false,
        metadata: { healthScore: metrics.healthScore },
      });
    }

    // Check failure rate
    const failureRate =
      metrics.totalTransactions > 0
        ? metrics.failureCount / metrics.totalTransactions
        : 0;

    if (failureRate > this.config.alertThresholds.failureRateMax) {
      alerts.push({
        id: `failure_${vpa}_${Date.now()}`,
        vpa,
        type: "high_failure_rate",
        severity: this.getSeverity(100 - failureRate * 100),
        message: `VPA ${vpa} failure rate is ${(failureRate * 100).toFixed(2)}% (above threshold ${(this.config.alertThresholds.failureRateMax * 100).toFixed(2)}%)`,
        timestamp: new Date(),
        resolved: false,
        metadata: { failureRate, totalTransactions: metrics.totalTransactions },
      });
    }

    // Check response time
    if (
      metrics.averageResponseTime > this.config.alertThresholds.responseTimeMax
    ) {
      alerts.push({
        id: `response_${vpa}_${Date.now()}`,
        vpa,
        type: "response_time_slow",
        severity: this.getSeverity(100 - metrics.averageResponseTime / 100),
        message: `VPA ${vpa} average response time is ${metrics.averageResponseTime}ms (above threshold ${this.config.alertThresholds.responseTimeMax}ms)`,
        timestamp: new Date(),
        resolved: false,
        metadata: { averageResponseTime: metrics.averageResponseTime },
      });
    }

    // Create alerts
    for (const alert of alerts) {
      await this.createAlert(alert);
    }
  }

  /**
   * Check for resolved alerts
   */
  private async checkResolvedAlerts(vpaMetrics: Map<string, VPAHealthMetrics>) {
    for (const [alertId, alert] of this.alerts.entries()) {
      if (alert.resolved) continue;

      const metrics = vpaMetrics.get(alert.vpa);
      if (!metrics) continue;

      let isResolved = false;

      switch (alert.type) {
        case "health_degraded":
          isResolved =
            metrics.healthScore >= this.config.alertThresholds.healthScoreMin;
          break;
        case "high_failure_rate":
          const failureRate =
            metrics.totalTransactions > 0
              ? metrics.failureCount / metrics.totalTransactions
              : 0;
          isResolved =
            failureRate <= this.config.alertThresholds.failureRateMax;
          break;
        case "response_time_slow":
          isResolved =
            metrics.averageResponseTime <=
            this.config.alertThresholds.responseTimeMax;
          break;
      }

      if (isResolved) {
        alert.resolved = true;
        this.logger.info(`Alert resolved: ${alert.message}`);
        await this.sendNotification(`Alert Resolved: ${alert.message}`, "low");
      }
    }
  }

  /**
   * Create a new alert
   */
  private async createAlert(alert: VPAAlert) {
    // Check if similar alert already exists
    const existingAlert = Array.from(this.alerts.values()).find(
      (a) => a.vpa === alert.vpa && a.type === alert.type && !a.resolved,
    );

    if (existingAlert) {
      // Update existing alert
      existingAlert.timestamp = alert.timestamp;
      existingAlert.message = alert.message;
      existingAlert.metadata = alert.metadata;
    } else {
      // Create new alert
      this.alerts.set(alert.id, alert);
      this.logger.warn(`New VPA alert: ${alert.message}`);
      await this.sendNotification(alert.message, alert.severity);
    }

    // Store alerts in cache
    await this.cacheManager.set(
      "vpa_alerts",
      Array.from(this.alerts.values()),
      86400000,
    ); // 24 hours
  }

  /**
   * Send notification through configured channels
   */
  private async sendNotification(message: string, severity: string) {
    try {
      // Email notifications
      if (this.config.notificationChannels.email?.length) {
        await this.sendEmailNotification(message, severity);
      }

      // Slack notifications
      if (this.config.notificationChannels.slack) {
        await this.sendSlackNotification(message, severity);
      }

      // Webhook notifications
      if (this.config.notificationChannels.webhook) {
        await this.sendWebhookNotification(message, severity);
      }
    } catch (error) {
      this.logger.error("Error sending notification", error);
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(message: string, severity: string) {
    // Implementation would integrate with your email service
    this.logger.info(`Email notification (${severity}): ${message}`);
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(message: string, severity: string) {
    // Implementation would integrate with Slack API
    this.logger.info(`Slack notification (${severity}): ${message}`);
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(message: string, severity: string) {
    // Implementation would send HTTP POST to webhook URL
    this.logger.info(`Webhook notification (${severity}): ${message}`);
  }

  /**
   * Get severity level based on metric value
   */
  private getSeverity(value: number): "low" | "medium" | "high" | "critical" {
    if (value >= 80) return "low";
    if (value >= 60) return "medium";
    if (value >= 40) return "high";

    return "critical";
  }

  /**
   * Get all active alerts
   */
  async getActiveAlerts(): Promise<VPAAlert[]> {
    return Array.from(this.alerts.values()).filter((alert) => !alert.resolved);
  }

  /**
   * Get alert history
   */
  async getAlertHistory(): Promise<VPAAlert[]> {
    return Array.from(this.alerts.values());
  }

  /**
   * Manually resolve an alert
   */
  async resolveAlert(alertId: string): Promise<boolean> {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      await this.cacheManager.set(
        "vpa_alerts",
        Array.from(this.alerts.values()),
        86400000,
      );

      return true;
    }

    return false;
  }

  /**
   * Get monitoring configuration
   */
  getConfig(): VPAMonitoringConfig {
    return this.config;
  }

  /**
   * Update monitoring configuration
   */
  updateConfig(newConfig: Partial<VPAMonitoringConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.logger.info("Monitoring configuration updated");
  }

  /**
   * Get monitoring status
   */
  getStatus(): any {
    return {
      isMonitoring: !!this.monitoringInterval,
      activeAlerts: Array.from(this.alerts.values()).filter((a) => !a.resolved)
        .length,
      totalAlerts: this.alerts.size,
      config: this.config,
    };
  }
}

// Export singleton instance
export const vpaMonitoringService = new VPAMonitoringService(null as any);
