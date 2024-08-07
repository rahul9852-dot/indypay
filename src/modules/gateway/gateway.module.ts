import { Module } from "@nestjs/common";
import { VerificationGateway } from "./verification.gateway";

@Module({
  controllers: [],
  providers: [VerificationGateway],
})
export class GatewayModule {}
