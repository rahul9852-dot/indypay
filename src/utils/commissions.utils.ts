import { Logger } from "@nestjs/common";

export const getPayoutCommissions = ({
  amount,
  commissionInPercentage,
  gstInPercentage,
}: {
  commissionInPercentage: number;
  gstInPercentage: number;
  amount: number;
}) => {
  if (amount < 1000) {
    const flatCommission = 5;
    const gstAmount = (flatCommission * gstInPercentage) / 100;
    const totalServiceCharge = flatCommission + gstAmount;
    const netPayableAmount = amount - totalServiceCharge;

    return {
      commissionAmount: flatCommission,
      gstAmount,
      netPayableAmount,
      totalServiceChange: totalServiceCharge,
    };
  }
  const commissionAmount = (amount * commissionInPercentage) / 100;
  const gstAmount = (commissionAmount * gstInPercentage) / 100;
  const totalServiceChange = commissionAmount + gstAmount;
  const netPayableAmount = amount - totalServiceChange;

  return {
    commissionAmount,
    gstAmount,
    netPayableAmount,
    totalServiceChange,
  };
};

export const calculatePayoutOriginalAmountFromNetPayable = ({
  netPayableAmount,
  commissionInPercentage,
  gstInPercentage,
  flatCommission,
}: {
  netPayableAmount: number;
  commissionInPercentage: number;
  gstInPercentage: number;
  flatCommission?: number;
}) => {
  const logger = new Logger("calculateOriginalAmountFromNetPayable");

  logger.log(
    `Calculating original amount from net payable: ${netPayableAmount}`,
  );
  logger.log(`Flat commission: ${flatCommission}`);

  if (netPayableAmount <= 1000) {
    const gstAmount = (flatCommission * gstInPercentage) / 100;
    const totalServiceCharge = flatCommission + gstAmount;
    const originalAmount = netPayableAmount + totalServiceCharge;

    logger.log(
      `Original amount calculated for flat commission: ${originalAmount}`,
    );

    return originalAmount;
  }

  const commissionRate = commissionInPercentage / 100;
  const gstRate = (commissionRate * gstInPercentage) / 100;

  const totalDeductionRate = commissionRate + gstRate;

  if (totalDeductionRate >= 1) {
    throw new Error(
      "Invalid rates: Total deduction cannot be equal or greater than 1.",
    );
  }

  const originalAmount = netPayableAmount / (1 - totalDeductionRate);

  return originalAmount;
};

export const getCommissions = ({
  amount,
  commissionInPercentage,
  gstInPercentage,
}: {
  commissionInPercentage: number;
  gstInPercentage: number;
  amount: number;
}) => {
  const commissionAmount = (amount * commissionInPercentage) / 100;
  const gstAmount = (commissionAmount * gstInPercentage) / 100;
  const totalServiceChange = commissionAmount + gstAmount;
  const netPayableAmount = amount - totalServiceChange;

  return {
    commissionAmount,
    gstAmount,
    netPayableAmount,
    totalServiceChange,
  };
};

export const calculateOriginalAmountFromNetPayable = ({
  netPayableAmount,
  commissionInPercentage,
  gstInPercentage,
}: {
  netPayableAmount: number;
  commissionInPercentage: number;
  gstInPercentage: number;
  flatCommission?: number;
}) => {
  const commissionRate = commissionInPercentage / 100;
  const gstRate = (commissionRate * gstInPercentage) / 100;

  const totalDeductionRate = commissionRate + gstRate;

  if (totalDeductionRate >= 1) {
    throw new Error(
      "Invalid rates: Total deduction cannot be equal or greater than 1.",
    );
  }

  const originalAmount = netPayableAmount / (1 - totalDeductionRate);

  return originalAmount;
};

export interface CommissionConfig {
  amountThreshold: number;
  commissionRate: number;
  gstRate: number;
}

export interface DynamicCommissionParams {
  amount: number;
  userCommissionRate: number;
  userGstRate: number;
  commissionConfigs?: CommissionConfig[];
}

/**
 * Calculate commission based on amount ranges
 * @param params - Commission calculation parameters
 * @returns Commission details with amount, commission, GST, and net payable
 *
 * @example
 * // For amounts < 1000: 7.25% commission, 18% GST
 * // For amounts >= 1000: User's default rates
 * const result = calculateDynamicCommission({
 *   amount: 500,
 *   userCommissionRate: 5.0,
 *   userGstRate: 18,
 *   commissionConfigs: [
 *     { amountThreshold: 1000, commissionRate: 7.25, gstRate: 18 }
 *   ]
 * });
 *
 * // Multiple thresholds example:
 * const result2 = calculateDynamicCommission({
 *   amount: 2500,
 *   userCommissionRate: 5.0,
 *   userGstRate: 18,
 *   commissionConfigs: [
 *     { amountThreshold: 1000, commissionRate: 7.25, gstRate: 18 },
 *     { amountThreshold: 5000, commissionRate: 6.0, gstRate: 18 },
 *     { amountThreshold: 10000, commissionRate: 4.5, gstRate: 18 }
 *   ]
 * });
 */
export function calculateDynamicCommission({
  amount,
  userCommissionRate,
  userGstRate,
  commissionConfigs = [
    // { amountThreshold: 1000, commissionRate: 12, gstRate: 18 }, // Default config for amounts < 1000
    // we also add multiple config if i need later on.
  ],
}: DynamicCommissionParams) {
  const sortedConfigs = [...commissionConfigs].sort(
    (a, b) => b.amountThreshold - a.amountThreshold,
  );
  const applicableConfig = sortedConfigs.find(
    (config) => amount < config.amountThreshold,
  );
  const commissionRate = applicableConfig
    ? applicableConfig.commissionRate
    : userCommissionRate;
  const gstRate = applicableConfig ? applicableConfig.gstRate : userGstRate;
  let commissionAmount = 0;

  if (applicableConfig) {
    commissionAmount = commissionRate;
  } else {
    commissionAmount = (amount * commissionRate) / 100;
  }
  const gstAmount = (commissionAmount * gstRate) / 100;
  const netPayableAmount = amount + commissionAmount + gstAmount;

  return {
    amount,
    gstAmount,
    commissionAmount,
    netPayableAmount,
    commissionRate,
    gstRate,
    appliedConfig: applicableConfig ? "threshold" : "user_default",
  };
}
