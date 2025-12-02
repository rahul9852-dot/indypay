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

// Pay N Pro
export interface IExternalPayinPaymentRequestPayNPro {
  amount: string;
  key_id: string;
  name: string;
  mobile: string;
  txnCurr: string;
  key_secret: string;
  email: string;
}

export interface IExternalPayinPaymentResponsePayNPro {
  key_id: string;
  data: string;
  Description?: string;
  statusCode?: string;
}

export interface IExternalPayoutRequestPayNPro {
  username: string;
  email_id: string;
  mob_no: string;
  amount: string;
  payout_ref: string;
  txn_type: PAYOUT_PAYMENT_MODE;
  recv_bank_ifsc: string;
  recv_name: string;
  recv_bank_name: string;
  purpose: string;
  recv_acc_no: string;
  signature: string;
}

export interface IExternalPayoutResponsePayNPro {
  Data?: {
    txn_id: string;
    date: string;
    payout_ref: string;
    amount: string;
    udf5: string;
    description: string;
    rrn: string;
    status: string;
  };
  error?: string;
  statusCode: number;
}

export interface IExternalPayoutStatusRequestPayNPro {
  payout_ref: string;
  // txnId: string;
  // emailId: string;
  // mobileNumber: string;
  signature: string;
}

export interface IExternalPayoutStatusResponsePayNPro {
  data?: {
    txn_id: string;
    payout_ref: string;
    description: string;
    bank_ref_no: string;
    status: string;
  }[];
  error?: string;
  statusCode: number;
}

export interface IWebhookDataPayNPro {
  date: string;
  bankId: string;
  amount: number;
  key_id: string;
  orderId: string;
  signature: string;
  mobile: string;
  description: string;
  txnCurr: string;
  transactionId: string;
  email: string;
  status: string;
}

// flakpay

export interface IExternalPayinPaymentRequestFlakPay {
  orderId: string;
  pgReturnSuccessUrl: string;
  pgReturnErrorUrl: string;
  amount: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface IExternalPayinPaymentResponseFlakPay {
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

export interface IExternalPayoutRequestFlakPay {
  orderId: string;
  amount: number;
  transferMode: string;
  industryType?: string;
  beneDetails: {
    beneBankName: string;
    beneAccountNo: string;
    beneIfsc: string;
    beneName: string;
    beneEmail?: string;
    benePhone?: string;
  };
}

export interface IExternalPayoutResponseFlakPay {
  timestamp: string;
  statusCode: number;
  status: string;
  message: string;
  data: {
    status: string;
    transferId: string;
    utr: string;
  };
}

export interface IExternalPayoutStatusRequestFlakPay {
  orderId: string;
}

export interface IExternalPayoutStatusResponseFlakPay {
  timestamp: string;
  statusCode: number;
  status: string;
  message: string;
  success: boolean;
  data: {
    status: string;
    transferId: string;
  };
}

export interface IExternalPayinStatusRequestFlakPay {
  orderId: string;
}

export interface IExternalPayinStatusResponseFlakPay {
  timestamp: string;
  statusCode: number;
  status: string;
  message: string;
  success: boolean;
  data: {
    status: string;
    transferId: string;
  };
}

export interface IExternalPayoutRequestEritech {
  paymentDetails: {
    txnPaymode: string;
    txnAmount: string;
    beneIfscCode: string;
    beneAccNum: string;
    beneName: string;
    custUniqRef: string;
    beneMobileNo: string;
  };
}

export interface IExternalPayoutRequestEritechEncrypt {
  data: string;
  key: string;
}
export interface IExternalPayoutRequestEritechDecrypt {
  data: string;
  key: string;
}

export interface IExternalPayoutRequestEritechToken {
  success: boolean;
  data: {
    user: string;
    token: string;
    creationDateTime: string;
  };
  message: string;
  errors: string;
  exception: string;
}

export interface IExternalEritecPayoutFundResponse {
  success: true;
  data: {
    encryptedResponseData: string;
    creationDateTime: string;
    status?: string;
  };
  message: string;
  errors: string;
  exception: string;
}

export interface IExternalEritecPayoutFundResponseDecrypted {
  orderId: string;
  merchantId: string;
  utrNo: string;
  txn_status: { transactionStatus: string; utrNo: string };
  amount: string;
  txnAmount: number;
  totalCharge: number;
  tax: string;
  totalDeduction: string;
  ip: string;
  paymentType: string;
  beneIfscCode: string;
  beneAccNum: string;
  beneName: string;
  beneMobileNo: string;
  custUniqRef: string;
  batchNo: string;
  mode: string;
}

export interface IExternalEritechStatusResponse {
  success: boolean;
  data: {
    status: string;
    response: {
      merchantId: string;
      totalCharge: number;
      tax: number;
      totalDeduction: number;
      orderId: number;
      txnAmount: number;
      txn_status: {
        statusDescription: string;
        responseCode: string;
        utrNo: string;
        transactionStatus: string;
      };
      amount: number;
      paymentType: string;
      custUniqRef: string;
      balance: number;
    };
  };
  creationDateTime: string;
  message: string;
  errors: string;
  exception: string;
}

export interface IExternalPayinStatusResponseUtkarsh {
  data: string;
  message: string;
}

export interface IExternalPayinPaymentRequestPayboltPayin {
  amount: number;
  email: string;
  mobile: string;
  name: string;
  orderId: string;
}

export interface IExternalPayinPaymentResponsePayboltPayin {
  orderId: string;
  intent: string;
}
