import { IGeneratePaymentLinkPayload } from "@/interface/common.interface";

export const generatePaymentLinkUtil = (
  payload: IGeneratePaymentLinkPayload,
): string => {
  const { amount, orderId, vpa } = payload;
  const expiry = new Date(Date.now() + 60 * 1000); // 15 minutes expiry

  const paymentStr = `&pa=${vpa}&am=${amount}&tid=${orderId}&tn=Payment_for_${orderId}&cu=INR&exp=${expiry.getTime()}`;

  return `upi://pay?${paymentStr}`;
};
