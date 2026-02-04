import { MigrationInterface, QueryRunner } from "typeorm";

export class AddHSNCode1770042132181 implements MigrationInterface {
  name = "AddHSNCode1770042132181";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "payment_links" ("id" character varying NOT NULL, "amount" numeric(10,2) NOT NULL, "orderId" character varying NOT NULL, "name" character varying NOT NULL, "email" character varying NOT NULL, "mobile" character varying NOT NULL, "status" character varying NOT NULL DEFAULT 'PENDING', "txnRefId" character varying, "paymentMethod" character varying NOT NULL DEFAULT 'UPI', "intent" character varying, "paymentLink" character varying, "utr" character varying, "isMisspelled" boolean NOT NULL DEFAULT false, "commissionInPercentage" numeric(10,2) NOT NULL DEFAULT '4.5', "commissionAmount" numeric(10,2) NOT NULL, "gstInPercentage" numeric(10,2) NOT NULL DEFAULT '18', "gstAmount" numeric(10,2) NOT NULL, "netPayableAmount" numeric(10,2) NOT NULL, "commissionId" character varying, "commissionSlabId" character varying, "chargeType" character varying(50), "chargeValue" numeric(18,2), "settlementStatus" character varying NOT NULL DEFAULT 'NOT_INITIATED', "userVpa" character varying, "userId" character varying NOT NULL, "successAt" TIMESTAMP WITH TIME ZONE, "failureAt" TIMESTAMP WITH TIME ZONE, "checkoutData" jsonb, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_ef6753de1e083ce730fd8ed4cd4" UNIQUE ("orderId"), CONSTRAINT "PK_5b176ff8200166713c53d6c3ada" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ef6753de1e083ce730fd8ed4cd" ON "payment_links" ("orderId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6017bc6a86a04f35e63c6895e8" ON "payment_links" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_414d9d1940a540b34225bfdc1a" ON "payment_links" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ec0e10dcbdea069c552b9d1827" ON "payment_links" ("createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f748259aaa5bd052051b70578f" ON "payment_links" ("userId", "createdAt") `,
    );
    await queryRunner.query(
      `ALTER TABLE "items" ADD "hsnCode" character varying NOT NULL`,
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
      `ALTER TABLE "users" ALTER COLUMN "authProvider" SET DEFAULT 'password'`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_links" ADD CONSTRAINT "FK_414d9d1940a540b34225bfdc1a5" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payment_links" DROP CONSTRAINT "FK_414d9d1940a540b34225bfdc1a5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "authProvider" SET DEFAULT 'google'`,
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
    await queryRunner.query(`ALTER TABLE "items" DROP COLUMN "hsnCode"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f748259aaa5bd052051b70578f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ec0e10dcbdea069c552b9d1827"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_414d9d1940a540b34225bfdc1a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6017bc6a86a04f35e63c6895e8"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ef6753de1e083ce730fd8ed4cd"`,
    );
    await queryRunner.query(`DROP TABLE "payment_links"`);
  }
}
