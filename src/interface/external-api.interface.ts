import { EXTERNAL_PAYOUT_PAYMENT_STATUS } from "@/enums/payment.enum";

export interface IExternalPayinPaymentResponse {
  timestamp: string;
  statusCode: number;
  status: string;
  message: string;
  success: boolean;
  data: {
    orderId: string;
    txnRefId: string;
    paymentUrl: string;
  };
}

export interface IExternalPayoutPaymentResponse {
  timestamp: string;
  statusCode: number;
  status: string;
  message: string;
  success: boolean;
  data: {
    status: EXTERNAL_PAYOUT_PAYMENT_STATUS;
    transferId: string;
  };
}
