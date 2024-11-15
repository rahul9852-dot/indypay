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
