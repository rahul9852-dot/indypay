export const MAX_ATTEMPTS = 3;
export const LOCK_TIME_MS = 30 * 60 * 1000; // 30 minutes

export const REDIS_KEYS = {
  API_KEY: (clientId: string) => `api_key_entity_${clientId}`,
  USER_KEY: (userId: string) => `user_entity_${userId}`,
  SSO_TOKEN: (clientId: string) => `sso_token_entity_${clientId}`,
  OTP_KEY: (mobile: string) => `otp_to_${mobile}`,
  PAYMENT_STATUS: (orderId: string) => `payment_status_${orderId}`,
  SUCCESS_COUNT: "pin_success_count",
};
