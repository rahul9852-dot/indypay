import { MigrationInterface, QueryRunner } from "typeorm";

export class BankDetailsMany1731501186726 implements MigrationInterface {
    name = 'BankDetailsMany1731501186726'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_cc48328e01a0d330f35c7c43325"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "REL_cc48328e01a0d330f35c7c4332"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "bankDetailsId"`);
        await queryRunner.query(`ALTER TABLE "user_bank_details" ADD "userId" character varying`);
        await queryRunner.query(`ALTER TABLE "payin_orders" ALTER COLUMN "commissionInPercentage" SET DEFAULT '4.5'`);
        await queryRunner.query(`ALTER TABLE "user_bank_details" ADD CONSTRAINT "FK_ae92220673e2399dabfc69930b2" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_bank_details" DROP CONSTRAINT "FK_ae92220673e2399dabfc69930b2"`);
        await queryRunner.query(`ALTER TABLE "payin_orders" ALTER COLUMN "commissionInPercentage" SET DEFAULT 4.5`);
        await queryRunner.query(`ALTER TABLE "user_bank_details" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "bankDetailsId" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "REL_cc48328e01a0d330f35c7c4332" UNIQUE ("bankDetailsId")`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_cc48328e01a0d330f35c7c43325" FOREIGN KEY ("bankDetailsId") REFERENCES "user_bank_details"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
