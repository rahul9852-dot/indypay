import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InvoiceCustomerService } from "./invoice.service";
import { CustomLogger } from "@/logger";

/**
 * Runs nightly to flip SENT / VIEWED invoices that have passed
 * their due date (expiryDate) to OVERDUE status.
 */
@Injectable()
export class InvoiceOverdueScheduler {
  private readonly logger = new CustomLogger(InvoiceOverdueScheduler.name);

  constructor(private readonly invoiceService: InvoiceCustomerService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleOverdueCheck() {
    this.logger.info("Running nightly overdue invoice check...");
    try {
      await this.invoiceService.markOverdueInvoices();
      this.logger.info("Overdue invoice check completed.");
    } catch (err) {
      this.logger.error(`Overdue invoice check failed: ${err.message}`);
    }
  }
}
