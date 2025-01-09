import { MigrationInterface, QueryRunner } from "typeorm";

export class FixKycIssuesOnTables1736409868324 implements MigrationInterface {
  name = "FixKycIssuesOnTables1736409868324";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_kyc" DROP CONSTRAINT "FK_4e246b1a648a4bf051e4d082eb5"`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_media" ("id" character varying NOT NULL, "documentType" character varying NOT NULL, "documentUrl" character varying NOT NULL, "documentName" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "kycId" character varying, CONSTRAINT "PK_70554748248e1812b2dd205a24c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_business_details" DROP COLUMN "personalPan"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_business_details" DROP COLUMN "personalEmailId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_business_details" DROP COLUMN "businessType"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_business_details" DROP COLUMN "kycStatus"`,
    );
    await queryRunner.query(`ALTER TABLE "user_kyc" DROP COLUMN "kycStatus"`);
    await queryRunner.query(`ALTER TABLE "user_kyc" DROP COLUMN "panId"`);
    await queryRunner.query(`ALTER TABLE "user_kyc" DROP COLUMN "aadharId"`);
    await queryRunner.query(
      `ALTER TABLE "user_kyc" DROP COLUMN "addressProofId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_kyc" DROP COLUMN "bankStatementId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_kyc" DROP CONSTRAINT "UQ_4e246b1a648a4bf051e4d082eb5"`,
    );
    await queryRunner.query(`ALTER TABLE "user_kyc" DROP COLUMN "userId"`);
    await queryRunner.query(
      `ALTER TABLE "payin_orders" DROP COLUMN "paymentLink"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "kycId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "UQ_8d7891ecc41ac3858a5f477afc7" UNIQUE ("kycId")`,
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
    await queryRunner.query(
      `ALTER TABLE "user_media" ADD CONSTRAINT "FK_6e58ba5609d4d2b3e271d624fdc" FOREIGN KEY ("kycId") REFERENCES "user_kyc"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_8d7891ecc41ac3858a5f477afc7" FOREIGN KEY ("kycId") REFERENCES "user_kyc"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_8d7891ecc41ac3858a5f477afc7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_media" DROP CONSTRAINT "FK_6e58ba5609d4d2b3e271d624fdc"`,
    );
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
      `ALTER TABLE "users" DROP CONSTRAINT "UQ_8d7891ecc41ac3858a5f477afc7"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "kycId"`);
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ADD "paymentLink" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_kyc" ADD "userId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_kyc" ADD CONSTRAINT "UQ_4e246b1a648a4bf051e4d082eb5" UNIQUE ("userId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_kyc" ADD "bankStatementId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_kyc" ADD "addressProofId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_kyc" ADD "aadharId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_kyc" ADD "panId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_kyc" ADD "kycStatus" integer NOT NULL DEFAULT '1'`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_business_details" ADD "kycStatus" integer NOT NULL DEFAULT '1'`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_business_details" ADD "businessType" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_business_details" ADD "personalEmailId" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_business_details" ADD "personalPan" character varying NOT NULL`,
    );
    await queryRunner.query(`DROP TABLE "user_media"`);
    await queryRunner.query(
      `ALTER TABLE "user_kyc" ADD CONSTRAINT "FK_4e246b1a648a4bf051e4d082eb5" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
