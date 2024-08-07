import { Body, Controller, Post, Res } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Response } from "express";

import { UsersService } from "./users.service";
import { UpdateBusinessDetailsDto } from "./users.dto";

@ApiTags("Manage Users - Self")
@Controller("users")
export class UsersSelfController {
  constructor(private readonly _usersService: UsersService) {}

  @ApiOperation({ summary: "Update Business Details" })
  @Post("business-details")
  async updateBusinessDetails(
    @Body() updateBusinessDetailsDto: UpdateBusinessDetailsDto,
    @Res() response: Response,
  ) {
    return this._usersService.updateBusinessDetails(
      updateBusinessDetailsDto,
      response,
    );
  }
}
