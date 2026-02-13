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
    max: 500, // Increased from 10 to 100 to 500to handle high load (CRITICAL for production)
    min: 50, // Increased from 2 to 20 to 50 to maintain pool size
    connectionTimeoutMillis: 2000, // Reduced from 3000 for faster failure detection
    idleTimeoutMillis: 30000,
    // Optimize for concurrent operations with aggressive timeouts
    statement_timeout: 5000, // Reduced from 5000 for faster query timeout
    lock_timeout: 300, // Reduced from 500 for faster lock timeout
    idle_in_transaction_session_timeout: 500, // Reduced from 1000 to prevent long-held transactions
    acquireTimeoutMillis: 1000, // Reduced from 2000 for faster connection acquisition
    reapIntervalMillis: 200, // Check for idle connections every 200ms (faster cleanup)
  },
  logging: !isProduction,
  ...((isProduction || isStaging) && {
    ssl: {
      rejectUnauthorized: false,
    },
  }),
};
