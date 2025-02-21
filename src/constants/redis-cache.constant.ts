export const MAX_ATTEMPTS = 3;
export const LOCK_TIME_MS = 30 * 60 * 1000; // 30 minutes

export const REDIS_KEYS = {
  TWO_FACTOR_TOKEN: (userId: string) => `2fa:${userId}:code`,
  TWO_FACTOR_PENDING: (userId: string) => `2fa:${userId}:pending`,
  API_KEY: (clientId: string) => `api_key_entity_${clientId}`,
  USER_KEY: (userId: string) => `user_entity_${userId}`,
  SSO_TOKEN: (clientId: string) => `sso_token_entity_${clientId}`,
  OTP_KEY: (mobile: string) => `otp_to_${mobile}`,
  FORGET_PASSWORD_KEY: (mobile: string) => `forget_pwd_to_${mobile}`,
  PAYMENT_STATUS: (orderId: string) => `payment_status_${orderId}`,
  SUCCESS_COUNT: (userId: string) => `pin_success_count:${userId}`,
};
