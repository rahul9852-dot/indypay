import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBankDetailsPayout1736764555962 implements MigrationInterface {
  name = "AddBankDetailsPayout1736764555962";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payout_orders" ADD "name" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "payout_orders" ADD "bankName" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "payout_orders" ADD "bankAccountNumber" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "payout_orders" ADD "bankIfsc" character varying`,
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
      `ALTER TABLE "payout_orders" DROP COLUMN "bankIfsc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payout_orders" DROP COLUMN "bankAccountNumber"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payout_orders" DROP COLUMN "bankName"`,
    );
    await queryRunner.query(`ALTER TABLE "payout_orders" DROP COLUMN "name"`);
  }
}
