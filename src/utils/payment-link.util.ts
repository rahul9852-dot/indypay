import { IGeneratePaymentLinkPayload } from "@/interface/common.interface";

export const generatePaymentLinkUtil = (
  payload: IGeneratePaymentLinkPayload,
): string => {
  const { amount, orderId, vpa } = payload;
  const name = "PAYBOLTTECHNOLOGIES";
  const expiry = new Date(Date.now() + 60 * 1000); // 15 minutes expiry
  const paymentStr = `&pa=${vpa}&pn=${name}&am=${amount}&tr=${orderId}&tn=Paymentfor${orderId}&cu=INR&exp=${expiry.getTime()}`;

  return `upi://pay?${paymentStr}`;
};
