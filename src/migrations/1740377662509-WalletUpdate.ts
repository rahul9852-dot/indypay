import { MigrationInterface, QueryRunner } from "typeorm";

export class WalletUpdate1740377662509 implements MigrationInterface {
  name = "WalletUpdate1740377662509";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add column as nullable first
    await queryRunner.query(
      `ALTER TABLE "wallets" ADD "userId" character varying`,
    );

    // 2. Update the values using the correct walletId relationship
    await queryRunner.query(`
      UPDATE "wallets" w
      SET "userId" = u.id
      FROM "users" u
      WHERE u."walletId" = w.id
    `);

    // 3. Alter the column to be NOT NULL after data is set
    await queryRunner.query(
      `ALTER TABLE "wallets" ALTER COLUMN "userId" SET NOT NULL`,
    );

    await queryRunner.query(
      `DROP INDEX "public"."IDX_e9795ce20414e35048a4395665"`,
    );
    await queryRunner.query(`ALTER TABLE "settlements" DROP COLUMN "amount"`);
    await queryRunner.query(
      `ALTER TABLE "payout_orders" DROP COLUMN "gstAmount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payout_orders" DROP COLUMN "netPayableAmount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payout_orders" DROP COLUMN "commissionAmount"`,
    );
    await queryRunner.query(`ALTER TABLE "wallet-topup" DROP COLUMN "amount"`);
    await queryRunner.query(
      `ALTER TABLE "wallets" DROP COLUMN "collectionAfterDeduction"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallets" DROP COLUMN "payoutServiceCharge"`,
    );
    await queryRunner.query(`ALTER TABLE "wallets" DROP COLUMN "totalPayout"`);
    await queryRunner.query(`ALTER TABLE "wallets" DROP COLUMN "totalTopUp"`);
    await queryRunner.query(
      `ALTER TABLE "wallets" DROP COLUMN "serviceCharge"`,
    );
    await queryRunner.query(
      `ALTER TABLE "settlements" ADD "collectionAmount" numeric(10,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "settlements" ADD "serviceCharge" numeric(10,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "settlements" ADD "amountAfterDeduction" numeric(10,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "settlements" ADD "settlementType" character varying NOT NULL DEFAULT 'MANUAL'`,
    );
    await queryRunner.query(
      `ALTER TABLE "payout_orders" ADD "amountBeforeDeduction" numeric(10,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet-topup" ADD "collectionAmount" numeric(15,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "wallet-topup"."collectionAmount" IS 'collection amount'`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet-topup" ADD "payInCharge" numeric(15,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "wallet-topup"."payInCharge" IS 'payin charge'`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet-topup" ADD "amountAfterPayinDeduction" numeric(15,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "wallet-topup"."amountAfterPayinDeduction" IS 'amount after payin deduction'`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet-topup" ADD "payOutCharge" numeric(15,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "wallet-topup"."payOutCharge" IS 'payout charge'`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet-topup" ADD "topUpAmount" numeric(15,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "wallet-topup"."topUpAmount" IS 'amount after charges (payin + payout) deduction'`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallets" ADD CONSTRAINT "UQ_2ecdb33f23e9a6fc392025c0b97" UNIQUE ("userId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ALTER COLUMN "commissionInPercentage" SET DEFAULT '4.5'`,
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
      `CREATE INDEX "IDX_2ecdb33f23e9a6fc392025c0b9" ON "wallets" ("userId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "wallets" ADD CONSTRAINT "FK_2ecdb33f23e9a6fc392025c0b97" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "wallets" DROP CONSTRAINT "FK_2ecdb33f23e9a6fc392025c0b97"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2ecdb33f23e9a6fc392025c0b9"`,
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
      `ALTER TABLE "payin_orders" ALTER COLUMN "commissionInPercentage" SET DEFAULT 4.5`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallets" DROP CONSTRAINT "UQ_2ecdb33f23e9a6fc392025c0b97"`,
    );
    await queryRunner.query(`ALTER TABLE "wallets" DROP COLUMN "userId"`);
    await queryRunner.query(
      `COMMENT ON COLUMN "wallet-topup"."topUpAmount" IS 'amount after charges (payin + payout) deduction'`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet-topup" DROP COLUMN "topUpAmount"`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "wallet-topup"."payOutCharge" IS 'payout charge'`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet-topup" DROP COLUMN "payOutCharge"`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "wallet-topup"."amountAfterPayinDeduction" IS 'amount after payin deduction'`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet-topup" DROP COLUMN "amountAfterPayinDeduction"`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "wallet-topup"."payInCharge" IS 'payin charge'`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet-topup" DROP COLUMN "payInCharge"`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "wallet-topup"."collectionAmount" IS 'collection amount'`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet-topup" DROP COLUMN "collectionAmount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payout_orders" DROP COLUMN "amountBeforeDeduction"`,
    );
    await queryRunner.query(
      `ALTER TABLE "settlements" DROP COLUMN "settlementType"`,
    );
    await queryRunner.query(
      `ALTER TABLE "settlements" DROP COLUMN "amountAfterDeduction"`,
    );
    await queryRunner.query(
      `ALTER TABLE "settlements" DROP COLUMN "serviceCharge"`,
    );
    await queryRunner.query(
      `ALTER TABLE "settlements" DROP COLUMN "collectionAmount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallets" ADD "serviceCharge" numeric(15,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallets" ADD "totalTopUp" numeric(15,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallets" ADD "totalPayout" numeric(15,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallets" ADD "payoutServiceCharge" numeric(15,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallets" ADD "collectionAfterDeduction" numeric(15,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet-topup" ADD "amount" numeric(15,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "payout_orders" ADD "commissionAmount" numeric(10,2) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "payout_orders" ADD "netPayableAmount" numeric(10,2) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "payout_orders" ADD "gstAmount" numeric(10,2) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "settlements" ADD "amount" numeric(10,2) NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e9795ce20414e35048a4395665" ON "wallets" ("availablePayoutBalance") `,
    );
  }
}
