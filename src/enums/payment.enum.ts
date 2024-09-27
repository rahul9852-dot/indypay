export enum PAYMENT_STATUS {
  DUPLICATE = "DUPLICATE",
  FAILED = "FAILED",
  PENDING = "PENDING",
  SUCCESS = "SUCCESS",
  TAMPERED = "TAMPERED",
}

export enum PAYMENT_TYPE {
  PAYIN = "payin",
  PAYOUT = "payout",
}

export enum PAYMENT_METHOD {
  CASH = "cash",
  CREDIT_CARD = "credit_card",
  DEBIT_CARD = "debit_card",
  NET_BANKING = "net_banking",
  UPI = "upi",
  WALLET = "wallet",
}

export enum CURRENCY_ENUM {
  INR = "INR",
  USD = "USD",
}
