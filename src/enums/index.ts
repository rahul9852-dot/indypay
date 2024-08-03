export enum NODE_ENV {
  DEVELOPMENT = "development",
  PRODUCTION = "production",
}

export enum COOKIE_KEYS {
  ACCESS_TOKEN = "atk",
  REFRESH_TOKEN = "rtk",
}

export enum ROLES {
  MERCHANT = 1,
  OPS,
  ADMIN,
  SUPER_ADMIN,
}

export enum STATUS {
  INACTIVE = 1,
  ACTIVE,
}

export enum PAYMENT_STATUS {
  PENDING = 1,
  FAILED,
  SUCCESS,
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
