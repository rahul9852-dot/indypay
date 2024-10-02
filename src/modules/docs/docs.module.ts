import { TypeOrmModule } from "@nestjs/typeorm";
import { Module } from "@nestjs/common";
import { DocsController } from "./docs.controller";
import { UserApiKeysEntity } from "@/entities/user-api-key.entity";

@Module({
  imports: [TypeOrmModule.forFeature([UserApiKeysEntity])],
  controllers: [DocsController],
})
export class DocsModule {}
