import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPayoutOrdersSoftDelete1771600000008
  implements MigrationInterface
{
  name = "AddPayoutOrdersSoftDelete1771600000008";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payout_orders" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMPTZ NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payout_orders" DROP COLUMN IF EXISTS "deletedAt"`,
    );
  }
}
