import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVPAColumn1752056197274 implements MigrationInterface {
  name = "AddVPAColumn1752056197274";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_payin_orders_vpa_query"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_payin_orders_created_at"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_payin_orders_intent"`);
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ADD "vpa" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ALTER COLUMN "commissionInPercentage" SET DEFAULT '4.5'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "commissionInPercentagePayin" SET DEFAULT '4.5'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "commissionInPercentagePayout" SET DEFAULT '1.5'`,
    );

    // Create optimized indexes for VPA queries
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_payin_orders_vpa" 
            ON "payin_orders" ("vpa") 
            WHERE "vpa" IS NOT NULL
        `);

    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_payin_orders_vpa_created_at" 
            ON "payin_orders" ("vpa", "createdAt" DESC) 
            WHERE "vpa" IS NOT NULL
        `);

    // Create a function to extract VPA from intent (for future use)
    await queryRunner.query(`
            CREATE OR REPLACE FUNCTION extract_vpa_from_intent(intent_text TEXT)
            RETURNS TEXT AS $$
            BEGIN
                RETURN CASE 
                    WHEN intent_text LIKE '%pa=%' THEN 
                        SUBSTRING(intent_text FROM 'pa=([^&]+)')
                    ELSE NULL
                END;
            END;
            $$ LANGUAGE plpgsql;
        `);

    // Populate VPA column for recent records only (last 30 days) to avoid long migration
    await queryRunner.query(`
            UPDATE "payin_orders" 
            SET "vpa" = extract_vpa_from_intent("intent")
            WHERE "intent" IS NOT NULL 
            AND "intent" LIKE '%pa=%'
            AND "createdAt" >= NOW() - INTERVAL '30 days'
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the function
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS extract_vpa_from_intent(TEXT)`,
    );

    // Drop the new indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_payin_orders_vpa"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_payin_orders_vpa_created_at"`,
    );

    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "commissionInPercentagePayout" SET DEFAULT 1.5`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "commissionInPercentagePayin" SET DEFAULT 4.5`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ALTER COLUMN "commissionInPercentage" SET DEFAULT 4.5`,
    );
    await queryRunner.query(`ALTER TABLE "payin_orders" DROP COLUMN "vpa"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_payin_orders_intent" ON "payin_orders" ("intent") WHERE (intent IS NOT NULL)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_payin_orders_created_at" ON "payin_orders" ("createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_payin_orders_vpa_query" ON "payin_orders" ("intent", "createdAt") WHERE ((intent IS NOT NULL) AND ((intent)::text ~~ '%pa=%'::text))`,
    );
  }
}
