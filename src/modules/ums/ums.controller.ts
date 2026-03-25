import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { UmsService } from "./ums.service";
import { UmsAuditService } from "./ums-audit.service";
import {
  AssignRoleDto,
  RevokeRoleDto,
  CreateTenantDto,
  UpdateTenantDto,
  AddTenantMemberDto,
  CreateSessionDto,
  RevokeSessionDto,
  UpdateRolePermissionDto,
  BulkUpdatePermissionsDto,
  AuditLogQueryDto,
} from "./dto/ums.dto";

/** Placeholder: replace with real auth guard decorator once auth module is wired */
const buildAuditCtx = () => ({
  actorId: undefined,
  actorRole: undefined,
  tenantId: undefined,
  ipAddress: undefined,
  userAgent: undefined,
});

@ApiTags("UMS")
@Controller("ums")
export class UmsController {
  constructor(
    private readonly umsService: UmsService,
    private readonly auditService: UmsAuditService,
  ) {}

  // ─────────────────────────────────────────────
  // ROLES
  // ─────────────────────────────────────────────

  @Get("roles")
  @ApiOperation({ summary: "List all active roles" })
  getRoles() {
    return this.umsService.getAllRoles();
  }

  @Get("roles/:code")
  @ApiOperation({ summary: "Get a role by code" })
  getRole(@Param("code") code: string) {
    return this.umsService.getRoleByCode(code);
  }

  @Get("roles/:code/permissions")
  @ApiOperation({ summary: "Get permissions assigned to a role" })
  getRolePermissions(@Param("code") code: string) {
    return this.umsService.getRolePermissions(code);
  }

  @Patch("roles/permissions")
  @ApiOperation({ summary: "Update a single role-permission grant" })
  updateRolePermission(@Body() dto: UpdateRolePermissionDto) {
    return this.umsService.updateRolePermission(dto, buildAuditCtx());
  }

  @Patch("roles/permissions/bulk")
  @ApiOperation({ summary: "Bulk-update role-permission grants" })
  bulkUpdatePermissions(@Body() dto: BulkUpdatePermissionsDto) {
    return Promise.all(
      dto.permissions.map((p) =>
        this.umsService.updateRolePermission(p, buildAuditCtx()),
      ),
    );
  }

  // ─────────────────────────────────────────────
  // PERMISSIONS
  // ─────────────────────────────────────────────

  @Get("permissions")
  @ApiOperation({ summary: "List all permission codes" })
  getPermissions() {
    return this.umsService.getAllPermissions();
  }

  // ─────────────────────────────────────────────
  // USER ROLES
  // ─────────────────────────────────────────────

  @Post("users/roles/assign")
  @ApiOperation({ summary: "Assign a role to a user" })
  assignRole(@Body() dto: AssignRoleDto) {
    return this.umsService.assignRole(dto, buildAuditCtx());
  }

  @Post("users/roles/revoke")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Revoke a role from a user" })
  async revokeRole(@Body() dto: RevokeRoleDto) {
    await this.umsService.revokeRole(dto, buildAuditCtx());
  }

  @Get("users/:userId/roles")
  @ApiOperation({ summary: "Get all active roles for a user" })
  getUserRoles(
    @Param("userId") userId: string,
    @Query("tenantId") tenantId?: string,
  ) {
    return this.umsService.getUserRoles(userId, tenantId);
  }

  @Get("users/:userId/permissions")
  @ApiOperation({ summary: "Compute effective permissions for a user" })
  getUserPermissions(
    @Param("userId") userId: string,
    @Query("tenantId") tenantId?: string,
  ) {
    return this.umsService.computeUserPermissions(userId, tenantId);
  }

  // ─────────────────────────────────────────────
  // TENANTS
  // ─────────────────────────────────────────────

  @Post("tenants")
  @ApiOperation({
    summary: "Register a new tenant (Partner/Reseller/Aggregator)",
  })
  createTenant(@Body() dto: CreateTenantDto) {
    return this.umsService.createTenant(dto, buildAuditCtx());
  }

  @Get("tenants")
  @ApiOperation({ summary: "List tenants with pagination" })
  getTenants(@Query("page") page = 1, @Query("limit") limit = 20) {
    return this.umsService.getTenants(Number(page), Number(limit));
  }

  @Get("tenants/:tenantId")
  @ApiOperation({ summary: "Get a tenant by ID" })
  getTenant(@Param("tenantId") tenantId: string) {
    return this.umsService.getTenantById(tenantId);
  }

  @Patch("tenants/:tenantId")
  @ApiOperation({ summary: "Update tenant metadata or config" })
  updateTenant(
    @Param("tenantId") tenantId: string,
    @Body() dto: UpdateTenantDto,
  ) {
    return this.umsService.updateTenant(tenantId, dto, buildAuditCtx());
  }

  @Post("tenants/members")
  @ApiOperation({ summary: "Add a user to a tenant" })
  addTenantMember(@Body() dto: AddTenantMemberDto) {
    return this.umsService.addTenantMember(dto, buildAuditCtx());
  }

  @Get("tenants/:tenantId/members")
  @ApiOperation({ summary: "List all active members of a tenant" })
  getTenantMembers(@Param("tenantId") tenantId: string) {
    return this.umsService.getTenantMembers(tenantId);
  }

  // ─────────────────────────────────────────────
  // SESSIONS
  // ─────────────────────────────────────────────

  @Post("sessions")
  @ApiOperation({ summary: "Register a new JWT session" })
  createSession(@Body() dto: CreateSessionDto) {
    return this.umsService.createSession(dto);
  }

  @Get("sessions/validate/:jti")
  @ApiOperation({ summary: "Check if a JWT session is valid" })
  async validateSession(@Param("jti") jti: string) {
    const valid = await this.umsService.isSessionValid(jti);

    return { jti, valid };
  }

  @Post("sessions/revoke")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Revoke a specific JWT session by JTI" })
  async revokeSession(@Body() dto: RevokeSessionDto) {
    await this.umsService.revokeSession(dto, buildAuditCtx());
  }

  @Post("sessions/revoke-all/:userId")
  @ApiOperation({ summary: "Revoke all active sessions for a user" })
  async revokeAllSessions(
    @Param("userId") userId: string,
    @Body("reason") reason = "admin_revoke",
  ) {
    const count = await this.umsService.revokeAllUserSessions(
      userId,
      reason,
      buildAuditCtx(),
    );

    return { revoked: count };
  }

  @Get("sessions/:userId")
  @ApiOperation({ summary: "List all active sessions for a user" })
  getUserSessions(@Param("userId") userId: string) {
    return this.umsService.getUserActiveSessions(userId);
  }

  // ─────────────────────────────────────────────
  // AUDIT LOGS
  // ─────────────────────────────────────────────

  @Get("audit-logs")
  @ApiOperation({ summary: "Query the audit trail with filters" })
  async getAuditLogs(@Query() query: AuditLogQueryDto) {
    return this.auditService.query({
      actorId: query.actorId,
      tenantId: query.tenantId,
      action: query.action,
      resource: query.resource,
      resourceId: query.resourceId,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      page: query.page,
      limit: query.limit,
    });
  }
}
