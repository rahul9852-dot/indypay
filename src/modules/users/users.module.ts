import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";
import { UsersEntity } from "@/entities/user.entity";
import { AuthService } from "@/modules/auth/auth.service";
import { AuthOtpEntity } from "@/entities/otp.entity";
import { BcryptService } from "@/shared/bcrypt/bcrypt.service";
import { UserApiKeysEntity } from "@/entities/user-api-key.entity";
import { UserBankDetailsEntity } from "@/entities/user-bank-details.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UsersEntity,
      AuthOtpEntity,
      UserApiKeysEntity,
      UserBankDetailsEntity,
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService, AuthService, BcryptService, JwtService],
})
export class UsersModule {}
