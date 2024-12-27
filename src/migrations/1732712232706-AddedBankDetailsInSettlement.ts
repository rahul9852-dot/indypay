import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedBankDetailsInSettlement1732712232706
  implements MigrationInterface
{
  name = "AddedBankDetailsInSettlement1732712232706";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "settlements" ADD "bankDetailsId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "settlements" ADD CONSTRAINT "UQ_746ab925e9ff66a7fa95220f564" UNIQUE ("bankDetailsId")`,
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
      `ALTER TABLE "settlements" ADD CONSTRAINT "FK_746ab925e9ff66a7fa95220f564" FOREIGN KEY ("bankDetailsId") REFERENCES "user_bank_details"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "settlements" DROP CONSTRAINT "FK_746ab925e9ff66a7fa95220f564"`,
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
    await queryRunner.query(
      `ALTER TABLE "settlements" DROP CONSTRAINT "UQ_746ab925e9ff66a7fa95220f564"`,
    );
    await queryRunner.query(
      `ALTER TABLE "settlements" DROP COLUMN "bankDetailsId"`,
    );
  }
}
