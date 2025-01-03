import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1731057492151 implements MigrationInterface {
  name = "Init1731057492151";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user_api_keys" ("id" character varying NOT NULL, "clientId" character varying NOT NULL, "clientSecret" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" character varying, CONSTRAINT "PK_978fa5caa3468f463dac9d92e69" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_multi_factor_auth" ("id" character varying NOT NULL, "secret" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c7919726b93b2e1710000d5b0e0" PRIMARY KEY ("id")); COMMENT ON COLUMN "user_multi_factor_auth"."secret" IS '2FA secret'`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_business_details" ("id" character varying NOT NULL, "businessEntityType" integer NOT NULL, "businessName" character varying NOT NULL, "designation" character varying NOT NULL, "turnover" integer NOT NULL, "industry" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0f007b75f6ef843518f194a35bc" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_bank_details" ("id" character varying NOT NULL, "name" character varying NOT NULL, "email" character varying NOT NULL, "mobile" character varying NOT NULL, "bankName" character varying NOT NULL, "bankIFSC" character varying NOT NULL, "accountNumber" character varying NOT NULL, CONSTRAINT "PK_6d4c4e4f554aea8154590b14d94" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_kyc" ("id" character varying NOT NULL, "kycStatus" integer NOT NULL DEFAULT '1', "pan" character varying, "aadhar" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_96852e5a0116c49c1507faae57a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_address" ("id" character varying NOT NULL, "address" character varying NOT NULL, "city" character varying NOT NULL, "state" character varying NOT NULL, "country" character varying NOT NULL, "pincode" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" character varying, CONSTRAINT "PK_302d96673413455481d5ff4022a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "payout_orders" ("id" character varying NOT NULL, "amount" numeric(10,2) NOT NULL, "orderId" character varying NOT NULL, "transferMode" character varying NOT NULL, "status" character varying NOT NULL DEFAULT 'PENDING', "transferId" character varying, "commissionInPercentage" numeric(10,2) NOT NULL, "commissionAmount" numeric(10,2) NOT NULL, "gstInPercentage" numeric(10,2) NOT NULL, "gstAmount" numeric(10,2) NOT NULL, "netPayableAmount" numeric(10,2) NOT NULL, "successAt" TIMESTAMP, "failureAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" character varying, CONSTRAINT "UQ_169dbb6b559c7ce823af139f478" UNIQUE ("orderId"), CONSTRAINT "PK_004f6d9ef75562188dc6233e30c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_169dbb6b559c7ce823af139f47" ON "payout_orders" ("orderId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "payout_batches" ("id" character varying NOT NULL, "amount" numeric(10,2) NOT NULL, "orderId" character varying NOT NULL, "transferMode" character varying NOT NULL, "status" character varying NOT NULL DEFAULT 'PENDING', "transferId" character varying, "successAt" TIMESTAMP, "failureAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" character varying, CONSTRAINT "UQ_41907937421de47afbd263434d7" UNIQUE ("orderId"), CONSTRAINT "PK_aa57cb1e16d39cc0d41083145e4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_41907937421de47afbd263434d" ON "payout_batches" ("orderId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "transactions" ("id" character varying NOT NULL, "transactionType" character varying NOT NULL, "failureAt" TIMESTAMP, "successAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "payInOrderId" character varying, "payOutOrderId" character varying, "payoutBatchId" character varying, "userId" character varying, CONSTRAINT "REL_56253ef17752a6d04ecee9ec9c" UNIQUE ("payInOrderId"), CONSTRAINT "REL_3abe8c03b9c4ebcc1db34f5d0e" UNIQUE ("payOutOrderId"), CONSTRAINT "REL_74f9b62467d421dda349ce80c0" UNIQUE ("payoutBatchId"), CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "payin_orders" ("id" character varying NOT NULL, "amount" numeric(10,2) NOT NULL, "orderId" character varying NOT NULL, "name" character varying NOT NULL, "email" character varying NOT NULL, "mobile" character varying NOT NULL, "status" character varying NOT NULL DEFAULT 'PENDING', "txnRefId" character varying, "intent" character varying, "commissionInPercentage" numeric(10,2) NOT NULL DEFAULT '4.5', "commissionAmount" numeric(10,2) NOT NULL, "gstInPercentage" numeric(10,2) NOT NULL DEFAULT '18', "gstAmount" numeric(10,2) NOT NULL, "netPayableAmount" numeric(10,2) NOT NULL, "settlementStatus" character varying NOT NULL DEFAULT 'NOT_INITIATED', "successAt" TIMESTAMP, "failureAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" character varying, "payoutBatchId" character varying, CONSTRAINT "UQ_7af9214b2eb46ca058a0cd74220" UNIQUE ("orderId"), CONSTRAINT "PK_8b3320872ed3bea4e12869d6c67" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7af9214b2eb46ca058a0cd7422" ON "payin_orders" ("orderId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" character varying NOT NULL, "fullName" character varying(100) NOT NULL, "email" character varying(100) NOT NULL, "mobile" character varying NOT NULL, "password" character varying NOT NULL, "accountStatus" integer NOT NULL DEFAULT '1', "role" integer NOT NULL DEFAULT '2', "onboardingStatus" integer NOT NULL DEFAULT '1', "image" character varying(255), "payInWebhookUrl" character varying, "payOutWebhookUrl" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "businessDetailsId" character varying, "multiFactorAuthId" character varying, "kycId" character varying, "bankDetailsId" character varying, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_d376a9f93bba651f32a2c03a7d3" UNIQUE ("mobile"), CONSTRAINT "REL_abfb8b60c24e6e22a6b0b8f18e" UNIQUE ("businessDetailsId"), CONSTRAINT "REL_02f203b01625d8dab98d791632" UNIQUE ("multiFactorAuthId"), CONSTRAINT "REL_8d7891ecc41ac3858a5f477afc" UNIQUE ("kycId"), CONSTRAINT "REL_cc48328e01a0d330f35c7c4332" UNIQUE ("bankDetailsId"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d376a9f93bba651f32a2c03a7d" ON "users" ("mobile") `,
    );
    await queryRunner.query(
      `CREATE TABLE "user_whitelist_ips" ("id" character varying NOT NULL, "ipAddress" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" character varying, CONSTRAINT "PK_b4e56d2d9ed9232198a43e3aeca" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "auth_otp" ("id" character varying NOT NULL, "code" character varying(6) NOT NULL, "mobile" character varying NOT NULL, "expiredAt" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_2c699378068abaea9eff84e9ec3" UNIQUE ("mobile"), CONSTRAINT "PK_06c70acc09e7cb64b282d37e139" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_api_keys" ADD CONSTRAINT "FK_e131705cbbc8fb589889b02d457" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_address" ADD CONSTRAINT "FK_1abd8badc4a127b0f357d9ecbc2" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payout_orders" ADD CONSTRAINT "FK_43a99b6a22cbe5a0c511ff11b84" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payout_batches" ADD CONSTRAINT "FK_affa903702963d0959d83a181ac" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_56253ef17752a6d04ecee9ec9c5" FOREIGN KEY ("payInOrderId") REFERENCES "payin_orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_3abe8c03b9c4ebcc1db34f5d0eb" FOREIGN KEY ("payOutOrderId") REFERENCES "payout_orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_74f9b62467d421dda349ce80c02" FOREIGN KEY ("payoutBatchId") REFERENCES "payout_batches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_6bb58f2b6e30cb51a6504599f41" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ADD CONSTRAINT "FK_cfc9049095f9e4c6d9fd549747d" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ADD CONSTRAINT "FK_def77ef5bcbb1493a58b991e4af" FOREIGN KEY ("payoutBatchId") REFERENCES "payout_batches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_abfb8b60c24e6e22a6b0b8f18ef" FOREIGN KEY ("businessDetailsId") REFERENCES "user_business_details"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_02f203b01625d8dab98d7916329" FOREIGN KEY ("multiFactorAuthId") REFERENCES "user_multi_factor_auth"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_8d7891ecc41ac3858a5f477afc7" FOREIGN KEY ("kycId") REFERENCES "user_kyc"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_cc48328e01a0d330f35c7c43325" FOREIGN KEY ("bankDetailsId") REFERENCES "user_bank_details"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_whitelist_ips" ADD CONSTRAINT "FK_ecd98d8bbe89545748689296c8c" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_whitelist_ips" DROP CONSTRAINT "FK_ecd98d8bbe89545748689296c8c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_cc48328e01a0d330f35c7c43325"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_8d7891ecc41ac3858a5f477afc7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_02f203b01625d8dab98d7916329"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_abfb8b60c24e6e22a6b0b8f18ef"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" DROP CONSTRAINT "FK_def77ef5bcbb1493a58b991e4af"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" DROP CONSTRAINT "FK_cfc9049095f9e4c6d9fd549747d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_6bb58f2b6e30cb51a6504599f41"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_74f9b62467d421dda349ce80c02"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_3abe8c03b9c4ebcc1db34f5d0eb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_56253ef17752a6d04ecee9ec9c5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payout_batches" DROP CONSTRAINT "FK_affa903702963d0959d83a181ac"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payout_orders" DROP CONSTRAINT "FK_43a99b6a22cbe5a0c511ff11b84"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_address" DROP CONSTRAINT "FK_1abd8badc4a127b0f357d9ecbc2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_api_keys" DROP CONSTRAINT "FK_e131705cbbc8fb589889b02d457"`,
    );
    await queryRunner.query(`DROP TABLE "auth_otp"`);
    await queryRunner.query(`DROP TABLE "user_whitelist_ips"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d376a9f93bba651f32a2c03a7d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7af9214b2eb46ca058a0cd7422"`,
    );
    await queryRunner.query(`DROP TABLE "payin_orders"`);
    await queryRunner.query(`DROP TABLE "transactions"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_41907937421de47afbd263434d"`,
    );
    await queryRunner.query(`DROP TABLE "payout_batches"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_169dbb6b559c7ce823af139f47"`,
    );
    await queryRunner.query(`DROP TABLE "payout_orders"`);
    await queryRunner.query(`DROP TABLE "user_address"`);
    await queryRunner.query(`DROP TABLE "user_kyc"`);
    await queryRunner.query(`DROP TABLE "user_bank_details"`);
    await queryRunner.query(`DROP TABLE "user_business_details"`);
    await queryRunner.query(`DROP TABLE "user_multi_factor_auth"`);
    await queryRunner.query(`DROP TABLE "user_api_keys"`);
  }
}
