import { EXTERNAL_PAYOUT_PAYMENT_STATUS } from "@/enums/payment.enum";

export interface IExternalPayinPaymentRequest {
  amount: string;
  customer_name: string;
  customer_mobile: string;
  customer_email: string;
  ref_no: string;
}

export interface IExternalPayinPaymentResponse {
  res_code: string;
  msg: string;
  data: {
    qr: string;
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
