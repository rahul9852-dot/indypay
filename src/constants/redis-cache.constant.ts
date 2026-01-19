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
  // Stats caching keys
  STATS_MERCHANT: (userId: string, startDate: string, endDate: string) =>
    `stats:merchant:${userId}:${startDate}:${endDate}`,
  STATS_ADMIN: (startDate: string, endDate: string) =>
    `stats:admin:${startDate}:${endDate}`,
  USER_INTEGRATION_MAPPING: (userId: string) =>
    `user_integration_mapping:${userId}`,
  USER_COMMISSION_PLAN: (userId: string, type: string) =>
    `user_commission_plan:${userId}:${type}`,
  // Week-based stats caching keys
  STATS_ADMIN_WEEK: (weekStart: string) => `stats:admin:week:${weekStart}`,
  STATS_MERCHANT_WEEK: (userId: string, weekStart: string) =>
    `stats:merchant:week:${userId}:${weekStart}`,
  // Daily stats caching keys (for incremental aggregation)
  STATS_ADMIN_DAILY: (date: string) => `stats:admin:daily:${date}`,
  STATS_MERCHANT_DAILY: (userId: string, date: string) =>
    `stats:merchant:daily:${userId}:${date}`,
};
