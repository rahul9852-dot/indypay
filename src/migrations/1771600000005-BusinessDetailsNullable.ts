import { MigrationInterface, QueryRunner } from "typeorm";

export class BusinessDetailsNullable1771600000005
  implements MigrationInterface
{
  name = "BusinessDetailsNullable1771600000005";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_business_details" ALTER COLUMN "businessEntityType" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_business_details" ALTER COLUMN "businessName" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_business_details" ALTER COLUMN "registerBusinessNumber" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_business_details" ALTER COLUMN "designation" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_business_details" ALTER COLUMN "turnover" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_business_details" ALTER COLUMN "businessIndustry" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_business_details" ALTER COLUMN "businessIndustry" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_business_details" ALTER COLUMN "turnover" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_business_details" ALTER COLUMN "designation" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_business_details" ALTER COLUMN "registerBusinessNumber" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_business_details" ALTER COLUMN "businessName" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_business_details" ALTER COLUMN "businessEntityType" SET NOT NULL`,
    );
  }
}
