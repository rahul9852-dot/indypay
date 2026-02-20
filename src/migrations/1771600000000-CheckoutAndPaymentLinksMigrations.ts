import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Single migration combining:
 * - checkouts: add notifyOnEmail, notifyOnNumber
 * - payment_links: simplify (add encrypted fields, drop legacy columns)
 * - checkout_pages: create table with status (draft/publish)
 */
export class CheckoutAndPaymentLinksMigrations1771600000000
  implements MigrationInterface
{
  name = "CheckoutAndPaymentLinksMigrations1771600000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ----- 1. Checkouts: add notify flags -----
    await queryRunner.query(
      `ALTER TABLE "checkouts" ADD COLUMN IF NOT EXISTS "notifyOnEmail" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "checkouts" ADD COLUMN IF NOT EXISTS "notifyOnNumber" boolean NOT NULL DEFAULT false`,
    );

    // ----- 2. Payment links: simplify table -----
    await queryRunner.query(
      `ALTER TABLE "payment_links" DROP CONSTRAINT IF EXISTS "UQ_ef6753de1e083ce730fd8ed4cd4"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_ef6753de1e083ce730fd8ed4cd"`,
    );
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
    const dropPaymentLinkColumns = [
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
    for (const col of dropPaymentLinkColumns) {
      await queryRunner.query(
        `ALTER TABLE "payment_links" DROP COLUMN IF EXISTS "${col}"`,
      );
    }

    // ----- 3. Checkout pages: create table with status -----
    await queryRunner.query(`
      CREATE TYPE "checkout_pages_amounttype_enum" AS ENUM('FIXED', 'USER_ENTERED')
    `);
    await queryRunner.query(`
      CREATE TYPE "checkout_pages_status_enum" AS ENUM('DRAFT', 'PUBLISHED')
    `);
    await queryRunner.query(`
      CREATE TABLE "checkout_pages" (
        "id" character varying NOT NULL,
        "userId" character varying NOT NULL,
        "name" character varying(255),
        "logoUrl" text,
        "title" character varying(500) NOT NULL,
        "pageDescription" text,
        "contactMobile" character varying(20),
        "contactEmail" character varying(255),
        "termsAndConditions" text,
        "amountType" "checkout_pages_amounttype_enum" NOT NULL DEFAULT 'USER_ENTERED',
        "fixedAmount" numeric(18,2),
        "customFields" jsonb DEFAULT '[]',
        "status" "checkout_pages_status_enum" NOT NULL DEFAULT 'DRAFT',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_checkout_pages" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_checkout_pages_userId" ON "checkout_pages" ("userId")`,
    );
    await queryRunner.query(`
      ALTER TABLE "checkout_pages"
      ADD CONSTRAINT "FK_checkout_pages_user"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop checkout_pages
    await queryRunner.query(
      `ALTER TABLE "checkout_pages" DROP CONSTRAINT "FK_checkout_pages_user"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_checkout_pages_userId"`);
    await queryRunner.query(`DROP TABLE "checkout_pages"`);
    await queryRunner.query(`DROP TYPE "checkout_pages_status_enum"`);
    await queryRunner.query(`DROP TYPE "checkout_pages_amounttype_enum"`);

    // Restore payment_links columns (minimal)
    const restoreColumns = [
      ["orderId", "character varying"],
      ["name", "character varying"],
      ["txnRefId", "character varying"],
      ["paymentMethod", "character varying NOT NULL DEFAULT 'UPI'"],
      ["intent", "character varying"],
      ["paymentLink", "character varying"],
      ["utr", "character varying"],
      ["commissionInPercentage", "numeric(10,2) NOT NULL DEFAULT 4.5"],
      ["commissionAmount", "numeric(10,2)"],
      ["gstInPercentage", "numeric(10,2) NOT NULL DEFAULT 18"],
      ["gstAmount", "numeric(10,2)"],
      ["netPayableAmount", "numeric(10,2)"],
      ["commissionId", "character varying"],
      ["commissionSlabId", "character varying"],
      ["chargeType", "character varying(50)"],
      ["chargeValue", "numeric(18,2)"],
      [
        "settlementStatus",
        "character varying NOT NULL DEFAULT 'NOT_INITIATED'",
      ],
      ["userVpa", "character varying"],
      ["successAt", "TIMESTAMP WITH TIME ZONE"],
      ["failureAt", "TIMESTAMP WITH TIME ZONE"],
      ["checkoutData", "jsonb"],
    ];
    for (const [col, type] of restoreColumns) {
      await queryRunner.query(
        `ALTER TABLE "payment_links" ADD COLUMN IF NOT EXISTS "${col}" ${type}`,
      );
    }
    await queryRunner.query(
      `ALTER TABLE "payment_links" DROP COLUMN IF EXISTS "notifyOnNumber"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_links" DROP COLUMN IF EXISTS "notifyOnEmail"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_links" DROP COLUMN IF EXISTS "expiresAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_links" DROP COLUMN IF EXISTS "encryptedData"`,
    );

    // Remove checkout notify columns
    await queryRunner.query(
      `ALTER TABLE "checkouts" DROP COLUMN IF EXISTS "notifyOnNumber"`,
    );
    await queryRunner.query(
      `ALTER TABLE "checkouts" DROP COLUMN IF EXISTS "notifyOnEmail"`,
    );
  }
}
