import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedVersionColumn1754332826573 implements MigrationInterface {
  name = "AddedVersionColumn1754332826573";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Use IF EXISTS to safely drop indexes - this is the safest approach
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_payin_orders_vpa"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_payin_orders_vpa_created_at"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_67724fd60d03d4aeca293a3f24"`,
    );

    // Column drops - use IF EXISTS for safety
    await queryRunner.query(
      `ALTER TABLE "payin_orders" DROP COLUMN IF EXISTS "vpa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_login_ips" DROP COLUMN IF EXISTS "loginTime"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_login_ips" DROP COLUMN IF EXISTS "vpnUsed"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_login_ips" DROP COLUMN IF EXISTS "role"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_login_ips" DROP COLUMN IF EXISTS "deviceId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_login_ips" DROP COLUMN IF EXISTS "browser"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_login_ips" DROP COLUMN IF EXISTS "platform"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_login_ips" DROP COLUMN IF EXISTS "version"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_login_ips" DROP COLUMN IF EXISTS "device"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_login_ips" DROP COLUMN IF EXISTS "city"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_login_ips" DROP COLUMN IF EXISTS "fullName"`,
    );

    // Add new column - use raw SQL check for column existence
    const columnExists = await queryRunner.query(`
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'wallets' AND column_name = 'version'
    `);

    if (columnExists.length === 0) {
      await queryRunner.query(
        `ALTER TABLE "wallets" ADD "version" integer NOT NULL DEFAULT '0'`,
      );
    }

    // ALTER COLUMN operations - these are safe to run multiple times
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ALTER COLUMN "commissionInPercentage" SET DEFAULT '4.5'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "commissionInPercentagePayin" SET DEFAULT '4.5'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "commissionInPercentagePayout" SET DEFAULT '1.5'`,
    );

    // Create new index - use raw SQL to check if index exists
    const indexExists = await queryRunner.query(`
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'IDX_2ce90956d7010da073390b2d03'
    `);

    if (indexExists.length === 0) {
      await queryRunner.query(
        `CREATE INDEX "IDX_2ce90956d7010da073390b2d03" ON "user_login_ips" ("userId", "createdAt") `,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_2ce90956d7010da073390b2d03"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "commissionInPercentagePayout" SET DEFAULT 1.5`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "commissionInPercentagePayin" SET DEFAULT 4.5`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ALTER COLUMN "commissionInPercentage" SET DEFAULT 4.5`,
    );

    // Check if version column exists before dropping
    const columnExists = await queryRunner.query(`
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'wallets' AND column_name = 'version'
    `);

    if (columnExists.length > 0) {
      await queryRunner.query(`ALTER TABLE "wallets" DROP COLUMN "version"`);
    }

    // Add columns back - these should be safe to run multiple times
    await queryRunner.query(
      `ALTER TABLE "user_login_ips" ADD COLUMN IF NOT EXISTS "fullName" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_login_ips" ADD COLUMN IF NOT EXISTS "city" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_login_ips" ADD COLUMN IF NOT EXISTS "device" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_login_ips" ADD COLUMN IF NOT EXISTS "version" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_login_ips" ADD COLUMN IF NOT EXISTS "platform" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_login_ips" ADD COLUMN IF NOT EXISTS "browser" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_login_ips" ADD COLUMN IF NOT EXISTS "deviceId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_login_ips" ADD COLUMN IF NOT EXISTS "role" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_login_ips" ADD COLUMN IF NOT EXISTS "vpnUsed" boolean`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_login_ips" ADD COLUMN IF NOT EXISTS "loginTime" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ADD COLUMN IF NOT EXISTS "vpa" character varying`,
    );

    // Recreate indexes - check existence with raw SQL
    const index1Exists = await queryRunner.query(`
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'IDX_67724fd60d03d4aeca293a3f24'
    `);
    if (index1Exists.length === 0) {
      await queryRunner.query(
        `CREATE INDEX "IDX_67724fd60d03d4aeca293a3f24" ON "user_login_ips" ("ipAddress", "userId", "createdAt") `,
      );
    }

    const index2Exists = await queryRunner.query(`
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'IDX_payin_orders_vpa_created_at'
    `);
    if (index2Exists.length === 0) {
      await queryRunner.query(
        `CREATE INDEX "IDX_payin_orders_vpa_created_at" ON "payin_orders" ("createdAt", "vpa") WHERE (vpa IS NOT NULL)`,
      );
    }

    const index3Exists = await queryRunner.query(`
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'IDX_payin_orders_vpa'
    `);
    if (index3Exists.length === 0) {
      await queryRunner.query(
        `CREATE INDEX "IDX_payin_orders_vpa" ON "payin_orders" ("vpa") WHERE (vpa IS NOT NULL)`,
      );
    }
  }
}

export class AddWalletOptimisticLockIndex1754332826574
  implements MigrationInterface
{
  name = "AddWalletOptimisticLockIndex1754332826574";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if indexes exist before creating them
    const userId_version_exists = await queryRunner.query(`
      SELECT 1 FROM pg_indexes
      WHERE indexname = 'IDX_wallets_userId_version'
    `);
    if (userId_version_exists.length === 0) {
      await queryRunner.query(
        `CREATE INDEX "IDX_wallets_userId_version" ON "wallets" ("userId", "version")`,
      );
    }

    const updatedAt_exists = await queryRunner.query(`
      SELECT 1 FROM pg_indexes
      WHERE indexname = 'IDX_wallets_updatedAt'
    `);
    if (updatedAt_exists.length === 0) {
      await queryRunner.query(
        `CREATE INDEX "IDX_wallets_updatedAt" ON "wallets" ("updatedAt")`,
      );
    }

    const userId_exists = await queryRunner.query(`
      SELECT 1 FROM pg_indexes
      WHERE indexname = 'IDX_wallets_userId'
    `);
    if (userId_exists.length === 0) {
      await queryRunner.query(
        `CREATE INDEX "IDX_wallets_userId" ON "wallets" ("userId")`,
      );
    }

    const covering_exists = await queryRunner.query(`
      SELECT 1 FROM pg_indexes
      WHERE indexname = 'IDX_wallets_userId_version_covering'
    `);
    if (covering_exists.length === 0) {
      await queryRunner.query(
        `CREATE INDEX "IDX_wallets_userId_version_covering" ON "wallets" ("userId", "version") INCLUDE ("totalCollections", "availablePayoutBalance", "updatedAt")`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_wallets_userId_version"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_wallets_updatedAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_wallets_userId"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_wallets_userId_version_covering"`,
    );
  }
}
