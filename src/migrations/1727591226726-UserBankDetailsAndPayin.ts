import { MigrationInterface, QueryRunner } from "typeorm";

export class UserBankDetailsAndPayin1727591226726 implements MigrationInterface {
    name = 'UserBankDetailsAndPayin1727591226726'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_bank_details" ("id" character varying NOT NULL, "name" character varying NOT NULL, "email" character varying NOT NULL, "mobile" character varying NOT NULL, "bankName" character varying NOT NULL, "bankIFSC" character varying NOT NULL, "accountNumber" character varying NOT NULL, CONSTRAINT "PK_6d4c4e4f554aea8154590b14d94" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "payout_batches" ("id" character varying NOT NULL, "amount" numeric(10,2) NOT NULL, "orderId" character varying NOT NULL, "transferMode" character varying NOT NULL, "industryType" character varying NOT NULL, "status" character varying NOT NULL DEFAULT 'PENDING', "transferId" character varying, "commissionInPercentage" numeric(10,2) NOT NULL, "commissionAmount" numeric(10,2) NOT NULL, "gstInPercentage" numeric(10,2) NOT NULL, "gstAmount" numeric(10,2) NOT NULL, "netPayableAmount" numeric(10,2) NOT NULL, "successAt" TIMESTAMP, "failureAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" character varying, CONSTRAINT "UQ_41907937421de47afbd263434d7" UNIQUE ("orderId"), CONSTRAINT "PK_aa57cb1e16d39cc0d41083145e4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_41907937421de47afbd263434d" ON "payout_batches" ("orderId") `);
        await queryRunner.query(`ALTER TABLE "payout_orders" DROP COLUMN "paymentUrl"`);
        await queryRunner.query(`ALTER TABLE "payout_orders" DROP COLUMN "externalPaymentId"`);
        await queryRunner.query(`ALTER TABLE "payout_orders" DROP COLUMN "currency"`);
        await queryRunner.query(`ALTER TABLE "payout_orders" ADD "orderId" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "payout_orders" ADD CONSTRAINT "UQ_169dbb6b559c7ce823af139f478" UNIQUE ("orderId")`);
        await queryRunner.query(`ALTER TABLE "payout_orders" ADD "transferMode" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "payout_orders" ADD "industryType" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "payout_orders" ADD "transferId" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "payout_orders" ADD "commissionInPercentage" numeric(10,2) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "payout_orders" ADD "commissionAmount" numeric(10,2) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "payout_orders" ADD "gstInPercentage" numeric(10,2) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "payout_orders" ADD "gstAmount" numeric(10,2) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "payout_orders" ADD "netPayableAmount" numeric(10,2) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD "payoutBatchId" character varying`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "UQ_74f9b62467d421dda349ce80c02" UNIQUE ("payoutBatchId")`);
        await queryRunner.query(`ALTER TABLE "payin_orders" ADD "settlementStatus" character varying NOT NULL DEFAULT 'NOT_INITIATED'`);
        await queryRunner.query(`ALTER TABLE "payin_orders" ADD "payoutBatchId" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "bankDetailsId" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_cc48328e01a0d330f35c7c43325" UNIQUE ("bankDetailsId")`);
        await queryRunner.query(`ALTER TABLE "payin_orders" ALTER COLUMN "commissionInPercentage" SET DEFAULT '4.5'`);
        await queryRunner.query(`CREATE INDEX "IDX_169dbb6b559c7ce823af139f47" ON "payout_orders" ("orderId") `);
        await queryRunner.query(`ALTER TABLE "payout_batches" ADD CONSTRAINT "FK_affa903702963d0959d83a181ac" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_74f9b62467d421dda349ce80c02" FOREIGN KEY ("payoutBatchId") REFERENCES "payout_batches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payin_orders" ADD CONSTRAINT "FK_def77ef5bcbb1493a58b991e4af" FOREIGN KEY ("payoutBatchId") REFERENCES "payout_batches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_cc48328e01a0d330f35c7c43325" FOREIGN KEY ("bankDetailsId") REFERENCES "user_bank_details"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_cc48328e01a0d330f35c7c43325"`);
        await queryRunner.query(`ALTER TABLE "payin_orders" DROP CONSTRAINT "FK_def77ef5bcbb1493a58b991e4af"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_74f9b62467d421dda349ce80c02"`);
        await queryRunner.query(`ALTER TABLE "payout_batches" DROP CONSTRAINT "FK_affa903702963d0959d83a181ac"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_169dbb6b559c7ce823af139f47"`);
        await queryRunner.query(`ALTER TABLE "payin_orders" ALTER COLUMN "commissionInPercentage" SET DEFAULT 4.5`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_cc48328e01a0d330f35c7c43325"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "bankDetailsId"`);
        await queryRunner.query(`ALTER TABLE "payin_orders" DROP COLUMN "payoutBatchId"`);
        await queryRunner.query(`ALTER TABLE "payin_orders" DROP COLUMN "settlementStatus"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "UQ_74f9b62467d421dda349ce80c02"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "payoutBatchId"`);
        await queryRunner.query(`ALTER TABLE "payout_orders" DROP COLUMN "netPayableAmount"`);
        await queryRunner.query(`ALTER TABLE "payout_orders" DROP COLUMN "gstAmount"`);
        await queryRunner.query(`ALTER TABLE "payout_orders" DROP COLUMN "gstInPercentage"`);
        await queryRunner.query(`ALTER TABLE "payout_orders" DROP COLUMN "commissionAmount"`);
        await queryRunner.query(`ALTER TABLE "payout_orders" DROP COLUMN "commissionInPercentage"`);
        await queryRunner.query(`ALTER TABLE "payout_orders" DROP COLUMN "transferId"`);
        await queryRunner.query(`ALTER TABLE "payout_orders" DROP COLUMN "industryType"`);
        await queryRunner.query(`ALTER TABLE "payout_orders" DROP COLUMN "transferMode"`);
        await queryRunner.query(`ALTER TABLE "payout_orders" DROP CONSTRAINT "UQ_169dbb6b559c7ce823af139f478"`);
        await queryRunner.query(`ALTER TABLE "payout_orders" DROP COLUMN "orderId"`);
        await queryRunner.query(`ALTER TABLE "payout_orders" ADD "currency" character varying NOT NULL DEFAULT 'INR'`);
        await queryRunner.query(`ALTER TABLE "payout_orders" ADD "externalPaymentId" character varying`);
        await queryRunner.query(`ALTER TABLE "payout_orders" ADD "paymentUrl" character varying`);
        await queryRunner.query(`DROP INDEX "public"."IDX_41907937421de47afbd263434d"`);
        await queryRunner.query(`DROP TABLE "payout_batches"`);
        await queryRunner.query(`DROP TABLE "user_bank_details"`);
    }

}
