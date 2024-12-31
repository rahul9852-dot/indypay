export const ISMART_PAY = {
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
