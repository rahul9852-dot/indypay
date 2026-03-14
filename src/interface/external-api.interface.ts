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
