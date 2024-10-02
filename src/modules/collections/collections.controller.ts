import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Controller, Get, Param, Query } from "@nestjs/common";
import { CollectionsService } from "./collections.service";
import { User } from "@/decorators/user.decorator";
import { UsersEntity } from "@/entities/user.entity";
import { Role } from "@/decorators/role.decorator";
import { USERS_ROLE } from "@/enums";
import { PaginationDto } from "@/dtos/common.dto";

@ApiTags("Collections")
@Controller("collections")
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Role(USERS_ROLE.ADMIN, USERS_ROLE.OWNER)
  @ApiOperation({ summary: "Get all collections grouped by user - Admin" })
  @Get("admin")
  getAllCollectionsGroupByUserAdmin(@Query() paginationDto: PaginationDto) {
    return this.collectionsService.getAllCollectionsGroupByUserAdmin(
      paginationDto,
    );
  }

  @Role(USERS_ROLE.ADMIN, USERS_ROLE.OWNER)
  @ApiOperation({ summary: "Get collection by payin Id - Admin" })
  @Get("admin/payin/:payinId")
  getCollectionsByPayinIdAdmin(@Param("payinId") payinId: string) {
    return this.collectionsService.getCollectionsByPayinIdAdmin(payinId);
  }

  @Role(USERS_ROLE.ADMIN, USERS_ROLE.OWNER)
  @ApiOperation({ summary: "Get all collections by user Id - Admin" })
  @Get("admin/:userId")
  getAllCollectionsByUserIdAdmin(
    @Param("userId") userId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.collectionsService.getAllCollectionsByUserIdAdmin(
      userId,
      paginationDto,
    );
  }

  @Role(USERS_ROLE.MERCHANT)
  @ApiOperation({ summary: "Get all collections - Merchant" })
  @Get()
  async getAllCollections(
    @User() user: UsersEntity,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.collectionsService.getAllCollections(user, paginationDto);
  }

  @Role(USERS_ROLE.MERCHANT)
  @ApiOperation({ summary: "Get collection by id - Merchant" })
  @Get(":id")
  async getCollectionById(@User() user: UsersEntity, @Param("id") id: string) {
    return this.collectionsService.getCollectionById(user, id);
  }
}
