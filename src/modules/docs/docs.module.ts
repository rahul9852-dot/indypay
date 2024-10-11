import { TypeOrmModule } from "@nestjs/typeorm";
import { Module } from "@nestjs/common";
import { DocsController } from "./docs.controller";
import { UserApiKeysEntity } from "@/entities/user-api-key.entity";
import { UserWhitelistIpsEntity } from "@/entities/user-whitelist-ip.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([UserApiKeysEntity, UserWhitelistIpsEntity]),
  ],
  controllers: [DocsController],
})
export class DocsModule {}
