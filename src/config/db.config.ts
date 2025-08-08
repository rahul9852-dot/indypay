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
    max: 20, // Reduced from 50 to 20 for better performance
    min: 5, // Minimum connections to maintain
    connectionTimeoutMillis: 3000, // 3 seconds max
    idleTimeoutMillis: 30000, // 30 seconds max
    // Optimize for concurrent operations with aggressive timeouts
    statement_timeout: 10000, // 10 seconds max
    lock_timeout: 3000, //  3 seconds max
    idle_in_transaction_session_timeout: 5000, // 5 seconds max
    acquireTimeoutMillis: 5000, // 5 seconds to acquire connection
    reapIntervalMillis: 1000, // Check for idle connections every 1 second
  },
  logging: !isProduction,
  ...((isProduction || isStaging) && {
    ssl: {
      rejectUnauthorized: false,
    },
  }),
};
