import { registerAs } from "@nestjs/config";
import { config } from "dotenv";
import { NodeEnv } from "enums";
import { getOsEnv, getOsEnvOptional } from "./config.util";

config();

export const appConfig = registerAs("appConfig", () => ({
  port: getOsEnvOptional("PORT") || 4000,
  nodeEnv: getOsEnv("NODE_ENV"),
  allowedOrigins: getOsEnv("ALLOWED_ORIGINS").split(","),
  isProduction: getOsEnv("NODE_ENV") === NodeEnv.Production,
  jwtConfig: {
    accessTokenSecret: getOsEnv("JWT_ACCESS_TOKEN_SECRET"),
    refreshTokenSecret: getOsEnv("JWT_REFRESH_TOKEN_SECRET"),
    accessTokenExpiresIn: getOsEnv("JWT_ACCESS_TOKEN_EXPIRES_IN"),
    refreshTokenExpiresIn: getOsEnv("JWT_REFRESH_TOKEN_EXPIRES_IN"),
  },
}));
