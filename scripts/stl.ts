import { join } from "path";
import { createReadStream } from "fs";
import * as csvParser from "csv-parser";
import { DataSource } from "typeorm";
import { SettlementsEntity } from "../src/entities/settlements.entity";
import dataSource from "../src/config/migration.config";
import { calculateOriginalAmountFromNetPayable } from "../src/utils/commissions.utils";

async function processSettlements(filePath: string, dataSource: DataSource) {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    console.log("Reading CSV file...");

    const settlements: any[] = [];

    await new Promise((resolve, reject) => {
      createReadStream(filePath)
        .pipe(csvParser())
        .on("data", (row) => settlements.push(row))
        .on("end", resolve)
        .on("error", reject);
    });

    console.log(`Total settlements found: ${settlements.length}`);

    for (const settlement of settlements) {
      const settlementId = settlement.id;
      const amountAfterDeduction = +settlement.amount;

      // Fetch user data related to the settlement
      const settlementRecord = await queryRunner.manager.findOne(
        SettlementsEntity,
        {
          where: { id: settlementId },
          relations: ["user"], // Ensure user relation is fetched
        },
      );

      if (!settlementRecord || !settlementRecord.user) {
        console.warn(`Skipping settlement ID ${settlementId}, user not found.`);
        continue;
      }

      const user = settlementRecord.user;
      const commissionInPercentage = +user.commissionInPercentagePayin || 0;
      const gstInPercentage = +user.gstInPercentagePayin || 0;

      // Calculate collectionAmount
      const collectionAmount = calculateOriginalAmountFromNetPayable({
        netPayableAmount: amountAfterDeduction,
        commissionInPercentage,
        gstInPercentage,
      });

      // Calculate serviceCharge
      const serviceCharge = collectionAmount - amountAfterDeduction;

      // Update settlement table with calculated values
      await queryRunner.manager.update(SettlementsEntity, settlementId, {
        collectionAmount,
        serviceCharge,
        amountAfterDeduction,
      });

      console.log(
        `Updated Settlement ID ${settlementId}: CollectionAmount=${collectionAmount}, ServiceCharge=${serviceCharge}`,
      );
    }

    await queryRunner.commitTransaction();
    console.log("All settlements updated successfully!");
  } catch (error) {
    console.error("Error processing settlements:", error);
    await queryRunner.rollbackTransaction();
  } finally {
    await queryRunner.release();
  }
}

// Run the script
dataSource
  .initialize()
  .then(() => {
    const filePath = join(__dirname, "settlements.csv");
    processSettlements(filePath, dataSource);
  })
  .catch((err) => console.error("Database connection failed:", err));
