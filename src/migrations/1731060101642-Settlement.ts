import { MigrationInterface, QueryRunner } from "typeorm";

export class Settlement1731060101642 implements MigrationInterface {
  name = "Settlement1731060101642";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_74f9b62467d421dda349ce80c02"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" DROP CONSTRAINT "FK_def77ef5bcbb1493a58b991e4af"`,
    );
    await queryRunner.query(
      `CREATE TABLE "settlements" ("id" character varying NOT NULL, "amount" numeric(10,2) NOT NULL, "transferMode" character varying NOT NULL DEFAULT 'IMPS', "status" character varying NOT NULL DEFAULT 'PENDING', "transferId" character varying, "successAt" TIMESTAMP, "failureAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" character varying, CONSTRAINT "PK_5f523ce152b84e818bff9467aab" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "REL_74f9b62467d421dda349ce80c0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN "payoutBatchId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" DROP COLUMN "payoutBatchId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ALTER COLUMN "commissionInPercentage" SET DEFAULT '4.5'`,
    );
    await queryRunner.query(
      `ALTER TABLE "settlements" ADD CONSTRAINT "FK_4ff643af81bd6ae92eaaabdd2f4" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "settlements" DROP CONSTRAINT "FK_4ff643af81bd6ae92eaaabdd2f4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ALTER COLUMN "commissionInPercentage" SET DEFAULT 4.5`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ADD "payoutBatchId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD "payoutBatchId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "REL_74f9b62467d421dda349ce80c0" UNIQUE ("payoutBatchId")`,
    );
    await queryRunner.query(`DROP TABLE "settlements"`);
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ADD CONSTRAINT "FK_def77ef5bcbb1493a58b991e4af" FOREIGN KEY ("payoutBatchId") REFERENCES "payout_batches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_74f9b62467d421dda349ce80c02" FOREIGN KEY ("payoutBatchId") REFERENCES "payout_batches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
