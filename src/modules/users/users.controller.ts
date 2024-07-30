import { Controller, Get, Param } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { UsersEntity } from "entities/users.entity";
import { UsersService } from "./users.service";

@ApiTags("Users")
@Controller("users")
export class UsersController {
  constructor(private readonly _usersService: UsersService) {}

  @ApiOperation({ summary: "Get all users" })
  @ApiOkResponse({ type: [UsersEntity] })
  @Get()
  async findUsers() {
    return await this._usersService.findUsers();
  }

  @Get(":userId")
  async findUserById(@Param("userId") userId: number) {
    return await this._usersService.findUserById(userId);
  }
}
