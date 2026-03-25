import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Adds branding, amount config, and post-payment behaviour columns to
 * checkout_pages, and links checkout sessions back to their originating
 * checkout page + owning merchant.
 *
 * checkout_pages — new columns:
 *   primaryColor        varchar(9)       brand hex colour (default #6366F1)
 *   buttonText          varchar(50)      CTA label (default "Pay Now")
 *   minimumAmount       numeric(18,2)    min customer-entered amount
 *   collectAddress      boolean          collect delivery address flag
 *   successRedirectUrl  text             post-payment redirect on success
 *   failureRedirectUrl  text             post-payment redirect on failure
 *   successMessage      varchar(500)     custom thank-you message
 *
 * checkouts — new columns:
 *   checkoutPageId      varchar          FK to checkout_pages (nullable)
 *   userId              varchar          merchant who owns the session (nullable)
 *
 * All statements use IF NOT EXISTS / IF EXISTS so the migration is safe to
 * re-run on environments that may already have partial columns applied.
 */
export class CheckoutPageEnhancements1771600000003
  implements MigrationInterface
{
  name = "CheckoutPageEnhancements1771600000003";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── checkout_pages: branding ────────────────────────────────────────────
    await queryRunner.query(
      `ALTER TABLE "checkout_pages"
       ADD COLUMN IF NOT EXISTS "primaryColor" character varying(9) NOT NULL DEFAULT '#6366F1'`,
    );

    await queryRunner.query(
      `ALTER TABLE "checkout_pages"
       ADD COLUMN IF NOT EXISTS "buttonText" character varying(50) NOT NULL DEFAULT 'Pay Now'`,
    );

    // ── checkout_pages: amount config ───────────────────────────────────────
    await queryRunner.query(
      `ALTER TABLE "checkout_pages"
       ADD COLUMN IF NOT EXISTS "minimumAmount" numeric(18,2)`,
    );

    // ── checkout_pages: form fields ─────────────────────────────────────────
    await queryRunner.query(
      `ALTER TABLE "checkout_pages"
       ADD COLUMN IF NOT EXISTS "collectAddress" boolean NOT NULL DEFAULT false`,
    );

    // ── checkout_pages: post-payment behaviour ──────────────────────────────
    await queryRunner.query(
      `ALTER TABLE "checkout_pages"
       ADD COLUMN IF NOT EXISTS "successRedirectUrl" text`,
    );

    await queryRunner.query(
      `ALTER TABLE "checkout_pages"
       ADD COLUMN IF NOT EXISTS "failureRedirectUrl" text`,
    );

    await queryRunner.query(
      `ALTER TABLE "checkout_pages"
       ADD COLUMN IF NOT EXISTS "successMessage" character varying(500)`,
    );

    // ── checkouts: link to page + merchant ──────────────────────────────────
    await queryRunner.query(
      `ALTER TABLE "checkouts"
       ADD COLUMN IF NOT EXISTS "checkoutPageId" character varying`,
    );

    await queryRunner.query(
      `ALTER TABLE "checkouts"
       ADD COLUMN IF NOT EXISTS "userId" character varying`,
    );

    // Index for quick lookups by merchant and page
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_checkouts_checkoutPageId"
       ON "checkouts" ("checkoutPageId")`,
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_checkouts_userId"
       ON "checkouts" ("userId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_checkouts_userId"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_checkouts_checkoutPageId"`,
    );

    await queryRunner.query(
      `ALTER TABLE "checkouts" DROP COLUMN IF EXISTS "userId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "checkouts" DROP COLUMN IF EXISTS "checkoutPageId"`,
    );

    await queryRunner.query(
      `ALTER TABLE "checkout_pages" DROP COLUMN IF EXISTS "successMessage"`,
    );
    await queryRunner.query(
      `ALTER TABLE "checkout_pages" DROP COLUMN IF EXISTS "failureRedirectUrl"`,
    );
    await queryRunner.query(
      `ALTER TABLE "checkout_pages" DROP COLUMN IF EXISTS "successRedirectUrl"`,
    );
    await queryRunner.query(
      `ALTER TABLE "checkout_pages" DROP COLUMN IF EXISTS "collectAddress"`,
    );
    await queryRunner.query(
      `ALTER TABLE "checkout_pages" DROP COLUMN IF EXISTS "minimumAmount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "checkout_pages" DROP COLUMN IF EXISTS "buttonText"`,
    );
    await queryRunner.query(
      `ALTER TABLE "checkout_pages" DROP COLUMN IF EXISTS "primaryColor"`,
    );
  }
}
