import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Response } from "express";
import { Body, Controller, Get, Param, Post, Query, Res } from "@nestjs/common";
import { TransactionsService } from "./transactions.service";
import { DownloadCsvDto } from "./download-csv.dto";
import { IgnoreKyc } from "@/decorators/ignore-kyc.decorator";
import { User } from "@/decorators/user.decorator";
import { UsersEntity } from "@/entities/user.entity";
import { IgnoreBusinessDetails } from "@/decorators/ignore-business-details.decorator";
import { Role } from "@/decorators/role.decorator";
import { USERS_ROLE } from "@/enums";
import { PaginationDto } from "@/dtos/common.dto";

@ApiTags("Transactions")
@Controller("transactions")
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @ApiOperation({ summary: "Download all Payin Transactions" })
  @Role(USERS_ROLE.MERCHANT)
  @Post("download-csv/merchant")
  @IgnoreKyc()
  @IgnoreBusinessDetails()
  async downloadCsvAllPayinTransactionsMerchant(
    @Body() downloadCsvDto: DownloadCsvDto,
    @Res() res: Response,
    @User() user: UsersEntity,
  ) {
    return await this.transactionsService.downloadCsvAllPayinTransactionsMerchant(
      user,
      downloadCsvDto,
      res,
    );
  }

  @ApiOperation({ summary: "Download all Payin Transactions - Admin" })
  @Role(USERS_ROLE.ADMIN, USERS_ROLE.OWNER)
  @Post("download-csv/admin")
  async downloadCsvAllPayinTransactionsAdmin(
    @Body() downloadCsvDto: DownloadCsvDto,
    @Res() res: Response,
  ) {
    return await this.transactionsService.downloadCsvAllPayinTransactionsAdmin(
      downloadCsvDto,
      res,
    );
  }

  @ApiOperation({ summary: "Get all merchant's transactions - Admin Only" })
  @Role(USERS_ROLE.ADMIN, USERS_ROLE.OWNER)
  @Get("admin")
  @IgnoreKyc()
  @IgnoreBusinessDetails()
  async getAllTransactionsAdmin(@Query() paginationDto: PaginationDto) {
    return await this.transactionsService.getAllTransactionsAdmin(
      paginationDto,
    );
  }

  @ApiOperation({
    summary: "Get own all transactions - Merchant Only",
  })
  @Role(USERS_ROLE.MERCHANT)
  @Get("merchant")
  @IgnoreKyc()
  @IgnoreBusinessDetails()
  async getAllTransactionMerchant(
    @User() user: UsersEntity,
    @Query() paginationDto: PaginationDto,
  ) {
    return await this.transactionsService.getAllTransactionMerchant(
      user.id,
      paginationDto,
    );
  }

  @ApiOperation({
    summary: "Get stats - Merchant Only",
  })
  @Role(USERS_ROLE.MERCHANT)
  @Get("stats")
  @IgnoreKyc()
  async getStatsForMerchant(@User() user: UsersEntity) {
    return await this.transactionsService.getStatsForMerchant(user.id);
  }

  @ApiOperation({
    summary: "Get stats of all merchants - Admin Only",
  })
  @Role(USERS_ROLE.ADMIN, USERS_ROLE.OWNER)
  @Get("stats/admin")
  @IgnoreBusinessDetails()
  @IgnoreKyc()
  async getStatsForAdmin() {
    return await this.transactionsService.getStatsForAdmin();
  }

  @ApiOperation({
    summary: "Get all transactions done by merchant - Admin Only",
  })
  @Role(USERS_ROLE.ADMIN, USERS_ROLE.OWNER)
  @Get("admin/merchant/:merchantId")
  @IgnoreKyc()
  @IgnoreBusinessDetails()
  async getAllTransactionsOfMerchant(
    @Param("merchantId") merchantId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return await this.transactionsService.getAllTransactionsOfMerchant(
      merchantId,
      paginationDto,
    );
  }

  @ApiOperation({
    summary: "Get any transaction details by transactionId - Admin Only",
  })
  @Role(USERS_ROLE.ADMIN, USERS_ROLE.OWNER)
  @Get("admin/:transactionId")
  @IgnoreKyc()
  @IgnoreBusinessDetails()
  async findTransaction(@Param("transactionId") transactionId: string) {
    return await this.transactionsService.getTransactionByIdAdmin(
      transactionId,
    );
  }

  @ApiOperation({
    summary: "Get any transaction details by transactionId - Merchant Only",
  })
  @Role(USERS_ROLE.MERCHANT)
  @Get("merchant/:transactionId")
  @IgnoreKyc()
  @IgnoreBusinessDetails()
  async getTransactionMerchant(
    @User() user: UsersEntity,
    @Param("transactionId") transactionId: string,
  ) {
    return await this.transactionsService.getTransactionMerchant(
      user.id,
      transactionId,
    );
  }
}
