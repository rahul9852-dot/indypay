import { MigrationInterface, QueryRunner } from "typeorm";

export class PayinCommission1727425151799 implements MigrationInterface {
    name = 'PayinCommission1727425151799'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payin_orders" ADD "commissionInPercentage" numeric(10,2) NOT NULL DEFAULT '4.5'`);
        await queryRunner.query(`ALTER TABLE "payin_orders" ADD "commissionAmount" numeric(10,2) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "payin_orders" ADD "gstInPercentage" numeric(10,2) NOT NULL DEFAULT '18'`);
        await queryRunner.query(`ALTER TABLE "payin_orders" ADD "gstAmount" numeric(10,2) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "payout_orders" ALTER COLUMN "status" SET DEFAULT 'PENDING'`);
        await queryRunner.query(`ALTER TABLE "payin_orders" ALTER COLUMN "status" SET DEFAULT 'PENDING'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payin_orders" ALTER COLUMN "status" SET DEFAULT 'Pending'`);
        await queryRunner.query(`ALTER TABLE "payout_orders" ALTER COLUMN "status" SET DEFAULT 'Pending'`);
        await queryRunner.query(`ALTER TABLE "payin_orders" DROP COLUMN "gstAmount"`);
        await queryRunner.query(`ALTER TABLE "payin_orders" DROP COLUMN "gstInPercentage"`);
        await queryRunner.query(`ALTER TABLE "payin_orders" DROP COLUMN "commissionAmount"`);
        await queryRunner.query(`ALTER TABLE "payin_orders" DROP COLUMN "commissionInPercentage"`);
    }

}
