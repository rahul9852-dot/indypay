import { Cache } from "cache-manager";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject } from "@nestjs/common";
import { VPARoute } from "./enhanced-vpa-routing.util";
import { CustomLogger } from "@/logger";

export interface VPADynamicConfig {
  vpas: VPARoute[];
  routing: {
    strategy: string;
    loadBalanceThreshold?: number;
    userBasedMapping?: Record<string, string>;
    amountBasedMapping?: Record<string, string>;
  };
  monitoring: {
    enabled: boolean;
    healthCheckInterval: number;
    alertThresholds: {
      healthScoreMin: number;
      failureRateMax: number;
      responseTimeMax: number;
      circuitBreakerFailures: number;
    };
  };
  rateLimiting: {
    enabled: boolean;
    defaultLimitPerMinute: number;
    vpaSpecificLimits?: Record<string, number>;
  };
  circuitBreaker: {
    enabled: boolean;
    defaultThreshold: number;
    defaultTimeoutMs: number;
    vpaSpecificSettings?: Record<
      string,
      { threshold: number; timeoutMs: number }
    >;
  };
}

export interface ConfigChangeEvent {
  type:
    | "vpa_added"
    | "vpa_updated"
    | "vpa_removed"
    | "strategy_changed"
    | "monitoring_updated";
  timestamp: Date;
  details: any;
  previousValue?: any;
  newValue?: any;
}

export class VPAConfigManager {
  private readonly logger = new CustomLogger(VPAConfigManager.name);
  private config: VPADynamicConfig;
  private changeHistory: ConfigChangeEvent[] = [];
  private configWatchers: ((event: ConfigChangeEvent) => void)[] = [];

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {
    this.initializeConfig();
  }

  /**
   * Initialize configuration from cache or defaults
   */
  private async initializeConfig() {
    try {
      const cachedConfig =
        await this.cacheManager.get<VPADynamicConfig>("vpa_dynamic_config");

      if (cachedConfig) {
        this.config = cachedConfig;
        this.logger.info("Loaded VPA configuration from cache");
      } else {
        // Initialize with default configuration
        this.config = this.getDefaultConfig();
        await this.saveConfig();
        this.logger.info("Initialized with default VPA configuration");
      }
    } catch (error) {
      this.logger.warn(
        "Failed to load configuration from cache, using defaults",
      );
      this.config = this.getDefaultConfig();
    }
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): VPADynamicConfig {
    return {
      vpas: [],
      routing: {
        strategy: "round_robin",
        loadBalanceThreshold: 1000000,
        userBasedMapping: {},
        amountBasedMapping: {},
      },
      monitoring: {
        enabled: true,
        healthCheckInterval: 60,
        alertThresholds: {
          healthScoreMin: 50,
          failureRateMax: 0.1,
          responseTimeMax: 5000,
          circuitBreakerFailures: 5,
        },
      },
      rateLimiting: {
        enabled: true,
        defaultLimitPerMinute: 1000,
        vpaSpecificLimits: {},
      },
      circuitBreaker: {
        enabled: true,
        defaultThreshold: 5,
        defaultTimeoutMs: 30000,
        vpaSpecificSettings: {},
      },
    };
  }

  /**
   * Save configuration to cache
   */
  private async saveConfig() {
    try {
      await this.cacheManager.set("vpa_dynamic_config", this.config, 0); // No expiration
    } catch (error) {
      this.logger.warn(
        `Failed to save VPA configuration to cache: ${error.message}`,
      );
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): VPADynamicConfig {
    return { ...this.config }; // Return copy to prevent direct modification
  }

  /**
   * Add a new VPA
   */
  async addVPA(vpaConfig: VPARoute): Promise<boolean> {
    try {
      // Validate VPA configuration
      if (!this.validateVPAConfig(vpaConfig)) {
        return false;
      }

      // Check if VPA already exists
      const existingIndex = this.config.vpas.findIndex(
        (v) => v.vpa === vpaConfig.vpa,
      );
      if (existingIndex !== -1) {
        this.logger.warn(`VPA ${vpaConfig.vpa} already exists`);

        return false;
      }

      // Add VPA
      this.config.vpas.push(vpaConfig);
      await this.saveConfig();

      // Record change event
      const event: ConfigChangeEvent = {
        type: "vpa_added",
        timestamp: new Date(),
        details: { vpa: vpaConfig.vpa },
        newValue: vpaConfig,
      };
      this.recordChangeEvent(event);

      this.logger.info(`VPA ${vpaConfig.vpa} added successfully`);

      return true;
    } catch (error) {
      this.logger.error(`Error adding VPA ${vpaConfig.vpa}`, error);

      return false;
    }
  }

  /**
   * Update existing VPA
   */
  async updateVPA(vpa: string, updates: Partial<VPARoute>): Promise<boolean> {
    try {
      const vpaIndex = this.config.vpas.findIndex((v) => v.vpa === vpa);
      if (vpaIndex === -1) {
        this.logger.warn(`VPA ${vpa} not found`);

        return false;
      }

      const previousValue = { ...this.config.vpas[vpaIndex] };
      const updatedVPA = { ...this.config.vpas[vpaIndex], ...updates };

      // Validate updated configuration
      if (!this.validateVPAConfig(updatedVPA)) {
        return false;
      }

      // Update VPA
      this.config.vpas[vpaIndex] = updatedVPA;
      await this.saveConfig();

      // Record change event
      const event: ConfigChangeEvent = {
        type: "vpa_updated",
        timestamp: new Date(),
        details: { vpa },
        previousValue,
        newValue: updatedVPA,
      };
      this.recordChangeEvent(event);

      this.logger.info(`VPA ${vpa} updated successfully`);

      return true;
    } catch (error) {
      this.logger.error(`Error updating VPA ${vpa}`, error);

      return false;
    }
  }

  /**
   * Remove VPA
   */
  async removeVPA(vpa: string): Promise<boolean> {
    try {
      const vpaIndex = this.config.vpas.findIndex((v) => v.vpa === vpa);
      if (vpaIndex === -1) {
        this.logger.warn(`VPA ${vpa} not found`);

        return false;
      }

      const removedVPA = this.config.vpas.splice(vpaIndex, 1)[0];
      await this.saveConfig();

      // Record change event
      const event: ConfigChangeEvent = {
        type: "vpa_removed",
        timestamp: new Date(),
        details: { vpa },
        previousValue: removedVPA,
      };
      this.recordChangeEvent(event);

      this.logger.info(`VPA ${vpa} removed successfully`);

      return true;
    } catch (error) {
      this.logger.error(`Error removing VPA ${vpa}`, error);

      return false;
    }
  }

  /**
   * Update routing strategy
   */
  async updateRoutingStrategy(
    strategy: string,
    config?: any,
  ): Promise<boolean> {
    try {
      const previousValue = { ...this.config.routing };

      this.config.routing.strategy = strategy;
      if (config) {
        this.config.routing = { ...this.config.routing, ...config };
      }

      await this.saveConfig();

      // Record change event
      const event: ConfigChangeEvent = {
        type: "strategy_changed",
        timestamp: new Date(),
        details: { strategy, config },
        previousValue,
        newValue: this.config.routing,
      };
      this.recordChangeEvent(event);

      this.logger.info(`Routing strategy updated to: ${strategy}`);

      return true;
    } catch (error) {
      this.logger.error(`Error updating routing strategy`, error);

      return false;
    }
  }

  /**
   * Update monitoring configuration
   */
  async updateMonitoringConfig(
    monitoringConfig: Partial<VPADynamicConfig["monitoring"]>,
  ): Promise<boolean> {
    try {
      const previousValue = { ...this.config.monitoring };

      this.config.monitoring = {
        ...this.config.monitoring,
        ...monitoringConfig,
      };
      await this.saveConfig();

      // Record change event
      const event: ConfigChangeEvent = {
        type: "monitoring_updated",
        timestamp: new Date(),
        details: monitoringConfig,
        previousValue,
        newValue: this.config.monitoring,
      };
      this.recordChangeEvent(event);

      this.logger.info("Monitoring configuration updated");

      return true;
    } catch (error) {
      this.logger.error("Error updating monitoring configuration", error);

      return false;
    }
  }

  /**
   * Update rate limiting configuration
   */
  async updateRateLimitingConfig(
    rateLimitingConfig: Partial<VPADynamicConfig["rateLimiting"]>,
  ): Promise<boolean> {
    try {
      this.config.rateLimiting = {
        ...this.config.rateLimiting,
        ...rateLimitingConfig,
      };
      await this.saveConfig();

      this.logger.info("Rate limiting configuration updated");

      return true;
    } catch (error) {
      this.logger.error("Error updating rate limiting configuration", error);

      return false;
    }
  }

  /**
   * Update circuit breaker configuration
   */
  async updateCircuitBreakerConfig(
    circuitBreakerConfig: Partial<VPADynamicConfig["circuitBreaker"]>,
  ): Promise<boolean> {
    try {
      this.config.circuitBreaker = {
        ...this.config.circuitBreaker,
        ...circuitBreakerConfig,
      };
      await this.saveConfig();

      this.logger.info("Circuit breaker configuration updated");

      return true;
    } catch (error) {
      this.logger.error("Error updating circuit breaker configuration", error);

      return false;
    }
  }

  /**
   * Validate VPA configuration
   */
  private validateVPAConfig(vpaConfig: VPARoute): boolean {
    if (!vpaConfig.vpa || typeof vpaConfig.vpa !== "string") {
      this.logger.error("Invalid VPA: must be a non-empty string");

      return false;
    }

    if (
      typeof vpaConfig.priority !== "number" ||
      vpaConfig.priority < 1 ||
      vpaConfig.priority > 10
    ) {
      this.logger.error("Invalid priority: must be a number between 1 and 10");

      return false;
    }

    if (typeof vpaConfig.isActive !== "boolean") {
      this.logger.error("Invalid isActive: must be a boolean");

      return false;
    }

    // Validate optional fields
    if (
      vpaConfig.maxDailyTransactions !== undefined &&
      (typeof vpaConfig.maxDailyTransactions !== "number" ||
        vpaConfig.maxDailyTransactions < 0)
    ) {
      this.logger.error(
        "Invalid maxDailyTransactions: must be a non-negative number",
      );

      return false;
    }

    if (
      vpaConfig.maxDailyAmount !== undefined &&
      (typeof vpaConfig.maxDailyAmount !== "number" ||
        vpaConfig.maxDailyAmount < 0)
    ) {
      this.logger.error(
        "Invalid maxDailyAmount: must be a non-negative number",
      );

      return false;
    }

    return true;
  }

  /**
   * Record configuration change event
   */
  private recordChangeEvent(event: ConfigChangeEvent) {
    this.changeHistory.push(event);

    // Keep only last 100 events
    if (this.changeHistory.length > 100) {
      this.changeHistory = this.changeHistory.slice(-100);
    }

    // Notify watchers
    this.configWatchers.forEach((watcher) => {
      try {
        watcher(event);
      } catch (error) {
        this.logger.error("Error in config watcher", error);
      }
    });

    // Save change history to cache
    this.cacheManager.set("vpa_config_history", this.changeHistory, 86400000); // 24 hours
  }

  /**
   * Subscribe to configuration changes
   */
  subscribeToChanges(watcher: (event: ConfigChangeEvent) => void): () => void {
    this.configWatchers.push(watcher);

    // Return unsubscribe function
    return () => {
      const index = this.configWatchers.indexOf(watcher);
      if (index > -1) {
        this.configWatchers.splice(index, 1);
      }
    };
  }

  /**
   * Get configuration change history
   */
  getChangeHistory(): ConfigChangeEvent[] {
    return [...this.changeHistory];
  }

  /**
   * Get VPA by ID
   */
  getVPA(vpa: string): VPARoute | undefined {
    return this.config.vpas.find((v) => v.vpa === vpa);
  }

  /**
   * Get all active VPAs
   */
  getActiveVPAs(): VPARoute[] {
    return this.config.vpas.filter((v) => v.isActive);
  }

  /**
   * Get VPA statistics
   */
  getVPAStats(): any {
    return {
      totalVPAs: this.config.vpas.length,
      activeVPAs: this.getActiveVPAs().length,
      routingStrategy: this.config.routing.strategy,
      monitoringEnabled: this.config.monitoring.enabled,
      rateLimitingEnabled: this.config.rateLimiting.enabled,
      circuitBreakerEnabled: this.config.circuitBreaker.enabled,
      recentChanges: this.changeHistory.slice(-10), // Last 10 changes
    };
  }

  /**
   * Export configuration
   */
  exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * Import configuration
   */
  async importConfig(configJson: string): Promise<boolean> {
    try {
      const importedConfig = JSON.parse(configJson) as VPADynamicConfig;

      // Validate imported configuration
      if (!this.validateImportedConfig(importedConfig)) {
        return false;
      }

      const previousConfig = { ...this.config };
      this.config = importedConfig;
      await this.saveConfig();

      // Record change event
      const event: ConfigChangeEvent = {
        type: "strategy_changed",
        timestamp: new Date(),
        details: { action: "config_imported" },
        previousValue: previousConfig,
        newValue: this.config,
      };
      this.recordChangeEvent(event);

      this.logger.info("Configuration imported successfully");

      return true;
    } catch (error) {
      this.logger.error("Error importing configuration", error);

      return false;
    }
  }

  /**
   * Validate imported configuration
   */
  private validateImportedConfig(config: any): boolean {
    if (!config || typeof config !== "object") {
      this.logger.error("Invalid configuration: must be an object");

      return false;
    }

    if (!Array.isArray(config.vpas)) {
      this.logger.error("Invalid configuration: vpas must be an array");

      return false;
    }

    // Validate each VPA
    for (const vpa of config.vpas) {
      if (!this.validateVPAConfig(vpa)) {
        return false;
      }
    }

    return true;
  }
}

// Export singleton instance
export const vpaConfigManager = new VPAConfigManager(null as any);
