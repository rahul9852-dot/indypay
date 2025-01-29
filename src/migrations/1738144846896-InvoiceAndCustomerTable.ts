import { MigrationInterface, QueryRunner } from "typeorm";

export class InvoiceAndCustomerTable1738144846896
  implements MigrationInterface
{
  name = "InvoiceAndCustomerTable1738144846896";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."invoices_status_enum" AS ENUM('1', '2', '3')`,
    );
    await queryRunner.query(
      `CREATE TABLE "invoices" ("id" character varying NOT NULL, "invoiceNumber" character varying NOT NULL, "description" character varying NOT NULL, "totalAmount" numeric(15,2) NOT NULL DEFAULT '0', "customerNotes" character varying, "termsAndServices" text NOT NULL, "shippingAddress" character varying NOT NULL, "status" "public"."invoices_status_enum" NOT NULL DEFAULT '1', "issueDate" TIMESTAMP WITH TIME ZONE NOT NULL, "expiryDate" TIMESTAMP WITH TIME ZONE NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "merchantId" character varying, "customerId" character varying, "billingAddressId" character varying, CONSTRAINT "UQ_bf8e0f9dd4558ef209ec111782d" UNIQUE ("invoiceNumber"), CONSTRAINT "PK_668cef7c22a427fd822cc1be3ce" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "invoice_customers" ("id" character varying NOT NULL, "name" character varying NOT NULL, "email" character varying NOT NULL, "gstin" character varying, "contactNumber" character varying(15) NOT NULL, "addressLine1" character varying NOT NULL, "addressLine2" character varying, "pincode" character varying(10) NOT NULL, "city" character varying NOT NULL, "state" character varying NOT NULL, "country" character varying NOT NULL, "merchantId" character varying NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_1858f6741175fde5aad4a6f6843" UNIQUE ("email"), CONSTRAINT "UQ_7de96c28ef767f5a18092cc481f" UNIQUE ("gstin"), CONSTRAINT "UQ_b34599aeb172e950ef5bb70f9c1" UNIQUE ("contactNumber"), CONSTRAINT "PK_5534e01171c539e8b24e2bc3a4b" PRIMARY KEY ("id"))`,
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
      `ALTER TABLE "invoices" ADD CONSTRAINT "FK_064ffba3c2b1f6ba2fd098d13e6" FOREIGN KEY ("merchantId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ADD CONSTRAINT "FK_1df049f8943c6be0c1115541efb" FOREIGN KEY ("customerId") REFERENCES "invoice_customers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ADD CONSTRAINT "FK_92e8dd34c24a74f1ecc95609bca" FOREIGN KEY ("billingAddressId") REFERENCES "user_address"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice_customers" ADD CONSTRAINT "FK_36337bb9065a059891a4b4e55d6" FOREIGN KEY ("merchantId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "invoice_customers" DROP CONSTRAINT "FK_36337bb9065a059891a4b4e55d6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" DROP CONSTRAINT "FK_92e8dd34c24a74f1ecc95609bca"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" DROP CONSTRAINT "FK_1df049f8943c6be0c1115541efb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" DROP CONSTRAINT "FK_064ffba3c2b1f6ba2fd098d13e6"`,
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
    await queryRunner.query(`DROP TABLE "invoice_customers"`);
    await queryRunner.query(`DROP TABLE "invoices"`);
    await queryRunner.query(`DROP TYPE "public"."invoices_status_enum"`);
  }
}
