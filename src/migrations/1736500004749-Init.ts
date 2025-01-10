import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1736500004749 implements MigrationInterface {
  name = "Init1736500004749";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user_api_keys" ("id" character varying NOT NULL, "clientId" character varying NOT NULL, "clientSecret" character varying NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "userId" character varying, CONSTRAINT "PK_978fa5caa3468f463dac9d92e69" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_multi_factor_auth" ("id" character varying NOT NULL, "secret" character varying NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_c7919726b93b2e1710000d5b0e0" PRIMARY KEY ("id")); COMMENT ON COLUMN "user_multi_factor_auth"."secret" IS '2FA secret'`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_business_details" ("id" character varying NOT NULL, "businessPan" character varying, "businessEntityType" integer NOT NULL, "businessName" character varying NOT NULL, "registerBusinessNumber" character varying NOT NULL, "designation" character varying NOT NULL, "turnover" integer NOT NULL, "businessIndustry" character varying NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_0f007b75f6ef843518f194a35bc" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "settlements" ("id" character varying NOT NULL, "amount" numeric(10,2) NOT NULL, "transferMode" character varying NOT NULL DEFAULT 'IMPS', "status" character varying NOT NULL DEFAULT 'PENDING', "transferId" character varying, "remarks" character varying, "successAt" TIMESTAMP WITH TIME ZONE, "failureAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "userId" character varying, "bankDetailsId" character varying, "settledById" character varying, CONSTRAINT "PK_5f523ce152b84e818bff9467aab" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_bank_details" ("id" character varying NOT NULL, "name" character varying NOT NULL, "email" character varying NOT NULL, "mobile" character varying NOT NULL, "bankName" character varying NOT NULL, "bankIFSC" character varying NOT NULL, "accountNumber" character varying NOT NULL, "userId" character varying, CONSTRAINT "PK_6d4c4e4f554aea8154590b14d94" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_media" ("id" character varying NOT NULL, "documentType" character varying NOT NULL, "documentUrl" character varying NOT NULL, "documentName" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "kycId" character varying, CONSTRAINT "PK_70554748248e1812b2dd205a24c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_kyc" ("id" character varying NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_96852e5a0116c49c1507faae57a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_address" ("id" character varying NOT NULL, "address" character varying NOT NULL, "city" character varying NOT NULL, "state" character varying NOT NULL, "country" character varying NOT NULL, "pincode" character varying NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_302d96673413455481d5ff4022a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "payout_orders" ("id" character varying NOT NULL, "amount" numeric(10,2) NOT NULL, "orderId" character varying NOT NULL, "transferMode" character varying NOT NULL, "status" character varying NOT NULL DEFAULT 'PENDING', "transferId" character varying, "commissionInPercentage" numeric(10,2) NOT NULL, "commissionAmount" numeric(10,2) NOT NULL, "gstInPercentage" numeric(10,2) NOT NULL, "gstAmount" numeric(10,2) NOT NULL, "netPayableAmount" numeric(10,2) NOT NULL, "successAt" TIMESTAMP WITH TIME ZONE, "failureAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "userId" character varying, CONSTRAINT "UQ_169dbb6b559c7ce823af139f478" UNIQUE ("orderId"), CONSTRAINT "PK_004f6d9ef75562188dc6233e30c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_169dbb6b559c7ce823af139f47" ON "payout_orders" ("orderId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "transactions" ("id" character varying NOT NULL, "transactionType" character varying NOT NULL, "failureAt" TIMESTAMP WITH TIME ZONE, "successAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "payInOrderId" character varying, "payOutOrderId" character varying, "userId" character varying, CONSTRAINT "REL_56253ef17752a6d04ecee9ec9c" UNIQUE ("payInOrderId"), CONSTRAINT "REL_3abe8c03b9c4ebcc1db34f5d0e" UNIQUE ("payOutOrderId"), CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "payin_orders" ("id" character varying NOT NULL, "amount" numeric(10,2) NOT NULL, "orderId" character varying NOT NULL, "name" character varying NOT NULL, "email" character varying NOT NULL, "mobile" character varying NOT NULL, "status" character varying NOT NULL DEFAULT 'PENDING', "txnRefId" character varying, "intent" character varying, "paymentLink" character varying, "commissionInPercentage" numeric(10,2) NOT NULL DEFAULT '4.5', "commissionAmount" numeric(10,2) NOT NULL, "gstInPercentage" numeric(10,2) NOT NULL DEFAULT '18', "gstAmount" numeric(10,2) NOT NULL, "netPayableAmount" numeric(10,2) NOT NULL, "settlementStatus" character varying NOT NULL DEFAULT 'NOT_INITIATED', "successAt" TIMESTAMP WITH TIME ZONE, "failureAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "userId" character varying, CONSTRAINT "UQ_7af9214b2eb46ca058a0cd74220" UNIQUE ("orderId"), CONSTRAINT "PK_8b3320872ed3bea4e12869d6c67" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7af9214b2eb46ca058a0cd7422" ON "payin_orders" ("orderId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "user_whitelist_ips" ("id" character varying NOT NULL, "ipAddress" character varying NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "userId" character varying, CONSTRAINT "PK_b4e56d2d9ed9232198a43e3aeca" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" character varying NOT NULL, "firstName" character varying(100) NOT NULL DEFAULT 'DEFAULT', "lastName" character varying(100) NOT NULL DEFAULT 'DEFAULT', "fullName" character varying(200) NOT NULL DEFAULT 'DEFAULT', "email" character varying(100) NOT NULL, "mobile" character varying NOT NULL, "password" character varying NOT NULL, "accountStatus" integer NOT NULL DEFAULT '1', "role" integer NOT NULL DEFAULT '2', "onboardingStatus" integer NOT NULL DEFAULT '1', "image" character varying(255), "payInWebhookUrl" character varying, "payOutWebhookUrl" character varying, "commissionInPercentagePayin" numeric(10,2) NOT NULL DEFAULT '4.5', "commissionInPercentagePayout" numeric(10,2) NOT NULL DEFAULT '1.5', "gstInPercentagePayin" numeric(10,2) NOT NULL DEFAULT '18', "gstInPercentagePayout" numeric(10,2) NOT NULL DEFAULT '18', "channelPartnerId" character varying, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "businessDetailsId" character varying, "multiFactorAuthId" character varying, "walletId" character varying, "addressId" character varying, "kycId" character varying, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_d376a9f93bba651f32a2c03a7d3" UNIQUE ("mobile"), CONSTRAINT "REL_abfb8b60c24e6e22a6b0b8f18e" UNIQUE ("businessDetailsId"), CONSTRAINT "REL_02f203b01625d8dab98d791632" UNIQUE ("multiFactorAuthId"), CONSTRAINT "REL_0a95e6aab86ff1b0278c18cf48" UNIQUE ("walletId"), CONSTRAINT "REL_bafb08f60d7857f4670c172a6e" UNIQUE ("addressId"), CONSTRAINT "REL_8d7891ecc41ac3858a5f477afc" UNIQUE ("kycId"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d376a9f93bba651f32a2c03a7d" ON "users" ("mobile") `,
    );
    await queryRunner.query(
      `CREATE TABLE "wallets" ("id" character varying NOT NULL, "totalCollections" numeric(15,2) NOT NULL DEFAULT '0', "settledAmount" numeric(15,2) NOT NULL DEFAULT '0', "unsettledAmount" numeric(15,2) NOT NULL DEFAULT '0', "commissionAmount" numeric(15,2) NOT NULL DEFAULT '0', "gstAmount" numeric(15,2) NOT NULL DEFAULT '0', "netPayableAmount" numeric(15,2) NOT NULL DEFAULT '0', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_8402e5df5a30a229380e83e4f7e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "auth_otp" ("id" character varying NOT NULL, "code" character varying(6) NOT NULL, "mobile" character varying NOT NULL, "expiredAt" TIMESTAMP WITH TIME ZONE NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_2c699378068abaea9eff84e9ec3" UNIQUE ("mobile"), CONSTRAINT "PK_06c70acc09e7cb64b282d37e139" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "media_kyc" ("id" character varying NOT NULL, "kycStatus" integer NOT NULL DEFAULT '1', "fileName" character varying, "fileType" character varying, "url" character varying, "documentType" character varying, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "userKycId" character varying, CONSTRAINT "PK_c5445c0fe72ddf3947fa0fe720c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "kyc" ("id" SERIAL NOT NULL, "kycStatus" character varying, "panId" character varying, "aadharId" character varying, "addressProofId" character varying, "bankStatementId" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" character varying, CONSTRAINT "REL_ca948073ed4a3ba22030d37b3d" UNIQUE ("userId"), CONSTRAINT "PK_84ab2e81ea9700d29dda719f3be" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_api_keys" ADD CONSTRAINT "FK_e131705cbbc8fb589889b02d457" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "settlements" ADD CONSTRAINT "FK_4ff643af81bd6ae92eaaabdd2f4" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "settlements" ADD CONSTRAINT "FK_746ab925e9ff66a7fa95220f564" FOREIGN KEY ("bankDetailsId") REFERENCES "user_bank_details"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "settlements" ADD CONSTRAINT "FK_ba40101ac8dfb96097f9d6bc0c4" FOREIGN KEY ("settledById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_bank_details" ADD CONSTRAINT "FK_ae92220673e2399dabfc69930b2" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_media" ADD CONSTRAINT "FK_6e58ba5609d4d2b3e271d624fdc" FOREIGN KEY ("kycId") REFERENCES "user_kyc"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payout_orders" ADD CONSTRAINT "FK_43a99b6a22cbe5a0c511ff11b84" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_56253ef17752a6d04ecee9ec9c5" FOREIGN KEY ("payInOrderId") REFERENCES "payin_orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_3abe8c03b9c4ebcc1db34f5d0eb" FOREIGN KEY ("payOutOrderId") REFERENCES "payout_orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_6bb58f2b6e30cb51a6504599f41" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ADD CONSTRAINT "FK_cfc9049095f9e4c6d9fd549747d" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_whitelist_ips" ADD CONSTRAINT "FK_ecd98d8bbe89545748689296c8c" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_2d6f34363c7c6e0ef7961624bdb" FOREIGN KEY ("channelPartnerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_abfb8b60c24e6e22a6b0b8f18ef" FOREIGN KEY ("businessDetailsId") REFERENCES "user_business_details"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_02f203b01625d8dab98d7916329" FOREIGN KEY ("multiFactorAuthId") REFERENCES "user_multi_factor_auth"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_0a95e6aab86ff1b0278c18cf48e" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_bafb08f60d7857f4670c172a6ea" FOREIGN KEY ("addressId") REFERENCES "user_address"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_8d7891ecc41ac3858a5f477afc7" FOREIGN KEY ("kycId") REFERENCES "user_kyc"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
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
      `ALTER TABLE "users" DROP CONSTRAINT "FK_8d7891ecc41ac3858a5f477afc7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_bafb08f60d7857f4670c172a6ea"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_0a95e6aab86ff1b0278c18cf48e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_02f203b01625d8dab98d7916329"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_abfb8b60c24e6e22a6b0b8f18ef"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_2d6f34363c7c6e0ef7961624bdb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_whitelist_ips" DROP CONSTRAINT "FK_ecd98d8bbe89545748689296c8c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" DROP CONSTRAINT "FK_cfc9049095f9e4c6d9fd549747d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_6bb58f2b6e30cb51a6504599f41"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_3abe8c03b9c4ebcc1db34f5d0eb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_56253ef17752a6d04ecee9ec9c5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payout_orders" DROP CONSTRAINT "FK_43a99b6a22cbe5a0c511ff11b84"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_media" DROP CONSTRAINT "FK_6e58ba5609d4d2b3e271d624fdc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_bank_details" DROP CONSTRAINT "FK_ae92220673e2399dabfc69930b2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "settlements" DROP CONSTRAINT "FK_ba40101ac8dfb96097f9d6bc0c4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "settlements" DROP CONSTRAINT "FK_746ab925e9ff66a7fa95220f564"`,
    );
    await queryRunner.query(
      `ALTER TABLE "settlements" DROP CONSTRAINT "FK_4ff643af81bd6ae92eaaabdd2f4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_api_keys" DROP CONSTRAINT "FK_e131705cbbc8fb589889b02d457"`,
    );
    await queryRunner.query(`DROP TABLE "kyc"`);
    await queryRunner.query(`DROP TABLE "media_kyc"`);
    await queryRunner.query(`DROP TABLE "auth_otp"`);
    await queryRunner.query(`DROP TABLE "wallets"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d376a9f93bba651f32a2c03a7d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "user_whitelist_ips"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7af9214b2eb46ca058a0cd7422"`,
    );
    await queryRunner.query(`DROP TABLE "payin_orders"`);
    await queryRunner.query(`DROP TABLE "transactions"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_169dbb6b559c7ce823af139f47"`,
    );
    await queryRunner.query(`DROP TABLE "payout_orders"`);
    await queryRunner.query(`DROP TABLE "user_address"`);
    await queryRunner.query(`DROP TABLE "user_kyc"`);
    await queryRunner.query(`DROP TABLE "user_media"`);
    await queryRunner.query(`DROP TABLE "user_bank_details"`);
    await queryRunner.query(`DROP TABLE "settlements"`);
    await queryRunner.query(`DROP TABLE "user_business_details"`);
    await queryRunner.query(`DROP TABLE "user_multi_factor_auth"`);
    await queryRunner.query(`DROP TABLE "user_api_keys"`);
  }
}
