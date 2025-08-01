import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVPAQueryIndexes1750320254019 implements MigrationInterface {
  name = "AddVPAQueryIndexes1750320254019";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add composite index for VPA query performance
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_payin_orders_vpa_query" 
      ON "payin_orders" ("createdAt", "intent") 
      WHERE "intent" IS NOT NULL AND "intent" LIKE '%pa=%'
    `);

    // Add index for createdAt for better date range queries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_payin_orders_created_at" 
      ON "payin_orders" ("createdAt" DESC)
    `);

    // Add index for intent column
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_payin_orders_intent" 
      ON "payin_orders" ("intent") 
      WHERE "intent" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_payin_orders_vpa_query"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_payin_orders_created_at"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_payin_orders_intent"`);
  }
}
