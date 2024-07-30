import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { AuthGuard } from "guard/auth.guard";
import { UsersEntity } from "entities/users.entity";
import { UsersService } from "modules/users/users.service";
import { BcryptService } from "shared/bcrypt/bcrypt.service";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([UsersEntity]),
    JwtModule.register({
      global: true,
    }),
  ],
  providers: [
    AuthService,
    UsersService,
    BcryptService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
