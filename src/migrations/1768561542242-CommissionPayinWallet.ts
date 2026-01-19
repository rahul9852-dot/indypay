import { MigrationInterface, QueryRunner } from "typeorm";

export class CommissionPayinWallet1768561542242 implements MigrationInterface {
  name = "CommissionPayinWallet1768561542242";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_integration_mappings" RENAME COLUMN "integrationCode" TO "integrationId"`,
    );
    await queryRunner.query(
      `CREATE TABLE "master_bank" ("id" character varying NOT NULL, "name" character varying NOT NULL, "bankName" character varying NOT NULL, "bankIFSC" character varying NOT NULL, "accountNumber" character varying NOT NULL, "activity" character varying NOT NULL DEFAULT 'ACTIVE', CONSTRAINT "PK_ae4b7d16bdb4e166ede5cb6840a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "payin-wallet-load" ("id" character varying NOT NULL, "amount" numeric(15,2) NOT NULL DEFAULT '0', "utr" character varying NOT NULL, "status" character varying NOT NULL, "userId" character varying NOT NULL, "masterBankId" character varying NOT NULL, "mode" character varying NOT NULL DEFAULT 'IMPS', "topupById" character varying, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_6babc30b49de24c49550c545524" PRIMARY KEY ("id")); COMMENT ON COLUMN "payin-wallet-load"."amount" IS 'collection amount'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6b924a9e68d50381821d22bbd9" ON "payin-wallet-load" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ff5b96ae34d96f9e09bc02dacb" ON "payin-wallet-load" ("createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ffaa9391c74492899ecdac8be9" ON "payin-wallet-load" ("userId", "createdAt") `,
    );
    await queryRunner.query(
      `CREATE TABLE "integrations" ("id" character varying NOT NULL, "name" character varying(100) NOT NULL, "code" character varying(50) NOT NULL, "config" jsonb, "isActive" boolean NOT NULL DEFAULT true, "dailyLimit" numeric(15,2) NOT NULL DEFAULT '0', "dailyLimitConsumed" numeric(15,2) NOT NULL DEFAULT '0', "monthlyLimit" numeric(15,2) NOT NULL DEFAULT '0', "monthlyLimitConsumed" numeric(15,2) NOT NULL DEFAULT '0', "lastResetDate" date, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_7421bdea2f911908e38d9693f04" UNIQUE ("code"), CONSTRAINT "PK_9adcdc6d6f3922535361ce641e8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7421bdea2f911908e38d9693f0" ON "integrations" ("code") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8d6d5e50f079bab0910ad47500" ON "integrations" ("code", "isActive") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."commission_slabs_chargetype_enum" AS ENUM('PERCENTAGE', 'FLAT')`,
    );
    await queryRunner.query(
      `CREATE TABLE "commission_slabs" ("id" character varying NOT NULL, "commissionId" character varying NOT NULL, "minAmount" numeric(18,2) NOT NULL DEFAULT '0', "maxAmount" numeric(18,2), "chargeType" "public"."commission_slabs_chargetype_enum" NOT NULL, "chargeValue" numeric(18,2) NOT NULL, "gstPercentage" numeric(10,2), "priority" integer NOT NULL DEFAULT '0', "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_0aabb083f4338d0b4c19dcf4637" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3191f40cf8a82496658a4bb711" ON "commission_slabs" ("commissionId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3810069371ba866182e48ff112" ON "commission_slabs" ("commissionId", "priority") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."commissions_type_enum" AS ENUM('PAYIN', 'PAYOUT')`,
    );
    await queryRunner.query(
      `CREATE TABLE "commissions" ("id" character varying NOT NULL, "name" character varying(255) NOT NULL, "type" "public"."commissions_type_enum" NOT NULL, "description" text, "isActive" boolean NOT NULL DEFAULT true, "defaultGstPercentage" numeric(10,2) NOT NULL DEFAULT '18', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_2701379966e2e670bb5ff0ae78e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_67b2c7ffd5db519ff4ad1692f9" ON "commissions" ("type", "isActive") `,
    );
    await queryRunner.query(
      `CREATE TABLE "user_commission_mappings" ("id" character varying NOT NULL, "userId" character varying NOT NULL, "payinCommissionId" character varying NOT NULL, "payoutCommissionId" character varying, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_7168e6ac0b3a4602507b6850eae" PRIMARY KEY ("id"))`,
    );
    // Check if index exists before creating (to handle re-runs)
    const indexExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM pg_indexes 
                WHERE indexname = 'IDX_05c9bccecd503d9d8b47d8bba4'
            )
        `);
    if (!indexExists[0].exists) {
      await queryRunner.query(
        `CREATE INDEX "IDX_05c9bccecd503d9d8b47d8bba4" ON "user_commission_mappings" ("userId") `,
      );
    }
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ADD "commissionId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ADD "commissionSlabId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ADD "chargeType" character varying(50)`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ADD "chargeValue" numeric(18,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ADD "userVpa" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallets" ADD "totalPayinBalance" numeric(15,2) NOT NULL DEFAULT '0'`,
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
      `ALTER TABLE "user_integration_mappings" DROP COLUMN "integrationId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_integration_mappings" ADD "integrationId" character varying NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4600348035d217e8b2212d2bb7" ON "user_integration_mappings" ("integrationId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "payin-wallet-load" ADD CONSTRAINT "FK_473d4407f6f76baaf2f89f31442" FOREIGN KEY ("topupById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin-wallet-load" ADD CONSTRAINT "FK_1204d85a8f41e1cf3c6ab1bb225" FOREIGN KEY ("masterBankId") REFERENCES "master_bank"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin-wallet-load" ADD CONSTRAINT "FK_6b924a9e68d50381821d22bbd9d" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_integration_mappings" ADD CONSTRAINT "FK_4600348035d217e8b2212d2bb7f" FOREIGN KEY ("integrationId") REFERENCES "integrations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "commission_slabs" ADD CONSTRAINT "FK_3191f40cf8a82496658a4bb7115" FOREIGN KEY ("commissionId") REFERENCES "commissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_commission_mappings" ADD CONSTRAINT "FK_05c9bccecd503d9d8b47d8bba4a" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_commission_mappings" ADD CONSTRAINT "FK_14ab87da364b7c1584e30f27407" FOREIGN KEY ("payinCommissionId") REFERENCES "commissions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_commission_mappings" ADD CONSTRAINT "FK_1b7eed84cb580add817d10ba054" FOREIGN KEY ("payoutCommissionId") REFERENCES "commissions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_commission_mappings" DROP CONSTRAINT "FK_1b7eed84cb580add817d10ba054"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_commission_mappings" DROP CONSTRAINT "FK_14ab87da364b7c1584e30f27407"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_commission_mappings" DROP CONSTRAINT "FK_05c9bccecd503d9d8b47d8bba4a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "commission_slabs" DROP CONSTRAINT "FK_3191f40cf8a82496658a4bb7115"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_integration_mappings" DROP CONSTRAINT "FK_4600348035d217e8b2212d2bb7f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin-wallet-load" DROP CONSTRAINT "FK_6b924a9e68d50381821d22bbd9d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin-wallet-load" DROP CONSTRAINT "FK_1204d85a8f41e1cf3c6ab1bb225"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin-wallet-load" DROP CONSTRAINT "FK_473d4407f6f76baaf2f89f31442"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4600348035d217e8b2212d2bb7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_integration_mappings" DROP COLUMN "integrationId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_integration_mappings" ADD "integrationId" character varying(50) NOT NULL`,
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
      `ALTER TABLE "wallets" DROP COLUMN "totalPayinBalance"`,
    );
    await queryRunner.query(`ALTER TABLE "payin_orders" DROP COLUMN "userVpa"`);
    await queryRunner.query(
      `ALTER TABLE "payin_orders" DROP COLUMN "chargeValue"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" DROP COLUMN "chargeType"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" DROP COLUMN "commissionSlabId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" DROP COLUMN "commissionId"`,
    );
    // Drop index if it exists
    const indexExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM pg_indexes 
                WHERE indexname = 'IDX_05c9bccecd503d9d8b47d8bba4'
            )
        `);
    if (indexExists[0].exists) {
      await queryRunner.query(
        `DROP INDEX "public"."IDX_05c9bccecd503d9d8b47d8bba4"`,
      );
    }
    await queryRunner.query(`DROP TABLE "user_commission_mappings"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_67b2c7ffd5db519ff4ad1692f9"`,
    );
    await queryRunner.query(`DROP TABLE "commissions"`);
    await queryRunner.query(`DROP TYPE "public"."commissions_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3810069371ba866182e48ff112"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3191f40cf8a82496658a4bb711"`,
    );
    await queryRunner.query(`DROP TABLE "commission_slabs"`);
    await queryRunner.query(
      `DROP TYPE "public"."commission_slabs_chargetype_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8d6d5e50f079bab0910ad47500"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7421bdea2f911908e38d9693f0"`,
    );
    await queryRunner.query(`DROP TABLE "integrations"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ffaa9391c74492899ecdac8be9"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ff5b96ae34d96f9e09bc02dacb"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6b924a9e68d50381821d22bbd9"`,
    );
    await queryRunner.query(`DROP TABLE "payin-wallet-load"`);
    await queryRunner.query(`DROP TABLE "master_bank"`);
    await queryRunner.query(
      `ALTER TABLE "user_integration_mappings" RENAME COLUMN "integrationId" TO "integrationCode"`,
    );
  }
}
