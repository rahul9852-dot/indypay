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
