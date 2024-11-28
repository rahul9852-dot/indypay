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
