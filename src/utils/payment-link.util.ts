import { IGeneratePaymentLinkPayload } from "@/interface/common.interface";
import { enhancedVpaRoutingService } from "@/utils/enhanced-vpa-routing.util";
import { CustomLogger, LoggerPlaceHolder } from "@/logger";

const logger = new CustomLogger("PaymentLinkUtil");

export const generatePaymentLinkUtil = async (
  payload: IGeneratePaymentLinkPayload,
): Promise<string> => {
  const { amount, orderId, vpa, userId } = payload;
  const startTime = Date.now();

  try {
    // Use enhanced VPA routing service
    const routingResult = await enhancedVpaRoutingService.selectVPA(
      userId,
      amount,
      orderId,
    );
    const selectedVpa = vpa || routingResult.selectedVpa;

    const responseTime = Date.now() - startTime;

    // Record success metrics
    await enhancedVpaRoutingService.recordSuccess(selectedVpa, responseTime);

    logger.info(`VPA Selection: ${LoggerPlaceHolder.Json}`, {
      selectedVpa,
      strategy: routingResult.strategy,
      reason: routingResult.reason,
      responseTime,
      metadata: routingResult.metadata,
    });

    const expiry = new Date(Date.now() + 60 * 1000); // 1 minute expiry

    const paymentStr = `&pa=${selectedVpa}&am=${amount}&tr=${orderId}&tn=Payment_for_${orderId}&cu=INR&exp=${expiry.getTime()}`;

    return `upi://pay?${paymentStr}`;
  } catch (error) {
    // Record failure metrics if we have a selected VPA
    if (vpa) {
      await enhancedVpaRoutingService.recordFailure(vpa);
    }

    logger.error(`VPA Selection Failed: ${LoggerPlaceHolder.Json}`, {
      error: error.message,
      payload,
    });

    // Fallback to default VPA
    const fallbackVpa = vpa || "default@paybolt";
    const paymentStr = `&pa=${fallbackVpa}&am=${amount}&tr=${orderId}&tn=Payment_for_${orderId}&cu=INR&exp=${new Date(Date.now() + 60 * 1000).getTime()}`;

    return `upi://pay?${paymentStr}`;
  }
};
