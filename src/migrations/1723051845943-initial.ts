import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1723051845943 implements MigrationInterface {
    name = 'Initial1723051845943'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "business_details" ("id" character varying NOT NULL, "businessEntityType" integer, "businessName" character varying, "designation" character varying, "turnover" integer, "industry" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e82f20e45ada87f32a409b3491a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" character varying NOT NULL, "fullName" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying, "mobile" character varying NOT NULL, "isKycVerified" boolean NOT NULL DEFAULT false, "is2FAEnabled" boolean NOT NULL DEFAULT false, "status" integer NOT NULL DEFAULT '1', "role" integer NOT NULL DEFAULT '2', "onboardingStatus" integer NOT NULL DEFAULT '1', "businessDetailsId" character varying NOT NULL, "address" character varying, "city" character varying, "state" character varying, "pincode" character varying, "aadhar" character varying, "pan" character varying, "image" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_d376a9f93bba651f32a2c03a7d3" UNIQUE ("mobile"), CONSTRAINT "REL_abfb8b60c24e6e22a6b0b8f18e" UNIQUE ("businessDetailsId"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")); COMMENT ON COLUMN "users"."fullName" IS 'merchant name as per pan card'; COMMENT ON COLUMN "users"."isKycVerified" IS 'kyc will verify on verify.paybolt.in with aadhar & pan'; COMMENT ON COLUMN "users"."is2FAEnabled" IS '2FA'`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_d376a9f93bba651f32a2c03a7d" ON "users" ("mobile") `);
        await queryRunner.query(`CREATE TABLE "internal_users" ("id" character varying NOT NULL, "fullName" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying, "mobile" character varying NOT NULL, "status" integer NOT NULL DEFAULT '1', "role" integer NOT NULL DEFAULT '1', "image" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_b7d7c019ae2f3c6922a05586019" UNIQUE ("email"), CONSTRAINT "UQ_56c029f4522a4a6351bd6ce9610" UNIQUE ("mobile"), CONSTRAINT "PK_2d59d7927ab38048afb534f00b3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_b7d7c019ae2f3c6922a0558601" ON "internal_users" ("email") `);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_abfb8b60c24e6e22a6b0b8f18ef" FOREIGN KEY ("businessDetailsId") REFERENCES "business_details"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_abfb8b60c24e6e22a6b0b8f18ef"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b7d7c019ae2f3c6922a0558601"`);
        await queryRunner.query(`DROP TABLE "internal_users"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d376a9f93bba651f32a2c03a7d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "business_details"`);
    }

}
