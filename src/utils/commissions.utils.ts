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
