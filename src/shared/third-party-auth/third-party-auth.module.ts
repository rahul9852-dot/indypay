import { Module } from "@nestjs/common";
import { CacheModule } from "@nestjs/cache-manager";
import { ThirdPartyAuthService } from "./third-party-auth.service";

@Module({
  imports: [
    CacheModule.register({
      ttl: 3600000,
      max: 100,
    }),
  ],
  providers: [ThirdPartyAuthService],
  exports: [ThirdPartyAuthService],
})
export class ThirdPartyAuthModule {}
