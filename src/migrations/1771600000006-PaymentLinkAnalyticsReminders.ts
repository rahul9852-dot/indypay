import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Adds payment link analytics and reminders infrastructure:
 *
 * New tables:
 *   payment_link_events   — one row per link open/paid/abandoned event (for city breakdown, hourly chart, recent activity)
 *   payment_link_reminders — one row per reminder sent (WhatsApp/SMS history + delivery status)
 *
 * New column on payment_links:
 *   autoReminderEnabled — toggles the 24h auto-reminder for unpaid links
 */
export class PaymentLinkAnalyticsReminders1771600000006
  implements MigrationInterface
{
  name = "PaymentLinkAnalyticsReminders1771600000006";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ─── payment_link_events ────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payment_link_events" (
        "id"          varchar          NOT NULL,
        "linkId"      varchar          NOT NULL,
        "action"      varchar          NOT NULL DEFAULT 'OPENED',
        "ipAddress"   varchar(64),
        "city"        varchar(100),
        "createdAt"   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payment_link_events" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ple_linkId_createdAt"
      ON "payment_link_events" ("linkId", "createdAt")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ple_linkId"
      ON "payment_link_events" ("linkId")
    `);

    // ─── payment_link_reminders ─────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payment_link_reminders" (
        "id"          varchar          NOT NULL,
        "linkId"      varchar          NOT NULL,
        "channel"     varchar          NOT NULL,
        "recipient"   varchar(20)      NOT NULL,
        "status"      varchar          NOT NULL DEFAULT 'SENT',
        "sentAt"      TIMESTAMP WITH TIME ZONE NOT NULL,
        "createdAt"   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payment_link_reminders" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_plr_linkId_createdAt"
      ON "payment_link_reminders" ("linkId", "createdAt")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_plr_linkId"
      ON "payment_link_reminders" ("linkId")
    `);

    // ─── autoReminderEnabled on payment_links ────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE "payment_links"
      ADD COLUMN IF NOT EXISTS "autoReminderEnabled" boolean NOT NULL DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payment_links" DROP COLUMN IF EXISTS "autoReminderEnabled"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "payment_link_reminders"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payment_link_events"`);
  }
}
