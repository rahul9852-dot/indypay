import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Add name column back to payment_links (nullable) for display/labeling.
 * Safe to run if column was dropped by CheckoutAndPaymentLinksMigrations.
 */
export class AddPaymentLinkName1771600000001 implements MigrationInterface {
  name = "AddPaymentLinkName1771600000001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payment_links" ADD COLUMN IF NOT EXISTS "name" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payment_links" DROP COLUMN IF EXISTS "name"`,
    );
  }
}
