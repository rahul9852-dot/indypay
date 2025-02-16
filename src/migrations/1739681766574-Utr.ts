import { MigrationInterface, QueryRunner } from "typeorm";

export class Utr1739681766574 implements MigrationInterface {
  name = "Utr1739681766574";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "settlements" ADD "utr" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "payout_orders" ADD "utr" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ADD "utr" character varying`,
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
    await queryRunner.query(`ALTER TABLE "payin_orders" DROP COLUMN "utr"`);
    await queryRunner.query(`ALTER TABLE "payout_orders" DROP COLUMN "utr"`);
    await queryRunner.query(`ALTER TABLE "settlements" DROP COLUMN "utr"`);
  }
}
