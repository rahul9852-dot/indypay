import { registerAs } from "@nestjs/config";
import { config } from "dotenv";
import { NODE_ENV } from "@/enums";
import { getOsEnv, getOsEnvOptional } from "@/config/config.util";

config();

export const appConfig = registerAs("appConfig", () => ({
  port: getOsEnvOptional("PORT") || 4000,
  nodeEnv: getOsEnv("NODE_ENV"),
  allowedOrigins: getOsEnv("ALLOWED_ORIGINS").split(","),
  beBaseUrl: getOsEnv("BE_BASE_URL"),
  isProduction: getOsEnv("NODE_ENV") === NODE_ENV.PRODUCTION,
  isStaging: getOsEnv("NODE_ENV") === NODE_ENV.STAGING,
  encryptionKey: getOsEnv("ENCRYPTION_KEY"),
  encryptionAlgorithm: getOsEnv("ENCRYPTION_ALGORITHM"),
  authKey: getOsEnv("AUTH_KEY"),
  encryptionIV: getOsEnv("AUTH_IV"),
  allowCookiesDomain: getOsEnv("ALLOW_COOKIES_DOMAIN"),
  database: {
    host: getOsEnv("DB_HOST"),
    port: getOsEnv("DB_PORT"),
    name: getOsEnv("DB_NAME"),
    username: getOsEnv("DB_USERNAME"),
    password: getOsEnv("DB_PASSWORD"),
  },
  jwtConfig: {
    accessTokenSecret: getOsEnv("JWT_ACCESS_TOKEN_SECRET"),
    refreshTokenSecret: getOsEnv("JWT_REFRESH_TOKEN_SECRET"),
    accessTokenExpiresIn: getOsEnv("JWT_ACCESS_TOKEN_EXPIRES_IN"),
    refreshTokenExpiresIn: getOsEnv("JWT_REFRESH_TOKEN_EXPIRES_IN"),
    paymentLinkSecret: getOsEnv("JWT_PAYMENT_LINK_SECRET"),
    twoFactorSecret: getOsEnv("JWT_TWO_FACTOR_SECRET"),
  },
  // oauthGoogle: {
  //   clientId: getOsEnv("OAUTH_GOOGLE_CLIENT_ID"),
  //   clientSecret: getOsEnv("OAUTH_GOOGLE_CLIENT_SECRET"),
  //   feRedirectUrl: getOsEnv("OAUTH_GOOGLE_FE_REDIRECT_URL"), // with id token
  // },
  // otpless: {
  //   clientId: getOsEnv("OTPLESS_CLIENT_ID"),
  //   clientSecret: getOsEnv("OTPLESS_CLIENT_SECRET"),
  // },
  twoFactorConfig: {
    issuer: getOsEnv("ISSUER"),
    secretBites: +getOsEnv("SECRET_BITES") || 20,
  },

  externalPaymentConfig: {
    ismart: {
      clientId: getOsEnv("ISMART_PAYMENT_CLIENT_ID"),
      clientSecret: getOsEnv("ISMART_PAYMENT_CLIENT_SECRET"),
      webhookIps: getOsEnv("ISMART_PAYMENT_WEBHOOK_IPS").split(","),
    },
    flakPay: {
      clientId: getOsEnv("FLAKPAY_PAYMENT_CLIENT_ID"),
      clientSecret: getOsEnv("FLAKPAY_PAYMENT_CLIENT_SECRET"),
      webhookIps: getOsEnv("FLAKPAY_PAYMENT_WEBHOOK_IPS").split(","),
    },
    ertech: {
      encryptionKey: getOsEnv("ERTITECH_ENCRYPTION_KEY"),
      email: getOsEnv("ERTITECH_EMAIL"),
      password: getOsEnv("ERTITECH_PASSWORD"),
      merchantId: getOsEnv("ERTITECH_MERCHANT_ID"),
      webhookIps: getOsEnv("ERTITECH_WEBHOOK_IPS").split(","),
    },
    paynpro: {
      payin: {
        clientId: getOsEnv("PAYNPRO_PAYIN_PAYMENT_CLIENT_ID"),
        clientSecret: getOsEnv("PAYNPRO_PAYIN_PAYMENT_CLIENT_SECRET"),
        encryptionSalt: getOsEnv("PAYNPRO_PAYIN_PAYMENT_ENCRYPTION_SALT"),
        aesSecretKey: getOsEnv("PAYNPRO_PAYIN_PAYMENT_AES_SECRET_KEY"),
      },
      payout: {
        clientId: getOsEnv("PAYNPRO_PAYOUT_PAYMENT_CLIENT_ID"),
        clientSecret: getOsEnv("PAYNPRO_PAYOUT_PAYMENT_CLIENT_SECRET"),
        signature: getOsEnv("PAYNPRO_PAYOUT_PAYMENT_SIGNATURE"),
      },
      webhookIps: getOsEnv("PAYNPRO_PAYMENT_WEBHOOK_IPS").split(","),
    },
  },
  transactionConfig: {
    commissionInPercentagePayIn:
      +getOsEnv("PAYIN_COMMISSION_IN_PERCENTAGE") || 4.5,
    gstInPercentagePayIn: +getOsEnv("PAYIN_GST_IN_PERCENTAGE") || 18,
    commissionInPercentagePayOut:
      +getOsEnv("PAYOUT_COMMISSION_IN_PERCENTAGE") || 1.5,
    gstInPercentagePayOut: +getOsEnv("PAYOUT_GST_IN_PERCENTAGE") || 18,
  },

  redisConfig: {
    redisHostUrl: getOsEnv("REDIS_HOST_URL"),
    redisPort: +getOsEnv("REDIS_PORT") || 6379,
  },

  sso: {
    invoice: {
      clientId: getOsEnv("SSO_INVOICE_CLIENT_ID"),
      clientSecret: getOsEnv("SSO_INVOICE_CLIENT_SECRET"),
      baseUrl: getOsEnv("SSO_INVOICE_BASE_URL"),
    },
  },
  emailConfig: {
    host: getOsEnv("EMAIL_SMTP_HOST"),
    port: +getOsEnv("EMAIL_SMTP_PORT") || 587,
    username: getOsEnv("EMAIL_SMTP_USER"),
    password: getOsEnv("EMAIL_SMTP_PASSWORD"),
    from: getOsEnv("EMAIL_SMTP_FROM"),
  },
  aws: {
    accessKeyId: getOsEnv("AWS_ACCESS_KEY_ID"),
    secretAccessKey: getOsEnv("AWS_SECRET_ACCESS_KEY"),
    region: getOsEnv("AWS_REGION"),
    snsTopicArn: getOsEnv("AWS_SNS_TOPIC_ARN"),
    s3BucketName: getOsEnv("AWS_S3_BUCKET_NAME"),
  },
  sabpaisa: {
    clientCode: getOsEnv("CLIENT_CODE"),
    transUserName: getOsEnv("TRANSUSER_NAME"),
    transUserPassword: getOsEnv("TRANS_USER_PASSWORD"),
    mcc: getOsEnv("MCC"),
    Class: getOsEnv("CLASS"),
    role: getOsEnv("S_ROLE"),
  },
  utkarsh: {
    vpa: getOsEnv("UPI_ID"),
    webhookIps: getOsEnv("UTKARSH").split(","),
    utkarshMid: getOsEnv("UTKARSH_MID"),
    utkarshTerminalId: getOsEnv("UTKARSH_TERMINAL_ID"),
    utkarshAuthIV: getOsEnv("UTKARSH_AUTH_IV"),
    utkarshAuthKey: getOsEnv("UTKARSH_AUTH_KEY"),
  },
}));
