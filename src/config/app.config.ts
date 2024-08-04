import { registerAs } from "@nestjs/config";
import { config } from "dotenv";
import { NODE_ENV } from "enums";
import { getOsEnv, getOsEnvOptional } from "./config.util";

config();

export const appConfig = registerAs("appConfig", () => ({
  port: getOsEnvOptional("PORT") || 4000,
  nodeEnv: getOsEnv("NODE_ENV"),
  allowedOrigins: getOsEnv("ALLOWED_ORIGINS").split(","),
  isProduction: getOsEnv("NODE_ENV") === NODE_ENV.PRODUCTION,
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
    pendingSignUpTokenSecret: getOsEnv("JWT_PENDING_SIGN_UP_TOKEN_SECRET"),
    pendingSignUpTokenExpiresIn: getOsEnv(
      "JWT_PENDING_SIGN_UP_TOKEN_EXPIRES_IN",
    ),
  },
}));
