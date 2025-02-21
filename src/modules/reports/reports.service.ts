import { Response } from "express";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Between, FindManyOptions, Repository } from "typeorm";
import * as ExcelJS from "exceljs"; // Import exceljs
import { PayInOrdersEntity } from "@/entities/payin-orders.entity";
import { PAYMENT_STATUS } from "@/enums/payment.enum";
import { todayEndDate, todayStartDate } from "@/utils/date.utils";
import { formatDateTime } from "@/utils/helperFunctions.utils";
import { PayOutOrdersEntity } from "@/entities/payout-orders.entity";

@Injectable()
export class ReportsService {
  private readonly batchSize = 1000;

  constructor(
    @InjectRepository(PayInOrdersEntity)
    private readonly payInOrdersRepository: Repository<PayInOrdersEntity>,
    @InjectRepository(PayOutOrdersEntity)
    private readonly payOutOrdersRepository: Repository<PayOutOrdersEntity>,
  ) {}

  async generateXLSXPayin({
    userId,
    status,
    startDate = todayStartDate().toISOString(),
    endDate = todayEndDate().toISOString(),
    from = 0,
    count = 1000,
    res,
  }: {
    userId: string;
    status?: PAYMENT_STATUS;
    startDate?: string;
    endDate?: string;
    from?: number; // Skip records
    count?: number; // How many records to take
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

    // Ensure valid range parameters
    const skip = Math.max(0, from);
    const take = Math.min(count, 10000); // Set reasonable limit to prevent abuse

    const filename =
      `payin_orders_${userId}${status ? "_" + status : ""}_${formatDateTime(normalizedStartDate)}-${formatDateTime(normalizedEndDate)}_records${skip}-${skip + take}.xlsx`
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

    // Get total count for context
    const totalCount = await this.getPayinOrdersCount(
      userId,
      status,
      normalizedStartDate,
      normalizedEndDate,
    );

    // Add range info
    worksheet.addRow([
      `Records ${skip + 1} to ${Math.min(skip + take, totalCount)} of ${totalCount}`,
    ]);
    worksheet.addRow([]); // Empty row for separation

    // Get records in specified range
    const records = await this.getPayinOrdersBatch(
      userId,
      skip,
      take,
      status,
      normalizedStartDate,
      normalizedEndDate,
    );

    if (records.length > 0) {
      records.forEach((order) => {
        worksheet.addRow([
          order.id,
          order.orderId,
          order.amount,
          order.utr,
          order.status,
          formatDateTime(order.createdAt),
        ]);
      });
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
    take: number,
    status: PAYMENT_STATUS,
    startDate: Date,
    endDate: Date,
  ): Promise<PayInOrdersEntity[]> {
    try {
      const whereClause: any = {
        user: { id: userId },
        createdAt: Between(startDate, endDate),
      };
      if (status) {
        whereClause.status = status;
      }

      const query = {
        where: whereClause,
        relations: ["user"],
        skip,
        take,
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

      return await this.payInOrdersRepository.find(query);
    } catch (error) {
      throw new Error(`Failed to fetch payin orders: ${error.message}`);
    }
  }

  private async getPayinOrdersCount(
    userId: string,
    status: PAYMENT_STATUS,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    try {
      const whereClause: any = {
        user: { id: userId },
        createdAt: Between(startDate, endDate),
      };
      if (status) {
        whereClause.status = status;
      }

      return await this.payInOrdersRepository.count({
        where: whereClause,
      });
    } catch (error) {
      throw new Error(`Failed to count payin orders: ${error.message}`);
    }
  }

  async generateXLSXPayout({
    userId,
    status,
    startDate = todayStartDate().toISOString(),
    endDate = todayEndDate().toISOString(),
    from = 0,
    count = 1000,
    res,
  }: {
    userId: string;
    status?: PAYMENT_STATUS;
    startDate?: string;
    endDate?: string;
    from?: number; // Skip records
    count?: number; // How many records to take
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

    // Ensure valid range parameters
    const skip = Math.max(0, from);
    const take = Math.min(count, 10000); // Set reasonable limit to prevent abuse

    const filename =
      `payout_orders_${userId}${status ? "_" + status : ""}_${formatDateTime(normalizedStartDate)}-${formatDateTime(normalizedEndDate)}_records${skip}-${skip + take}.xlsx`
        .replaceAll(" ", "_")
        .replaceAll(/[<>:"/\\|?*]/g, "-");

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("PayOut Orders");

    worksheet.addRow([
      "ID",
      "Order ID",
      "Payout ID",
      "Amount",
      "UTR",
      "Status",
      "Created At",
    ]);

    // Get total count for context
    const totalCount = await this.getPayoutOrdersCount(
      userId,
      status,
      normalizedStartDate,
      normalizedEndDate,
    );

    // Add range info
    worksheet.addRow([
      `Records ${skip + 1} to ${Math.min(skip + take, totalCount)} of ${totalCount}`,
    ]);
    worksheet.addRow([]); // Empty row for separation

    // Get records in specified range
    const records = await this.getPayoutOrdersBatch(
      userId,
      skip,
      take,
      status,
      normalizedStartDate,
      normalizedEndDate,
    );

    if (records.length > 0) {
      records.forEach((order) => {
        worksheet.addRow([
          order.id,
          order.orderId,
          order.payoutId,
          order.amount,
          order.utr,
          order.status,
          formatDateTime(order.createdAt),
        ]);
      });
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

  private async getPayoutOrdersBatch(
    userId: string,
    skip: number,
    take: number,
    status: PAYMENT_STATUS,
    startDate: Date,
    endDate: Date,
  ): Promise<PayOutOrdersEntity[]> {
    try {
      const whereClause: any = {
        user: { id: userId },
        createdAt: Between(startDate, endDate),
      };
      if (status) {
        whereClause.status = status;
      }

      const query: FindManyOptions<PayOutOrdersEntity> = {
        where: whereClause,
        relations: ["user"],
        skip,
        take,
        order: { createdAt: "DESC" as const },
        select: {
          id: true,
          orderId: true,
          payoutId: true,
          amount: true,
          utr: true,
          status: true,
          createdAt: true,
          user: {
            id: true,
          },
        },
      };

      return await this.payOutOrdersRepository.find(query);
    } catch (error) {
      throw new Error(`Failed to fetch payout orders: ${error.message}`);
    }
  }

  private async getPayoutOrdersCount(
    userId: string,
    status: PAYMENT_STATUS,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    try {
      const whereClause: any = {
        user: { id: userId },
        createdAt: Between(startDate, endDate),
      };
      if (status) {
        whereClause.status = status;
      }

      return await this.payOutOrdersRepository.count({
        where: whereClause,
      });
    } catch (error) {
      throw new Error(`Failed to count payout orders: ${error.message}`);
    }
  }
}
