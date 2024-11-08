import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1731057183820 implements MigrationInterface {
  name = "Init1731057183820";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payout_batches" DROP COLUMN "commissionInPercentage"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payout_batches" DROP COLUMN "commissionAmount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payout_batches" DROP COLUMN "gstInPercentage"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payout_batches" DROP COLUMN "gstAmount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payout_batches" DROP COLUMN "netPayableAmount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payout_batches" DROP COLUMN "industryType"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ALTER COLUMN "commissionInPercentage" SET DEFAULT 4.5`,
    );
    await queryRunner.query(
      `ALTER TABLE "payout_batches" ADD "industryType" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "payout_batches" ADD "netPayableAmount" numeric(10,2) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "payout_batches" ADD "gstAmount" numeric(10,2) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "payout_batches" ADD "gstInPercentage" numeric(10,2) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "payout_batches" ADD "commissionAmount" numeric(10,2) NOT NULL`,
    );
  }
}
