import { MigrationInterface, QueryRunner } from "typeorm";

export class Wallet1731574873739 implements MigrationInterface {
    name = 'Wallet1731574873739'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "wallets" DROP COLUMN "totalPayouts"`);
        await queryRunner.query(`ALTER TABLE "wallets" DROP COLUMN "totalBalance"`);
        await queryRunner.query(`ALTER TABLE "wallets" ADD "settledAmount" numeric(15,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "wallets" ADD "unsettledAmount" numeric(15,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "payin_orders" ALTER COLUMN "commissionInPercentage" SET DEFAULT '4.5'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payin_orders" ALTER COLUMN "commissionInPercentage" SET DEFAULT 4.5`);
        await queryRunner.query(`ALTER TABLE "wallets" DROP COLUMN "unsettledAmount"`);
        await queryRunner.query(`ALTER TABLE "wallets" DROP COLUMN "settledAmount"`);
        await queryRunner.query(`ALTER TABLE "wallets" ADD "totalBalance" numeric(15,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "wallets" ADD "totalPayouts" numeric(15,2) NOT NULL DEFAULT '0'`);
    }

}
