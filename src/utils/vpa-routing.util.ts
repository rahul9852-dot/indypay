import { appConfig } from "@/config/app.config";
import { CustomLogger, LoggerPlaceHolder } from "@/logger";

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
}

export interface VPARoutingResult {
  selectedVpa: string;
  strategy: string;
  reason: string;
}

export class VPARoutingService {
  private readonly logger = new CustomLogger(VPARoutingService.name);
  private currentRoundRobinIndex = 0;

  // select VPA based on configured routing strategy
  selectVPA(
    userId?: string,
    amount?: number,
    orderId?: string,
  ): VPARoutingResult {
    if (!vpas || vpas.length === 0) {
      this.logger.warn("No VPAs configured, using fallback");

      return {
        selectedVpa: appConfig().utkarsh.vpa,
        strategy: "fallback",
        reason: "No VPAs configured",
      };
    }

    const activeVPAs = vpas.filter((vpa) => vpa.isActive);

    if (activeVPAs.length === 0) {
      this.logger.warn("No active VPAs found, using fallback");

      return {
        selectedVpa: appConfig().utkarsh.vpa,
        strategy: "fallback",
        reason: "No active VPAs",
      };
    }

    switch (vpaRouting.strategy) {
      case "round_robin":
        return this.roundRobinStrategy(activeVPAs);
      case "load_balance":
        return this.loadBalanceStrategy(activeVPAs, amount);
      case "user_based":
        return this.userBasedStrategy(activeVPAs, userId);
      case "amount_based":
        return this.amountBasedStrategy(activeVPAs, amount);
      case "priority_based":
        return this.priorityBasedStrategy(activeVPAs);
      default:
        return this.roundRobinStrategy(activeVPAs);
    }
  }

  private roundRobinStrategy(vpas: VPARoute[]): VPARoutingResult {
    const selectedVpa = vpas[this.currentRoundRobinIndex % vpas.length];
    this.currentRoundRobinIndex =
      (this.currentRoundRobinIndex + 1) % vpas.length;

    this.logger.info(`Round Robin VPA Selection: ${LoggerPlaceHolder.Json}`, {
      selectedVpa: selectedVpa.vpa,
      index: this.currentRoundRobinIndex - 1,
      totalVPAs: vpas.length,
    });

    return {
      selectedVpa: selectedVpa.vpa,
      strategy: "round_robin",
      reason: `Selected VPA ${selectedVpa.vpa} (index: ${this.currentRoundRobinIndex - 1})`,
    };
  }

  private loadBalanceStrategy(
    vpas: VPARoute[],
    amount?: number,
  ): VPARoutingResult {
    // For now, implement a simple round-robin with amount consideration
    // In a real implementation, you'd track daily transaction counts and amounts
    const threshold = vpaRouting.loadBalanceThreshold || 1000000;

    if (amount && amount > threshold) {
      // For high amounts, use VPA with higher priority
      const highPriorityVPAs = vpas.filter((vpa) => vpa.priority <= 2);
      if (highPriorityVPAs.length > 0) {
        const selectedVpa = highPriorityVPAs[0];

        return {
          selectedVpa: selectedVpa.vpa,
          strategy: "load_balance",
          reason: `High amount (${amount}) - using high priority VPA ${selectedVpa.vpa}`,
        };
      }
    }

    // Fallback to round-robin for normal amounts
    return this.roundRobinStrategy(vpas);
  }

  private userBasedStrategy(
    vpas: VPARoute[],
    userId?: string,
  ): VPARoutingResult {
    if (!userId || !vpaRouting.userBasedMapping) {
      return this.roundRobinStrategy(vpas);
    }

    const mappedVpa = vpaRouting.userBasedMapping[userId];
    if (mappedVpa) {
      const vpaRoute = vpas.find((vpa) => vpa.vpa === mappedVpa);
      if (vpaRoute && vpaRoute.isActive) {
        return {
          selectedVpa: mappedVpa,
          strategy: "user_based",
          reason: `User ${userId} mapped to VPA ${mappedVpa}`,
        };
      }
    }

    return this.roundRobinStrategy(vpas);
  }

  private amountBasedStrategy(
    vpas: VPARoute[],
    amount?: number,
  ): VPARoutingResult {
    if (!amount || !vpaRouting.amountBasedMapping) {
      return this.roundRobinStrategy(vpas);
    }

    // Find the appropriate VPA based on amount ranges
    for (const [range, vpa] of Object.entries(vpaRouting.amountBasedMapping)) {
      const [min, max] = range.split("-").map(Number);
      if (amount >= min && (max === undefined || amount <= max)) {
        const vpaRoute = vpas.find((v) => v.vpa === vpa);
        if (vpaRoute && vpaRoute.isActive) {
          return {
            selectedVpa: vpa as string,
            strategy: "amount_based",
            reason: `Amount ${amount} falls in range ${range} - using VPA ${vpa}`,
          };
        }
      }
    }

    return this.roundRobinStrategy(vpas);
  }

  private priorityBasedStrategy(vpas: VPARoute[]): VPARoutingResult {
    // Sort VPAs by priority (lower number = higher priority)
    const sortedVPAs = [...vpas].sort((a, b) => a.priority - b.priority);

    // Use the highest priority VPA
    const selectedVpa = sortedVPAs[0];

    return {
      selectedVpa: selectedVpa.vpa,
      strategy: "priority_based",
      reason: `Selected highest priority VPA ${selectedVpa.vpa} (priority: ${selectedVpa.priority})`,
    };
  }

  /**
   * Get all active VPAs
   */
  getActiveVPAs(): VPARoute[] {
    return vpas?.filter((vpa) => vpa.isActive) || [];
  }

  /**
   * Get VPA statistics (for monitoring)
   */
  getVPAStats(): any {
    const activeVPAs = this.getActiveVPAs();

    return {
      totalVPAs: vpas?.length || 0,
      activeVPAs: activeVPAs.length,
      currentRoundRobinIndex: this.currentRoundRobinIndex,
      routingStrategy: vpaRouting.strategy,
      vpas: activeVPAs.map((vpa) => ({
        vpa: vpa.vpa,
        priority: vpa.priority,
        isActive: vpa.isActive,
        description: vpa.description,
      })),
    };
  }
}

export const vpaRoutingService = new VPARoutingService();
