export enum NODE_ENV {
  DEVELOPMENT = "development",
  PRODUCTION = "production",
}

export enum COOKIE_KEYS {
  ACCESS_TOKEN = "atk",
  PENDING_SIGN_UP = "psu",
  REFRESH_TOKEN = "rtk",
}

export enum ROLES {
  MERCHANT = 1,
  OPS,
  ADMIN,
  SUPER_ADMIN = 4,
}

export enum STATUS {
  INACTIVE = 1,
  ACTIVE = 2,
}

export enum PAYMENT_STATUS {
  PENDING = 1,
  FAILED,
  SUCCESS = 3,
}

export enum BUSINESS_TYPES {
  INDIVIDUAL = 1,
  SOLE_PROPRIETORSHIP = 2,
  PARTNERSHIP = 3,
  PUBLIC_PRIVATE_LTD = 4,
  TRUST_NGO_SOCIETIES = 5,
  LLP = 6,
  OTHERS = 7,
  UNREGISTERED = 8,
  FREELANCE = 9,
}

export enum OTP_TYPE {
  EMAIL = 1,
  MOBILE = 2,
}

export enum ID_TYPE {
  ADMIN = "adm",
  MERCHANT = "mer",
  OPS = "ops",
}

export enum ONBOARDING_STATUS {
  SIGN_UP = 1, // once the user signs up
  MOBILE_EMAIL_VERIFIED = 2, // verified email and mobile
  FILLED_PERSONAL_BUSINESS_DETAILS = 3, // filled up personal and business details
  PENDING_KYC_VERIFICATION = 4, // pending kyc verification - land on dashboard
  KYC_ON_HOLD = 5,
  KYC_VERIFIED = 6,
  ACTIVE = 7,
  SUSPENDED = 8,
  BLOCKED = 9,
  KYC_REJECTED = 10,
}
