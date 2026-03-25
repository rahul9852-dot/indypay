import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In, IsNull } from "typeorm";

import { UmsAuditService, AuditContext } from "./ums-audit.service";
import {
  AssignRoleDto,
  RevokeRoleDto,
  CreateTenantDto,
  UpdateTenantDto,
  AddTenantMemberDto,
  CreateSessionDto,
  RevokeSessionDto,
  UpdateRolePermissionDto,
  UserPermissionsResponseDto,
} from "./dto/ums.dto";
import { UmsRoleEntity } from "@/entities/ums-role.entity";
import { UmsPermissionEntity } from "@/entities/ums-permission.entity";
import {
  UmsRolePermissionEntity,
  UmsGrantType,
} from "@/entities/ums-role-permission.entity";
import { UmsUserRoleEntity } from "@/entities/ums-user-role.entity";
import { UmsTenantEntity, UmsTenantStatus } from "@/entities/ums-tenant.entity";
import { UmsTenantUserEntity } from "@/entities/ums-tenant-user.entity";
import { UmsSessionEntity } from "@/entities/ums-session.entity";

/** Grant precedence: higher index wins */
const GRANT_PRECEDENCE: UmsGrantType[] = [
  UmsGrantType.WITH_APPROVAL,
  UmsGrantType.PARTIAL,
  UmsGrantType.FULL,
];

@Injectable()
export class UmsService {
  constructor(
    @InjectRepository(UmsRoleEntity)
    private readonly roleRepo: Repository<UmsRoleEntity>,

    @InjectRepository(UmsPermissionEntity)
    private readonly permissionRepo: Repository<UmsPermissionEntity>,

    @InjectRepository(UmsRolePermissionEntity)
    private readonly rolePermRepo: Repository<UmsRolePermissionEntity>,

    @InjectRepository(UmsUserRoleEntity)
    private readonly userRoleRepo: Repository<UmsUserRoleEntity>,

    @InjectRepository(UmsTenantEntity)
    private readonly tenantRepo: Repository<UmsTenantEntity>,

    @InjectRepository(UmsTenantUserEntity)
    private readonly tenantUserRepo: Repository<UmsTenantUserEntity>,

    @InjectRepository(UmsSessionEntity)
    private readonly sessionRepo: Repository<UmsSessionEntity>,

    private readonly audit: UmsAuditService,
  ) {}

  // ─────────────────────────────────────────────
  // ROLES
  // ─────────────────────────────────────────────

  async getAllRoles(): Promise<UmsRoleEntity[]> {
    return this.roleRepo.find({
      where: { isActive: true },
      order: { tier: "ASC", level: "ASC" },
    });
  }

  async getRoleByCode(code: string): Promise<UmsRoleEntity> {
    const role = await this.roleRepo.findOne({ where: { code } });
    if (!role) throw new NotFoundException(`Role '${code}' not found`);

    return role;
  }

  // ─────────────────────────────────────────────
  // PERMISSIONS
  // ─────────────────────────────────────────────

  async getAllPermissions(): Promise<UmsPermissionEntity[]> {
    return this.permissionRepo.find({
      order: { resource: "ASC", action: "ASC" },
    });
  }

  async getRolePermissions(
    roleCode: string,
  ): Promise<UmsRolePermissionEntity[]> {
    const role = await this.getRoleByCode(roleCode);

    return this.rolePermRepo.find({ where: { roleId: role.id } });
  }

  async updateRolePermission(
    dto: UpdateRolePermissionDto,
    ctx: AuditContext,
  ): Promise<UmsRolePermissionEntity> {
    const role = await this.getRoleByCode(dto.roleCode);

    if (role.isSystemRole) {
      // System roles can only be updated by SUPER_ADMIN (caller must enforce via guard)
    }

    let rp = await this.rolePermRepo.findOne({
      where: { roleId: role.id, permissionCode: dto.permissionCode },
    });

    if (!rp) {
      const permission = await this.permissionRepo.findOne({
        where: { code: dto.permissionCode },
      });
      if (!permission)
        throw new NotFoundException(
          `Permission '${dto.permissionCode}' not found`,
        );

      rp = this.rolePermRepo.create({
        roleId: role.id,
        permissionCode: dto.permissionCode,
        grantType: dto.grantType,
        role,
        permission,
      });
    } else {
      rp.grantType = dto.grantType;
    }

    const saved = await this.rolePermRepo.save(rp);

    await this.audit.log(ctx, {
      action: "role.permission.update",
      resource: "role_permission",
      resourceId: saved.id,
      details: {
        roleCode: dto.roleCode,
        permissionCode: dto.permissionCode,
        grantType: dto.grantType,
      },
    });

    return saved;
  }

  // ─────────────────────────────────────────────
  // USER ROLE ASSIGNMENT
  // ─────────────────────────────────────────────

  async assignRole(
    dto: AssignRoleDto,
    ctx: AuditContext,
  ): Promise<UmsUserRoleEntity> {
    const role = await this.getRoleByCode(dto.roleCode);

    const existing = await this.userRoleRepo.findOne({
      where: {
        userId: dto.userId,
        roleId: role.id,
        tenantId: dto.tenantId ?? IsNull(),
      },
    });

    if (existing) {
      if (existing.isActive)
        throw new ConflictException(
          `User already has role '${dto.roleCode}' in this scope`,
        );
      // Re-activate a previously revoked assignment
      existing.isActive = true;
      existing.expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
      existing.assignedById = dto.assignedById ?? null;
      const saved = await this.userRoleRepo.save(existing);
      await this.audit.log(ctx, {
        action: "user.role.assign",
        resource: "user",
        resourceId: dto.userId,
        details: {
          roleCode: dto.roleCode,
          tenantId: dto.tenantId,
          reactivated: true,
        },
      });

      return saved;
    }

    const assignment = this.userRoleRepo.create({
      userId: dto.userId,
      roleId: role.id,
      tenantId: dto.tenantId ?? null,
      assignedById: dto.assignedById ?? null,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      isActive: true,
      role,
    });

    const saved = await this.userRoleRepo.save(assignment);

    await this.audit.log(ctx, {
      action: "user.role.assign",
      resource: "user",
      resourceId: dto.userId,
      details: {
        roleCode: dto.roleCode,
        tenantId: dto.tenantId ?? null,
        expiresAt: dto.expiresAt,
      },
    });

    return saved;
  }

  async revokeRole(dto: RevokeRoleDto, ctx: AuditContext): Promise<void> {
    const role = await this.getRoleByCode(dto.roleCode);

    const assignment = await this.userRoleRepo.findOne({
      where: {
        userId: dto.userId,
        roleId: role.id,
        tenantId: dto.tenantId ?? IsNull(),
        isActive: true,
      },
    });

    if (!assignment)
      throw new NotFoundException(
        `Active assignment not found for role '${dto.roleCode}'`,
      );

    assignment.isActive = false;
    await this.userRoleRepo.save(assignment);

    await this.audit.log(ctx, {
      action: "user.role.revoke",
      resource: "user",
      resourceId: dto.userId,
      details: { roleCode: dto.roleCode, tenantId: dto.tenantId ?? null },
    });
  }

  async getUserRoles(
    userId: string,
    tenantId?: string,
  ): Promise<UmsUserRoleEntity[]> {
    const where: Record<string, unknown> = { userId, isActive: true };
    if (tenantId !== undefined) where.tenantId = tenantId ?? IsNull();

    return this.userRoleRepo.find({ where, relations: ["role"] });
  }

  /**
   * Compute the effective permission set for a user.
   * Multiple roles → permissions are merged with FULL > PARTIAL > WITH_APPROVAL precedence.
   */
  async computeUserPermissions(
    userId: string,
    tenantId?: string,
  ): Promise<UserPermissionsResponseDto> {
    const userRoles = await this.getUserRoles(userId, tenantId);

    // Filter out expired assignments
    const activeRoles = userRoles.filter(
      (ur) => !ur.expiresAt || ur.expiresAt > new Date(),
    );

    if (activeRoles.length === 0) {
      return {
        userId,
        roles: [],
        permissions: {},
        tenantId: tenantId ?? null,
        computedAt: new Date().toISOString(),
      };
    }

    const roleIds = activeRoles.map((ur) => ur.roleId);
    const rolePerms = await this.rolePermRepo.find({
      where: { roleId: In(roleIds) },
    });

    // Merge: highest-precedence grant wins per permission code
    const permissionMap: Record<string, UmsGrantType> = {};
    for (const rp of rolePerms) {
      const existing = permissionMap[rp.permissionCode];
      if (
        !existing ||
        GRANT_PRECEDENCE.indexOf(rp.grantType) >
          GRANT_PRECEDENCE.indexOf(existing)
      ) {
        permissionMap[rp.permissionCode] = rp.grantType;
      }
    }

    return {
      userId,
      roles: activeRoles.map((ur) => ur.role?.code ?? ur.roleId),
      permissions: permissionMap,
      tenantId: tenantId ?? null,
      computedAt: new Date().toISOString(),
    };
  }

  // ─────────────────────────────────────────────
  // TENANTS
  // ─────────────────────────────────────────────

  async createTenant(
    dto: CreateTenantDto,
    ctx: AuditContext,
  ): Promise<UmsTenantEntity> {
    const exists = await this.tenantRepo.findOne({ where: { code: dto.code } });
    if (exists)
      throw new ConflictException(`Tenant code '${dto.code}' already exists`);

    if (dto.parentTenantId) {
      const parent = await this.tenantRepo.findOne({
        where: { id: dto.parentTenantId },
      });
      if (!parent)
        throw new NotFoundException(
          `Parent tenant '${dto.parentTenantId}' not found`,
        );
    }

    const tenant = this.tenantRepo.create({
      code: dto.code,
      name: dto.name,
      type: dto.type,
      ownerId: dto.ownerId,
      parentTenantId: dto.parentTenantId ?? null,
      config: dto.config ?? {},
      apiRateLimit: dto.apiRateLimit ?? null,
      status: UmsTenantStatus.PENDING,
    });

    const saved = await this.tenantRepo.save(tenant);

    await this.audit.log(ctx, {
      action: "tenant.create",
      resource: "tenant",
      resourceId: saved.id,
      details: { code: saved.code, type: saved.type },
    });

    return saved;
  }

  async updateTenant(
    tenantId: string,
    dto: UpdateTenantDto,
    ctx: AuditContext,
  ): Promise<UmsTenantEntity> {
    const tenant = await this.tenantRepo.findOne({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException(`Tenant '${tenantId}' not found`);

    Object.assign(tenant, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.config !== undefined && {
        config: { ...tenant.config, ...dto.config },
      }),
      ...(dto.apiRateLimit !== undefined && { apiRateLimit: dto.apiRateLimit }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    });

    const saved = await this.tenantRepo.save(tenant);

    await this.audit.log(ctx, {
      action: "tenant.update",
      resource: "tenant",
      resourceId: tenantId,
      details: dto as Record<string, unknown>,
    });

    return saved;
  }

  async getTenants(
    page = 1,
    limit = 20,
  ): Promise<{ data: UmsTenantEntity[]; total: number }> {
    const [data, total] = await this.tenantRepo.findAndCount({
      order: { createdAt: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total };
  }

  async getTenantById(tenantId: string): Promise<UmsTenantEntity> {
    const tenant = await this.tenantRepo.findOne({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException(`Tenant '${tenantId}' not found`);

    return tenant;
  }

  async addTenantMember(
    dto: AddTenantMemberDto,
    ctx: AuditContext,
  ): Promise<UmsTenantUserEntity> {
    const exists = await this.tenantUserRepo.findOne({
      where: { tenantId: dto.tenantId, userId: dto.userId },
    });
    if (exists) {
      if (exists.isActive)
        throw new ConflictException("User is already a member of this tenant");
      exists.isActive = true;
      const saved = await this.tenantUserRepo.save(exists);

      return saved;
    }

    const member = this.tenantUserRepo.create({
      tenantId: dto.tenantId,
      userId: dto.userId,
      designation: dto.designation ?? null,
      isPrimaryContact: dto.isPrimaryContact ?? false,
    });

    const saved = await this.tenantUserRepo.save(member);

    await this.audit.log(ctx, {
      action: "tenant.member.add",
      resource: "tenant",
      resourceId: dto.tenantId,
      details: { userId: dto.userId },
    });

    return saved;
  }

  async getTenantMembers(tenantId: string): Promise<UmsTenantUserEntity[]> {
    return this.tenantUserRepo.find({ where: { tenantId, isActive: true } });
  }

  // ─────────────────────────────────────────────
  // SESSIONS
  // ─────────────────────────────────────────────

  async createSession(dto: CreateSessionDto): Promise<UmsSessionEntity> {
    const existing = await this.sessionRepo.findOne({
      where: { jti: dto.jti },
    });
    if (existing) throw new ConflictException("JTI already registered");

    const session = this.sessionRepo.create({
      userId: dto.userId,
      jti: dto.jti,
      expiresAt: new Date(dto.expiresAt),
      deviceFingerprint: dto.deviceFingerprint ?? null,
      ipAddress: dto.ipAddress ?? null,
      userAgent: dto.userAgent ?? null,
    });

    return this.sessionRepo.save(session);
  }

  async isSessionValid(jti: string): Promise<boolean> {
    const session = await this.sessionRepo.findOne({ where: { jti } });
    if (!session) return false;
    if (!session.isActive) return false;
    if (session.expiresAt < new Date()) return false;

    return true;
  }

  async revokeSession(dto: RevokeSessionDto, ctx: AuditContext): Promise<void> {
    const session = await this.sessionRepo.findOne({ where: { jti: dto.jti } });
    if (!session) throw new NotFoundException("Session not found");

    session.isActive = false;
    session.revokedAt = new Date();
    session.revokedReason = dto.reason ?? "logout";
    await this.sessionRepo.save(session);

    await this.audit.log(ctx, {
      action: "session.revoke",
      resource: "session",
      resourceId: session.id,
      details: { jti: dto.jti, reason: dto.reason },
    });
  }

  async revokeAllUserSessions(
    userId: string,
    reason: string,
    ctx: AuditContext,
  ): Promise<number> {
    const sessions = await this.sessionRepo.find({
      where: { userId, isActive: true },
    });

    const now = new Date();
    for (const s of sessions) {
      s.isActive = false;
      s.revokedAt = now;
      s.revokedReason = reason;
    }

    if (sessions.length > 0) {
      await this.sessionRepo.save(sessions);
      await this.audit.log(ctx, {
        action: "session.revoke_all",
        resource: "user",
        resourceId: userId,
        details: { count: sessions.length, reason },
      });
    }

    return sessions.length;
  }

  async getUserActiveSessions(userId: string): Promise<UmsSessionEntity[]> {
    return this.sessionRepo.find({
      where: { userId, isActive: true },
      order: { createdAt: "DESC" },
    });
  }

  // ─────────────────────────────────────────────
  // PII MASKING UTILITIES
  // ─────────────────────────────────────────────

  maskEmail(email: string): string {
    const [local, domain] = email.split("@");
    if (!local || !domain) return email;
    const visible = local.slice(0, 2);

    return `${visible}***@${domain}`;
  }

  maskPhone(phone: string): string {
    if (phone.length < 6) return phone;

    return phone.slice(0, -6).replace(/./g, "*") + phone.slice(-6);
  }
}
