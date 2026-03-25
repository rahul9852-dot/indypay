import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Delete,
  HttpCode,
  HttpStatus,
  Patch,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { InvoiceCustomerService } from "./invoice.service";
import { CreateInvoiceDto } from "./dto/create-invoice.dto";
import { Role } from "@/decorators/role.decorator";
import { USERS_ROLE } from "@/enums";
import { User } from "@/decorators/user.decorator";
import { UsersEntity } from "@/entities/user.entity";
import { PaginationInvoiceDto, PaginationWithDateDto } from "@/dtos/common.dto";
import { Public } from "@/decorators/public.decorator";

@Controller("invoices")
@ApiTags("Invoices")
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceCustomerService) {}

  @ApiOperation({ summary: "Create invoice (Merchant Only)" })
  @Role(USERS_ROLE.MERCHANT, USERS_ROLE.ADMIN, USERS_ROLE.VIEW_ONLY_ADMIN)
  @Post("/draft")
  async saveToDraftInvoiceForMerchant(
    @Body() createInvoiceDto: CreateInvoiceDto,
    @User() user: UsersEntity,
  ) {
    return this.invoiceService.saveToDraftInvoice(createInvoiceDto, user);
  }

  @ApiOperation({
    summary: "Finalize and send invoice (Merchant Only)",
    description:
      "Calculates CGST/SGST/IGST, generates a GST-compliant PDF, and emails it to the customer.",
  })
  @Role(USERS_ROLE.MERCHANT, USERS_ROLE.ADMIN, USERS_ROLE.VIEW_ONLY_ADMIN)
  @Post("/finalize")
  async finalizeAndSendInvoiceForMerchant(
    @Body() createInvoiceDto: CreateInvoiceDto,
    @User() user: UsersEntity,
  ) {
    return this.invoiceService.processInvoice(createInvoiceDto, user);
  }

  @ApiOperation({
    summary: "Mark invoice as paid",
    description:
      "Sets status to PAID and records paidAt timestamp. Only the owning merchant can call this.",
  })
  @Role(USERS_ROLE.MERCHANT, USERS_ROLE.ADMIN, USERS_ROLE.OWNER)
  @HttpCode(HttpStatus.OK)
  @Patch(":invoiceId/mark-paid")
  async markInvoicePaid(
    @Param("invoiceId") invoiceId: string,
    @User() user: UsersEntity,
  ) {
    return this.invoiceService.markPaid(invoiceId, user.id);
  }

  @ApiOperation({
    summary: "Send one-click payment reminder to customer",
    description:
      "Sends a reminder email to the customer and records reminderSentAt timestamp.",
  })
  @Role(USERS_ROLE.MERCHANT, USERS_ROLE.ADMIN, USERS_ROLE.OWNER)
  @HttpCode(HttpStatus.OK)
  @Post(":invoiceId/send-reminder")
  async sendReminder(
    @Param("invoiceId") invoiceId: string,
    @User() user: UsersEntity,
  ) {
    return this.invoiceService.sendReminder(invoiceId, user);
  }

  @ApiOperation({
    summary: "Track when a customer views the invoice",
    description:
      "Call this from the email open-tracking pixel or the customer-facing invoice page. " +
      "Sets viewedAt and upgrades status from SENT to VIEWED (idempotent).",
  })
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post(":invoiceId/viewed")
  async markInvoiceViewed(@Param("invoiceId") invoiceId: string) {
    return this.invoiceService.markViewed(invoiceId);
  }

  @ApiOperation({ summary: "Get single invoice" })
  @Role(
    USERS_ROLE.MERCHANT,
    USERS_ROLE.ADMIN,
    USERS_ROLE.OWNER,
    USERS_ROLE.VIEW_ONLY_ADMIN,
  )
  @Get(":invoiceId")
  async getSingleInvoiceForMerchant(@Param("invoiceId") invoiceId: string) {
    return this.invoiceService.getInvoiceById(invoiceId);
  }

  @ApiOperation({ summary: "Get all invoices" })
  @Role(
    USERS_ROLE.MERCHANT,
    USERS_ROLE.ADMIN,
    USERS_ROLE.OWNER,
    USERS_ROLE.VIEW_ONLY_ADMIN,
  )
  @Get()
  async getInvoicesOfMerchant(
    @Query() paginationInvoiceDto: PaginationInvoiceDto,
    @User() user: UsersEntity,
  ) {
    return this.invoiceService.getInvoicesOfMerchant(
      user.id,
      paginationInvoiceDto,
    );
  }

  @ApiOperation({ summary: "Get all invoices of a customer" })
  @Role(USERS_ROLE.MERCHANT, USERS_ROLE.ADMIN, USERS_ROLE.OWNER)
  @Get("customer/:customerId")
  async getInvoicesOfCustomer(
    @Param("customerId") customerId: string,
    @User() user: UsersEntity,
  ) {
    return this.invoiceService.getInvoicesOfCustomer(customerId, user);
  }

  @ApiOperation({ summary: "Get all invoices of a merchant - Admin" })
  @Role(USERS_ROLE.ADMIN, USERS_ROLE.OWNER)
  @Get("/admin/:merchantId")
  async getInvoicesOfMerchantAdmin(
    @Param("merchantId") merchantId: string,
    @Query() paginationWithDateDto: PaginationWithDateDto,
  ) {
    return this.invoiceService.getInvoicesOfMerchant(
      merchantId,
      paginationWithDateDto,
    );
  }

  @ApiOperation({ summary: "Delete invoice - Merchant" })
  @Role(USERS_ROLE.MERCHANT)
  @Delete(":invoiceId")
  async deleteInvoice(@Param("invoiceId") invoiceId: string) {
    return this.invoiceService.deleteInvoice(invoiceId);
  }
}
