import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedVersionColumn1754332826573 implements MigrationInterface {
  name = "AddedVersionColumn1754332826573";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_payin_orders_vpa"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_payin_orders_vpa_created_at"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_67724fd60d03d4aeca293a3f24"`,
    );
    await queryRunner.query(`ALTER TABLE "payin_orders" DROP COLUMN "vpa"`);
    await queryRunner.query(
      `ALTER TABLE "user_login_ips" DROP COLUMN "loginTime"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_login_ips" DROP COLUMN "vpnUsed"`,
    );
    await queryRunner.query(`ALTER TABLE "user_login_ips" DROP COLUMN "role"`);
    await queryRunner.query(
      `ALTER TABLE "user_login_ips" DROP COLUMN "deviceId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_login_ips" DROP COLUMN "browser"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_login_ips" DROP COLUMN "platform"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_login_ips" DROP COLUMN "version"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_login_ips" DROP COLUMN "device"`,
    );
    await queryRunner.query(`ALTER TABLE "user_login_ips" DROP COLUMN "city"`);
    await queryRunner.query(
      `ALTER TABLE "user_login_ips" DROP COLUMN "fullName"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallets" ADD "version" integer NOT NULL DEFAULT '0'`,
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
    await queryRunner.query(
      `CREATE INDEX "IDX_2ce90956d7010da073390b2d03" ON "user_login_ips" ("userId", "createdAt") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2ce90956d7010da073390b2d03"`,
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
    await queryRunner.query(`ALTER TABLE "wallets" DROP COLUMN "version"`);
    await queryRunner.query(
      `ALTER TABLE "user_login_ips" ADD "fullName" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_login_ips" ADD "city" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_login_ips" ADD "device" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_login_ips" ADD "version" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_login_ips" ADD "platform" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_login_ips" ADD "browser" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_login_ips" ADD "deviceId" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "user_login_ips" ADD "role" integer`);
    await queryRunner.query(
      `ALTER TABLE "user_login_ips" ADD "vpnUsed" boolean`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_login_ips" ADD "loginTime" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ADD "vpa" character varying`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_67724fd60d03d4aeca293a3f24" ON "user_login_ips" ("ipAddress", "userId", "createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_payin_orders_vpa_created_at" ON "payin_orders" ("createdAt", "vpa") WHERE (vpa IS NOT NULL)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_payin_orders_vpa" ON "payin_orders" ("vpa") WHERE (vpa IS NOT NULL)`,
    );
  }
}
