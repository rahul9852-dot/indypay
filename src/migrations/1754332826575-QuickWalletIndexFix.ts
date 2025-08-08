import { MigrationInterface, QueryRunner } from "typeorm";

export class QuickWalletIndexFix1754332826575 implements MigrationInterface {
  name = "QuickWalletIndexFix1754332826575";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Quick fix: Add the most critical index for wallet updates
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_wallets_userId_version_quick" ON "wallets" ("userId", "version")`,
    );

    // Add index on userId for faster lookups
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_wallets_userId_quick" ON "wallets" ("userId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_wallets_userId_version_quick"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_wallets_userId_quick"`);
  }
}
