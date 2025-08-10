import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { appConfig } from "./app.config";

const {
  database: { host, port, name, password, username },
  isProduction,
  isStaging,
} = appConfig();

export const dbConfig: TypeOrmModuleOptions = {
  type: "postgres",
  host,
  port: +port,
  username,
  password,
  database: name,
  entities: [__dirname + "/../**/*.entity{.ts,.js}"],
  synchronize: false,
  maxQueryExecutionTime: 1000,
  extra: {
    max: 10,
    min: 2,
    connectionTimeoutMillis: 2000,
    idleTimeoutMillis: 15000,
    // Optimize for concurrent operations with aggressive timeouts
    statement_timeout: 5000,
    lock_timeout: 1000,
    idle_in_transaction_session_timeout: 2000,
    acquireTimeoutMillis: 3000,
    reapIntervalMillis: 500, // Check for idle connections every 500ms
  },
  logging: !isProduction,
  ...((isProduction || isStaging) && {
    ssl: {
      rejectUnauthorized: false,
    },
  }),
};
