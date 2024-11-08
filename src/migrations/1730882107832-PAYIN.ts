import { MigrationInterface, QueryRunner } from "typeorm";

export class PAYIN1730882107832 implements MigrationInterface {
    name = 'PAYIN1730882107832'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payin_orders" RENAME COLUMN "phone" TO "mobile"`);
        await queryRunner.query(`ALTER TABLE "payin_orders" ALTER COLUMN "commissionInPercentage" SET DEFAULT '4.5'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payin_orders" ALTER COLUMN "commissionInPercentage" SET DEFAULT 4.5`);
        await queryRunner.query(`ALTER TABLE "payin_orders" RENAME COLUMN "mobile" TO "phone"`);
    }

}
