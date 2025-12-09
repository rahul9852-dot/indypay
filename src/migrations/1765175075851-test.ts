import { MigrationInterface, QueryRunner } from "typeorm";

export class Test1765175075851 implements MigrationInterface {
  name = "Test1765175075851";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_wallets_updatedAt"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_wallets_userId_quick"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_wallets_userId_version"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_wallets_userId_version_quick"`,
    );
    await queryRunner.query(
      `CREATE TABLE "payin_wallets" ("id" character varying NOT NULL, "totalPayinBalance" numeric(15,2) NOT NULL DEFAULT '0', "userId" character varying NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "version" integer NOT NULL DEFAULT '0', CONSTRAINT "REL_94c80481f1e4351ebdafec7a4b" UNIQUE ("userId"), CONSTRAINT "PK_bc4f95c1bbfbac40a958617e861" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_94c80481f1e4351ebdafec7a4b" ON "payin_wallets" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5dc25dd970cffaec722f030739" ON "payin_wallets" ("userId", "version") `,
    );
    await queryRunner.query(`ALTER TABLE "payin_orders" DROP COLUMN "vpa"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "isPayinWalletFromDashboard" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "payinWalletId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "UQ_58b05821b1c7abd89811442ef80" UNIQUE ("payinWalletId")`,
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
      `CREATE INDEX "IDX_ceabcf58fac82c77db4be6c219" ON "wallets" ("userId", "version") `,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_wallets" ADD CONSTRAINT "FK_94c80481f1e4351ebdafec7a4bd" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_58b05821b1c7abd89811442ef80" FOREIGN KEY ("payinWalletId") REFERENCES "payin_wallets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_58b05821b1c7abd89811442ef80"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_wallets" DROP CONSTRAINT "FK_94c80481f1e4351ebdafec7a4bd"`,
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
      `ALTER TABLE "payin_orders" ALTER COLUMN "commissionInPercentage" SET DEFAULT 4.5`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "UQ_58b05821b1c7abd89811442ef80"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "payinWalletId"`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "isPayinWalletFromDashboard"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ADD "vpa" character varying`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5dc25dd970cffaec722f030739"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_94c80481f1e4351ebdafec7a4b"`,
    );
    await queryRunner.query(`DROP TABLE "payin_wallets"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_wallets_userId_version_quick" ON "wallets" ("userId", "version") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_wallets_userId_version" ON "wallets" ("userId", "version") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_wallets_userId_quick" ON "wallets" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_wallets_updatedAt" ON "wallets" ("updatedAt") `,
    );
  }
}
