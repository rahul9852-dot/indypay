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
    // ✅ PostgreSQL max_connections is 832, so we can use more connections
    // At 150 req/sec, each request holds connection for ~2-3 seconds
    // Need: 150 req/sec × 3 seconds = 450 concurrent connections
    // Using 300 to leave room for other operations and avoid hitting PostgreSQL limit
    max: 300, // Increased from 150 - PostgreSQL can handle 832, so use more connections
    min: 50, // Increased to maintain pool size
    connectionTimeoutMillis: 5000, // Give more time for connection
    idleTimeoutMillis: 30000,
    // Optimize for concurrent operations with aggressive timeouts
    statement_timeout: 3000, // Fail queries faster to free connections
    lock_timeout: 300, // Fast lock timeout
    idle_in_transaction_session_timeout: 500, // Kill idle transactions fast
    acquireTimeoutMillis: 10000, // ✅ CRITICAL: Increased to 10s - give more time when pool is busy
    reapIntervalMillis: 200, // Check for idle connections every 200ms (faster cleanup)
  },
  logging: !isProduction,
  ...((isProduction || isStaging) && {
    ssl: {
      rejectUnauthorized: false,
    },
  }),
};
