import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateIntegrationMapping1767781624597
  implements MigrationInterface
{
  name = "CreateIntegrationMapping1767781624597";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_wallets_userId_version"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_wallets_updatedAt"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_wallets_userId"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_wallets_userId_version_covering"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_wallets_userId_version_quick"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_wallets_userId_quick"`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "user_integration_mappings" ("id" character varying NOT NULL, "userId" character varying NOT NULL, "integrationCode" character varying(50) NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_6fb69bd956977211e02e0962924" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_d942df0f5e17d4e9c8f29841a2" ON "user_integration_mappings" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_17304ae535877f04f5cf96ba9e" ON "user_integration_mappings" ("userId", "isActive") `,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "checkouts" ("id" character varying NOT NULL, "payerName" text, "payerEmail" text NOT NULL, "payerMobile" text, "payerAddress" text, "amount" numeric(10,2) NOT NULL, "clientTxnId" text NOT NULL, "status" character varying NOT NULL DEFAULT 'PENDING', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_50ff635b5d91851d87a54eeb9f7" UNIQUE ("clientTxnId"), CONSTRAINT "PK_5800730d89f4137fc18770e4d4d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_e122b4131eba90a0becaa0e3b9" ON "checkouts" ("status") `,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" DROP COLUMN IF EXISTS "vpa"`,
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
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_d942df0f5e17d4e9c8f29841a29') THEN ALTER TABLE "user_integration_mappings" ADD CONSTRAINT "FK_d942df0f5e17d4e9c8f29841a29" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION; END IF; END $$`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_integration_mappings" DROP CONSTRAINT "FK_d942df0f5e17d4e9c8f29841a29"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ceabcf58fac82c77db4be6c219"`,
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
      `ALTER TABLE "payin_orders" ADD COLUMN IF NOT EXISTS "vpa" character varying(255)`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e122b4131eba90a0becaa0e3b9"`,
    );
    await queryRunner.query(`DROP TABLE "checkouts"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_17304ae535877f04f5cf96ba9e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d942df0f5e17d4e9c8f29841a2"`,
    );
    await queryRunner.query(`DROP TABLE "user_integration_mappings"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_wallets_userId_quick" ON "wallets" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_wallets_userId_version_quick" ON "wallets" ("userId", "version") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_wallets_userId_version_covering" ON "wallets" ("totalCollections", "updatedAt", "availablePayoutBalance", "userId", "version") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_wallets_userId" ON "wallets" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_wallets_updatedAt" ON "wallets" ("updatedAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_wallets_userId_version" ON "wallets" ("userId", "version") `,
    );
  }
}
