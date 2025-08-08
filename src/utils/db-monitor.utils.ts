import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { CustomLogger } from "@/logger";

@Injectable()
export class DatabaseMonitorService {
  private readonly logger = new CustomLogger(DatabaseMonitorService.name);

  constructor(private readonly dataSource: DataSource) {}

  /**
   * Monitor database connection pool status with timeout tracking
   */
  async getConnectionPoolStatus() {
    try {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();

      // Get PostgreSQL connection pool statistics
      const poolStats = await queryRunner.query(`
        SELECT 
          count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active_connections,
          count(*) FILTER (WHERE state = 'idle') as idle_connections,
          count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction,
          count(*) FILTER (WHERE state = 'disabled') as disabled_connections
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `);

      // Get timeout and lock statistics
      const timeoutStats = await queryRunner.query(`
        SELECT 
          count(*) FILTER (WHERE now() - query_start > interval '10 seconds') as long_running_queries,
          count(*) FILTER (WHERE now() - query_start > interval '5 seconds') as medium_running_queries,
          count(*) FILTER (WHERE now() - query_start > interval '3 seconds') as short_running_queries
        FROM pg_stat_activity 
        WHERE state = 'active' AND datname = current_database()
      `);

      // Get lock information
      const lockInfo = await queryRunner.query(`
        SELECT 
          l.locktype,
          l.database,
          l.relation::regclass as table_name,
          l.page,
          l.tuple,
          l.virtualxid,
          l.transactionid,
          l.classid,
          l.objid,
          l.objsubid,
          l.virtualtransaction,
          l.pid,
          l.mode,
          l.granted,
          a.usename,
          a.application_name,
          a.client_addr,
          a.state,
          a.query_start,
          a.query
        FROM pg_locks l
        JOIN pg_stat_activity a ON l.pid = a.pid
        WHERE l.database = (SELECT oid FROM pg_database WHERE datname = current_database())
        AND l.locktype != 'relation'
        ORDER BY l.granted, l.pid
      `);

      await queryRunner.release();

      this.logger.info("Database connection pool status:", {
        poolStats: poolStats[0],
        timeoutStats: timeoutStats[0],
        activeLocks: lockInfo.length,
        locks: lockInfo.slice(0, 10), // Log first 10 locks
      });

      return {
        poolStats: poolStats[0],
        timeoutStats: timeoutStats[0],
        activeLocks: lockInfo.length,
        locks: lockInfo,
      };
    } catch (error) {
      this.logger.error("Failed to get database pool status:", error);
      throw error;
    }
  }

  /**
   * Get long-running transactions
   */
  async getLongRunningTransactions(thresholdMinutes = 5) {
    try {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();

      const longRunning = await queryRunner.query(`
        SELECT 
          pid,
          usename,
          application_name,
          client_addr,
          state,
          query_start,
          now() - query_start as duration,
          query
        FROM pg_stat_activity 
        WHERE state = 'active'
        AND now() - query_start > interval '${thresholdMinutes} minutes'
        ORDER BY query_start
      `);

      await queryRunner.release();
      if (longRunning.length > 0) {
        this.logger.warn(
          `Found ${longRunning.length} long-running transactions: ${JSON.stringify(
            {
              transactions: longRunning.map((t) => ({
                pid: t.pid,
                duration: t.duration,
                state: t.state,
                query: t.query?.substring(0, 100) + "...",
              })),
            },
          )}`,
        );
      }

      return longRunning;
    } catch (error) {
      this.logger.error("Failed to get long-running transactions:", error);
      throw error;
    }
  }

  /**
   * Get wallet table lock statistics (optimistic locking)
   */
  async getWalletLockStats() {
    try {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();

      const walletLocks = await queryRunner.query(`
        SELECT 
          l.pid,
          l.mode,
          l.granted,
          a.usename,
          a.application_name,
          a.state,
          a.query_start,
          a.query
        FROM pg_locks l
        JOIN pg_stat_activity a ON l.pid = a.pid
        WHERE l.relation = 'wallets'::regclass
        ORDER BY l.granted, l.pid
      `);

      await queryRunner.release();

      this.logger.info(`Wallet table lock statistics:`, {
        totalLocks: walletLocks.length,
        grantedLocks: walletLocks.filter((l) => l.granted).length,
        waitingLocks: walletLocks.filter((l) => !l.granted).length,
        locks: walletLocks,
      });

      return walletLocks;
    } catch (error) {
      this.logger.error("Failed to get wallet lock stats:", error);
      throw error;
    }
  }
}
