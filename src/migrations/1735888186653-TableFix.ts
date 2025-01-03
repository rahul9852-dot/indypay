import { MigrationInterface, QueryRunner } from "typeorm";

export class TableFix1735888186653 implements MigrationInterface {
  name = "TableFix1735888186653";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user_media_kyc" ("id" character varying NOT NULL, "documentType" character varying NOT NULL, "documentUrl" character varying NOT NULL, "status" integer NOT NULL DEFAULT '1', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" character varying, "userKycId" character varying, CONSTRAINT "PK_8473bfea56ac70b17b09e602915" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "media_kyc" ("id" character varying NOT NULL, "kycStatus" integer NOT NULL DEFAULT '1', "fileName" character varying, "fileType" character varying, "url" character varying, "documentType" character varying, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "userKycId" character varying, CONSTRAINT "PK_c5445c0fe72ddf3947fa0fe720c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "kyc" ("id" SERIAL NOT NULL, "kycStatus" character varying, "panId" character varying, "aadharId" character varying, "addressProofId" character varying, "bankStatementId" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" character varying, CONSTRAINT "REL_ca948073ed4a3ba22030d37b3d" UNIQUE ("userId"), CONSTRAINT "PK_84ab2e81ea9700d29dda719f3be" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "firstName" character varying(100) NOT NULL DEFAULT 'DEFAULT'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "lastName" character varying(100) NOT NULL DEFAULT 'DEFAULT'`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ALTER COLUMN "commissionInPercentage" SET DEFAULT '4.5'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "fullName" SET DEFAULT 'DEFAULT'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "commissionInPercentagePayin" SET DEFAULT '4.5'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "commissionInPercentagePayout" SET DEFAULT '1.5'`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_media_kyc" ADD CONSTRAINT "FK_5032eee90db9df1f29ee155bf4b" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_media_kyc" ADD CONSTRAINT "FK_1a1a1240ddcdd3b1f5f7e40b829" FOREIGN KEY ("userKycId") REFERENCES "user_kyc"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "media_kyc" ADD CONSTRAINT "FK_283cce8ee2a4c77f32c1a5f11eb" FOREIGN KEY ("userKycId") REFERENCES "user_kyc"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "kyc" ADD CONSTRAINT "FK_ca948073ed4a3ba22030d37b3db" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "kyc" DROP CONSTRAINT "FK_ca948073ed4a3ba22030d37b3db"`,
    );
    await queryRunner.query(
      `ALTER TABLE "media_kyc" DROP CONSTRAINT "FK_283cce8ee2a4c77f32c1a5f11eb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_media_kyc" DROP CONSTRAINT "FK_1a1a1240ddcdd3b1f5f7e40b829"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_media_kyc" DROP CONSTRAINT "FK_5032eee90db9df1f29ee155bf4b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "commissionInPercentagePayout" SET DEFAULT 1.5`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "commissionInPercentagePayin" SET DEFAULT 4.5`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "fullName" SET DEFAULT 'default'`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ALTER COLUMN "commissionInPercentage" SET DEFAULT 4.5`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "lastName"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "firstName"`);
    await queryRunner.query(`DROP TABLE "kyc"`);
    await queryRunner.query(`DROP TABLE "media_kyc"`);
    await queryRunner.query(`DROP TABLE "user_media_kyc"`);
  }
}
