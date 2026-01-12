export enum NODE_ENV {
  DEVELOPMENT = "development",
  PRODUCTION = "production",
  STAGING = "staging",
}

export enum COOKIE_KEYS {
  ACCESS_TOKEN = "atk",
  MOBILE_INFO_KEY = "utk",
  PAYMENT_LINK_TOKEN = "_xplink",
  REFRESH_TOKEN = "rtk",
  VERIFY_TOKEN = "vtk",
}

export enum USERS_ROLE {
  GUEST = 0,
  SALE = 1,
  MERCHANT = 2,
  CHANNEL_PARTNER = 3,
  OPS = 4,
  ADMIN = 5,
  OWNER = 6,
  VIEW_ONLY_ADMIN = 7,
}

export enum KYC_STATUS {
  PENDING = 1,
  PAN_VERIFIED = 2,
  AADHAR_VERIFIED = 3,
  APPROVED = 4,
  HOLD = 5,
  REJECTED = 6,
}

export enum ACCOUNT_STATUS {
  ACTIVE = 1,
  INACTIVE = 2,
  SUSPENDED = 3,
  BLOCKED = 4,
  DELETED = 5,
  TEST_DELETED = 6,
  INTERNAL_USER = 7,
}

export enum BUSINESS_ENTITY_TYPE {
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

export enum TURNOVER_TYPE {
  ZERO_TO_TWENTY_FIVE_LAC = 1,
  TWENTY_FIVE_TO_FIFTY_LAC = 2,
  FIFTY_LAC_TO_TWO_CR = 3,
  TWO_CR_TO_TEN_CR = 4,
  TEN_CR_PLUS = 5,
}

export enum DESIGNATION {
  ACCOUNTANT = "accountant",
  CHATERED_ACCOUNTANT = "ca",
  DIRECTOR = "director",
  FOUNDER_CXO = "founder/cxo",
  MANAGER = "manager",
  OTHER = "other",
  OWNER = "owner",
  SVP_EVP_VP = "svp/evp/vp",
}

export enum ID_TYPE {
  API_CREDENTIALS = "apic",
  BUSINESS_DETAILS = "bsd",
  CHECKOUT = "chk",
  CUSTOMER = "cst",
  INTEGRATION = "intg",
  INTERNAL_USER = "itu",
  INVOICES = "inv",
  INVOICE_ITEMS = "invitm",
  ITEMS = "itm",
  MEDIA_KYC = "mda",
  MERCHANT_PAYOUT = "mpout",
  ONBOARDING_USER = "onu",
  ORDER = "ord",
  OTP = "otp",
  PAYIN_KEY = "pin",
  PAYIN_WALLET = "pinwl",
  PAYOUT_BATCH_KEY = "pbatch",
  PAYOUT_KEY = "pout",
  PG_CONFIG = "conf",
  SETTLEMENT_PAYOUT = "stl",
  TRANSACTIONS_KEY = "txn",
  USER = "usr",
  USER_ADDRESS = "uad",
  USER_API_KEY = "apik",
  USER_KYC = "ukyc",
  USER_LOGIN_IP = "ip",
  USER_MULTI_FACTOR_AUTH = "umfa",
  USER_WHITELIST_IP = "uwip",
  USER_INTEGRATION_MAPPING = "uim",
  USER_BANK_DETAILS_KEY = "ubank",
  WALLET = "wlt",
  WALLET_TOPUP = "wtop",
}

export enum ONBOARDING_STATUS {
  NOT_STARTED = 0,
  SIGN_UP = 1, // signs up user with verified mobile and email
  KYC_PENDING = 2, // kyc document submitted - almost there page
  KYC_ON_HOLD = 3, // kyc on hold by admin - almost there page
  KYC_REJECTED = 4, // kyc rejected by admin - almost there page
  KYC_VERIFIED = 5, // final: kyc verified - almost there page
  FILLED_BUSINESS_DETAILS = 6, // fix: need to remove
  MOBILE_EMAIL_VERIFIED = 7, // fix: need to remove
}

export enum BUSINESS_INDUSTRIES {
  AGRICULTURE = 1,
  ARCHITECT_INTERIORS = 2,
  AUTOMOBILE_REPAIRS = 3,
  CONSTRUCTION_BUILDERS = 4,
  CONSULTANCY = 5,
  CREATIVE_ART = 6,
  DEALER = 7,
  "E-COMMERCE" = 8,
  EDUCATIONAL_INSTITUTION = 9,
  ELECTRONICS_HARDWARE = 10,
  ENTERTAINMENT = 11,
  EVENT_MANAGEMENT = 12,
  FINANCIAL_SERVICES = 13,
  FOOD_AND_BEVERAGES = 14,
  FREELANCER = 15,
  HEALTH = 16,
  HOSPITALITY = 17,
  IMPORT_EXPORT = 18,
  INSURANCE = 19,
  IT_SOFTWARE = 20,
  JEWELLERY = 21,
  MANPOWER_HR = 22,
  MANUFACTURER = 23,
  MARKETING_AGENCY = 24,
  MISCELLANEOUS = 25,
  MOBILE_COMPUTER_ACCESSORIES = 26,
  NGO = 27,
  ONLINE_SERVICES = 28,
  PET_SHOP = 29,
  PHOTOGRAPHY_STUDIO = 30,
  PRINTING = 31,
  PROVISIONAL_STORE = 32,
  ENGINEERING_SERVICES = 33,
  REAL_ESTATE = 34,
  RETAILER_SUPPLIER = 35,
  SALOON_LIFESTYLE = 36,
  MEDIA_ADVT = 37,
  TOURS_AND_TRAVELS = 38,
  TRADING = 39,
  TRANSPORTATION_LOGISTICS = 40,
  WHOLESALER = 41,
  DISTRIBUTORS = 42,
  GAMBLING_CASINO = 43,
  MULTI_LEVEL_MARKETING = 44,
  DROP_SHIPPING = 45,
  BPO = 46,
  LIVE_STOCK = 47,
  CROWD_FUNDING = 48,
  TOBACCO = 49,
  WINE_SHOP = 50,
  UNLICENSED_FINANCE_SERVICES = 51,
}

export enum OAUTH_PROVIDER {
  GOOGLE = "google",
  MICROSOFT = "microsoft",
}

export enum VERIFICATION_GATEWAY_EVENT {
  MOBILE_VERIFY = "mobileVerify",
  ON_MOBILE_VERIFY = "onMobileVerify",
}

export enum THIRDPARTY_PG {
  ERTITECH = "ertitech",
  FLAK_PAY = "flakpay",
  ISMART_PAY = "ismartpay",
  PAYNPRO = "paynpro",
}

export enum INVOICE_STATUS {
  DRAFT = 1,
  SENT = 2,
  FAILED = 3,
}

export enum SETTLEMENT_TYPE {
  AUTOMATIC = "AUTOMATIC",
  MANUAL = "MANUAL",
}
