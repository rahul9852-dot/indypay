import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtService } from "@nestjs/jwt";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { UsersEntity } from "@/entities/user.entity";
import { AuthOtpEntity } from "@/entities/otp.entity";
import { BcryptService } from "@/shared/bcrypt/bcrypt.service";

@Module({
  imports: [TypeOrmModule.forFeature([UsersEntity, AuthOtpEntity])],
  providers: [AuthService, BcryptService, JwtService],
  controllers: [AuthController],
})
export class AuthModule {}
