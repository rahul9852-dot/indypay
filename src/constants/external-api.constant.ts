export const ISMART_PAY = {
  BASE_URL: "https://pay.ismartpay.co.in",
  PAYIN: "api/create/order",
  PAYOUT: "api/create/payout",
  PAYOUT_STATUS: "api/payout/status", // api/payout/status/{{transaction_id}}
};

export const ANVITAPAY = {
  PAYIN: "api/dynamic_qr_code/get_qr_code",
  PAYOUT: "api/payout_api/create_request",
  PAYOUT_STATUS: "api/payout_api/fetchstatus",

  STATUS: {
    SUCCESS: "101",
  },
};

export const PAYNPRO = {
  PAYIN: {
    BASE_URL: "https://pg.paynpro.com",
    TEST_ENDPOINT: "payment/gateway/v1/test/intent/request",
    LIVE_ENDPOINT: "payment/gateway/v1/live/intent/request",
    STATUS: "sapi/payin_status",
  },
  PAYOUT: {
    BASE_URL: "https://pout.paynpro.com",
    LIVE_ENDPOINT: "payout/v1/transfer",
    STATUS: "payout/v1/getStatus",
    BALANCE: "payout/v1/fetchBalance",
  },
};

export const FALKPAY = {
  BASE_URL: "https://api.flakpay.com",
  PAYIN: {
    LIVE: "fundsweep-payin-svc/api/v1/payin/ext/txn/initiate-intent",
    STATUS_CHECK: "fundsweep-payin-svc/api/v1/payin/ext/txn/status",
  },
  PAYOUT: {
    LIVE: "digi-payout/api/v1/external/payout/ft",
    STATUS_CHECK: "digi-payout/api/v1/external/transaction-status",
  },
};

export const ERTITECH = {
  BASE_URL: " https://api.ertipay.com/payout",
  AUTH: "login",
  PAYOUT: {
    LIVE: "payout",
    BALANCE: "balance",
    BULK_TRANSFER: "bulk-transfer",
    FUND: "fund",
    STATUS_CHECK: "status",
    ENCRYPT: "encrypt",
    DECRYPT: "decrypt",
  },
};

export const SABPAISA = {
  BASE_URL: "https://securepay.sabpaisa.in/SabPaisa/sabPaisaInit?v=1",
  PAYIN: "sabPaisaInit",
  PAYOUT: "sabPaisaInit",
  PAYOUT_STATUS: "sabPaisaInit",
};

export const UTKARSH = {
  BASE_URL: "https://portal.getepay.in:8443/getepayPortal",
  PAYIN: {
    STATUS_CHECK: "/payment/getStaticQrRequery",
  },
};

export const DIASPAY = {
  BASE_URL: "https://apiv2.diaspay.in",
  PAYIN: {
    LIVE: "api/initiatePayout",
  },
  PAYOUT: {
    FUND_TRANSFER: "api/initiatePayout",
    QUERY: "api/getPayoutStatus",
  },
};
