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
    max: 100, // Increased from 10 to handle 200 req/sec (CRITICAL for production)
    min: 20, // Increased from 2 to maintain pool size
    connectionTimeoutMillis: 3000, // Reduced from 5000 for faster failure detection
    idleTimeoutMillis: 30000,
    // Optimize for concurrent operations with aggressive timeouts
    statement_timeout: 5000, // Reduced from 10000 for faster query timeout
    lock_timeout: 500, // Reduced from 1000 for faster lock timeout
    idle_in_transaction_session_timeout: 1000, // Reduced from 2000 to prevent long-held transactions
    acquireTimeoutMillis: 2000, // Reduced from 3000 for faster connection acquisition
    reapIntervalMillis: 500, // Check for idle connections every 500ms
  },
  logging: !isProduction,
  ...((isProduction || isStaging) && {
    ssl: {
      rejectUnauthorized: false,
    },
  }),
};
