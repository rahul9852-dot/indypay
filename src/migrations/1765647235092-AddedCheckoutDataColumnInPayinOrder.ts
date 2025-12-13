import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedCheckoutDataColumnInPayinOrder1765647235092
  implements MigrationInterface
{
  name = "AddedCheckoutDataColumnInPayinOrder1765647235092";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add checkoutData column to payin_orders table
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ADD "checkoutData" jsonb`,
    );

    // Add comment for documentation
    await queryRunner.query(
      `COMMENT ON COLUMN "payin_orders"."checkoutData" IS 'Stores GeoPay checkout form data including merchantId, signature, callback URL, etc.'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove checkoutData column
    await queryRunner.query(
      `ALTER TABLE "payin_orders" DROP COLUMN "checkoutData"`,
    );
  }
}
