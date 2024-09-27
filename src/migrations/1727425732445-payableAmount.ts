import { MigrationInterface, QueryRunner } from "typeorm";

export class PayableAmount1727425732445 implements MigrationInterface {
    name = 'PayableAmount1727425732445'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payin_orders" ADD "netPayableAmount" numeric(10,2) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "payin_orders" ALTER COLUMN "commissionInPercentage" SET DEFAULT '4.5'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payin_orders" ALTER COLUMN "commissionInPercentage" SET DEFAULT 4.5`);
        await queryRunner.query(`ALTER TABLE "payin_orders" DROP COLUMN "netPayableAmount"`);
    }

}
