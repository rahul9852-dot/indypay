import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBeneMobileNo1750320254019 implements MigrationInterface {
  name = "AddBeneMobileNo1750320254019";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "checkouts" ("id" character varying NOT NULL, "payerName" text, "payerEmail" text NOT NULL, "payerMobile" text, "payerAddress" text, "amount" numeric(10,2) NOT NULL, "clientTxnId" text NOT NULL, "status" character varying NOT NULL DEFAULT 'PENDING', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_50ff635b5d91851d87a54eeb9f7" UNIQUE ("clientTxnId"), CONSTRAINT "PK_5800730d89f4137fc18770e4d4d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e122b4131eba90a0becaa0e3b9" ON "checkouts" ("status") `,
    );
    await queryRunner.query(
      `ALTER TABLE "payout_orders" ADD "beneficiaryMobile" character varying`,
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "commissionInPercentagePayout" SET DEFAULT 1.5`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "commissionInPercentagePayin" SET DEFAULT 4.5`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ALTER COLUMN "commissionInPercentage" SET DEFAULT 4.5`,
    );
    await queryRunner.query(
      `ALTER TABLE "payout_orders" DROP COLUMN "beneficiaryMobile"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e122b4131eba90a0becaa0e3b9"`,
    );
    await queryRunner.query(`DROP TABLE "checkouts"`);
  }
}
