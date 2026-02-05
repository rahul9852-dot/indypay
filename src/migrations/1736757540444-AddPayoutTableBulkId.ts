import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPayoutTableBulkId1736757540444 implements MigrationInterface {
  name = "AddPayoutTableBulkId1736757540444";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add column only if it doesn't exist
    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payout_orders' AND column_name = 'batchId') THEN ALTER TABLE "payout_orders" ADD "batchId" character varying; END IF; END $$`,
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
    await queryRunner.query(
      `ALTER TABLE "payout_orders" DROP COLUMN "batchId"`,
    );
  }
}
