import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  UmsAuditLogEntity,
  UmsAuditStatus,
} from "@/entities/ums-audit-log.entity";

export interface AuditContext {
  actorId?: string;
  actorRole?: string;
  tenantId?: string;
  ipAddress?: string;
  deviceFingerprint?: string;
  userAgent?: string;
}

export interface AuditPayload {
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  status?: UmsAuditStatus;
}

/**
 * Append-only audit writer.
 * Never exposes update or delete.  All callers must go through this service.
 *
 * Usage:
 *   await this.audit.log(ctx, {
 *     action: 'user.role.assign',
 *     resource: 'user',
 *     resourceId: userId,
 *     details: { roleCode, tenantId },
 *   });
 */
@Injectable()
export class UmsAuditService {
  constructor(
    @InjectRepository(UmsAuditLogEntity)
    private readonly auditRepo: Repository<UmsAuditLogEntity>,
  ) {}

  async log(ctx: AuditContext, payload: AuditPayload): Promise<void> {
    const entry = this.auditRepo.create({
      actorId: ctx.actorId ?? null,
      actorRole: ctx.actorRole ?? null,
      tenantId: ctx.tenantId ?? null,
      ipAddress: ctx.ipAddress ?? null,
      deviceFingerprint: ctx.deviceFingerprint ?? null,
      userAgent: ctx.userAgent ?? null,
      action: payload.action,
      resource: payload.resource,
      resourceId: payload.resourceId ?? null,
      details: payload.details ?? {},
      status: payload.status ?? UmsAuditStatus.SUCCESS,
    });
    await this.auditRepo.save(entry);
  }

  /** Convenience wrapper for failed / blocked events */
  async logFailure(
    ctx: AuditContext,
    payload: AuditPayload,
    status: UmsAuditStatus.FAILURE | UmsAuditStatus.BLOCKED,
  ): Promise<void> {
    return this.log(ctx, { ...payload, status });
  }

  async query(filters: {
    actorId?: string;
    tenantId?: string;
    action?: string;
    resource?: string;
    resourceId?: string;
    from?: Date;
    to?: Date;
    page?: number;
    limit?: number;
  }): Promise<{ data: UmsAuditLogEntity[]; total: number }> {
    const { page = 1, limit = 50, from, to, ...rest } = filters;

    const qb = this.auditRepo
      .createQueryBuilder("log")
      .orderBy("log.createdAt", "DESC")
      .skip((page - 1) * limit)
      .take(limit);

    if (rest.actorId)
      qb.andWhere("log.actorId = :actorId", { actorId: rest.actorId });
    if (rest.tenantId)
      qb.andWhere("log.tenantId = :tenantId", { tenantId: rest.tenantId });
    if (rest.action)
      qb.andWhere("log.action ILIKE :action", { action: `%${rest.action}%` });
    if (rest.resource)
      qb.andWhere("log.resource = :resource", { resource: rest.resource });
    if (rest.resourceId)
      qb.andWhere("log.resourceId = :resourceId", {
        resourceId: rest.resourceId,
      });
    if (from) qb.andWhere("log.createdAt >= :from", { from });
    if (to) qb.andWhere("log.createdAt <= :to", { to });

    const [data, total] = await qb.getManyAndCount();

    return { data, total };
  }
}
