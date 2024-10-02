import { MigrationInterface, QueryRunner } from "typeorm";

export class UserBankDetailsAndPayin1727598854939 implements MigrationInterface {
    name = 'UserBankDetailsAndPayin1727598854939'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payin_orders" ALTER COLUMN "commissionInPercentage" SET DEFAULT '4.5'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payin_orders" ALTER COLUMN "commissionInPercentage" SET DEFAULT 4.5`);
    }

}
