import { MigrationInterface, QueryRunner } from "typeorm";

export class InvoiceItem1739349288297 implements MigrationInterface {
  name = "InvoiceItem1739349288297";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "items" ("id" character varying NOT NULL, "name" character varying NOT NULL, "description" character varying, "price" numeric(10,2) NOT NULL, "merchantId" character varying NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_213736582899b3599acaade2cd1" UNIQUE ("name"), CONSTRAINT "PK_ba5885359424c15ca6b9e79bcf6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "invoice_items" ("id" character varying NOT NULL, "quantity" integer NOT NULL, "itemId" character varying, "invoiceId" character varying, CONSTRAINT "PK_53b99f9e0e2945e69de1a12b75a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ALTER COLUMN "commissionInPercentage" SET DEFAULT '4.5'`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" DROP CONSTRAINT "UQ_bf8e0f9dd4558ef209ec111782d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ALTER COLUMN "description" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ALTER COLUMN "totalAmount" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ALTER COLUMN "termsAndServices" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ALTER COLUMN "shippingAddress" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ALTER COLUMN "billingAddress" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ALTER COLUMN "issueDate" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ALTER COLUMN "expiryDate" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "commissionInPercentagePayin" SET DEFAULT '4.5'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "commissionInPercentagePayout" SET DEFAULT '1.5'`,
    );
    await queryRunner.query(
      `ALTER TABLE "items" ADD CONSTRAINT "FK_80ab6c335623412bb33e95ddff8" FOREIGN KEY ("merchantId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice_items" ADD CONSTRAINT "FK_fa3401d21f40e33ebd8b6931040" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice_items" ADD CONSTRAINT "FK_7fb6895fc8fad9f5200e91abb59" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "invoice_items" DROP CONSTRAINT "FK_7fb6895fc8fad9f5200e91abb59"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice_items" DROP CONSTRAINT "FK_fa3401d21f40e33ebd8b6931040"`,
    );
    await queryRunner.query(
      `ALTER TABLE "items" DROP CONSTRAINT "FK_80ab6c335623412bb33e95ddff8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "commissionInPercentagePayout" SET DEFAULT 1.5`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "commissionInPercentagePayin" SET DEFAULT 4.5`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ALTER COLUMN "expiryDate" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ALTER COLUMN "issueDate" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ALTER COLUMN "billingAddress" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ALTER COLUMN "shippingAddress" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ALTER COLUMN "termsAndServices" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ALTER COLUMN "totalAmount" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ALTER COLUMN "description" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ADD CONSTRAINT "UQ_bf8e0f9dd4558ef209ec111782d" UNIQUE ("invoiceNumber")`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ALTER COLUMN "commissionInPercentage" SET DEFAULT 4.5`,
    );
    await queryRunner.query(`DROP TABLE "invoice_items"`);
    await queryRunner.query(`DROP TABLE "items"`);
  }
}
