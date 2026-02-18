import { MigrationInterface, QueryRunner } from "typeorm";

export class EditIndexPayin1771435524551 implements MigrationInterface {
  name = "EditIndexPayin1771435524551";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_75dd384c175a527c9cfb6b0993"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cfc9049095f9e4c6d9fd549747"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0c95df3966a156b518e5942138"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9f0f4b6b056df2b27bc12097ce"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_56253ef17752a6d04ecee9ec9c5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "REL_56253ef17752a6d04ecee9ec9c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN "payInOrderId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD "payInOrderId" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "UQ_56253ef17752a6d04ecee9ec9c5" UNIQUE ("payInOrderId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" DROP CONSTRAINT "PK_8b3320872ed3bea4e12869d6c67"`,
    );
    await queryRunner.query(`ALTER TABLE "payin_orders" DROP COLUMN "id"`);
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ADD "id" SERIAL NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ADD CONSTRAINT "PK_8b3320872ed3bea4e12869d6c67" PRIMARY KEY ("id")`,
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
      `ALTER TABLE "payment_links" ALTER COLUMN "commissionInPercentage" SET DEFAULT '4.5'`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_56253ef17752a6d04ecee9ec9c5" FOREIGN KEY ("payInOrderId") REFERENCES "payin_orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_56253ef17752a6d04ecee9ec9c5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_links" ALTER COLUMN "commissionInPercentage" SET DEFAULT 4.5`,
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
      `ALTER TABLE "payin_orders" DROP CONSTRAINT "PK_8b3320872ed3bea4e12869d6c67"`,
    );
    await queryRunner.query(`ALTER TABLE "payin_orders" DROP COLUMN "id"`);
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ADD "id" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ADD CONSTRAINT "PK_8b3320872ed3bea4e12869d6c67" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "UQ_56253ef17752a6d04ecee9ec9c5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN "payInOrderId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD "payInOrderId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "REL_56253ef17752a6d04ecee9ec9c" UNIQUE ("payInOrderId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_56253ef17752a6d04ecee9ec9c5" FOREIGN KEY ("payInOrderId") REFERENCES "payin_orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9f0f4b6b056df2b27bc12097ce" ON "payin_orders" ("createdAt", "userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0c95df3966a156b518e5942138" ON "payin_orders" ("createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cfc9049095f9e4c6d9fd549747" ON "payin_orders" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_75dd384c175a527c9cfb6b0993" ON "payin_orders" ("status") `,
    );
  }
}
