import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsDateString,
  IsNotEmpty,
  MaxLength,
  Min,
  ValidateNested,
  IsObject,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { UmsTenantType } from "@/entities/ums-tenant.entity";
import { UmsGrantType } from "@/entities/ums-role-permission.entity";

// ─────────────────────────────────────────────
// Role DTOs
// ─────────────────────────────────────────────

export class AssignRoleDto {
  @ApiProperty({ description: "Target user ID" })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: "Role code to assign e.g. L4_CUSTOMER_SUPPORT" })
  @IsString()
  @IsNotEmpty()
  roleCode: string;

  @ApiPropertyOptional({ description: "Tenant scope; null = platform-wide" })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiPropertyOptional({ description: "ISO datetime when the role expires" })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({
    description: "ID of the user performing the assignment",
  })
  @IsOptional()
  @IsString()
  assignedById?: string;
}

export class RevokeRoleDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  roleCode: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tenantId?: string;
}

// ─────────────────────────────────────────────
// Permission DTOs
// ─────────────────────────────────────────────

export class UpdateRolePermissionDto {
  @ApiProperty({ description: "Role code to update permissions for" })
  @IsString()
  @IsNotEmpty()
  roleCode: string;

  @ApiProperty({ description: "Permission code e.g. kyc:approve" })
  @IsString()
  @IsNotEmpty()
  permissionCode: string;

  @ApiProperty({ enum: UmsGrantType })
  @IsEnum(UmsGrantType)
  grantType: UmsGrantType;
}

export class BulkUpdatePermissionsDto {
  @ApiProperty({ type: [UpdateRolePermissionDto] })
  @ValidateNested({ each: true })
  @Type(() => UpdateRolePermissionDto)
  permissions: UpdateRolePermissionDto[];
}

// ─────────────────────────────────────────────
// Tenant DTOs
// ─────────────────────────────────────────────

export class CreateTenantDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  code: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiProperty({ enum: UmsTenantType })
  @IsEnum(UmsTenantType)
  type: UmsTenantType;

  @ApiProperty({ description: "Owner user ID" })
  @IsString()
  @IsNotEmpty()
  ownerId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  parentTenantId?: string;

  @ApiPropertyOptional({ description: "Optional JSONB config overrides" })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  apiRateLimit?: number;
}

export class UpdateTenantDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  apiRateLimit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AddTenantMemberDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  designation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPrimaryContact?: boolean;
}

// ─────────────────────────────────────────────
// Session DTOs
// ─────────────────────────────────────────────

export class CreateSessionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: "JWT ID claim (jti)" })
  @IsString()
  @IsNotEmpty()
  jti: string;

  @ApiProperty({ description: "ISO datetime when the JWT expires" })
  @IsDateString()
  expiresAt: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deviceFingerprint?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userAgent?: string;
}

export class RevokeSessionDto {
  @ApiProperty({ description: "JWT ID (jti) to revoke" })
  @IsString()
  @IsNotEmpty()
  jti: string;

  @ApiPropertyOptional({
    description:
      "Reason: logout | admin_revoke | suspicious_activity | password_change",
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

// ─────────────────────────────────────────────
// Audit Log Query DTO
// ─────────────────────────────────────────────

export class AuditLogQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  actorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resource?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resourceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number = 50;
}

// ─────────────────────────────────────────────
// Computed Permissions Response
// ─────────────────────────────────────────────

export class UserPermissionsResponseDto {
  userId: string;
  roles: string[];
  permissions: Record<string, UmsGrantType>;
  tenantId: string | null;
  computedAt: string;
}
