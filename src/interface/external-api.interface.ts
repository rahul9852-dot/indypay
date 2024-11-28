import { PAYOUT_PAYMENT_MODE } from "@/enums/payment.enum";

// AnviNeo
export interface IExternalPayinPaymentRequestAnviNeo {
  amount: string;
  customer_name: string;
  customer_mobile: string;
  customer_email: string;
  ref_no: string;
}

export interface IExternalPayinPaymentResponseAnviNeo {
  res_code: string;
  msg: string;
  data: {
    qr: string;
  };
}

export interface IExternalPayoutRequestAnviNeo {
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

export interface IExternalPayoutResponseAnviNeo {
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

// Ismart

export interface IExternalPayinPaymentRequestIsmart {
  currency: string;
  amount: string;
  order_id: string;
  email: string;
  mobile: string;
  name: string;
  redirect_url: string;
  webhook_url: string;
  pay_type: "UPI";
  vpa: string;
}

export interface IExternalPayinPaymentResponseIsmart {
  status: boolean;
  status_code: string;
  transaction_id: string;
  order_id: string;
  amount: string;
  currency: string;
  created_on: string;
  payment_url: string;
  errors?: string;
  intent?: string;
}

export interface IExternalPayoutRequestIsmart {
  amount: number;
  currency: "INR";
  purpose: string;
  order_id: string;
  narration: string;
  phone_number: string;
  payment_details: {
    type: "NB" | "UPI" | "WL";
    account_number: string;
    ifsc_code: string;
    beneficiary_name: string;
    mode: PAYOUT_PAYMENT_MODE;
  };
}

export interface IExternalPayoutResponseIsmart {
  status: boolean;
  status_code: string;
  message: string;
  transaction_id: string;
  amount: number;
  bank_id: string;
  order_id: string;
  purpose: string;
  narration: string;
  currency: string;
  wallet_id: string;
  wallet_name: string;
  created_on: string;
  errors?: string;
}

export interface IExternalPayoutStatusResponseIsmart {
  status: boolean;
  status_code: string;
  message: string;
  transaction_id: string;
  amount: number;
  bank_id: string;
  order_id: string;
  purpose: string;
  narration: string;
  currency: string;
  wallet_id: string;
  wallet_name: string;
  created_on: string;
}
