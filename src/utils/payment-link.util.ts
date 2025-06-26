import { IGeneratePaymentLinkPayload } from "@/interface/common.interface";
import { vpaRoutingService } from "@/utils/vpa-routing.util";

export const generatePaymentLinkUtil = (
  payload: IGeneratePaymentLinkPayload,
): string => {
  const { amount, orderId, vpa, userId } = payload;
  const routingResult = vpaRoutingService.selectVPA(userId, amount, orderId);
  const selectedVpa = vpa || routingResult.selectedVpa;

  const expiry = new Date(Date.now() + 60 * 1000); // 1 minute expiry

  const paymentStr = `&pa=${selectedVpa}&am=${amount}&tr=${orderId}&tn=Payment_for_${orderId}&cu=INR&exp=${expiry.getTime()}`;

  return `upi://pay?${paymentStr}`;
};
