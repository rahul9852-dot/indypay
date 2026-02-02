import { Controller, Get, Post, Body, Query, Param } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { CustomerService } from "./customer.service";
import { CreateCustomerDto } from "./dto/create-customer.dto";
import { USERS_ROLE } from "@/enums";
import { Role } from "@/decorators/role.decorator";
import { MessageResponseDto } from "@/dtos/common.dto";
import { User } from "@/decorators/user.decorator";
import { UsersEntity } from "@/entities/user.entity";

@Controller("customers")
@ApiTags("Customers")
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @ApiOperation({ summary: "Create a new customer (Merchant Only)" })
  @Role(USERS_ROLE.MERCHANT, USERS_ROLE.ADMIN, USERS_ROLE.VIEW_ONLY_ADMIN)
  @Post()
  @ApiResponse({ type: MessageResponseDto })
  async createCustomerForMerchant(
    @Body() createCustomerDto: CreateCustomerDto,
    @User() user: UsersEntity,
  ) {
    return this.customerService.createCustomer(createCustomerDto, user);
  }

  @ApiOperation({ summary: "Get list of all customers for a merchant" })
  @ApiQuery({
    name: "search",
    required: false,
    description: "Customer name for search",
  })
  @Role(USERS_ROLE.MERCHANT, USERS_ROLE.ADMIN, USERS_ROLE.VIEW_ONLY_ADMIN)
  @Get("list")
  async getListOfCustomersForSelect(
    @User() user: UsersEntity,
    @Query("search") search?: string,
  ) {
    return this.customerService.getListOfCustomersForMerchant(user.id, search);
  }

  @ApiOperation({ summary: "Get single customer" })
  @Role(
    USERS_ROLE.MERCHANT,
    USERS_ROLE.ADMIN,
    USERS_ROLE.OWNER,
    USERS_ROLE.VIEW_ONLY_ADMIN,
  )
  @Get(":customerId")
  async getSingleCustomerForMerchant(@Param("customerId") customerId: string) {
    return this.customerService.getCustomerById(customerId);
  }
}
