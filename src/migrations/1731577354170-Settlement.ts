import { MigrationInterface, QueryRunner } from "typeorm";

export class Settlement1731577354170 implements MigrationInterface {
    name = 'Settlement1731577354170'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "settlements" ADD "remarks" character varying`);
        await queryRunner.query(`ALTER TABLE "payin_orders" ALTER COLUMN "commissionInPercentage" SET DEFAULT '4.5'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payin_orders" ALTER COLUMN "commissionInPercentage" SET DEFAULT 4.5`);
        await queryRunner.query(`ALTER TABLE "settlements" DROP COLUMN "remarks"`);
    }

}
