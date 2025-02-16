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
    status,
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
    const normalizedStartDate = new Date(startDate);
    const normalizedEndDate = new Date(endDate);

    if (
      isNaN(normalizedStartDate.getTime()) ||
      isNaN(normalizedEndDate.getTime())
    ) {
      throw new Error("Invalid date format provided");
    }

    if (normalizedStartDate > normalizedEndDate) {
      throw new Error("Start date must be before or equal to end date");
    }
    const filename =
      `payin_orders_${userId}${status ? "_" + status : ""}_${formatDateTime(normalizedStartDate)}-${formatDateTime(normalizedEndDate)}.xlsx`
        .replaceAll(" ", "_")
        .replaceAll(/[<>:"/\\|?*]/g, "-");

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("PayIn Orders");

    worksheet.addRow([
      "ID",
      "Order ID",
      "Amount",
      "UTR",
      "Status",
      "Created At",
    ]);

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
            // order.utr,
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
    try {
      const whereClause: any = {
        user: { id: userId },
        createdAt: Between(new Date(startDate), new Date(endDate)),
      };
      if (status) {
        whereClause.status = status;
      }

      const query = {
        where: whereClause,
        relations: ["user"],
        skip,
        take: this.batchSize,
        order: { createdAt: "DESC" as const },
        select: {
          id: true,
          orderId: true,
          amount: true,
          utr: true,
          status: true,
          createdAt: true,
          user: {
            id: true,
          },
        },
      };
      const result = await this.payInOrdersRepository.find(query);

      return result;
    } catch (error) {
      throw new Error(`Failed to fetch payin orders: ${error.message}`);
    }
  }
}
