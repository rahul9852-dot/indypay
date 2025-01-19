import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPurposeRemarksPayout1737291044799
  implements MigrationInterface
{
  name = "AddPurposeRemarksPayout1737291044799";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payout_orders" ADD "purpose" character varying DEFAULT 'DEFAULT'`,
    );
    await queryRunner.query(
      `ALTER TABLE "payout_orders" ADD "remarks" character varying DEFAULT 'DEFAULT'`,
    );
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
      `ALTER TABLE "payout_orders" DROP COLUMN "remarks"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payout_orders" DROP COLUMN "purpose"`,
    );
  }
}
