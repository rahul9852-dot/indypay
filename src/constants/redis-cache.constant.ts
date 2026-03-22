export const MAX_ATTEMPTS = 3;
export const LOCK_TIME_MS = 30 * 60 * 1000; // 30 minutes

// S-5 fix: cap 2FA verify attempts to prevent brute-force of the 6-digit OTP space.
export const MAX_2FA_ATTEMPTS = 5;

export const REDIS_KEYS = {
  TWO_FACTOR_TOKEN: (userId: string) => `2fa:${userId}:code`,
  TWO_FACTOR_PENDING: (userId: string) => `2fa:${userId}:pending`,
  TWO_FACTOR_ATTEMPTS: (userId: string) => `2fa:${userId}:attempts`,
  API_KEY: (clientId: string) => `api_key_entity_${clientId}`,
  USER_KEY: (userId: string) => `user_entity_${userId}`,
  SSO_TOKEN: (clientId: string) => `sso_token_entity_${clientId}`,
  OTP_KEY: (mobile: string) => `otp_to_${mobile}`,
  FORGET_PASSWORD_KEY: (identifier: string) => `forget_pwd_${identifier}`,
  PAYMENT_STATUS: (orderId: string) => `payment_status_${orderId}`,
  SUCCESS_COUNT: (userId: string) => `pin_success_count:${userId}`,
  // Stats caching keys
  STATS_MERCHANT: (userId: string, startDate: string, endDate: string) =>
    `stats:merchant:${userId}:${startDate}:${endDate}`,
  STATS_ADMIN: (startDate: string, endDate: string) =>
    `stats:admin:${startDate}:${endDate}`,
  USER_INTEGRATION_MAPPING: (userId: string) =>
    `user_integration_mapping:${userId}`,
  INTEGRATION_LIMIT_DAILY: (integrationCode: string, date: string) =>
    `integration_limit:daily:${integrationCode}:${date}`,
  INTEGRATION_LIMIT_MONTHLY: (integrationCode: string, yearMonth: string) =>
    `integration_limit:monthly:${integrationCode}:${yearMonth}`,
  INTEGRATION_LAST_RESET: (integrationCode: string) =>
    `integration_last_reset:${integrationCode}`,
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
  // D-3 fix: tracks successfully processed webhooks for 24 hours so PG retries
  // are rejected at the Redis layer without touching the database at all.
  WEBHOOK_PROCESSED: (orderId: string) => `webhook:processed:${orderId}`,
  // KYC: cache a verified PAN result for 24 h to avoid re-calling Karza for
  // the same PAN within the same session / accidental re-submit.
  KYC_PAN_VERIFIED: (pan: string) => `kyc:pan:verified:${pan.toUpperCase()}`,
  // KYC: cache verified GST result for 24 h.
  KYC_GST_VERIFIED: (gstin: string) =>
    `kyc:gst:verified:${gstin.toUpperCase()}`,
  // KYC: cache verified bank result for 24 h.
  KYC_BANK_VERIFIED: (accountNumber: string, ifsc: string) =>
    `kyc:bank:verified:${accountNumber}:${ifsc.toUpperCase()}`,
};
