import { MigrationInterface, QueryRunner } from "typeorm";

export class WalletTopup1737364960201 implements MigrationInterface {
  name = "WalletTopup1737364960201";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "wallet-topup" ("id" character varying NOT NULL, "amount" numeric(15,2) NOT NULL DEFAULT '0', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "userId" character varying, "topupById" character varying, CONSTRAINT "PK_a2f37a942a5c499b756f656f3dc" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ALTER COLUMN "commissionInPercentage" SET DEFAULT '4.5'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "commissionInPercentagePayin" SET DEFAULT '4.5'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "commissionInPercentagePayout" SET DEFAULT '1.5'`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet-topup" ADD CONSTRAINT "FK_9458f2993aaf6c227cb1e469a6d" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet-topup" ADD CONSTRAINT "FK_ed9cb2100030a24596577712fb4" FOREIGN KEY ("topupById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "wallet-topup" DROP CONSTRAINT "FK_ed9cb2100030a24596577712fb4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet-topup" DROP CONSTRAINT "FK_9458f2993aaf6c227cb1e469a6d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "commissionInPercentagePayout" SET DEFAULT 1.5`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "commissionInPercentagePayin" SET DEFAULT 4.5`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ALTER COLUMN "commissionInPercentage" SET DEFAULT 4.5`,
    );
    await queryRunner.query(`DROP TABLE "wallet-topup"`);
  }
}
