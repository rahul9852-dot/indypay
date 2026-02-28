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
    // Target: 200+ req/sec with high success rate
    // Current issue: 45 req/sec with only 29 successful (64% success)
    // Need larger pool to prevent connection timeouts
    max: 20, // Increased significantly to handle bursts and prevent timeouts
    // to 20 & 5 to test pg bouncer
    min: 5, // Higher min to reduce connection acquisition time
    connectionTimeoutMillis: 15000, // More time when pool is busy
    idleTimeoutMillis: 30000,
    statement_timeout: 5000, // Balanced - not too aggressive
    lock_timeout: 1000, // Reasonable lock timeout
    idle_in_transaction_session_timeout: 2000, // Kill idle transactions
    prepareThreshold: 0,
    // acquireTimeoutMillis: 20000, // Much more time to acquire connection during high load
    // reapIntervalMillis: 100, // Faster cleanup for better connection reuse
  },
  ssl: false,
  // logging: !isProduction,
  // ...((isProduction || isStaging) &&
  //   {
  // commented ssl for pgbouncer
  // ssl: {
  //   rejectUnauthorized: false,
  // },
  // }),
};
