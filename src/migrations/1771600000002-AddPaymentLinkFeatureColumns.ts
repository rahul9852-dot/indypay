import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Adds 5 new columns to payment_links introduced by the payment-link feature sprint:
 *  - note              — optional merchant note shown on payment page / PDF receipt
 *  - allowPartialPayment — enables advance + balance payment flows (B2B use case)
 *  - minimumPartialAmount — minimum accepted partial amount when partial is allowed
 *  - paidAt            — timestamp set when a successful payment is linked back
 *  - viewCount         — analytics counter incremented each time a customer opens the link
 *
 * All columns use IF NOT EXISTS / IF EXISTS guards so the migration is safe to
 * re-run on environments that may already have some columns applied manually.
 */
export class AddPaymentLinkFeatureColumns1771600000002
  implements MigrationInterface
{
  name = "AddPaymentLinkFeatureColumns1771600000002";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payment_links" ADD COLUMN IF NOT EXISTS "note" text`,
    );

    await queryRunner.query(
      `ALTER TABLE "payment_links" ADD COLUMN IF NOT EXISTS "allowPartialPayment" boolean NOT NULL DEFAULT false`,
    );

    await queryRunner.query(
      `ALTER TABLE "payment_links" ADD COLUMN IF NOT EXISTS "minimumPartialAmount" numeric(10,2)`,
    );

    await queryRunner.query(
      `ALTER TABLE "payment_links" ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP WITH TIME ZONE`,
    );

    await queryRunner.query(
      `ALTER TABLE "payment_links" ADD COLUMN IF NOT EXISTS "viewCount" integer NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payment_links" DROP COLUMN IF EXISTS "viewCount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_links" DROP COLUMN IF EXISTS "paidAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_links" DROP COLUMN IF EXISTS "minimumPartialAmount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_links" DROP COLUMN IF EXISTS "allowPartialPayment"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_links" DROP COLUMN IF EXISTS "note"`,
    );
  }
}
