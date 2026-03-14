# Rupeeflow Backend — Architecture Audit Report

**Date:** March 12, 2026
**Codebase:** `rupeeflow-internal-dashboard` (NestJS / TypeScript)
**Prepared For:** Internal Engineering Team
**Classification:** Confidential — Fintech Internal

---

## Executive Summary

This audit covers the full backend architecture of the Rupeeflow payment gateway. The system is a NestJS monolith serving payment collections (payin), disbursements (payout), KYC onboarding, settlements, and analytics for merchants. It integrates 8+ external payment processors.

The audit identifies **47 loopholes** across 7 categories: Security, Data Integrity, Architecture, Scalability (for Orchestration), Operational/DevOps, Code Quality, and Compliance. Each finding is graded by severity.

**Severity Legend:**
`CRITICAL` — Can cause financial loss, data breach, or system compromise
`HIGH` — Significant risk; must fix before scaling
`MEDIUM` — Important; fix in next sprint
`LOW` — Best practice; fix when convenient

---

## Category 1 — Security Loopholes

### S-1 · Fixed IV in AES-256-CBC Login Encryption `[CRITICAL]`

**File:** `src/utils/auth-encryption.utils.ts`

The `AuthEncryptionInterceptor` encrypts/decrypts login and registration payloads using AES-256-CBC with a **static IV read from environment variables** (`LOGIN_SIGNUP_ENCRYPTION_IV`). AES-CBC with a fixed IV leaks patterns across ciphertexts — identical plaintext blocks produce identical ciphertext blocks. An attacker who captures two login sessions for the same user can detect and manipulate blocks.

- Replay attacks become trivial — a recorded encrypted login body can be replayed.
- The IV is stored in `.env.production` which is baked into the Docker image (see D-2).
- No MAC (Message Authentication Code) is applied, enabling ciphertext bit-flipping.

---

### S-2 · No Rate Limiting on Any Public Endpoint `[CRITICAL]`

**File:** `src/main.ts`

There is **zero rate limiting** on the entire application. No `@nestjs/throttler`, no Nginx-level limiting, no middleware. The following public endpoints can be abused freely:

- `POST /api/v1/auth/send-signup-otp` — sends SMS/email OTP; costs money per call via AWS SNS/SES
- `POST /api/v1/auth/send-forgot-password-otp` — same abuse vector
- `POST /api/v1/users/contact-us` — spam to SES
- `POST /api/v1/payments/payin/webhook` — webhook handlers lack throttling; a flood attack can overwhelm the queue
- `GET /api/v1/payments/checkout/:id` — no protection on checkout page serving

The only brute-force protection that exists is the 3-attempt login lock. This does not cover any other endpoint.

---

### S-3 · Webhook IP Validation is Bypass-able `[CRITICAL]`

**File:** `src/guard/webhook.guard.ts`, `src/utils/request.utils.ts`

The `WebhookGuard` reads the client IP from `x-forwarded-for` header (via `getCurrentUserIp()`). If the application sits behind a reverse proxy (which it likely does in production), this header **can be spoofed** by any caller. An attacker can send `X-Forwarded-For: <whitelisted-ip>` and bypass all webhook IP allowlists.

- Must use the **rightmost untrusted** IP from `x-forwarded-for`, not the leftmost.
- Or use `req.socket.remoteAddress` with `app.set('trust proxy', 1)` correctly configured.
- All webhook handlers (NXT, GeoPay, Fyntra, Onik, Utkarsh, KDS, BuckBox, RockyPayz) are affected.

---

### S-4 · AES-256-CTR Without Authentication (API Key Encryption) `[HIGH]`

**File:** `src/utils/encode-decode.utils.ts`

API client secrets are encrypted with AES-256-CTR using a random IV (good). However, AES-CTR is a **stream cipher with no integrity check**. Without an HMAC or AEAD (e.g., AES-256-GCM), the ciphertext is vulnerable to **bit-flipping attacks** — an attacker with DB access can flip specific bits in the stored ciphertext to change the decrypted secret without detection.

Use AES-256-GCM (authenticated encryption) instead.

---

### S-5 · 2FA via Email — Weak Factor `[HIGH]`

**File:** `src/modules/auth/auth.service.ts`

The 2FA implementation sends a 6-digit OTP to the user's email via SES. This is weaker than TOTP (Google Authenticator style):

- Email accounts can be compromised, defeating the second factor.
- No rate limiting on `POST /api/v1/auth/verify-2fa` — the 6-digit space (0–999999) is brute-forceable in ~1000 attempts at 1 req/s within the 5-minute window.
- The `vtk` cookie is set with `sameSite: lax` — some cross-site navigations will include it.
- The 6-digit OTP is stored as plaintext in Redis (`2fa:{userId}:code`) — anyone with Redis access sees OTPs.

---

### S-6 · `.env.production` Baked Into Docker Image `[HIGH]`

**File:** `Dockerfile`

```dockerfile
COPY .env.production .
```

All production secrets (DB credentials, JWT secrets, AWS keys, all 8 PG API credentials, encryption keys) are **embedded inside the Docker image**. Any team member who can pull the image from the registry gets all secrets. If the image is ever leaked or pushed to a public registry accidentally, the breach is total.

---

### S-7 · Cookie Security Disabled in Non-Production `[HIGH]`

**File:** `src/utils/cookies.utils.ts`

```typescript
httpOnly: isProduction,
secure: isProduction,
```

In staging/dev environments, `httpOnly: false` means cookies are readable by JavaScript, and `secure: false` allows cookies over HTTP. If staging URLs are publicly accessible (common in fintech for client demos), access tokens are trivially stealable via XSS.

---

### S-8 · No Signature Verification on Most Webhooks `[HIGH]`

Multiple webhook handlers rely only on IP allowlisting (which is bypassed per S-3). Most payment gateways provide HMAC-SHA256 signature headers (e.g., `X-Signature`, `X-Webhook-Signature`) that should be validated independently of IP. If IP validation is bypassed, there is no secondary layer to verify that the webhook is authentic and unmodified.

Affected processors: NXT, Fyntra, BuckBox, RockyPayz, KDS/Diaspay, GeoPay.

---

### S-9 · Sensitive Data Potentially Logged `[HIGH]`

**File:** `src/logger/`

The Winston logger is configured globally. NestJS default interceptors and exception filters log request bodies and error details. Since `AuthEncryptionInterceptor` decrypts the login body **before** it reaches the controller, the decrypted credentials (email, password) may be visible in logs. Payment amounts, bank account numbers from payout DTOs, and webhook payloads also risk appearing in logs.

---

### S-10 · No PKCE or State Parameter in Google OAuth `[MEDIUM]`

**File:** `src/modules/auth/`

The Google OAuth flow uses `verifyIdToken()` from `google-auth-library`. If the flow doesn't validate the `state` parameter or use PKCE, it's vulnerable to CSRF on the OAuth callback — an attacker can link their Google account to a victim's Rupeeflow account.

---

### S-11 · Account Lock Only on Email — Not on IP or User Agent `[MEDIUM]`

**File:** `src/modules/auth/auth.service.ts`

The 3-attempt lock is per email address in Redis. Attackers can brute-force passwords against many different accounts from one IP without triggering any lockout (they never hit 3 attempts on the same email). IP-level rate limiting is absent (see S-2).

---

### S-12 · API Key Cache (30 days) — No Revocation Propagation `[MEDIUM]`

**File:** `src/guard/api-key.guard.ts`

API keys are cached in Redis for 30 days (`api_key_entity_{clientId}`). If a merchant's API key is revoked in the database (e.g., due to compromise), the stale cached entry will continue to be served as valid for up to 30 days. No cache invalidation is triggered on API key deletion/revocation.

---

### S-13 · No Content Security Policy Audit `[MEDIUM]`

**File:** `src/config/helmet.config.ts`

Helmet is configured, but the CSP directives for the Handlebars-rendered payment pages (GeoPay checkout, payment link pages) have not been validated. Inline scripts in HBS templates commonly require `unsafe-inline`, which defeats the entire purpose of CSP.

---

## Category 2 — Data Integrity Loopholes

### D-1 · No Idempotency Keys on Payin Creation `[CRITICAL]`

**File:** `src/modules/payments/services/base-payin.service.ts`

The ultra-fast payin path enqueues the DB insert asynchronously and immediately returns a payment link. There are no idempotency keys. If a merchant's system retries a payin request (network timeout, retry logic), **two separate payin orders are created** with two separate orderId ULIDs. The merchant is charged twice, the customer gets two payment prompts. This is a direct financial integrity issue.

---

### D-2 · Race Condition: Webhook Arrives Before Queue Job Completes `[CRITICAL]`

**File:** `src/modules/payments/processors/payin.processor.ts`

Flow:
1. Merchant calls `POST /api/v1/payments/payin` → orderId returned, DB insert queued
2. External PG processes the UPI/payment very fast (seconds)
3. PG fires webhook → `POST /api/v1/payments/payin/webhook` arrives
4. Webhook handler looks up orderId in DB → **not found yet** (queue job hasn't run)
5. Webhook is rejected or erroneously marked as failed

This race condition can cause **legitimate successful payments to be missed**. The payment is credited by the PG but never recorded by Rupeeflow.

---

### D-3 · No Webhook Deduplication `[CRITICAL]`

**File:** `src/modules/payments/webhooks/`

Payment gateways guarantee **at-least-once** webhook delivery. Duplicate webhooks are a fact of life (network retries, PG retries on non-2xx responses). There is no idempotency check (e.g., `SELECT 1 FROM payin_orders WHERE orderId = ? AND status = 'SUCCESS'`) before processing a webhook. A duplicate webhook can:

- Credit a wallet twice
- Create duplicate transactions
- Trigger double settlement

This is a **direct financial loss vector**.

---

### D-4 · Bull Queue Jobs Lost on Redis Crash `[CRITICAL]`

**File:** `src/modules/payments/processors/payin.processor.ts`

Payin order DB inserts are queued in Bull (backed by Redis). If Redis crashes before the job is processed:

- The `orderId` was already returned to the merchant and passed to the external PG
- The DB record never gets created
- When the PG fires the webhook, the order doesn't exist
- The payment is irrecoverable — no record in the system, customer charged

Bull's persistence depends entirely on Redis. There is no backup queue, no write-ahead log, no fallback to synchronous insert.

---

### D-5 · Optimistic Locking with No Retry Logic on Wallet `[HIGH]`

**File:** Entity: `WalletEntity` (version column)

TypeORM optimistic locking throws `OptimisticLockVersionMismatchError` when two transactions try to update the same wallet concurrently. There is no retry loop in the webhook handlers or payout processors. The failed update is propagated as a 500 error, and the wallet balance is **not updated** even though the payment was successful. Manual intervention is required.

With 6 PM2 instances and 5 concurrent processors each, 30 concurrent wallet writes per second is achievable, making this race condition frequent.

---

### D-6 · Commission Plan Cached — Can Apply Stale Rates `[HIGH]`

**File:** `src/modules/commission/commission.service.ts`

Commission plans are cached in Redis. The cache TTL for commission plans is not explicitly documented in `redis-cache.constant.ts` for the commission plan key. If an admin changes a merchant's commission rate, the cached rate continues to be applied until the cache expires. For a high-volume merchant, this means all transactions between the admin change and cache expiry use the wrong commission — a financial discrepancy.

---

### D-7 · No Transaction Rollback on Partial Payout Batch `[HIGH]`

**File:** `src/modules/payments/processors/payout.processor.ts`

Payout processors batch 10 orders and send them to external PGs. If order #5 succeeds but the processor crashes before orders #6–10 are sent:

- Orders #1–5 are processed at the PG level
- Orders #1–5 may or may not be marked as complete in the DB (depends on where the crash occurred)
- The wallet debit for #1–5 may have already happened
- On job retry, the processor re-sends orders #1–5 to the PG — potential duplicate disbursements

---

### D-8 · Settlement Logic Lacks Double-Entry Accounting `[HIGH]`

The system uses a single-entry model: a `WalletEntity` with running balances (`totalCollections`, `availablePayoutBalance`). There is no double-entry ledger. This means:

- Any bug that credits without debiting (or vice versa) creates phantom money with no audit trail
- Reconciliation against PG reports requires full table scans
- Financial auditors cannot independently verify the books

---

### D-9 · No Soft Delete on Financial Records `[MEDIUM]`

The `ACCOUNT_STATUS.DELETED` enum marks users as deleted but it's unclear if payin/payout orders, transactions, and settlements are retained. If any financial entity is hard-deleted (even accidentally), the transaction history is permanently lost. Financial regulations (RBI) require transaction records for 5–10 years.

---

## Category 3 — Architecture Loopholes

### A-1 · In-Memory CacheMonitorService Unusable in Cluster Mode `[HIGH]`

**File:** `src/shared/services/cache-monitor.service.ts`

`CacheMonitorService` maintains hit/miss metrics in Node.js memory. With 6 PM2 cluster instances, each process has **its own independent copy**. Cache hit metrics from one instance are invisible to others. Aggregated metrics are meaningless — a "90% hit rate" shown by one instance actually represents 1/6th of traffic. Debugging cache performance in production is impossible.

---

### A-2 · No Dead Letter Queue for Failed Jobs `[HIGH]`

**File:** `src/modules/payments/processors/`

Bull jobs retry 3 times with exponential backoff, then fail permanently. Failed jobs have no Dead Letter Queue (DLQ). There is no alerting, no dashboard, no recovery path. A payin order that fails to insert after 3 retries is silently dropped — the merchant's dashboard shows the payment was initiated but it never appears in their transaction list. Manual DB investigation is required to reconcile.

---

### A-3 · Single Redis — Single Point of Failure for Everything `[HIGH]`

Redis is used for: JWT auth (user cache), 2FA OTPs, API key cache, Bull queues (all 7 queues), application cache (stats, commission plans), rate-limit counters. A single Redis instance going down:

- Kills all authentication (AuthGuard falls back to DB but cache misses propagate DB load spikes)
- Drops all queued payin/payout jobs
- Removes all in-flight 2FA tokens (users mid-login get locked out)
- Invalidates all stats caches (cold start causes DB hammering)

There is no Redis Sentinel, Redis Cluster, or failover configuration.

---

### A-4 · No API Versioning Deprecation Strategy `[MEDIUM]`

Endpoints exist at v1, v2, v3, v4 without documentation of what changed between versions or a deprecation timeline. Merchants integrating against v1 will break silently when v1 is removed. There is no `Deprecated` response header or sunset date mechanism.

---

### A-5 · Hardcoded Business Logic in Guards and Services `[MEDIUM]`

Business rules like "max 3 login attempts", "commission 30-day cache", "webhook IP lists" are hardcoded as constants or env vars. Changes require code deployment. For a platform serving many merchants with different SLAs, these should be configurable per-merchant in the database.

---

### A-6 · KYC Guards Commented Out — Enforcement Bypassed `[HIGH]`

**File:** `src/app.module.ts`

```typescript
// BusinessDetailsGuard,
// KycGuard,
```

Both `BusinessDetailsGuard` and `KycGuard` are commented out from the global guard list. This means merchants with incomplete KYC or missing business details can still call payin/payout endpoints. The `@IgnoreKyc()` decorator exists but the base enforcement is disabled, making the entire KYC gating non-functional system-wide.

---

### A-7 · 10 MB JSON Body Limit is a DoS Vector `[MEDIUM]`

**File:** `src/main.ts`

```typescript
app.use(json({ limit: "10mb" }));
```

A 10 MB JSON body on a financial API is excessive. Typical payin/payout requests are < 1 KB. An attacker can flood the API with 10 MB payloads, consuming CPU for JSON parsing and memory buffers per request. This is a simple application-layer DoS vector.

---

### A-8 · No Graceful Shutdown `[MEDIUM]`

**File:** `src/main.ts`

`app.enableShutdownHooks()` is not called. On SIGTERM (PM2 reload, container restart):

- In-flight HTTP requests are abruptly terminated (503 to clients)
- Bull job processors mid-execution are killed (job may be re-queued and retried, causing duplicates — see D-3, D-7)
- Open DB connections are not cleanly returned to the pool
- Active QueryRunners (wallet updates) may leave rows locked

---

### A-9 · No Correlation/Trace IDs `[MEDIUM]`

No request-scoped trace ID is generated and threaded through logs. Debugging a failed payment requires manually correlating timestamps across PM2 instance logs, Bull processor logs, and DB query logs. For a multi-PG system with async queues, this makes incident response extremely slow.

---

### A-10 · Handlebars Templates for Payment Pages Are a Security/Maintenance Risk `[MEDIUM]`

**File:** `src/modules/payments/`

Using server-side `.hbs` templates for the GeoPay checkout form and payment response pages creates:

- Template injection risk if any user-controlled data is rendered without escaping
- Tightly coupled rendering logic in the payment service
- No frontend build pipeline (no CSP nonce generation, no asset fingerprinting)
- Cannot be served from CDN

---

## Category 4 — Scalability / Orchestration Platform Loopholes

If Rupeeflow is to be evolved into an orchestration platform (routing payments across multiple PGs for many high-volume merchants), the following architectural constraints will become blockers.

### O-1 · No Smart PG Routing / Failover `[CRITICAL]`

**File:** `src/modules/payments/services/integration-payin-router.service.ts`

The current routing is a simple `switch` statement based on `UserIntegrationMapping`. There is:

- No fallback routing (if ONIK is down → try GEOPAY)
- No success-rate-based routing (send to PG with best recent success rate)
- No load balancing across PGs
- No circuit breaker (a failing PG keeps getting requests until manually changed)

For an orchestration platform, this is the core feature that must be completely redesigned.

---

### O-2 · No Tenant Isolation at DB Level `[CRITICAL]`

All merchants share the same PostgreSQL tables with `userId` as a discriminator. At scale (1000+ active merchants):

- A single merchant running high-volume analytics queries creates lock contention for all others
- No row-level security (RLS) prevents data leakage if a query bug occurs
- Impossible to give high-value merchants dedicated read replicas or query priority
- Cannot comply with data residency requirements per merchant

---

### O-3 · Single PostgreSQL — No Read Replicas `[HIGH]`

All analytics queries (business trends, hourly analytics, conversion rates, failure analytics) run on the same PostgreSQL instance as OLTP transactions. Heavy analytical queries will cause read-write lock contention, slow down payment inserts, and increase wallet update latency during report generation.

---

### O-4 · Adding a New PG Requires Code Changes + Deployment `[HIGH]`

To add a new payment gateway, a developer must:
1. Create a new service class
2. Add a new Bull queue
3. Add a new Bull processor
4. Add new webhook route + handler
5. Update `IntegrationPayinRouterService` switch statement
6. Add PG credentials to `.env` and `app.config.ts`
7. Run migration to add the new integration enum

This is not scalable for a platform aiming to support 20+ PGs. Should be a plugin/adapter architecture with a registry.

---

### O-5 · Bull Queue Architecture Doesn't Scale to Multi-Tenant `[HIGH]`

Currently: one queue per PG type, all merchants share the queue. Problems at scale:

- A single high-volume merchant saturates the queue, starving other merchants
- No per-merchant priority levels
- No per-merchant queue depth visibility
- SLA guarantees (e.g., "enterprise merchant gets sub-5s payment processing") are impossible to implement

---

### O-6 · No Financial Reconciliation Engine `[HIGH]`

There is no automated reconciliation service that:
- Downloads settlement reports from each PG
- Cross-checks them against internal `payin_orders`/`transactions` tables
- Flags mismatches (PG says SUCCESS but internal status is PENDING, or vice versa)

In production, PG callbacks are missed, networks drop, and systems crash. Without reconciliation, un-reconciled transactions accumulate silently. This is a regulatory compliance requirement under RBI guidelines for payment aggregators.

---

### O-7 · No Event Sourcing / Event Log `[HIGH]`

Transaction state changes (INITIATED → PENDING → SUCCESS/FAILED) are tracked only by updating the `status` column. There is no event log recording who changed the status, when, from what previous state, and why. This means:

- Cannot answer "who approved this settlement and when?"
- Cannot replay state to debug a specific incident
- Cannot build reliable audit reports for RBI compliance
- Cannot feed a real-time event stream to downstream systems (analytics, notifications)

---

### O-8 · No Multi-Region or Zone-Aware Deployment `[MEDIUM]`

The PM2 config hardcodes `TZ: "Asia/Calcutta"`. The entire system is single-region. For an orchestration platform:

- A regional outage takes down the entire platform
- Latency for merchants outside Mumbai/Bangalore regions will be high
- No multi-AZ DB setup (RDS Multi-AZ or PostgreSQL streaming replication)

---

### O-9 · No Webhook Retry / Delivery Guarantee to Merchants `[HIGH]`

When Rupeeflow notifies merchants of payment status via their configured webhook URL, there is no retry mechanism if the merchant's server is temporarily down. The webhook fires once and is forgotten. Merchants miss payment notifications and must poll the status API, which defeats the purpose of webhooks.

---

### O-10 · No Merchant Sandbox / Test Environment Isolation `[MEDIUM]`

`ACCOUNT_STATUS.TEST_DELETED` and `PAYMENT_STATUS.TEST` enum values suggest test functionality, but test transactions and live transactions appear to share the same tables. An orchestration platform needs complete sandbox/production environment separation at the data layer.

---

## Category 5 — Operational / DevOps Loopholes

### DEV-1 · No Health Checks for Redis, PostgreSQL, or Queues `[HIGH]`

The only health check is `GET /api/health-check` which verifies the HTTP layer is up. There are no Kubernetes/ECS-style readiness/liveness probes that check:

- PostgreSQL connectivity and pool status
- Redis connectivity
- Bull queue processor status
- Disk space (for logs)

A deployment where Redis is down will pass the health check and receive traffic, then fail all authenticated requests.

---

### DEV-2 · No Database Connection Pool Configuration `[HIGH]`

**File:** `src/config/db.config.ts`

TypeORM defaults are used (`pool.max` defaults to 10). With 6 PM2 instances × 30 concurrent processors = potential 180 simultaneous DB connections from processors alone, before counting HTTP request handlers. The PostgreSQL default `max_connections` is 100. This will cause connection exhaustion at moderate load, causing all DB operations to queue or fail.

---

### DEV-3 · PM2 Memory Limit Too Low `[MEDIUM]`

**File:** `ecosystem.config.js`

```javascript
max_memory_restart: "500M"
```

Each instance handles: in-memory JS heap, Bull job queues (in-memory before Redis flush), NestJS DI container, TypeORM connection pool, Redis client connections, Winston log buffers. 500 MB per instance is likely insufficient under load, causing frequent PM2 restarts — which kill in-flight requests and queued jobs.

---

### DEV-4 · `redis:latest` — Unpinned Docker Image Tag `[MEDIUM]`

**File:** `docker-compose.yml`

Using `redis:latest` will silently pick up a new major Redis version on the next `docker-compose pull`, potentially introducing breaking changes (protocol changes, configuration syntax changes, deprecated commands).

---

### DEV-5 · No Log Aggregation or Rotation `[MEDIUM]`

Winston logs to console/file without rotation. In PM2 cluster mode, 6 processes write logs independently. Without a log aggregator (ELK, Loki, CloudWatch), correlating logs across instances is manual. Without rotation, disk will fill on long-running instances.

---

### DEV-6 · No APM or Metrics Instrumentation `[MEDIUM]`

There is no Prometheus metrics endpoint, no DataDog/New Relic agent, no OpenTelemetry instrumentation. `DatabaseMonitorService` and `CacheMonitorService` are rudimentary in-process monitors. Real performance issues (slow DB queries, memory leaks, event loop lag) will only be discovered after production incidents.

---

### DEV-7 · Migrations Not Verified in CI/CD `[MEDIUM]`

The `deploy:prod` script likely runs migrations, but there is no CI step that validates that the TypeORM entity definitions match the last migration. A mismatch between entities and the DB schema (common when `synchronize: false`) causes silent runtime errors on columns that exist in entity but not in DB, or vice versa.

---

## Category 6 — Code Quality Loopholes

### Q-1 · Encryption Key Length Not Validated at Startup `[HIGH]`

AES-256-CBC requires a 32-byte key and 16-byte IV. AES-256-CTR requires the same. These values are read from environment variables as strings. There is no startup validation that the key/IV lengths are exactly correct. A misconfigured environment variable (e.g., 31 chars instead of 32) will silently produce incorrect encryption or runtime crashes under Node.js crypto module.

---

### Q-2 · `any` Types in External API Response Handlers `[MEDIUM]`

Integration services that call external PGs (Onik, GeoPay, Utkarsh, Fyntra, KDS) map response fields manually. Untyped `any` responses mean TypeScript provides no safety — a field name change in the PG's API response silently produces `undefined` values that propagate into DB writes (e.g., `utr: undefined` stored on a SUCCESS transaction).

---

### Q-3 · Error Messages Leak Internal Structure `[MEDIUM]`

**File:** `src/filters/http-exceptions.filter.ts`

Non-HTTP exceptions return `500 { message: error.message }`. TypeORM errors (e.g., unique constraint violations, connection refused messages) contain database table names, column names, and connection strings. These are returned directly to API clients, leaking internal architecture.

---

### Q-4 · No Input Sanitization for Free-Text Fields `[MEDIUM]`

DTOs validate field types and lengths but don't sanitize HTML/script content in free-text fields (business name, address, description, notes). These fields are rendered in invoices (server-side) and potentially in the dashboard frontend. XSS payloads stored in these fields could execute when rendered.

---

### Q-5 · Inconsistent Error Handling Across PG Integrations `[LOW]`

Each PG integration handles errors differently — some throw `HttpException`, some return null, some return error objects. There is no unified error taxonomy for PG failures. Upstream error handling (in controllers) must deal with multiple error shapes, creating inconsistent HTTP responses to merchants.

---

## Category 7 — Compliance / Regulatory Loopholes

### C-1 · No PII Encryption at Rest `[CRITICAL]`

Bank account numbers, IFSC codes, PAN numbers, Aadhaar numbers (from KYC), mobile numbers, and email addresses are stored as plaintext in PostgreSQL. Under RBI's data localization guidelines and DPDP Act 2023, PII must be encrypted at rest. A DB breach directly exposes all customer PII.

---

### C-2 · No Audit Log `[HIGH]`

There is no dedicated audit log table recording:
- Who made admin actions (role changes, settlement initiations, account status changes)
- What the previous and new values were
- When the action occurred and from which IP

This is required for RBI payment aggregator compliance and for internal fraud detection.

---

### C-3 · KYC Document Access Not Access-Controlled Post-Upload `[HIGH]`

**File:** `src/modules/kyc/kyc.service.ts`

S3 presigned PUT URLs are generated for KYC document upload with a 1-hour expiry. However, the stored S3 keys follow a predictable pattern: `kyc/<timestamp>-<filename>`. If the S3 bucket's access policy is misconfigured (common mistake), KYC documents (PAN, Aadhaar, bank statements) may be publicly accessible by guessing the key. Additionally, there is no verification step that confirms the uploaded document matches the presigned key before marking KYC as submitted.

---

### C-4 · No Transaction Dispute / Chargeback Workflow `[HIGH]`

There is no dispute management system. When a merchant or customer disputes a transaction, there is no internal workflow, no status tracking, and no evidence collection mechanism. This is a required feature for RBI-regulated payment aggregators.

---

### C-5 · Password Reset Token Not Single-Use `[MEDIUM]`

**File:** `src/modules/auth/auth.service.ts`

The `forget_pwd_{id}` Redis key used in forgot-password flow stores a token with a 15-minute TTL. If the token is cached and the TTL hasn't expired, the same token can be used multiple times to reset the password (pending verification of whether the token is invalidated post-use in the service code).

---

## Summary Table

| ID | Severity | Category | Title |
|----|----------|----------|-------|
| S-1 | CRITICAL | Security | Fixed IV in AES-256-CBC login encryption |
| S-2 | CRITICAL | Security | No rate limiting on any public endpoint |
| S-3 | CRITICAL | Security | Webhook IP validation bypass via X-Forwarded-For |
| S-4 | HIGH | Security | API key encryption without authentication (CTR mode) |
| S-5 | HIGH | Security | 2FA via email — weak, brute-forceable |
| S-6 | HIGH | Security | Production secrets baked into Docker image |
| S-7 | HIGH | Security | Cookies insecure in non-production environments |
| S-8 | HIGH | Security | No webhook signature verification |
| S-9 | HIGH | Security | Sensitive data leaking into application logs |
| S-10 | MEDIUM | Security | No PKCE/state in Google OAuth |
| S-11 | MEDIUM | Security | Login lock per-email only — no IP-level protection |
| S-12 | MEDIUM | Security | API key cache 30 days — no revocation propagation |
| S-13 | MEDIUM | Security | CSP may require unsafe-inline for payment pages |
| D-1 | CRITICAL | Data Integrity | No idempotency keys on payin creation |
| D-2 | CRITICAL | Data Integrity | Webhook arrives before async DB insert completes |
| D-3 | CRITICAL | Data Integrity | No webhook deduplication — double-crediting risk |
| D-4 | CRITICAL | Data Integrity | Bull queue jobs lost on Redis crash |
| D-5 | HIGH | Data Integrity | Optimistic wallet locking with no retry logic |
| D-6 | HIGH | Data Integrity | Stale commission plan cache causes wrong rates |
| D-7 | HIGH | Data Integrity | No rollback on partial payout batch |
| D-8 | HIGH | Data Integrity | Single-entry accounting — no double-entry ledger |
| D-9 | MEDIUM | Data Integrity | Financial records lack guaranteed soft-delete |
| A-1 | HIGH | Architecture | In-memory cache monitor unusable in cluster mode |
| A-2 | HIGH | Architecture | No Dead Letter Queue for failed Bull jobs |
| A-3 | HIGH | Architecture | Single Redis — total SPOF for all subsystems |
| A-4 | MEDIUM | Architecture | No API deprecation strategy |
| A-5 | MEDIUM | Architecture | Business rules hardcoded — not configurable per merchant |
| A-6 | HIGH | Architecture | KYC guards commented out — enforcement disabled |
| A-7 | MEDIUM | Architecture | 10 MB JSON body limit is a DoS vector |
| A-8 | MEDIUM | Architecture | No graceful shutdown |
| A-9 | MEDIUM | Architecture | No correlation/trace IDs |
| A-10 | MEDIUM | Architecture | HBS payment templates are security/maintenance risk |
| O-1 | CRITICAL | Orchestration | No smart PG routing or failover |
| O-2 | CRITICAL | Orchestration | No tenant isolation at DB level |
| O-3 | HIGH | Orchestration | Single PostgreSQL — no read replicas |
| O-4 | HIGH | Orchestration | Adding a new PG requires code deployment |
| O-5 | HIGH | Orchestration | Bull queues don't scale to multi-tenant |
| O-6 | HIGH | Orchestration | No financial reconciliation engine |
| O-7 | HIGH | Orchestration | No event sourcing / event log |
| O-8 | MEDIUM | Orchestration | No multi-region or zone-aware deployment |
| O-9 | HIGH | Orchestration | No webhook retry / delivery guarantee to merchants |
| O-10 | MEDIUM | Orchestration | No merchant sandbox / test environment isolation |
| DEV-1 | HIGH | DevOps | Health checks don't verify Redis/DB/queues |
| DEV-2 | HIGH | DevOps | No DB connection pool configuration |
| DEV-3 | MEDIUM | DevOps | PM2 memory limit too low |
| DEV-4 | MEDIUM | DevOps | Unpinned `redis:latest` Docker tag |
| DEV-5 | MEDIUM | DevOps | No log aggregation or rotation |
| DEV-6 | MEDIUM | DevOps | No APM or metrics instrumentation |
| DEV-7 | MEDIUM | DevOps | Migrations not verified in CI/CD |
| Q-1 | HIGH | Code Quality | Encryption key length not validated at startup |
| Q-2 | MEDIUM | Code Quality | `any` types in external API response handlers |
| Q-3 | MEDIUM | Code Quality | Error messages leak DB table names and internals |
| Q-4 | MEDIUM | Code Quality | No input sanitization on free-text fields |
| Q-5 | LOW | Code Quality | Inconsistent error handling across PG integrations |
| C-1 | CRITICAL | Compliance | PII stored as plaintext — RBI/DPDP violation |
| C-2 | HIGH | Compliance | No audit log for admin actions |
| C-3 | HIGH | Compliance | KYC documents potentially publicly accessible on S3 |
| C-4 | HIGH | Compliance | No dispute/chargeback workflow |
| C-5 | MEDIUM | Compliance | Password reset token may be reusable |

---

## Critical Count by Category

| Category | CRITICAL | HIGH | MEDIUM | LOW | Total |
|----------|----------|------|--------|-----|-------|
| Security | 3 | 6 | 4 | 0 | 13 |
| Data Integrity | 4 | 4 | 1 | 0 | 9 |
| Architecture | 0 | 4 | 6 | 0 | 10 |
| Orchestration | 2 | 6 | 2 | 0 | 10 |
| DevOps | 0 | 2 | 5 | 0 | 7 |
| Code Quality | 0 | 1 | 3 | 1 | 5 |
| Compliance | 1 | 3 | 1 | 0 | 5 |
| **TOTAL** | **10** | **26** | **22** | **1** | **59** |

> *Note: Some issues are related and overlap slightly across categories.*

---

*End of Report — Rupeeflow Architecture Audit — March 2026*
