import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { WalletsService } from "./wallets.service";
import { RefundWalletDto, WalletTopUpDto } from "./dto/wallet.dto";
import { User } from "@/decorators/user.decorator";
import { UsersEntity } from "@/entities/user.entity";
import { IgnoreBusinessDetails } from "@/decorators/ignore-business-details.decorator";
import { IgnoreKyc } from "@/decorators/ignore-kyc.decorator";
import { Role } from "@/decorators/role.decorator";
import { USERS_ROLE } from "@/enums";
import { PaginationDto } from "@/dtos/common.dto";

@ApiTags("Wallets")
@IgnoreBusinessDetails()
@IgnoreKyc()
@Controller("wallets")
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get()
  @ApiOperation({ summary: "Get Wallet" })
  getWallet(@User() user: UsersEntity) {
    return this.walletsService.getWallet(user.id);
  }

  @Role(USERS_ROLE.ADMIN, USERS_ROLE.OWNER)
  @ApiOperation({ summary: "Get Wallet Txn - Admin" })
  @Get("/admin/wallet-list")
  getWalletList(@Query() paginationDto: PaginationDto) {
    return this.walletsService.getWalletList(paginationDto);
  }

  @Role(USERS_ROLE.ADMIN, USERS_ROLE.OWNER)
  @ApiOperation({ summary: "Get Wallet Txn of a user - Admin" })
  @Get("/admin/wallet-list/:userId")
  getWalletListByUserId(
    @Param("userId") userId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.walletsService.getWalletListByUserId(userId, paginationDto);
  }

  @Role(USERS_ROLE.MERCHANT)
  @ApiOperation({ summary: "Get Wallet Txn - Merchant" })
  @Get("/merchant/wallet-list")
  getWalletListByMerchant(
    @User() user: UsersEntity,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.walletsService.getWalletListByMerchant(paginationDto, user.id);
  }

  @Role(USERS_ROLE.ADMIN, USERS_ROLE.OWNER)
  @ApiOperation({ summary: "Get Wallet of a user - Admin" })
  @Get("/admin/:userId")
  async getWalletAdmin(@Param("userId") userId: string) {
    return this.walletsService.getWallet(userId);
  }

  @Get("transactions")
  @ApiOperation({ summary: "Get Wallet Txn" })
  getTransactions(
    @User() user: UsersEntity,
    @Query() paginationDto: PaginationDto,
  ) {
    if ([USERS_ROLE.ADMIN, USERS_ROLE.OWNER].includes(user.role)) {
      return this.walletsService.getTopupTransactionsAdmin(paginationDto);
    } else {
      return this.walletsService.getTopupTransactions(user.id, paginationDto);
    }
  }

  @Role(USERS_ROLE.ADMIN, USERS_ROLE.OWNER)
  @ApiOperation({ summary: "Top Up Wallet - Admin" })
  @Post("top-up")
  topUpWallet(
    @User() user: UsersEntity,
    @Body() { amount, userId: merchantUserId }: WalletTopUpDto,
  ) {
    return this.walletsService.topUpWallet(merchantUserId, user, amount);
  }

  @Role(USERS_ROLE.ADMIN, USERS_ROLE.OWNER)
  @ApiOperation({ summary: "Refund user - Admin" })
  @Post("refund")
  refundWallet(
    @User() user: UsersEntity,
    @Body() { userId: merchantUserId, amount }: RefundWalletDto,
  ) {
    return this.walletsService.refundWallet(merchantUserId, user, amount);
  }
}
