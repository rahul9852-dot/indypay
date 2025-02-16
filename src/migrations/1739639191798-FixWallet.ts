import { MigrationInterface, QueryRunner } from "typeorm";

export class FixWallet1739639191798 implements MigrationInterface {
  name = "FixWallet1739639191798";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "wallets" DROP COLUMN "settledAmount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallets" DROP COLUMN "unsettledAmount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallets" DROP COLUMN "commissionAmount"`,
    );
    await queryRunner.query(`ALTER TABLE "wallets" DROP COLUMN "gstAmount"`);
    await queryRunner.query(
      `ALTER TABLE "wallets" DROP COLUMN "netPayableAmount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallets" ADD "serviceCharge" numeric(15,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallets" ADD "collectionAfterDeduction" numeric(15,2) NOT NULL DEFAULT '0'`,
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
      `ALTER TABLE "wallets" DROP COLUMN "collectionAfterDeduction"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallets" DROP COLUMN "serviceCharge"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallets" ADD "netPayableAmount" numeric(15,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallets" ADD "gstAmount" numeric(15,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallets" ADD "commissionAmount" numeric(15,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallets" ADD "unsettledAmount" numeric(15,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallets" ADD "settledAmount" numeric(15,2) NOT NULL DEFAULT '0'`,
    );
  }
}
