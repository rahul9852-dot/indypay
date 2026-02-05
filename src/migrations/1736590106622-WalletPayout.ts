import { MigrationInterface, QueryRunner } from "typeorm";

export class WalletPayout1736590106622 implements MigrationInterface {
  name = "WalletPayout1736590106622";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add columns only if they don't exist
    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallets' AND column_name = 'availablePayoutBalance') THEN ALTER TABLE "wallets" ADD "availablePayoutBalance" numeric(15,2) NOT NULL DEFAULT '0'; END IF; END $$`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallets' AND column_name = 'totalPayout') THEN ALTER TABLE "wallets" ADD "totalPayout" numeric(15,2) NOT NULL DEFAULT '0'; END IF; END $$`,
    );
    // ALTER COLUMN operations are safe to run multiple times
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ALTER COLUMN "commissionInPercentage" SET DEFAULT '4.5'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "commissionInPercentagePayin" SET DEFAULT '4.5'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "commissionInPercentagePayout" SET DEFAULT '1.5'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "commissionInPercentagePayout" SET DEFAULT 1.5`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "commissionInPercentagePayin" SET DEFAULT 4.5`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ALTER COLUMN "commissionInPercentage" SET DEFAULT 4.5`,
    );
    await queryRunner.query(`ALTER TABLE "wallets" DROP COLUMN "totalPayout"`);
    await queryRunner.query(
      `ALTER TABLE "wallets" DROP COLUMN "availablePayoutBalance"`,
    );
  }
}
