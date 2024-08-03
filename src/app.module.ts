import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "modules/auth/auth.module";
import { MerchantsModule } from "modules/merchants/merchants.module";
import { appConfig } from "config/app.config";
import { dbConfig } from "config/db.config";
import { AppController } from "./app.controller";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: ".env",
    }),
    TypeOrmModule.forRoot(dbConfig),
    MerchantsModule,
    AuthModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
