import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Sprint 05 — Invoice Upgrade
 *
 * items — new column:
 *   gstRate          int              GST slab 0/5/12/18/28 (default 18)
 *
 * invoice_items — new columns:
 *   description      varchar(500)     per-line description override
 *   rate             numeric(15,2)    unit price snapshot at invoice time
 *   gstRate          int              GST slab copied from item
 *   taxableAmount    numeric(15,2)    rate × quantity
 *   cgstAmount       numeric(15,2)    intra-state central tax
 *   sgstAmount       numeric(15,2)    intra-state state tax
 *   igstAmount       numeric(15,2)    inter-state integrated tax
 *   totalAmount      numeric(15,2)    taxableAmount + all taxes
 *
 * invoices — new columns:
 *   subtotalAmount   numeric(15,2)    pre-tax subtotal
 *   cgstAmount       numeric(15,2)    invoice-level CGST
 *   sgstAmount       numeric(15,2)    invoice-level SGST
 *   igstAmount       numeric(15,2)    invoice-level IGST
 *   totalTaxAmount   numeric(15,2)    total tax
 *   viewedAt         timestamptz      when customer first opened the invoice
 *   paidAt           timestamptz      when merchant marked it paid
 *   reminderSentAt   timestamptz      last reminder email timestamp
 *   isRecurring      boolean          true for recurring invoice templates
 *   recurringConfig  jsonb            recurring schedule config
 *
 * invoices — INVOICE_STATUS enum extended:
 *   adds VIEWED=4, PAID=5, OVERDUE=6, CANCELLED=7
 *
 * All ADD COLUMN statements use IF NOT EXISTS so the migration is safe to
 * re-run on environments that already have partial columns.
 */
export class InvoiceUpgrade1771600000004 implements MigrationInterface {
  name = "InvoiceUpgrade1771600000004";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── items: gstRate ───────────────────────────────────────────────────────
    await queryRunner.query(
      `ALTER TABLE "items"
       ADD COLUMN IF NOT EXISTS "gstRate" integer NOT NULL DEFAULT 18`,
    );

    // ── invoice_items: snapshot + tax breakdown ──────────────────────────────
    await queryRunner.query(
      `ALTER TABLE "invoice_items"
       ADD COLUMN IF NOT EXISTS "description" character varying(500)`,
    );

    await queryRunner.query(
      `ALTER TABLE "invoice_items"
       ADD COLUMN IF NOT EXISTS "rate" numeric(15,2) NOT NULL DEFAULT 0`,
    );

    await queryRunner.query(
      `ALTER TABLE "invoice_items"
       ADD COLUMN IF NOT EXISTS "gstRate" integer NOT NULL DEFAULT 18`,
    );

    await queryRunner.query(
      `ALTER TABLE "invoice_items"
       ADD COLUMN IF NOT EXISTS "taxableAmount" numeric(15,2) NOT NULL DEFAULT 0`,
    );

    await queryRunner.query(
      `ALTER TABLE "invoice_items"
       ADD COLUMN IF NOT EXISTS "cgstAmount" numeric(15,2) NOT NULL DEFAULT 0`,
    );

    await queryRunner.query(
      `ALTER TABLE "invoice_items"
       ADD COLUMN IF NOT EXISTS "sgstAmount" numeric(15,2) NOT NULL DEFAULT 0`,
    );

    await queryRunner.query(
      `ALTER TABLE "invoice_items"
       ADD COLUMN IF NOT EXISTS "igstAmount" numeric(15,2) NOT NULL DEFAULT 0`,
    );

    await queryRunner.query(
      `ALTER TABLE "invoice_items"
       ADD COLUMN IF NOT EXISTS "totalAmount" numeric(15,2) NOT NULL DEFAULT 0`,
    );

    // ── invoices: tax breakdown ──────────────────────────────────────────────
    await queryRunner.query(
      `ALTER TABLE "invoices"
       ADD COLUMN IF NOT EXISTS "subtotalAmount" numeric(15,2) DEFAULT 0`,
    );

    await queryRunner.query(
      `ALTER TABLE "invoices"
       ADD COLUMN IF NOT EXISTS "cgstAmount" numeric(15,2) DEFAULT 0`,
    );

    await queryRunner.query(
      `ALTER TABLE "invoices"
       ADD COLUMN IF NOT EXISTS "sgstAmount" numeric(15,2) DEFAULT 0`,
    );

    await queryRunner.query(
      `ALTER TABLE "invoices"
       ADD COLUMN IF NOT EXISTS "igstAmount" numeric(15,2) DEFAULT 0`,
    );

    await queryRunner.query(
      `ALTER TABLE "invoices"
       ADD COLUMN IF NOT EXISTS "totalTaxAmount" numeric(15,2) DEFAULT 0`,
    );

    // ── invoices: status tracking ────────────────────────────────────────────
    await queryRunner.query(
      `ALTER TABLE "invoices"
       ADD COLUMN IF NOT EXISTS "viewedAt" TIMESTAMP WITH TIME ZONE`,
    );

    await queryRunner.query(
      `ALTER TABLE "invoices"
       ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP WITH TIME ZONE`,
    );

    await queryRunner.query(
      `ALTER TABLE "invoices"
       ADD COLUMN IF NOT EXISTS "reminderSentAt" TIMESTAMP WITH TIME ZONE`,
    );

    // ── invoices: recurring ──────────────────────────────────────────────────
    await queryRunner.query(
      `ALTER TABLE "invoices"
       ADD COLUMN IF NOT EXISTS "isRecurring" boolean NOT NULL DEFAULT false`,
    );

    await queryRunner.query(
      `ALTER TABLE "invoices"
       ADD COLUMN IF NOT EXISTS "recurringConfig" jsonb`,
    );

    // ── INVOICE_STATUS enum — add new values ─────────────────────────────────
    // The enum is stored as an integer in the DB so no ALTER TYPE is needed —
    // TypeORM reads/writes the numeric value directly.
    // Values 4-7 (VIEWED, PAID, OVERDUE, CANCELLED) are now valid in the enum definition.
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ── invoices ──────────────────────────────────────────────────────────
    await queryRunner.query(
      `ALTER TABLE "invoices" DROP COLUMN IF EXISTS "recurringConfig"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" DROP COLUMN IF EXISTS "isRecurring"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" DROP COLUMN IF EXISTS "reminderSentAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" DROP COLUMN IF EXISTS "paidAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" DROP COLUMN IF EXISTS "viewedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" DROP COLUMN IF EXISTS "totalTaxAmount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" DROP COLUMN IF EXISTS "igstAmount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" DROP COLUMN IF EXISTS "sgstAmount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" DROP COLUMN IF EXISTS "cgstAmount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" DROP COLUMN IF EXISTS "subtotalAmount"`,
    );

    // ── invoice_items ────────────────────────────────────────────────────
    await queryRunner.query(
      `ALTER TABLE "invoice_items" DROP COLUMN IF EXISTS "totalAmount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice_items" DROP COLUMN IF EXISTS "igstAmount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice_items" DROP COLUMN IF EXISTS "sgstAmount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice_items" DROP COLUMN IF EXISTS "cgstAmount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice_items" DROP COLUMN IF EXISTS "taxableAmount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice_items" DROP COLUMN IF EXISTS "gstRate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice_items" DROP COLUMN IF EXISTS "rate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice_items" DROP COLUMN IF EXISTS "description"`,
    );

    // ── items ────────────────────────────────────────────────────────────
    await queryRunner.query(
      `ALTER TABLE "items" DROP COLUMN IF EXISTS "gstRate"`,
    );
  }
}
