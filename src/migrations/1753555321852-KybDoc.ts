import { MigrationInterface, QueryRunner } from "typeorm";

export class KybDoc1753555321852 implements MigrationInterface {
  name = "KybDoc1753555321852";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_payin_orders_vpa"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_payin_orders_vpa_created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" DROP COLUMN IF EXISTS "vpa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_business_details" ADD "companyPanNumber" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_business_details" ADD "gstin" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_business_details" ADD "websiteUrl" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_business_details" ADD "directors" jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_business_details" ADD "moa" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_business_details" ADD "aoa" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_business_details" ADD "coi" character varying`,
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
      `ALTER TABLE "user_business_details" DROP COLUMN "coi"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_business_details" DROP COLUMN "aoa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_business_details" DROP COLUMN "moa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_business_details" DROP COLUMN "directors"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_business_details" DROP COLUMN "websiteUrl"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_business_details" DROP COLUMN "gstin"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_business_details" DROP COLUMN "companyPanNumber"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ADD "vpa" character varying`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_payin_orders_vpa_created_at" ON "payin_orders" ("createdAt", "vpa") WHERE (vpa IS NOT NULL)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_payin_orders_vpa" ON "payin_orders" ("vpa") WHERE (vpa IS NOT NULL)`,
    );
  }
}
