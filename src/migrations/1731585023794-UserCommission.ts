import { MigrationInterface, QueryRunner } from "typeorm";

export class UserCommission1731585023794 implements MigrationInterface {
    name = 'UserCommission1731585023794'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "commissionInPercentagePayin" numeric(10,2) NOT NULL DEFAULT '4.5'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "commissionInPercentagePayout" numeric(10,2) NOT NULL DEFAULT '1.5'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "gstInPercentagePayin" numeric(10,2) NOT NULL DEFAULT '18'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "gstInPercentagePayout" numeric(10,2) NOT NULL DEFAULT '18'`);
        await queryRunner.query(`ALTER TABLE "payin_orders" ALTER COLUMN "commissionInPercentage" SET DEFAULT '4.5'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payin_orders" ALTER COLUMN "commissionInPercentage" SET DEFAULT 4.5`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "gstInPercentagePayout"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "gstInPercentagePayin"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "commissionInPercentagePayout"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "commissionInPercentagePayin"`);
    }

}
