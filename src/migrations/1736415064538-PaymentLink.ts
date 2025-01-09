import { MigrationInterface, QueryRunner } from "typeorm";

export class PaymentLink1736415064538 implements MigrationInterface {
  name = "PaymentLink1736415064538";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ADD "paymentLink" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_business_details" ALTER COLUMN "registerBusinessNumber" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_business_details" ALTER COLUMN "businessIndustry" SET NOT NULL`,
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
      `ALTER TABLE "user_business_details" ALTER COLUMN "businessIndustry" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_business_details" ALTER COLUMN "registerBusinessNumber" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" DROP COLUMN "paymentLink"`,
    );
  }
}
