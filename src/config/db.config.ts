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
  poolSize: 150,
  maxQueryExecutionTime: 1000,
  extra: {
    max: 50,
    connectionTimeoutMillis: 3000, // 🎯 3 seconds max
    idleTimeoutMillis: 30000, // 🎯 30 seconds max
    // Optimize for concurrent operations with aggressive timeouts
    statement_timeout: 10000, // 🎯 10 seconds max
    lock_timeout: 3000, // 🎯 3 seconds max
    idle_in_transaction_session_timeout: 5000, // 🎯 5 seconds max
  },
  logging: !isProduction,
  ...((isProduction || isStaging) && {
    ssl: {
      rejectUnauthorized: false,
    },
  }),
};
