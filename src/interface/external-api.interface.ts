import { EXTERNAL_PAYOUT_PAYMENT_STATUS } from "@/enums/payment.enum";

export interface IExternalPayinPaymentResponse {
  status: boolean;
  status_code: string;
  transaction_id: string;
  order_id: string;
  amount: string;
  currency: string;
  created_on: string;
  payment_url: string;
  intent: string;
  utf: {
    customer_id: string;
    hash_key: string;
  };
  errors?: string;
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
