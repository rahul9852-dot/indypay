import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * The invoices_status_enum PostgreSQL type was created with only values 1, 2, 3
 * (DRAFT, SENT, FAILED). VIEWED=4, PAID=5, OVERDUE=6, CANCELLED=7 were added
 * to the TypeScript enum but the DB type was never extended.
 * This migration adds the missing values so the scheduler (OVERDUE) and
 * service (PAID, VIEWED, CANCELLED) can write those statuses to the DB.
 */
export class ExtendInvoiceStatusEnum1771600000010
  implements MigrationInterface
{
  name = "ExtendInvoiceStatusEnum1771600000010";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "invoices_status_enum" ADD VALUE IF NOT EXISTS '4'`,
    );
    await queryRunner.query(
      `ALTER TYPE "invoices_status_enum" ADD VALUE IF NOT EXISTS '5'`,
    );
    await queryRunner.query(
      `ALTER TYPE "invoices_status_enum" ADD VALUE IF NOT EXISTS '6'`,
    );
    await queryRunner.query(
      `ALTER TYPE "invoices_status_enum" ADD VALUE IF NOT EXISTS '7'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL does not support removing values from an enum type.
    // To roll back, recreate the enum with only the original 3 values
    // and cast the column — this is intentionally left as a no-op.
  }
}
