import { Response } from "express";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Between, Repository } from "typeorm";
import * as ExcelJS from "exceljs"; // Import exceljs
import { PayInOrdersEntity } from "@/entities/payin-orders.entity";
import { PAYMENT_STATUS } from "@/enums/payment.enum";
import { todayEndDate, todayStartDate } from "@/utils/date.utils";
import { formatDateTime } from "@/utils/helperFunctions.utils";

@Injectable()
export class ReportsService {
  private readonly batchSize = 1000;

  constructor(
    @InjectRepository(PayInOrdersEntity)
    private readonly payInOrdersRepository: Repository<PayInOrdersEntity>,
  ) {}

  async generateXLSX({
    userId,
    status = PAYMENT_STATUS.SUCCESS,
    startDate = todayStartDate(),
    endDate = todayEndDate(),
    res,
  }: {
    userId: string;
    status?: PAYMENT_STATUS;
    startDate?: Date | string;
    endDate?: Date | string;
    res: Response;
  }): Promise<void> {
    const filename =
      `payin_orders_${userId}_${status}_${formatDateTime(new Date())}.xlsx`.replaceAll(
        " ",
        "_",
      );

    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("PayIn Orders");

    // Define the header row
    worksheet.addRow(["ID", "Order ID", "Amount", "Status", "Created At"]);

    let skip = 0;
    let hasMore = true;

    while (hasMore) {
      const batch = await this.getPayinOrdersBatch(
        userId,
        skip,
        status,
        startDate,
        endDate,
      );
      hasMore = batch.length === this.batchSize;
      skip += batch.length;

      if (batch.length > 0) {
        batch.forEach((order) => {
          worksheet.addRow([
            order.id,
            order.orderId,
            order.amount,
            order.status,
            order.createdAt,
          ]);
        });
      }
    }

    // Set response headers for Excel download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    // Write Excel to buffer and send it in response
    const buffer = await workbook.xlsx.writeBuffer();
    res.end(Buffer.from(buffer));
  }

  private async getPayinOrdersBatch(
    userId: string,
    skip: number,
    status: PAYMENT_STATUS,
    startDate: Date | string,
    endDate: Date | string,
  ): Promise<PayInOrdersEntity[]> {
    return this.payInOrdersRepository.find({
      where: {
        user: { id: userId },
        status,
        createdAt: Between(new Date(startDate), new Date(endDate)),
      },
      skip,
      take: this.batchSize,
      order: { createdAt: "DESC" },
      select: ["id", "orderId", "amount", "status", "createdAt"],
    });
  }
}
