import { DataSource } from "typeorm";
import { PayOutOrdersEntity } from "../src/entities/payout-orders.entity";
import dataSource from "../src/config/migration.config";
import { calculatePayoutOriginalAmountFromNetPayable } from "../src/utils/commissions.utils";

async function updatePayouts(dataSource: DataSource) {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // Fetch all payout records
    const payouts = await queryRunner.manager.find(PayOutOrdersEntity, {
      relations: ["user"], // Ensure User relation is fetched
    });

    for (const payout of payouts) {
      if (!payout.user) {
        console.warn(`Skipping payout ${payout.id}, user not found.`);
        continue;
      }

      const actualValue = calculatePayoutOriginalAmountFromNetPayable({
        netPayableAmount: +payout.amount,
        commissionInPercentage: +payout.user.commissionInPercentagePayout,
        gstInPercentage: +payout.user.gstInPercentagePayout,
        flatCommission: +payout.user.flatCommission,
      });

      // Update the payout with the calculated actual value
      await queryRunner.manager.update(PayOutOrdersEntity, payout.id, {
        amountBeforeDeduction: +actualValue,
      });

      console.log(
        `Updated payout ${payout.id} with actualValue ${actualValue}`,
      );
    }

    await queryRunner.commitTransaction();
  } catch (error) {
    console.error("Error updating payouts:", error);
    await queryRunner.rollbackTransaction();
  } finally {
    await queryRunner.release();
  }
}

// Execute the script

dataSource.initialize().then(() => {
  updatePayouts(dataSource);
});
