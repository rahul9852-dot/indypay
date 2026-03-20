import { Process, Processor, OnQueueFailed } from "@nestjs/bull";
import { Job } from "bull";
import axios from "axios";
import { CustomLogger } from "@/logger";

export interface MerchantWebhookJobData {
  url: string;
  payload: {
    orderId: string;
    status: string;
    amount: number;
    txnRefId?: string;
    utr?: string;
    payerVpa?: string;
    message?: string;
  };
}

/**
 * O-9 fix: Reliable merchant webhook delivery with automatic retries.
 *
 * PROBLEM THIS SOLVES
 * ───────────────────
 * Previously sendUserWebhook() did a single axios.post() with a 5s timeout.
 * If the merchant's server was temporarily down, the webhook was lost forever.
 * Merchants would not know a payment succeeded — their system thinks it failed.
 *
 * HOW IT WORKS NOW
 * ─────────────────
 * 1. When a payin status changes, a job is added to the "merchant-webhooks" queue.
 * 2. This processor picks it up and does the actual HTTP delivery.
 * 3. If the merchant's server returns 5xx or times out, Bull auto-retries:
 *      Attempt 1: immediate
 *      Attempt 2: after 60s
 *      Attempt 3: after 120s
 * 4. After all 3 attempts fail, @OnQueueFailed logs a CRITICAL alert.
 *
 * RETRY CONFIG (set in sendUserWebhook when enqueuing):
 *   attempts: 3
 *   backoff: { type: "exponential", delay: 60_000 }
 */
@Processor("merchant-webhooks")
export class MerchantWebhookProcessor {
  private readonly logger = new CustomLogger(MerchantWebhookProcessor.name);

  @Process("deliver-webhook")
  async deliver(job: Job<MerchantWebhookJobData>): Promise<void> {
    const { url, payload } = job.data;

    this.logger.info(
      `[MERCHANT-WEBHOOK] Attempt ${job.attemptsMade + 1} → ${url} orderId=${payload.orderId}`,
    );

    const { status: httpStatus } = await axios.post(url, payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 10_000, // 10s per attempt — more generous than the old 5s
      // Throw on 5xx so Bull registers it as a failure and retries.
      // 2xx and 4xx are treated as delivered (4xx = merchant rejected, not our fault).
      validateStatus: (s) => s < 500,
    });

    this.logger.info(
      `[MERCHANT-WEBHOOK] Delivered → ${url} orderId=${payload.orderId} httpStatus=${httpStatus}`,
    );
  }

  @OnQueueFailed()
  onFailed(job: Job<MerchantWebhookJobData>, err: Error): void {
    const { url, payload } = job.data;
    const exhausted = job.attemptsMade >= (job.opts.attempts ?? 1);

    if (exhausted) {
      // All retries consumed — this is a real delivery failure.
      this.logger.error(
        `[MERCHANT-WEBHOOK] CRITICAL: Webhook delivery permanently failed after ${job.attemptsMade} attempts. ` +
          `orderId=${payload.orderId} url=${url} error=${err.message}`,
      );
    } else {
      this.logger.warn(
        `[MERCHANT-WEBHOOK] Attempt ${job.attemptsMade} failed for orderId=${payload.orderId} — will retry. error=${err.message}`,
      );
    }
  }
}
