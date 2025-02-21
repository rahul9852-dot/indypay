import { MigrationInterface, QueryRunner } from "typeorm";

export class IndexingOnTable1739920678432 implements MigrationInterface {
  name = "IndexingOnTable1739920678432";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "settlements" DROP CONSTRAINT "FK_4ff643af81bd6ae92eaaabdd2f4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "settlements" ALTER COLUMN "userId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "payout_orders" DROP CONSTRAINT "FK_43a99b6a22cbe5a0c511ff11b84"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payout_orders" ALTER COLUMN "userId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_6bb58f2b6e30cb51a6504599f41"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ALTER COLUMN "userId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" DROP CONSTRAINT "FK_cfc9049095f9e4c6d9fd549747d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ALTER COLUMN "commissionInPercentage" SET DEFAULT '4.5'`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ALTER COLUMN "userId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet-topup" DROP CONSTRAINT "FK_9458f2993aaf6c227cb1e469a6d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet-topup" ALTER COLUMN "userId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ALTER COLUMN "description" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ALTER COLUMN "totalAmount" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ALTER COLUMN "termsAndServices" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ALTER COLUMN "shippingAddress" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ALTER COLUMN "billingAddress" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ALTER COLUMN "issueDate" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ALTER COLUMN "expiryDate" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "commissionInPercentagePayin" SET DEFAULT '4.5'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "commissionInPercentagePayout" SET DEFAULT '1.5'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7f1e8f227ae44f88ceec6de2e2" ON "settlements" ("transferMode") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_86077b8251cb7c44bb836a314e" ON "settlements" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4ff643af81bd6ae92eaaabdd2f" ON "settlements" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ab1315d31161f24564c230bb4d" ON "settlements" ("createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_73f96a1cc96be8fdf20ba50d89" ON "settlements" ("userId", "createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a09428cf2a65d75d95080dd48c" ON "payout_orders" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_43a99b6a22cbe5a0c511ff11b8" ON "payout_orders" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e8451a905a66d1bf7c4668630e" ON "payout_orders" ("createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1252e2ef4b2a2983a100d6c463" ON "payout_orders" ("userId", "createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8a6ba6c3d87545dec623f6dfb4" ON "transactions" ("transactionType") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6bb58f2b6e30cb51a6504599f4" ON "transactions" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e744417ceb0b530285c08f3865" ON "transactions" ("createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b467b9b4b250c7591c883294ca" ON "transactions" ("userId", "createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_75dd384c175a527c9cfb6b0993" ON "payin_orders" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cfc9049095f9e4c6d9fd549747" ON "payin_orders" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0c95df3966a156b518e5942138" ON "payin_orders" ("createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9f0f4b6b056df2b27bc12097ce" ON "payin_orders" ("userId", "createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9458f2993aaf6c227cb1e469a6" ON "wallet-topup" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9515c0ec6e8bb32187be6f66b3" ON "wallet-topup" ("createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_663bd4d412b48848b3d14cd166" ON "wallet-topup" ("userId", "createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e9795ce20414e35048a4395665" ON "wallets" ("availablePayoutBalance") `,
    );
    await queryRunner.query(
      `ALTER TABLE "settlements" ADD CONSTRAINT "FK_4ff643af81bd6ae92eaaabdd2f4" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payout_orders" ADD CONSTRAINT "FK_43a99b6a22cbe5a0c511ff11b84" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_6bb58f2b6e30cb51a6504599f41" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ADD CONSTRAINT "FK_cfc9049095f9e4c6d9fd549747d" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet-topup" ADD CONSTRAINT "FK_9458f2993aaf6c227cb1e469a6d" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "wallet-topup" DROP CONSTRAINT "FK_9458f2993aaf6c227cb1e469a6d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" DROP CONSTRAINT "FK_cfc9049095f9e4c6d9fd549747d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_6bb58f2b6e30cb51a6504599f41"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payout_orders" DROP CONSTRAINT "FK_43a99b6a22cbe5a0c511ff11b84"`,
    );
    await queryRunner.query(
      `ALTER TABLE "settlements" DROP CONSTRAINT "FK_4ff643af81bd6ae92eaaabdd2f4"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e9795ce20414e35048a4395665"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_663bd4d412b48848b3d14cd166"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9515c0ec6e8bb32187be6f66b3"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9458f2993aaf6c227cb1e469a6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9f0f4b6b056df2b27bc12097ce"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0c95df3966a156b518e5942138"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cfc9049095f9e4c6d9fd549747"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_75dd384c175a527c9cfb6b0993"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b467b9b4b250c7591c883294ca"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e744417ceb0b530285c08f3865"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6bb58f2b6e30cb51a6504599f4"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8a6ba6c3d87545dec623f6dfb4"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1252e2ef4b2a2983a100d6c463"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e8451a905a66d1bf7c4668630e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_43a99b6a22cbe5a0c511ff11b8"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a09428cf2a65d75d95080dd48c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_73f96a1cc96be8fdf20ba50d89"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ab1315d31161f24564c230bb4d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4ff643af81bd6ae92eaaabdd2f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_86077b8251cb7c44bb836a314e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7f1e8f227ae44f88ceec6de2e2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "commissionInPercentagePayout" SET DEFAULT 1.5`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "commissionInPercentagePayin" SET DEFAULT 4.5`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ALTER COLUMN "expiryDate" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ALTER COLUMN "issueDate" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ALTER COLUMN "billingAddress" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ALTER COLUMN "shippingAddress" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ALTER COLUMN "termsAndServices" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ALTER COLUMN "totalAmount" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ALTER COLUMN "description" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet-topup" ALTER COLUMN "userId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet-topup" ADD CONSTRAINT "FK_9458f2993aaf6c227cb1e469a6d" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ALTER COLUMN "userId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ALTER COLUMN "commissionInPercentage" SET DEFAULT 4.5`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ADD CONSTRAINT "FK_cfc9049095f9e4c6d9fd549747d" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ALTER COLUMN "userId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_6bb58f2b6e30cb51a6504599f41" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payout_orders" ALTER COLUMN "userId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "payout_orders" ADD CONSTRAINT "FK_43a99b6a22cbe5a0c511ff11b84" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "settlements" ALTER COLUMN "userId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "settlements" ADD CONSTRAINT "FK_4ff643af81bd6ae92eaaabdd2f4" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
