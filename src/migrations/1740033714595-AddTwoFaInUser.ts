import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTwoFaInUser1740033714595 implements MigrationInterface {
  name = "AddTwoFaInUser1740033714595";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user_login_ips" ("id" character varying NOT NULL, "ipAddress" character varying NOT NULL, "isApproved" boolean NOT NULL DEFAULT false, "userId" character varying NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_431bb902311d5da0d26311e5500" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_acfc2f5e8d05ced1f7a7f620f0" ON "user_login_ips" ("ipAddress") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6073538e214bea427870f76a45" ON "user_login_ips" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2ce90956d7010da073390b2d03" ON "user_login_ips" ("userId", "createdAt") `,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "lastLoginIp" character varying(45)`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "twoFactorEnabled" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "lastLoginAt" TIMESTAMP WITH TIME ZONE`,
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
      `ALTER TABLE "user_login_ips" ADD CONSTRAINT "FK_6073538e214bea427870f76a455" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_login_ips" DROP CONSTRAINT "FK_6073538e214bea427870f76a455"`,
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
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "lastLoginAt"`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "twoFactorEnabled"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "lastLoginIp"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2ce90956d7010da073390b2d03"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6073538e214bea427870f76a45"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_acfc2f5e8d05ced1f7a7f620f0"`,
    );
    await queryRunner.query(`DROP TABLE "user_login_ips"`);
  }
}
