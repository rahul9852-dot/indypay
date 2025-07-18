import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Query,
  Delete,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { ItemService } from "./item.service";
import { CreateItemDto } from "./dto/create-item.dto";
import { UsersEntity } from "@/entities/user.entity";
import { User } from "@/decorators/user.decorator";
import { PaginationWithDateDto } from "@/dtos/common.dto";
import { Role } from "@/decorators/role.decorator";
import { USERS_ROLE } from "@/enums";

@ApiTags("Items")
@Controller("items")
export class ItemController {
  constructor(private readonly itemService: ItemService) {}

  @ApiOperation({ summary: "Create item" })
  @Role(
    USERS_ROLE.MERCHANT,
    USERS_ROLE.ADMIN,
    USERS_ROLE.OWNER,
    USERS_ROLE.VIEW_ONLY_ADMIN,
  )
  @Post("create")
  async createItem(
    @Body() createItemDto: CreateItemDto,
    @User() merchant: UsersEntity,
  ) {
    return await this.itemService.createItem(createItemDto, merchant);
  }

  @ApiOperation({ summary: "Get all items for a merchant" })
  @Role(
    USERS_ROLE.MERCHANT,
    USERS_ROLE.ADMIN,
    USERS_ROLE.OWNER,
    USERS_ROLE.VIEW_ONLY_ADMIN,
  )
  @Get()
  async getItemsOfMerchant(
    @Query() paginationWithDateDto: PaginationWithDateDto,
    @User() merchant: UsersEntity,
  ) {
    return this.itemService.getAllItemsForMerchant(
      paginationWithDateDto,
      merchant,
    );
  }

  @ApiOperation({ summary: "Get item by ID" })
  @Role(
    USERS_ROLE.MERCHANT,
    USERS_ROLE.ADMIN,
    USERS_ROLE.OWNER,
    USERS_ROLE.VIEW_ONLY_ADMIN,
  )
  @Get(":itemId")
  async getItemById(
    @Param("itemId") itemId: string,
    @User() merchant: UsersEntity,
  ) {
    return this.itemService.getItemById(itemId, merchant);
  }

  @ApiOperation({ summary: "Delete item by ID" })
  @Role(USERS_ROLE.MERCHANT)
  @Delete(":itemId")
  async deleteItem(
    @Param("itemId") itemId: string,
    @User() merchant: UsersEntity,
  ) {
    return await this.itemService.deleteItem(itemId, merchant);
  }
}
