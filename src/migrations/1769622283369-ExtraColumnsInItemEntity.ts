import { MigrationInterface, QueryRunner } from "typeorm";

export class ExtraColumnsInItemEntity1769622283369
  implements MigrationInterface
{
  name = "ExtraColumnsInItemEntity1769622283369";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_wallets_updatedAt"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_wallets_userId_quick"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_wallets_userId_version"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_wallets_userId_version_quick"`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "master_bank" ("id" character varying NOT NULL, "name" character varying NOT NULL, "bankName" character varying NOT NULL, "bankIFSC" character varying NOT NULL, "accountNumber" character varying NOT NULL, "activity" character varying NOT NULL DEFAULT 'ACTIVE', CONSTRAINT "PK_ae4b7d16bdb4e166ede5cb6840a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "payin-wallet-load" ("id" character varying NOT NULL, "amount" numeric(15,2) NOT NULL DEFAULT '0', "utr" character varying NOT NULL, "status" character varying NOT NULL, "userId" character varying NOT NULL, "masterBankId" character varying NOT NULL, "mode" character varying NOT NULL DEFAULT 'IMPS', "topupById" character varying, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_6babc30b49de24c49550c545524" PRIMARY KEY ("id")); COMMENT ON COLUMN "payin-wallet-load"."amount" IS 'collection amount'`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_6b924a9e68d50381821d22bbd9" ON "payin-wallet-load" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_ff5b96ae34d96f9e09bc02dacb" ON "payin-wallet-load" ("createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_ffaa9391c74492899ecdac8be9" ON "payin-wallet-load" ("userId", "createdAt") `,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "integrations" ("id" character varying NOT NULL, "name" character varying(100) NOT NULL, "code" character varying(50) NOT NULL, "config" jsonb, "isActive" boolean NOT NULL DEFAULT true, "dailyLimit" numeric(15,2) NOT NULL DEFAULT '0', "dailyLimitConsumed" numeric(15,2) NOT NULL DEFAULT '0', "monthlyLimit" numeric(15,2) NOT NULL DEFAULT '0', "monthlyLimitConsumed" numeric(15,2) NOT NULL DEFAULT '0', "lastResetDate" date, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_7421bdea2f911908e38d9693f04" UNIQUE ("code"), CONSTRAINT "PK_9adcdc6d6f3922535361ce641e8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_7421bdea2f911908e38d9693f0" ON "integrations" ("code") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_8d6d5e50f079bab0910ad47500" ON "integrations" ("code", "isActive") `,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "user_integration_mappings" ("id" character varying NOT NULL, "userId" character varying NOT NULL, "integrationId" character varying NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_6fb69bd956977211e02e0962924" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_d942df0f5e17d4e9c8f29841a2" ON "user_integration_mappings" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_4600348035d217e8b2212d2bb7" ON "user_integration_mappings" ("integrationId") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_17304ae535877f04f5cf96ba9e" ON "user_integration_mappings" ("userId", "isActive") `,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'commission_slabs_chargetype_enum') THEN CREATE TYPE "public"."commission_slabs_chargetype_enum" AS ENUM('FLAT', 'PERCENTAGE'); END IF; END $$`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "commission_slabs" ("id" character varying NOT NULL, "commissionId" character varying NOT NULL, "minAmount" numeric(18,2) NOT NULL DEFAULT '0', "maxAmount" numeric(18,2), "chargeType" "public"."commission_slabs_chargetype_enum" NOT NULL, "chargeValue" numeric(18,2) NOT NULL, "gstPercentage" numeric(10,2), "priority" integer NOT NULL DEFAULT '0', "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_0aabb083f4338d0b4c19dcf4637" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_3191f40cf8a82496658a4bb711" ON "commission_slabs" ("commissionId") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_3810069371ba866182e48ff112" ON "commission_slabs" ("commissionId", "priority") `,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'commissions_type_enum') THEN CREATE TYPE "public"."commissions_type_enum" AS ENUM('PAYIN', 'PAYOUT'); END IF; END $$`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "commissions" ("id" character varying NOT NULL, "name" character varying(255) NOT NULL, "type" "public"."commissions_type_enum" NOT NULL, "description" text, "isActive" boolean NOT NULL DEFAULT true, "defaultGstPercentage" numeric(10,2) NOT NULL DEFAULT '18', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_2701379966e2e670bb5ff0ae78e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_67b2c7ffd5db519ff4ad1692f9" ON "commissions" ("type", "isActive") `,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "user_commission_mappings" ("id" character varying NOT NULL, "userId" character varying NOT NULL, "payinCommissionId" character varying NOT NULL, "payoutCommissionId" character varying, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_7168e6ac0b3a4602507b6850eae" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_05c9bccecd503d9d8b47d8bba4" ON "user_commission_mappings" ("userId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" DROP COLUMN IF EXISTS "vpa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ADD IF NOT EXISTS "commissionId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ADD IF NOT EXISTS "commissionSlabId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ADD IF NOT EXISTS "chargeType" character varying(50)`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ADD IF NOT EXISTS "chargeValue" numeric(18,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ADD IF NOT EXISTS "userVpa" character varying`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='wallets' AND column_name='totalPayinBalance') THEN ALTER TABLE "wallets" ADD "totalPayinBalance" numeric(15,2) NOT NULL DEFAULT '0'; END IF; END $$`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='items' AND column_name='hsnCode') THEN ALTER TABLE "items" ADD "hsnCode" character varying NOT NULL DEFAULT ''; END IF; END $$`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ALTER COLUMN "commissionInPercentage" SET DEFAULT '4.5'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "payin_orders"."checkoutData" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "commissionInPercentagePayin" SET DEFAULT '4.5'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "commissionInPercentagePayout" SET DEFAULT '1.5'`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_ceabcf58fac82c77db4be6c219" ON "wallets" ("userId", "version") `,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_473d4407f6f76baaf2f89f31442') THEN ALTER TABLE "payin-wallet-load" ADD CONSTRAINT "FK_473d4407f6f76baaf2f89f31442" FOREIGN KEY ("topupById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION; END IF; END $$`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_1204d85a8f41e1cf3c6ab1bb225') THEN ALTER TABLE "payin-wallet-load" ADD CONSTRAINT "FK_1204d85a8f41e1cf3c6ab1bb225" FOREIGN KEY ("masterBankId") REFERENCES "master_bank"("id") ON DELETE CASCADE ON UPDATE NO ACTION; END IF; END $$`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_6b924a9e68d50381821d22bbd9d') THEN ALTER TABLE "payin-wallet-load" ADD CONSTRAINT "FK_6b924a9e68d50381821d22bbd9d" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION; END IF; END $$`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_d942df0f5e17d4e9c8f29841a29') THEN ALTER TABLE "user_integration_mappings" ADD CONSTRAINT "FK_d942df0f5e17d4e9c8f29841a29" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION; END IF; END $$`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_4600348035d217e8b2212d2bb7f') THEN ALTER TABLE "user_integration_mappings" ADD CONSTRAINT "FK_4600348035d217e8b2212d2bb7f" FOREIGN KEY ("integrationId") REFERENCES "integrations"("id") ON DELETE CASCADE ON UPDATE NO ACTION; END IF; END $$`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_3191f40cf8a82496658a4bb7115') THEN ALTER TABLE "commission_slabs" ADD CONSTRAINT "FK_3191f40cf8a82496658a4bb7115" FOREIGN KEY ("commissionId") REFERENCES "commissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION; END IF; END $$`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_05c9bccecd503d9d8b47d8bba4a') THEN ALTER TABLE "user_commission_mappings" ADD CONSTRAINT "FK_05c9bccecd503d9d8b47d8bba4a" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION; END IF; END $$`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_14ab87da364b7c1584e30f27407') THEN ALTER TABLE "user_commission_mappings" ADD CONSTRAINT "FK_14ab87da364b7c1584e30f27407" FOREIGN KEY ("payinCommissionId") REFERENCES "commissions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION; END IF; END $$`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_1b7eed84cb580add817d10ba054') THEN ALTER TABLE "user_commission_mappings" ADD CONSTRAINT "FK_1b7eed84cb580add817d10ba054" FOREIGN KEY ("payoutCommissionId") REFERENCES "commissions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION; END IF; END $$`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_commission_mappings" DROP CONSTRAINT IF EXISTS "FK_1b7eed84cb580add817d10ba054"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_commission_mappings" DROP CONSTRAINT IF EXISTS "FK_14ab87da364b7c1584e30f27407"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_commission_mappings" DROP CONSTRAINT IF EXISTS "FK_05c9bccecd503d9d8b47d8bba4a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "commission_slabs" DROP CONSTRAINT IF EXISTS "FK_3191f40cf8a82496658a4bb7115"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_integration_mappings" DROP CONSTRAINT IF EXISTS "FK_4600348035d217e8b2212d2bb7f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_integration_mappings" DROP CONSTRAINT IF EXISTS "FK_d942df0f5e17d4e9c8f29841a29"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin-wallet-load" DROP CONSTRAINT IF EXISTS "FK_6b924a9e68d50381821d22bbd9d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin-wallet-load" DROP CONSTRAINT IF EXISTS "FK_1204d85a8f41e1cf3c6ab1bb225"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin-wallet-load" DROP CONSTRAINT IF EXISTS "FK_473d4407f6f76baaf2f89f31442"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_ceabcf58fac82c77db4be6c219"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "commissionInPercentagePayout" SET DEFAULT 1.5`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "commissionInPercentagePayin" SET DEFAULT 4.5`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "payin_orders"."checkoutData" IS 'Stores GeoPay checkout form data including merchantId, signature, callback URL, etc.'`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ALTER COLUMN "commissionInPercentage" SET DEFAULT 4.5`,
    );
    await queryRunner.query(
      `ALTER TABLE "items" DROP COLUMN IF EXISTS "hsnCode"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallets" DROP COLUMN IF EXISTS "totalPayinBalance"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" DROP COLUMN IF EXISTS "userVpa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" DROP COLUMN IF EXISTS "chargeValue"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" DROP COLUMN IF EXISTS "chargeType"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" DROP COLUMN IF EXISTS "commissionSlabId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" DROP COLUMN IF EXISTS "commissionId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ADD IF NOT EXISTS "vpa" character varying`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_05c9bccecd503d9d8b47d8bba4"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "user_commission_mappings"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_67b2c7ffd5db519ff4ad1692f9"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "commissions"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."commissions_type_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_3810069371ba866182e48ff112"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_3191f40cf8a82496658a4bb711"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "commission_slabs"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."commission_slabs_chargetype_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_17304ae535877f04f5cf96ba9e"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_4600348035d217e8b2212d2bb7"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_d942df0f5e17d4e9c8f29841a2"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "user_integration_mappings"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_8d6d5e50f079bab0910ad47500"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_7421bdea2f911908e38d9693f0"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "integrations"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_ffaa9391c74492899ecdac8be9"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_ff5b96ae34d96f9e09bc02dacb"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_6b924a9e68d50381821d22bbd9"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "payin-wallet-load"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "master_bank"`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_wallets_userId_version_quick" ON "wallets" ("userId", "version") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_wallets_userId_version" ON "wallets" ("userId", "version") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_wallets_userId_quick" ON "wallets" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_wallets_updatedAt" ON "wallets" ("updatedAt") `,
    );
  }
}
