import { IGeneratePaymentLinkPayload } from "@/interface/common.interface";
import { enhancedVpaRoutingService } from "@/utils/enhanced-vpa-routing.util";
import { CustomLogger, LoggerPlaceHolder } from "@/logger";

const logger = new CustomLogger("PaymentLinkUtil");

export const generatePaymentLinkUtil = async (
  payload: IGeneratePaymentLinkPayload,
): Promise<string> => {
  const { amount, orderId, vpa, userId } = payload;

  try {
    // Use enhanced VPA routing service to select the best VPA
    const routingResult = await enhancedVpaRoutingService.selectVPA(
      userId,
      amount,
      orderId,
    );
    const selectedVpa = vpa || routingResult.selectedVpa;

    logger.info(`VPA Selection: ${LoggerPlaceHolder.Json}`, {
      selectedVpa,
      strategy: routingResult.strategy,
      reason: routingResult.reason,
      metadata: routingResult.metadata,
    });

    // Fallback to default VPA
    const fallbackVpa = vpa || "default@paybolt";
    const name = "PAYBOLTTECHNOLOGIES";
    const paymentStr = `&pa=${fallbackVpa}&pn=${name}&am=${amount}&tr=${orderId}&tn=Paymentfor${orderId}&cu=INR&exp=${new Date(Date.now() + 60 * 1000).getTime()}`;

    return `upi://pay?${paymentStr}`;
  } catch (err) {
    throw new Error(err);
  }
};
