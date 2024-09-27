import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Controller, Get, Param } from "@nestjs/common";
import { TransactionsService } from "./transactions.service";
import { IgnoreKyc } from "@/decorators/ignore-kyc.decorator";
import { User } from "@/decorators/user.decorator";
import { UsersEntity } from "@/entities/user.entity";
import { IgnoreBusinessDetails } from "@/decorators/ignore-business-details.decorator";
import { Role } from "@/decorators/role.decorator";
import { USERS_ROLE } from "@/enums";

@ApiTags("Transactions")
@Controller("transactions")
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @ApiOperation({ summary: "Get all merchant's transactions - Admin Only" })
  @Role(USERS_ROLE.ADMIN, USERS_ROLE.OWNER)
  @Get("admin")
  @IgnoreKyc()
  @IgnoreBusinessDetails()
  async getAllTransactionsAdmin() {
    return await this.transactionsService.getAllTransactionsAdmin();
  }

  @ApiOperation({
    summary: "Get own all transactions - Merchant Only",
  })
  @Role(USERS_ROLE.MERCHANT)
  @Get("merchant")
  @IgnoreKyc()
  @IgnoreBusinessDetails()
  async getAllTransactionMerchant(@User() user: UsersEntity) {
    return await this.transactionsService.getAllTransactionMerchant(user.id);
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
  async getAllTransactionsOfMerchant(@Param("merchantId") merchantId: string) {
    return await this.transactionsService.getAllTransactionsOfMerchant(
      merchantId,
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
