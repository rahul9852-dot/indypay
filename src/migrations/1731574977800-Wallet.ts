import { MigrationInterface, QueryRunner } from "typeorm";

export class Wallet1731574977800 implements MigrationInterface {
    name = 'Wallet1731574977800'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "settlements" ADD "settledById" character varying`);
        await queryRunner.query(`ALTER TABLE "settlements" ADD CONSTRAINT "UQ_ba40101ac8dfb96097f9d6bc0c4" UNIQUE ("settledById")`);
        await queryRunner.query(`ALTER TABLE "payin_orders" ALTER COLUMN "commissionInPercentage" SET DEFAULT '4.5'`);
        await queryRunner.query(`ALTER TABLE "settlements" ADD CONSTRAINT "FK_ba40101ac8dfb96097f9d6bc0c4" FOREIGN KEY ("settledById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "settlements" DROP CONSTRAINT "FK_ba40101ac8dfb96097f9d6bc0c4"`);
        await queryRunner.query(`ALTER TABLE "payin_orders" ALTER COLUMN "commissionInPercentage" SET DEFAULT 4.5`);
        await queryRunner.query(`ALTER TABLE "settlements" DROP CONSTRAINT "UQ_ba40101ac8dfb96097f9d6bc0c4"`);
        await queryRunner.query(`ALTER TABLE "settlements" DROP COLUMN "settledById"`);
    }

}
