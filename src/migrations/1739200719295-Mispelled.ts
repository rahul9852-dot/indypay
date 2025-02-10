import { MigrationInterface, QueryRunner } from "typeorm";

export class Mispelled1739200719295 implements MigrationInterface {
  name = "Mispelled1739200719295";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ADD "isMisspelled" boolean NOT NULL DEFAULT false`,
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
      `ALTER TABLE "payin_orders" DROP COLUMN "isMisspelled"`,
    );
  }
}
