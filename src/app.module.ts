import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AppController } from "./app.controller";
import { migrationConfig } from "./config/migration.config";
import { AuthModule } from "@/modules/auth/auth.module";
import { appConfig } from "@/config/app.config";
import { dbConfig } from "@/config/db.config";
import { UsersModule } from "@/modules/users/users.module";
import { GatewayModule } from "@/modules/gateway/gateway.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: ".env",
    }),
    TypeOrmModule.forRoot(dbConfig),
    TypeOrmModule.forRoot(migrationConfig),
    AuthModule,
    UsersModule,
    GatewayModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
