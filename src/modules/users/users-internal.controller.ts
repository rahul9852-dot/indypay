import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { PaginationDto } from "@/dtos/common.dto";

@ApiTags("Manage Users - Internal")
@Controller("internal/users")
export class UsersInternalController {
  constructor(private readonly _usersService: UsersService) {}

  @ApiOperation({ summary: "get all users" })
  @Get()
  async getAllUsers(@Query() query: PaginationDto) {
    return this._usersService.getAll(query);
  }

  @ApiOperation({ summary: "Get user by id" })
  @Get(":userId")
  async getUserById(@Param("userId") userId: string) {
    return this._usersService.findById(userId);
  }
}
