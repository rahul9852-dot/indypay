import { PAYOUT_PAYMENT_MODE } from "@/enums/payment.enum";

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

export interface IExternalPayoutRequest {
  amount: number;
  bene_name: string;
  mobile: string;
  email: string;
  ref_no: string;
  account: string;
  ifsc: string;
  mode: PAYOUT_PAYMENT_MODE;
  Remark: string;
  Address: string;
}

export interface IExternalPayoutResponse {
  res_code: string;
  msg: string;
  data: {
    ID: string;
    status: string;
    Utr: string;
    Ref_No: string;
    Amount: number;
  };
}
