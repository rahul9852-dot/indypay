import { ONBOARDING_STATUS, USERS_ROLE } from "@/enums";
import { PAYMENT_STATUS } from "@/enums/payment.enum";

export interface IAccessTokenPayload {
  id: string;
  onboardingStatus: ONBOARDING_STATUS;
  role: USERS_ROLE;
  email: string;
  mobile: string;
}

export type IRefreshTokenPayload = IAccessTokenPayload;

export interface IVerifyMobilePayload {
  mobile: string;
  isVerified: boolean;
}

export interface IGeneratePaymentLinkPayload {
  amount: number;
  orderId: string;
  vpa?: string;
  userId?: string;
}

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
  metadata?: {
    healthScore?: number;
    currentLoad?: number;
    lastUsed?: Date;
    successRate?: number;
  };
}
