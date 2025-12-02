import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { CustomLogger } from "@/logger";

@Injectable()
export class DatabaseMonitorService {
  private readonly logger = new CustomLogger(DatabaseMonitorService.name);

  constructor(private readonly dataSource: DataSource) {}

  async getConnectionPoolStatus() {
    try {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
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
        locks: lockInfo.slice(0, 10),
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

  /**
   * Monitor slow wallet update queries
   */
  async getSlowWalletQueries() {
    try {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();

      const slowQueries = await queryRunner.query(`
        SELECT 
          pid,
          usename,
          application_name,
          state,
          query_start,
          now() - query_start as duration,
          query
        FROM pg_stat_activity 
        WHERE state = 'active'
        AND query LIKE '%wallets%'
        AND query LIKE '%UPDATE%'
        AND now() - query_start > interval '1 second'
        ORDER BY query_start
      `);

      await queryRunner.release();

      if (slowQueries.length > 0) {
        this.logger.warn(
          `Found ${slowQueries.length} slow wallet update queries: ${JSON.stringify(
            {
              queries: slowQueries.map((q) => ({
                pid: q.pid,
                duration: q.duration,
                state: q.state,
                query: q.query?.substring(0, 200) + "...",
              })),
            },
          )}`,
        );
      }

      return slowQueries;
    } catch (error) {
      this.logger.error("Failed to get slow wallet queries:", error);
      throw error;
    }
  }
  async getWalletIndexStats() {
    try {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();

      const indexStats = await queryRunner.query(`
        SELECT 
          schemaname,
          relname as tablename,
          indexrelname as indexname,
          idx_scan,
          idx_tup_read,
          idx_tup_fetch
        FROM pg_stat_user_indexes 
        WHERE relname = 'wallets'
        ORDER BY idx_scan DESC
      `);

      await queryRunner.release();

      this.logger.info(`Wallet table index statistics:`, {
        indexStats,
      });

      return indexStats;
    } catch (error) {
      this.logger.error("Failed to get wallet index stats:", error);
      throw error;
    }
  }

  async getWalletUpdateTPS() {
    try {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();

      // Get wallet update statistics from the last hour
      const walletUpdateStats = await queryRunner.query(`
        SELECT 
          COUNT(*) as total_updates,
          COUNT(*) / 3600.0 as tps,
          AVG(EXTRACT(EPOCH FROM (now() - query_start))) as avg_duration_seconds,
          MAX(EXTRACT(EPOCH FROM (now() - query_start))) as max_duration_seconds,
          MIN(EXTRACT(EPOCH FROM (now() - query_start))) as min_duration_seconds
        FROM pg_stat_activity 
        WHERE state = 'active'
        AND query LIKE '%UPDATE%wallets%'
        AND query_start > now() - interval '1 hour'
      `);

      // Get current slow wallet updates
      const slowWalletUpdates = await queryRunner.query(`
        SELECT 
          pid,
          usename,
          application_name,
          state,
          query_start,
          EXTRACT(EPOCH FROM (now() - query_start)) as duration_seconds,
          query
        FROM pg_stat_activity 
        WHERE state = 'active'
        AND query LIKE '%UPDATE%wallets%'
        AND query_start < now() - interval '1 second'
        ORDER BY query_start
      `);

      await queryRunner.release();

      const stats = walletUpdateStats[0] || {
        total_updates: 0,
        tps: 0,
        avg_duration_seconds: 0,
        max_duration_seconds: 0,
        min_duration_seconds: 0,
      };

      this.logger.info(`Wallet update TPS statistics:`, {
        totalUpdates: stats.total_updates,
        tps: parseFloat(stats.tps || 0).toFixed(2),
        avgDurationSeconds: parseFloat(stats.avg_duration_seconds || 0).toFixed(
          3,
        ),
        maxDurationSeconds: parseFloat(stats.max_duration_seconds || 0).toFixed(
          3,
        ),
        slowUpdates: slowWalletUpdates.length,
      });

      return {
        stats,
        slowUpdates: slowWalletUpdates,
      };
    } catch (error) {
      this.logger.error("Failed to get wallet update TPS:", error);
      throw error;
    }
  }
  async checkWalletIndexes() {
    try {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();

      const indexes = await queryRunner.query(`
        SELECT 
          indexname,
          indexdef
        FROM pg_indexes 
        WHERE tablename = 'wallets'
        ORDER BY indexname
      `);

      // Check if the critical index exists
      const hasUserIdVersionIndex = indexes.some(
        (idx) =>
          idx.indexname.includes("userId") && idx.indexname.includes("version"),
      );

      await queryRunner.release();

      this.logger.info(`Wallet indexes check:`, {
        totalIndexes: indexes.length,
        hasUserIdVersionIndex,
        indexes: indexes.map((idx) => idx.indexname),
      });

      return {
        totalIndexes: indexes.length,
        hasUserIdVersionIndex,
        indexes: indexes.map((idx) => idx.indexname),
      };
    } catch (error) {
      this.logger.error("Failed to check wallet indexes:", error);
      throw error;
    }
  }
}
