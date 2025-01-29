import { Controller, Post, Get, Body, Param, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { InvoiceCustomerService } from "./invoice.service";
import { CreateInvoiceDto } from "./dto/create-invoice.dto";
import { Role } from "@/decorators/role.decorator";
import { USERS_ROLE } from "@/enums";
import { User } from "@/decorators/user.decorator";
import { UsersEntity } from "@/entities/user.entity";
import { PaginationWithDateDto } from "@/dtos/common.dto";

@Controller("invoices")
@ApiTags("Invoices")
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceCustomerService) {}

  @ApiOperation({ summary: "Create invoice (Merchant Only)" })
  @Role(USERS_ROLE.MERCHANT)
  @Post("/draft")
  async saveToDraftInvoiceForMerchant(
    @Body() createInvoiceDto: CreateInvoiceDto,
    @User() user: UsersEntity,
  ) {
    return this.invoiceService.saveToDraftInvoice(createInvoiceDto, user);
  }

  @ApiOperation({ summary: "Get single invoice" })
  @Role(USERS_ROLE.MERCHANT, USERS_ROLE.ADMIN, USERS_ROLE.OWNER)
  @Get(":invoiceId")
  async getSingleInvoiceForMerchant(@Param("invoiceId") invoiceId: string) {
    return this.invoiceService.getInvoiceById(invoiceId);
  }

  @ApiOperation({ summary: "Get all invoices" })
  @Role(USERS_ROLE.MERCHANT, USERS_ROLE.ADMIN, USERS_ROLE.OWNER)
  @Get()
  async getInvoicesOfMerchant(
    @Query() paginationWithDateDto: PaginationWithDateDto,
    @User() user: UsersEntity,
  ) {
    return this.invoiceService.getInvoicesOfMerchant(
      user.id,
      paginationWithDateDto,
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

  @ApiOperation({ summary: "Finalize and send invoice (Merchant Only)" })
  @Role(USERS_ROLE.MERCHANT)
  @Post("/finalize")
  async finalizeAndSendInvoiceForMerchant(
    @Body() createInvoiceDto: CreateInvoiceDto,
    @User() user: UsersEntity,
  ) {
    return this.invoiceService.processInvoice(createInvoiceDto, user);
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
}
