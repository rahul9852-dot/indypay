import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSoftDeleteColumns1771600000009 implements MigrationInterface {
  name = "AddSoftDeleteColumns1771600000009";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMPTZ NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "settlements" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMPTZ NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMPTZ NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN IF EXISTS "deletedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "settlements" DROP COLUMN IF EXISTS "deletedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" DROP COLUMN IF EXISTS "deletedAt"`,
    );
  }
}
