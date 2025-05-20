import { ExternalPayOutWebhookEritechDto } from "@/modules/payments/dto/external-webhook-payout.dto";
import { ExternalEritechWebhookDto } from "@/modules/payments/dto/external-webhook-payout.dto";

export function mapToFilteredDto(
  rawData: ExternalEritechWebhookDto,
): ExternalPayOutWebhookEritechDto {
  return {
    orderId: rawData.data.response.custUniqRef,
    status: rawData.data.response.txn_status.transactionStatus,
    transferId: rawData.data.response.custUniqRef,
    amount: rawData.data.response.amount,
    utr: rawData.data.response.txn_status.utrNo,
  };
}
