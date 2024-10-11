import { MigrationInterface, QueryRunner } from "typeorm";

export class IPWhitelist1728545671849 implements MigrationInterface {
    name = 'IPWhitelist1728545671849'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_whitelist_ips" ("id" character varying NOT NULL, "ipAddress" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" character varying, CONSTRAINT "PK_b4e56d2d9ed9232198a43e3aeca" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "payin_orders" ALTER COLUMN "commissionInPercentage" SET DEFAULT '4.5'`);
        await queryRunner.query(`ALTER TABLE "user_whitelist_ips" ADD CONSTRAINT "FK_ecd98d8bbe89545748689296c8c" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_whitelist_ips" DROP CONSTRAINT "FK_ecd98d8bbe89545748689296c8c"`);
        await queryRunner.query(`ALTER TABLE "payin_orders" ALTER COLUMN "commissionInPercentage" SET DEFAULT 4.5`);
        await queryRunner.query(`DROP TABLE "user_whitelist_ips"`);
    }

}
