import { MigrationInterface, QueryRunner } from "typeorm";

export class SimplifyPaymentLinksTable1771500000002
  implements MigrationInterface
{
  name = "SimplifyPaymentLinksTable1771500000002";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop unique constraint on orderId before dropping column
    await queryRunner.query(
      `ALTER TABLE "payment_links" DROP CONSTRAINT IF EXISTS "UQ_ef6753de1e083ce730fd8ed4cd4"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_ef6753de1e083ce730fd8ed4cd"`,
    );

    // Add new columns if not exist (for fresh installs or if 1771500000001 wasn't run)
    await queryRunner.query(
      `ALTER TABLE "payment_links" ADD COLUMN IF NOT EXISTS "encryptedData" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_links" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_links" ADD COLUMN IF NOT EXISTS "notifyOnEmail" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_links" ADD COLUMN IF NOT EXISTS "notifyOnNumber" boolean NOT NULL DEFAULT false`,
    );

    // Make encryptedData and expiresAt required for new rows (alter to NOT NULL would fail on existing nulls; leave nullable for backward compat or add default)
    // Drop unused columns
    const dropColumns = [
      "orderId",
      "name",
      "txnRefId",
      "paymentMethod",
      "intent",
      "paymentLink",
      "utr",
      "isMisspelled",
      "commissionInPercentage",
      "commissionAmount",
      "gstInPercentage",
      "gstAmount",
      "netPayableAmount",
      "commissionId",
      "commissionSlabId",
      "chargeType",
      "chargeValue",
      "settlementStatus",
      "userVpa",
      "successAt",
      "failureAt",
      "checkoutData",
    ];
    for (const col of dropColumns) {
      await queryRunner.query(
        `ALTER TABLE "payment_links" DROP COLUMN IF EXISTS "${col}"`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Re-add columns (minimal restore for rollback)
    await queryRunner.query(
      `ALTER TABLE "payment_links" ADD COLUMN IF NOT EXISTS "orderId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_links" ADD COLUMN IF NOT EXISTS "name" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_links" ADD COLUMN IF NOT EXISTS "txnRefId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_links" ADD COLUMN IF NOT EXISTS "paymentMethod" character varying NOT NULL DEFAULT 'UPI'`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_links" ADD COLUMN IF NOT EXISTS "intent" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_links" ADD COLUMN IF NOT EXISTS "paymentLink" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_links" ADD COLUMN IF NOT EXISTS "utr" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_links" ADD COLUMN IF NOT EXISTS "isMisspelled" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_links" ADD COLUMN IF NOT EXISTS "commissionInPercentage" numeric(10,2) NOT NULL DEFAULT 4.5`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_links" ADD COLUMN IF NOT EXISTS "commissionAmount" numeric(10,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_links" ADD COLUMN IF NOT EXISTS "gstInPercentage" numeric(10,2) NOT NULL DEFAULT 18`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_links" ADD COLUMN IF NOT EXISTS "gstAmount" numeric(10,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_links" ADD COLUMN IF NOT EXISTS "netPayableAmount" numeric(10,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_links" ADD COLUMN IF NOT EXISTS "commissionId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_links" ADD COLUMN IF NOT EXISTS "commissionSlabId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_links" ADD COLUMN IF NOT EXISTS "chargeType" character varying(50)`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_links" ADD COLUMN IF NOT EXISTS "chargeValue" numeric(18,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_links" ADD COLUMN IF NOT EXISTS "settlementStatus" character varying NOT NULL DEFAULT 'NOT_INITIATED'`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_links" ADD COLUMN IF NOT EXISTS "userVpa" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_links" ADD COLUMN IF NOT EXISTS "successAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_links" ADD COLUMN IF NOT EXISTS "failureAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_links" ADD COLUMN IF NOT EXISTS "checkoutData" jsonb`,
    );
  }
}
