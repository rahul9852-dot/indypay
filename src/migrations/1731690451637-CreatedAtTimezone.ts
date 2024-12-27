import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatedAtTimezone1731690451637 implements MigrationInterface {
  name = "CreatedAtTimezone1731690451637";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_api_keys" DROP COLUMN "createdAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_api_keys" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_api_keys" DROP COLUMN "updatedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_api_keys" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_multi_factor_auth" DROP COLUMN "createdAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_multi_factor_auth" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_multi_factor_auth" DROP COLUMN "updatedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_multi_factor_auth" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_business_details" DROP COLUMN "createdAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_business_details" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_business_details" DROP COLUMN "updatedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_business_details" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "user_kyc" DROP COLUMN "createdAt"`);
    await queryRunner.query(
      `ALTER TABLE "user_kyc" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "user_kyc" DROP COLUMN "updatedAt"`);
    await queryRunner.query(
      `ALTER TABLE "user_kyc" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_address" DROP COLUMN "createdAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_address" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_address" DROP COLUMN "updatedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_address" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "payout_orders" DROP COLUMN "successAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payout_orders" ADD "successAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "payout_orders" DROP COLUMN "failureAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payout_orders" ADD "failureAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "payout_orders" DROP COLUMN "createdAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payout_orders" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "payout_orders" DROP COLUMN "updatedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payout_orders" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN "failureAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD "failureAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN "successAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD "successAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN "createdAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN "updatedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ALTER COLUMN "commissionInPercentage" SET DEFAULT '4.5'`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" DROP COLUMN "successAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ADD "successAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" DROP COLUMN "failureAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ADD "failureAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" DROP COLUMN "createdAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" DROP COLUMN "updatedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_whitelist_ips" DROP COLUMN "createdAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_whitelist_ips" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_whitelist_ips" DROP COLUMN "updatedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_whitelist_ips" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "settlements" DROP COLUMN "successAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "settlements" ADD "successAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "settlements" DROP COLUMN "failureAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "settlements" ADD "failureAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "settlements" DROP COLUMN "createdAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "settlements" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "settlements" DROP COLUMN "updatedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "settlements" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "commissionInPercentagePayin" SET DEFAULT '4.5'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "commissionInPercentagePayout" SET DEFAULT '1.5'`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "createdAt"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "updatedAt"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "wallets" DROP COLUMN "createdAt"`);
    await queryRunner.query(
      `ALTER TABLE "wallets" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "wallets" DROP COLUMN "updatedAt"`);
    await queryRunner.query(
      `ALTER TABLE "wallets" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "auth_otp" DROP COLUMN "expiredAt"`);
    await queryRunner.query(
      `ALTER TABLE "auth_otp" ADD "expiredAt" TIMESTAMP WITH TIME ZONE NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "auth_otp" DROP COLUMN "createdAt"`);
    await queryRunner.query(
      `ALTER TABLE "auth_otp" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "auth_otp" DROP COLUMN "updatedAt"`);
    await queryRunner.query(
      `ALTER TABLE "auth_otp" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "auth_otp" DROP COLUMN "updatedAt"`);
    await queryRunner.query(
      `ALTER TABLE "auth_otp" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "auth_otp" DROP COLUMN "createdAt"`);
    await queryRunner.query(
      `ALTER TABLE "auth_otp" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "auth_otp" DROP COLUMN "expiredAt"`);
    await queryRunner.query(
      `ALTER TABLE "auth_otp" ADD "expiredAt" TIMESTAMP NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "wallets" DROP COLUMN "updatedAt"`);
    await queryRunner.query(
      `ALTER TABLE "wallets" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "wallets" DROP COLUMN "createdAt"`);
    await queryRunner.query(
      `ALTER TABLE "wallets" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "updatedAt"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "createdAt"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "commissionInPercentagePayout" SET DEFAULT 1.5`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "commissionInPercentagePayin" SET DEFAULT 4.5`,
    );
    await queryRunner.query(
      `ALTER TABLE "settlements" DROP COLUMN "updatedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "settlements" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "settlements" DROP COLUMN "createdAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "settlements" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "settlements" DROP COLUMN "failureAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "settlements" ADD "failureAt" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "settlements" DROP COLUMN "successAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "settlements" ADD "successAt" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_whitelist_ips" DROP COLUMN "updatedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_whitelist_ips" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_whitelist_ips" DROP COLUMN "createdAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_whitelist_ips" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" DROP COLUMN "updatedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" DROP COLUMN "createdAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" DROP COLUMN "failureAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ADD "failureAt" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" DROP COLUMN "successAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ADD "successAt" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "payin_orders" ALTER COLUMN "commissionInPercentage" SET DEFAULT 4.5`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN "updatedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN "createdAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN "successAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD "successAt" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN "failureAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD "failureAt" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "payout_orders" DROP COLUMN "updatedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payout_orders" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "payout_orders" DROP COLUMN "createdAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payout_orders" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "payout_orders" DROP COLUMN "failureAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payout_orders" ADD "failureAt" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "payout_orders" DROP COLUMN "successAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payout_orders" ADD "successAt" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_address" DROP COLUMN "updatedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_address" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_address" DROP COLUMN "createdAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_address" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "user_kyc" DROP COLUMN "updatedAt"`);
    await queryRunner.query(
      `ALTER TABLE "user_kyc" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "user_kyc" DROP COLUMN "createdAt"`);
    await queryRunner.query(
      `ALTER TABLE "user_kyc" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_business_details" DROP COLUMN "updatedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_business_details" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_business_details" DROP COLUMN "createdAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_business_details" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_multi_factor_auth" DROP COLUMN "updatedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_multi_factor_auth" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_multi_factor_auth" DROP COLUMN "createdAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_multi_factor_auth" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_api_keys" DROP COLUMN "updatedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_api_keys" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_api_keys" DROP COLUMN "createdAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_api_keys" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
  }
}
