import { MigrationInterface, QueryRunner } from "typeorm";
import { ulid } from "ulid";

/**
 * UMS Foundation Migration — Phase 1
 *
 * Creates 8 new tables:
 *   ums_roles              — 17 seeded system roles (14 from spec + 3 tier-C variants)
 *   ums_permissions        — 21 granular permission codes
 *   ums_role_permissions   — Full RBAC matrix from the spec's permission grid
 *   ums_user_roles         — User ↔ role many-to-many (tenant-scoped)
 *   ums_tenants            — Multi-tenant registry (Partners, Resellers, Aggregators)
 *   ums_tenant_users       — User membership within a tenant
 *   ums_audit_logs         — Append-only audit trail (RBI 7yr retention)
 *   ums_sessions           — JWT session tracking + token blacklist
 *
 * Seed data: all 17 roles + 21 permissions + full RBAC matrix loaded on first run.
 * Uses IF NOT EXISTS / IF EXISTS guards throughout — idempotent & safe to re-run.
 */
export class UmsFoundation1771600000007 implements MigrationInterface {
  name = "UmsFoundation1771600000007";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── ums_roles ────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ums_roles" (
        "id"           varchar        NOT NULL,
        "code"         varchar(50)    NOT NULL,
        "name"         varchar(100)   NOT NULL,
        "tier"         varchar(1)     NOT NULL,
        "level"        varchar(10)    NOT NULL,
        "description"  text,
        "riskLevel"    varchar(20)    NOT NULL,
        "isSystemRole" boolean        NOT NULL DEFAULT true,
        "isActive"     boolean        NOT NULL DEFAULT true,
        "createdAt"    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt"    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ums_roles" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_ums_roles_code" UNIQUE ("code")
      )
    `);

    // ── ums_permissions ──────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ums_permissions" (
        "id"          varchar        NOT NULL,
        "code"        varchar(100)   NOT NULL,
        "name"        varchar(200)   NOT NULL,
        "resource"    varchar(100)   NOT NULL,
        "action"      varchar(100)   NOT NULL,
        "scope"       varchar(50)    NOT NULL DEFAULT 'full',
        "description" text,
        "createdAt"   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ums_permissions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_ums_permissions_code" UNIQUE ("code")
      )
    `);

    // ── ums_role_permissions ─────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ums_role_permissions" (
        "id"             varchar     NOT NULL,
        "roleId"         varchar     NOT NULL,
        "permissionCode" varchar(100) NOT NULL,
        "grantType"      varchar(20) NOT NULL DEFAULT 'FULL',
        "createdAt"      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ums_role_permissions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_ums_rp_role_perm" UNIQUE ("roleId", "permissionCode"),
        CONSTRAINT "FK_ums_rp_role" FOREIGN KEY ("roleId")
          REFERENCES "ums_roles"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ums_rp_roleId" ON "ums_role_permissions" ("roleId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ums_rp_permCode" ON "ums_role_permissions" ("permissionCode")
    `);

    // ── ums_user_roles ───────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ums_user_roles" (
        "id"           varchar     NOT NULL,
        "userId"       varchar     NOT NULL,
        "roleId"       varchar     NOT NULL,
        "tenantId"     varchar,
        "assignedById" varchar,
        "expiresAt"    TIMESTAMP WITH TIME ZONE,
        "isActive"     boolean     NOT NULL DEFAULT true,
        "createdAt"    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ums_user_roles" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_ums_ur_user_role_tenant" UNIQUE ("userId", "roleId", "tenantId"),
        CONSTRAINT "FK_ums_ur_role" FOREIGN KEY ("roleId")
          REFERENCES "ums_roles"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ums_ur_userId" ON "ums_user_roles" ("userId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ums_ur_roleId" ON "ums_user_roles" ("roleId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ums_ur_tenantId" ON "ums_user_roles" ("tenantId")
    `);

    // ── ums_tenants ──────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ums_tenants" (
        "id"             varchar     NOT NULL,
        "code"           varchar(100) NOT NULL,
        "name"           varchar(200) NOT NULL,
        "type"           varchar(50)  NOT NULL,
        "ownerId"        varchar,
        "parentTenantId" varchar,
        "config"         jsonb        NOT NULL DEFAULT '{}',
        "status"         varchar(20)  NOT NULL DEFAULT 'PENDING',
        "kybStatus"      varchar(20)  NOT NULL DEFAULT 'PENDING',
        "apiRateLimit"   integer      NOT NULL DEFAULT 1000,
        "isActive"       boolean      NOT NULL DEFAULT true,
        "createdAt"      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt"      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ums_tenants" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_ums_tenants_code" UNIQUE ("code")
      )
    `);

    // ── ums_tenant_users ─────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ums_tenant_users" (
        "id"       varchar     NOT NULL,
        "tenantId" varchar     NOT NULL,
        "userId"   varchar     NOT NULL,
        "role"     varchar(100) NOT NULL,
        "isActive" boolean     NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ums_tenant_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_ums_tu_tenant_user" UNIQUE ("tenantId", "userId"),
        CONSTRAINT "FK_ums_tu_tenant" FOREIGN KEY ("tenantId")
          REFERENCES "ums_tenants"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ums_tu_tenantId" ON "ums_tenant_users" ("tenantId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ums_tu_userId"   ON "ums_tenant_users" ("userId")
    `);

    // ── ums_audit_logs ───────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ums_audit_logs" (
        "id"                varchar     NOT NULL,
        "actorId"           varchar     NOT NULL,
        "actorRole"         varchar(100),
        "tenantId"          varchar,
        "action"            varchar(200) NOT NULL,
        "resource"          varchar(100) NOT NULL,
        "resourceId"        varchar,
        "details"           jsonb        NOT NULL DEFAULT '{}',
        "ipAddress"         varchar(64),
        "deviceFingerprint" varchar(200),
        "userAgent"         text,
        "status"            varchar(20)  NOT NULL DEFAULT 'SUCCESS',
        "createdAt"         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ums_audit_logs" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ums_al_actorId_createdAt"  ON "ums_audit_logs" ("actorId", "createdAt")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ums_al_resourceId_resource" ON "ums_audit_logs" ("resourceId", "resource")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ums_al_tenantId_createdAt" ON "ums_audit_logs" ("tenantId", "createdAt")
    `);

    // ── ums_sessions ─────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ums_sessions" (
        "id"                varchar     NOT NULL,
        "userId"            varchar     NOT NULL,
        "jti"               varchar(200) NOT NULL,
        "deviceFingerprint" varchar(200),
        "ipAddress"         varchar(64),
        "userAgent"         text,
        "isActive"          boolean     NOT NULL DEFAULT true,
        "revokedAt"         TIMESTAMP WITH TIME ZONE,
        "revokedReason"     varchar(200),
        "expiresAt"         TIMESTAMP WITH TIME ZONE NOT NULL,
        "createdAt"         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ums_sessions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_ums_sessions_jti" UNIQUE ("jti")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ums_sess_userId_isActive" ON "ums_sessions" ("userId", "isActive")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ums_sess_jti" ON "ums_sessions" ("jti")
    `);

    // ────────────────────────────────────────────────────────────────────────
    // SEED DATA — 17 roles + 21 permissions + full RBAC matrix
    // ────────────────────────────────────────────────────────────────────────

    const makeId = (prefix: string) => `${prefix}_${ulid()}`;

    // ── Seed roles ────────────────────────────────────────────────────────────
    const roles = [
      // Tier A - Internal
      {
        code: "L1_SUPER_ADMIN",
        name: "Super Admin",
        tier: "A",
        level: "L1",
        riskLevel: "CRITICAL",
        desc: "Absolute platform authority. Platform-wide config, compliance settings, emergency kill-switch.",
      },
      {
        code: "L2_COMPLIANCE_OFFICER",
        name: "Compliance Officer",
        tier: "A",
        level: "L2",
        riskLevel: "CRITICAL",
        desc: "Owns KYC/AML lifecycle. Reviews verifications, approves tier upgrades, files SARs.",
      },
      {
        code: "L2_RISK_ANALYST",
        name: "Risk Analyst",
        tier: "A",
        level: "L2",
        riskLevel: "HIGH",
        desc: "Monitors real-time transaction risk, manages fraud engine rules, triages flagged queues.",
      },
      {
        code: "L3_FINANCE_OPS",
        name: "Finance Ops",
        tier: "A",
        level: "L3",
        riskLevel: "HIGH",
        desc: "Manages daily settlement runs, reconciliation, refunds, and payout scheduling.",
      },
      {
        code: "L3_DEVELOPER",
        name: "Developer / Engineer",
        tier: "A",
        level: "L3",
        riskLevel: "MEDIUM",
        desc: "System builders with tightly controlled production access. All deployments via CI/CD.",
      },
      {
        code: "L4_CUSTOMER_SUPPORT",
        name: "Customer Support",
        tier: "A",
        level: "L4",
        riskLevel: "MEDIUM",
        desc: "Handles user queries, account lookups, tier-1 issue resolution. All sensitive data masked.",
      },
      {
        code: "L4_DATA_ANALYST",
        name: "Data Analyst",
        tier: "A",
        level: "L4",
        riskLevel: "LOW",
        desc: "Business intelligence and reporting. Works on anonymized, aggregated datasets only.",
      },
      // Tier B - External Business
      {
        code: "B1_PARTNER",
        name: "Partner",
        tier: "B",
        level: "B1",
        riskLevel: "HIGH",
        desc: "White-label / co-brand operator. Manages own user base under platform compliance.",
      },
      {
        code: "B2_RESELLER",
        name: "Reseller",
        tier: "B",
        level: "B2",
        riskLevel: "MEDIUM",
        desc: "Product resale and sub-tenant management. Does not white-label.",
      },
      {
        code: "B3_MERCHANT",
        name: "Merchant",
        tier: "B",
        level: "B3",
        riskLevel: "MEDIUM",
        desc: "Businesses accepting payments through the platform.",
      },
      {
        code: "B4_AGGREGATOR",
        name: "Aggregator",
        tier: "B",
        level: "B4",
        riskLevel: "HIGH",
        desc: "Manages a portfolio of merchant accounts. Responsible for sub-merchant compliance.",
      },
      {
        code: "B5_AGENT",
        name: "Agent / DSA",
        tier: "B",
        level: "B5",
        riskLevel: "MEDIUM",
        desc: "Direct Selling Agents who onboard users/merchants. Limited data entry & status tracking.",
      },
      // Tier C - End Users
      {
        code: "C1_GUEST",
        name: "Guest / Unverified",
        tier: "C",
        level: "C1",
        riskLevel: "LOW",
        desc: "No registration required. Browse only. No financial transactions permitted.",
      },
      {
        code: "C2_KYC_TIER1",
        name: "KYC Tier 1 (Basic)",
        tier: "C",
        level: "C2",
        riskLevel: "LOW",
        desc: "Phone + email verified. Low-value transactions. Limit: ₹10K/day, ₹50K/month.",
      },
      {
        code: "C3_KYC_TIER2",
        name: "KYC Tier 2 (Standard)",
        tier: "C",
        level: "C3",
        riskLevel: "LOW",
        desc: "Aadhaar/PAN + selfie verified. Standard limits. ₹1L/day, ₹5L/month.",
      },
      {
        code: "C4_KYC_TIER3",
        name: "KYC Tier 3 (Premium)",
        tier: "C",
        level: "C4",
        riskLevel: "LOW",
        desc: "Video KYC + income proof + EDD interview. Full access. ₹10L/day, ₹50L/month.",
      },
      {
        code: "C5_BUSINESS_ACCOUNT",
        name: "Business Account",
        tier: "C",
        level: "C5",
        riskLevel: "MEDIUM",
        desc: "Registered businesses (GST/CIN). Corporate wallet, sub-user management, bulk payments.",
      },
    ];

    const roleIds: Record<string, string> = {};
    for (const r of roles) {
      const exists = await queryRunner.query(
        `SELECT id FROM ums_roles WHERE code = $1`,
        [r.code],
      );
      if (exists.length > 0) {
        roleIds[r.code] = exists[0].id;
        continue;
      }
      const id = makeId("umsr");
      roleIds[r.code] = id;
      await queryRunner.query(
        `INSERT INTO "ums_roles" ("id","code","name","tier","level","description","riskLevel","isSystemRole","isActive")
         VALUES ($1,$2,$3,$4,$5,$6,$7,true,true)`,
        [id, r.code, r.name, r.tier, r.level, r.desc, r.riskLevel],
      );
    }

    // ── Seed permissions ──────────────────────────────────────────────────────
    const permissions = [
      {
        code: "user:pii:full",
        name: "View Full User PII",
        resource: "user",
        action: "read",
        scope: "full",
      },
      {
        code: "user:pii:masked",
        name: "View Masked User PII",
        resource: "user",
        action: "read",
        scope: "masked",
      },
      {
        code: "kyc:view",
        name: "View KYC Documents",
        resource: "kyc",
        action: "read",
        scope: "full",
      },
      {
        code: "kyc:approve",
        name: "Approve or Reject KYC",
        resource: "kyc",
        action: "approve",
        scope: "full",
      },
      {
        code: "txn:initiate",
        name: "Initiate Transactions",
        resource: "transaction",
        action: "write",
        scope: "own",
      },
      {
        code: "txn:view:all",
        name: "View All Transactions",
        resource: "transaction",
        action: "read",
        scope: "all",
      },
      {
        code: "txn:view:own",
        name: "View Own Transactions",
        resource: "transaction",
        action: "read",
        scope: "own",
      },
      {
        code: "txn:void",
        name: "Void Pending Transactions",
        resource: "transaction",
        action: "void",
        scope: "full",
      },
      {
        code: "account:freeze",
        name: "Freeze / Unfreeze Accounts",
        resource: "account",
        action: "freeze",
        scope: "full",
      },
      {
        code: "system:config",
        name: "Manage System Configuration",
        resource: "system",
        action: "write",
        scope: "full",
      },
      {
        code: "role:manage",
        name: "Create and Assign Roles",
        resource: "role",
        action: "write",
        scope: "full",
      },
      {
        code: "audit:logs",
        name: "Access Audit Logs",
        resource: "audit",
        action: "read",
        scope: "full",
      },
      {
        code: "sar:file",
        name: "File Suspicious Activity Reports",
        resource: "compliance",
        action: "write",
        scope: "full",
      },
      {
        code: "settlement:reports",
        name: "View Settlement Reports",
        resource: "settlement",
        action: "read",
        scope: "own",
      },
      {
        code: "refund:initiate",
        name: "Initiate Refunds",
        resource: "transaction",
        action: "refund",
        scope: "own",
      },
      {
        code: "api_key:manage",
        name: "Create and Rotate API Keys",
        resource: "api_key",
        action: "write",
        scope: "own",
      },
      {
        code: "feature_flags:manage",
        name: "Toggle Feature Flags",
        resource: "system",
        action: "write",
        scope: "flags",
      },
      {
        code: "analytics:full",
        name: "Access Full Analytics & BI",
        resource: "analytics",
        action: "read",
        scope: "full",
      },
      {
        code: "analytics:partial",
        name: "Access Anonymized Analytics",
        resource: "analytics",
        action: "read",
        scope: "masked",
      },
      {
        code: "transfer:international",
        name: "Initiate International Transfers",
        resource: "transaction",
        action: "write",
        scope: "international",
      },
      {
        code: "credit:products",
        name: "Access Credit Products",
        resource: "products",
        action: "read",
        scope: "credit",
      },
    ];

    const permIds: Record<string, string> = {};
    for (const p of permissions) {
      const exists = await queryRunner.query(
        `SELECT id FROM ums_permissions WHERE code = $1`,
        [p.code],
      );
      if (exists.length > 0) {
        permIds[p.code] = exists[0].id;
        continue;
      }
      const id = makeId("umsp");
      permIds[p.code] = id;
      await queryRunner.query(
        `INSERT INTO "ums_permissions" ("id","code","name","resource","action","scope")
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [id, p.code, p.name, p.resource, p.action, p.scope],
      );
    }

    // ── Seed role-permission matrix (from the PDF spec permission grid) ────────
    // F = FULL, P = PARTIAL, A = WITH_APPROVAL
    type Grant = "FULL" | "PARTIAL" | "WITH_APPROVAL";
    const matrix: Array<{ roleCode: string; permCode: string; grant: Grant }> =
      [
        // ── Super Admin (L1) — gets everything FULL
        {
          roleCode: "L1_SUPER_ADMIN",
          permCode: "user:pii:full",
          grant: "FULL",
        },
        {
          roleCode: "L1_SUPER_ADMIN",
          permCode: "user:pii:masked",
          grant: "FULL",
        },
        { roleCode: "L1_SUPER_ADMIN", permCode: "kyc:view", grant: "FULL" },
        { roleCode: "L1_SUPER_ADMIN", permCode: "kyc:approve", grant: "FULL" },
        { roleCode: "L1_SUPER_ADMIN", permCode: "txn:view:all", grant: "FULL" },
        { roleCode: "L1_SUPER_ADMIN", permCode: "txn:void", grant: "FULL" },
        {
          roleCode: "L1_SUPER_ADMIN",
          permCode: "account:freeze",
          grant: "FULL",
        },
        {
          roleCode: "L1_SUPER_ADMIN",
          permCode: "system:config",
          grant: "FULL",
        },
        { roleCode: "L1_SUPER_ADMIN", permCode: "role:manage", grant: "FULL" },
        { roleCode: "L1_SUPER_ADMIN", permCode: "audit:logs", grant: "FULL" },
        { roleCode: "L1_SUPER_ADMIN", permCode: "sar:file", grant: "FULL" },
        {
          roleCode: "L1_SUPER_ADMIN",
          permCode: "settlement:reports",
          grant: "FULL",
        },
        {
          roleCode: "L1_SUPER_ADMIN",
          permCode: "refund:initiate",
          grant: "FULL",
        },
        {
          roleCode: "L1_SUPER_ADMIN",
          permCode: "api_key:manage",
          grant: "FULL",
        },
        {
          roleCode: "L1_SUPER_ADMIN",
          permCode: "feature_flags:manage",
          grant: "FULL",
        },
        {
          roleCode: "L1_SUPER_ADMIN",
          permCode: "analytics:full",
          grant: "FULL",
        },

        // ── Compliance Officer (L2) — KYC + audit focus, no txn modification
        {
          roleCode: "L2_COMPLIANCE_OFFICER",
          permCode: "user:pii:full",
          grant: "FULL",
        },
        {
          roleCode: "L2_COMPLIANCE_OFFICER",
          permCode: "user:pii:masked",
          grant: "FULL",
        },
        {
          roleCode: "L2_COMPLIANCE_OFFICER",
          permCode: "kyc:view",
          grant: "FULL",
        },
        {
          roleCode: "L2_COMPLIANCE_OFFICER",
          permCode: "kyc:approve",
          grant: "FULL",
        },
        {
          roleCode: "L2_COMPLIANCE_OFFICER",
          permCode: "txn:view:all",
          grant: "FULL",
        },
        {
          roleCode: "L2_COMPLIANCE_OFFICER",
          permCode: "account:freeze",
          grant: "FULL",
        },
        {
          roleCode: "L2_COMPLIANCE_OFFICER",
          permCode: "audit:logs",
          grant: "FULL",
        },
        {
          roleCode: "L2_COMPLIANCE_OFFICER",
          permCode: "sar:file",
          grant: "FULL",
        },
        {
          roleCode: "L2_COMPLIANCE_OFFICER",
          permCode: "analytics:partial",
          grant: "PARTIAL",
        },

        // ── Risk Analyst (L2) — read-only on PII (masked), risk rules
        {
          roleCode: "L2_RISK_ANALYST",
          permCode: "user:pii:masked",
          grant: "PARTIAL",
        },
        {
          roleCode: "L2_RISK_ANALYST",
          permCode: "txn:view:all",
          grant: "FULL",
        },
        {
          roleCode: "L2_RISK_ANALYST",
          permCode: "audit:logs",
          grant: "PARTIAL",
        },
        {
          roleCode: "L2_RISK_ANALYST",
          permCode: "analytics:partial",
          grant: "PARTIAL",
        },

        // ── Finance Ops (L3) — settlements, refunds (dual approval above ₹50K)
        { roleCode: "L3_FINANCE_OPS", permCode: "txn:view:all", grant: "FULL" },
        { roleCode: "L3_FINANCE_OPS", permCode: "txn:void", grant: "FULL" },
        {
          roleCode: "L3_FINANCE_OPS",
          permCode: "txn:initiate",
          grant: "WITH_APPROVAL",
        },
        {
          roleCode: "L3_FINANCE_OPS",
          permCode: "settlement:reports",
          grant: "FULL",
        },
        {
          roleCode: "L3_FINANCE_OPS",
          permCode: "refund:initiate",
          grant: "WITH_APPROVAL",
        },
        {
          roleCode: "L3_FINANCE_OPS",
          permCode: "audit:logs",
          grant: "PARTIAL",
        },
        {
          roleCode: "L3_FINANCE_OPS",
          permCode: "analytics:partial",
          grant: "PARTIAL",
        },

        // ── Developer (L3) — system config (feature flags), anonymized logs only
        {
          roleCode: "L3_DEVELOPER",
          permCode: "system:config",
          grant: "PARTIAL",
        },
        { roleCode: "L3_DEVELOPER", permCode: "audit:logs", grant: "PARTIAL" },
        { roleCode: "L3_DEVELOPER", permCode: "api_key:manage", grant: "FULL" },
        {
          roleCode: "L3_DEVELOPER",
          permCode: "feature_flags:manage",
          grant: "FULL",
        },
        {
          roleCode: "L3_DEVELOPER",
          permCode: "analytics:partial",
          grant: "PARTIAL",
        },

        // ── Customer Support (L4) — masked PII only, no financial data
        {
          roleCode: "L4_CUSTOMER_SUPPORT",
          permCode: "user:pii:masked",
          grant: "PARTIAL",
        },
        {
          roleCode: "L4_CUSTOMER_SUPPORT",
          permCode: "txn:view:all",
          grant: "PARTIAL",
        },

        // ── Data Analyst (L4) — anonymized analytics only
        {
          roleCode: "L4_DATA_ANALYST",
          permCode: "analytics:full",
          grant: "PARTIAL",
        },
        {
          roleCode: "L4_DATA_ANALYST",
          permCode: "analytics:partial",
          grant: "FULL",
        },

        // ── Partner (B1) — tenant-scoped role & settlement management
        { roleCode: "B1_PARTNER", permCode: "role:manage", grant: "PARTIAL" },
        { roleCode: "B1_PARTNER", permCode: "txn:view:all", grant: "PARTIAL" },
        {
          roleCode: "B1_PARTNER",
          permCode: "settlement:reports",
          grant: "FULL",
        },
        { roleCode: "B1_PARTNER", permCode: "api_key:manage", grant: "FULL" },
        {
          roleCode: "B1_PARTNER",
          permCode: "analytics:partial",
          grant: "PARTIAL",
        },

        // ── Reseller (B2) — sub-merchant management, portfolio analytics
        { roleCode: "B2_RESELLER", permCode: "role:manage", grant: "PARTIAL" },
        { roleCode: "B2_RESELLER", permCode: "txn:view:all", grant: "PARTIAL" },
        {
          roleCode: "B2_RESELLER",
          permCode: "settlement:reports",
          grant: "FULL",
        },
        { roleCode: "B2_RESELLER", permCode: "api_key:manage", grant: "FULL" },

        // ── Merchant (B3) — own transactions, refunds, API keys, webhooks
        { roleCode: "B3_MERCHANT", permCode: "role:manage", grant: "PARTIAL" },
        { roleCode: "B3_MERCHANT", permCode: "txn:initiate", grant: "FULL" },
        { roleCode: "B3_MERCHANT", permCode: "txn:view:all", grant: "PARTIAL" },
        { roleCode: "B3_MERCHANT", permCode: "txn:view:own", grant: "FULL" },
        {
          roleCode: "B3_MERCHANT",
          permCode: "settlement:reports",
          grant: "FULL",
        },
        { roleCode: "B3_MERCHANT", permCode: "refund:initiate", grant: "FULL" },
        { roleCode: "B3_MERCHANT", permCode: "api_key:manage", grant: "FULL" },
        {
          roleCode: "B3_MERCHANT",
          permCode: "analytics:partial",
          grant: "PARTIAL",
        },

        // ── Aggregator (B4) — portfolio view, settlement, sub-merchant management
        {
          roleCode: "B4_AGGREGATOR",
          permCode: "role:manage",
          grant: "PARTIAL",
        },
        { roleCode: "B4_AGGREGATOR", permCode: "txn:initiate", grant: "FULL" },
        {
          roleCode: "B4_AGGREGATOR",
          permCode: "txn:view:all",
          grant: "PARTIAL",
        },
        {
          roleCode: "B4_AGGREGATOR",
          permCode: "settlement:reports",
          grant: "FULL",
        },
        {
          roleCode: "B4_AGGREGATOR",
          permCode: "api_key:manage",
          grant: "FULL",
        },
        {
          roleCode: "B4_AGGREGATOR",
          permCode: "analytics:partial",
          grant: "PARTIAL",
        },

        // ── Agent/DSA (B5) — onboarding forms only, no financial access
        // (No financial permissions — agents can only submit forms)

        // ── KYC Tier 1 (C2) — basic transactions
        { roleCode: "C2_KYC_TIER1", permCode: "txn:initiate", grant: "FULL" },
        { roleCode: "C2_KYC_TIER1", permCode: "txn:view:own", grant: "FULL" },

        // ── KYC Tier 2 (C3) — standard features
        { roleCode: "C3_KYC_TIER2", permCode: "txn:initiate", grant: "FULL" },
        { roleCode: "C3_KYC_TIER2", permCode: "txn:view:own", grant: "FULL" },

        // ── KYC Tier 3 (C4) — full access incl. international + credit
        { roleCode: "C4_KYC_TIER3", permCode: "txn:initiate", grant: "FULL" },
        { roleCode: "C4_KYC_TIER3", permCode: "txn:view:own", grant: "FULL" },
        {
          roleCode: "C4_KYC_TIER3",
          permCode: "transfer:international",
          grant: "FULL",
        },
        {
          roleCode: "C4_KYC_TIER3",
          permCode: "credit:products",
          grant: "FULL",
        },

        // ── Business Account (C5) — corporate features
        {
          roleCode: "C5_BUSINESS_ACCOUNT",
          permCode: "txn:initiate",
          grant: "FULL",
        },
        {
          roleCode: "C5_BUSINESS_ACCOUNT",
          permCode: "txn:view:own",
          grant: "FULL",
        },
        {
          roleCode: "C5_BUSINESS_ACCOUNT",
          permCode: "role:manage",
          grant: "PARTIAL",
        },
        {
          roleCode: "C5_BUSINESS_ACCOUNT",
          permCode: "settlement:reports",
          grant: "FULL",
        },
        {
          roleCode: "C5_BUSINESS_ACCOUNT",
          permCode: "api_key:manage",
          grant: "FULL",
        },
        {
          roleCode: "C5_BUSINESS_ACCOUNT",
          permCode: "analytics:partial",
          grant: "PARTIAL",
        },
        {
          roleCode: "C5_BUSINESS_ACCOUNT",
          permCode: "transfer:international",
          grant: "FULL",
        },
        {
          roleCode: "C5_BUSINESS_ACCOUNT",
          permCode: "credit:products",
          grant: "FULL",
        },
      ];

    for (const entry of matrix) {
      const roleId = roleIds[entry.roleCode];
      if (!roleId) continue;

      const exists = await queryRunner.query(
        `SELECT id FROM ums_role_permissions WHERE "roleId" = $1 AND "permissionCode" = $2`,
        [roleId, entry.permCode],
      );
      if (exists.length > 0) continue;

      const id = makeId("umrp");
      await queryRunner.query(
        `INSERT INTO "ums_role_permissions" ("id","roleId","permissionCode","grantType")
         VALUES ($1,$2,$3,$4)`,
        [id, roleId, entry.permCode, entry.grant],
      );
    }

    console.log(
      `[UmsFoundation] Seeded: ${roles.length} roles, ${permissions.length} permissions, ${matrix.length} role-permission mappings`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "ums_sessions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ums_audit_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ums_tenant_users"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ums_tenants"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ums_user_roles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ums_role_permissions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ums_permissions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ums_roles"`);
  }
}
