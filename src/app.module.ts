import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { appConfig } from "config/app.config";
import { AuthModule } from "modules/auth/auth.module";
import { AppController } from "./app.controller";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: ".env",
    }),
    AuthModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
