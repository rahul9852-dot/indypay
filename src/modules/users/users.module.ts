import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersEntity } from "entities/users.entity";
import { JwtService as NestJwtService } from "@nestjs/jwt";
import { BcryptService } from "shared/bcrypt/bcrypt.service";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

@Module({
  imports: [TypeOrmModule.forFeature([UsersEntity])],
  controllers: [UsersController],
  providers: [UsersService, NestJwtService, BcryptService],
})
export class UsersModule {}
