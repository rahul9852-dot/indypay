import { MigrationInterface, QueryRunner } from "typeorm";

export class InstanceMig1736410303580 implements MigrationInterface {
  name = "InstanceMig1736410303580";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user_media" ("id" character varying NOT NULL, "documentType" character varying NOT NULL, "documentUrl" character varying NOT NULL, "documentName" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "kycId" character varying, CONSTRAINT "PK_70554748248e1812b2dd205a24c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_business_details" DROP COLUMN "industry"`,
    );
    await queryRunner.query(`ALTER TABLE "user_kyc" DROP COLUMN "kycStatus"`);
    await queryRunner.query(`ALTER TABLE "user_kyc" DROP COLUMN "pan"`);
    await queryRunner.query(`ALTER TABLE "user_kyc" DROP COLUMN "aadhar"`);
    await queryRunner.query(
      `ALTER TABLE "user_business_details" ADD "businessPan" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_business_details" ADD "registerBusinessNumber" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_business_details" ADD "businessIndustry" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ALTER COLUMN "commissionInPercentage" SET DEFAULT '4.5'`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "fullName"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "fullName" character varying(200) NOT NULL DEFAULT 'DEFAULT'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "commissionInPercentagePayin" SET DEFAULT '4.5'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "commissionInPercentagePayout" SET DEFAULT '1.5'`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_media" ADD CONSTRAINT "FK_6e58ba5609d4d2b3e271d624fdc" FOREIGN KEY ("kycId") REFERENCES "user_kyc"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_media" DROP CONSTRAINT "FK_6e58ba5609d4d2b3e271d624fdc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "commissionInPercentagePayout" SET DEFAULT 1.5`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "commissionInPercentagePayin" SET DEFAULT 4.5`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "fullName"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "fullName" character varying(100) NOT NULL DEFAULT 'DEFAULT'`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ALTER COLUMN "commissionInPercentage" SET DEFAULT 4.5`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_business_details" DROP COLUMN "businessIndustry"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_business_details" DROP COLUMN "registerBusinessNumber"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_business_details" DROP COLUMN "businessPan"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_kyc" ADD "aadhar" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_kyc" ADD "pan" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_kyc" ADD "kycStatus" integer NOT NULL DEFAULT '1'`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_business_details" ADD "industry" integer NOT NULL`,
    );
    await queryRunner.query(`DROP TABLE "user_media"`);
  }
}
