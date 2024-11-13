import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { BanksService } from "./banks.service";
import {
  AddBankDetailsDto,
  UpdateBankDetailsDto,
} from "./dto/add-bank-details.dto";
import { Role } from "@/decorators/role.decorator";
import { USERS_ROLE } from "@/enums";
import { User } from "@/decorators/user.decorator";
import { UsersEntity } from "@/entities/user.entity";

@ApiTags("Banks")
@Controller("banks")
export class BanksController {
  constructor(private readonly banksService: BanksService) {}

  @ApiOperation({ summary: "Add Bank Details - Merchant" })
  @Role(USERS_ROLE.MERCHANT)
  @Post()
  async addBankDetails(
    @Body() addBankDetailsDto: AddBankDetailsDto,
    @User() { id }: UsersEntity,
  ) {
    return this.banksService.addBank(id, addBankDetailsDto);
  }

  @ApiOperation({ summary: "Get All Banks - Merchant" })
  @Role(USERS_ROLE.MERCHANT)
  @Get()
  async getAllBanks(@User() { id }: UsersEntity) {
    return this.banksService.getAllBanks(id);
  }

  @ApiOperation({ summary: "Get Bank Details By Bank Id - Admin & OPS" })
  @Role(USERS_ROLE.ADMIN, USERS_ROLE.OWNER, USERS_ROLE.OPS)
  @Get("details/:bankId")
  async getBanksByBankId(@Param("bankId") bankId: string) {
    return this.banksService.getBankByBankId(bankId);
  }

  @ApiOperation({ summary: "Delete Banks By BankId - Admin" })
  @Role(USERS_ROLE.ADMIN, USERS_ROLE.OWNER)
  @Delete("manage/:bankId")
  async deleteBank(@Param("bankId") bankId: string) {
    return this.banksService.deleteBank(bankId);
  }

  @ApiOperation({ summary: "Update Banks By BankId - Admin" })
  @Role(USERS_ROLE.ADMIN, USERS_ROLE.OWNER)
  @Patch("manage/:bankId")
  async updateBank(
    @Param("bankId") bankId: string,
    @Body() updateBankDetailsDto: UpdateBankDetailsDto,
  ) {
    return this.banksService.updateBank(bankId, updateBankDetailsDto);
  }

  @ApiOperation({ summary: "Get All Banks By UserId - Admin & OPS" })
  @Role(USERS_ROLE.ADMIN, USERS_ROLE.OWNER, USERS_ROLE.OPS)
  @Get(":userId")
  async getBanksByUserId(@Param("userId") userId: string) {
    return this.banksService.getBankByUserId(userId);
  }
}
