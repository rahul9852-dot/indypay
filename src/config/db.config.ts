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
    max: 50,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10_000,
    // Optimize for concurrent operations
    statement_timeout: 30000, // 30 seconds
    lock_timeout: 10000, // 10 seconds
    idle_in_transaction_session_timeout: 30000, // 30 seconds
  },
  logging: !isProduction,
  ...((isProduction || isStaging) && {
    ssl: {
      rejectUnauthorized: false,
    },
  }),
};
