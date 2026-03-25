import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { UmsController } from "./ums.controller";
import { UmsService } from "./ums.service";
import { UmsAuditService } from "./ums-audit.service";
import { UmsRoleEntity } from "@/entities/ums-role.entity";
import { UmsPermissionEntity } from "@/entities/ums-permission.entity";
import { UmsRolePermissionEntity } from "@/entities/ums-role-permission.entity";
import { UmsUserRoleEntity } from "@/entities/ums-user-role.entity";
import { UmsTenantEntity } from "@/entities/ums-tenant.entity";
import { UmsTenantUserEntity } from "@/entities/ums-tenant-user.entity";
import { UmsAuditLogEntity } from "@/entities/ums-audit-log.entity";
import { UmsSessionEntity } from "@/entities/ums-session.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UmsRoleEntity,
      UmsPermissionEntity,
      UmsRolePermissionEntity,
      UmsUserRoleEntity,
      UmsTenantEntity,
      UmsTenantUserEntity,
      UmsAuditLogEntity,
      UmsSessionEntity,
    ]),
  ],
  controllers: [UmsController],
  providers: [UmsService, UmsAuditService],
  exports: [UmsService, UmsAuditService],
})
export class UmsModule {}
