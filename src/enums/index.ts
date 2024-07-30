export enum NodeEnv {
  Development = "development",
  Production = "production",
}

export enum CookieKeys {
  AccessToken = "atk",
  RefreshToken = "rtk",
}

export enum Roles {
  Merchant = 1,
  Ops,
  SuperAdmin,
}

export enum Status {
  Inactive = 1,
  Active,
}

export enum PaymentStatus {
  Pending = 1,
  Failed,
  Success,
}

export const DateFormat = {
  DD_MM_YYYY_HH_MM_SS_A: "DD/MM/YYYY HH:mm:ss A",
};
