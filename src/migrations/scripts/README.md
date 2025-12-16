# Migration Scripts

Helper SQL scripts for managing database migrations in production.

## Problem

When running `npm run mig:run` in production, you get:
```
error: relation "user_api_keys" already exists
Migration "Start1736502134195" failed
```

**Why?** Production database has tables already created, but the migrations table doesn't have records showing old migrations were executed. TypeORM tries to run ALL migrations from scratch → fails because tables already exist.

---

## Solution Scripts

### 🚀 1. Quick Fix (RECOMMENDED)

**File:** `quick-fix-add-checkout-data.sql`

**Use when:** You just want to add the checkoutData column and get your app working ASAP.

```bash
# Connect to production
psql -U your_user -d your_production_db -f src/migrations/scripts/quick-fix-add-checkout-data.sql
```

**What it does:**
- Adds `checkoutData` column to `payin_orders` table
- Marks the migration as executed
- Safe to run (uses `IF NOT EXISTS`)

---

### 🔍 2. Check Status First

**File:** `check-migration-status.sql`

**Use when:** You want to understand the current state before making changes.

```bash
psql -U your_user -d your_production_db -f src/migrations/scripts/check-migration-status.sql
```

**What it shows:**
- How many migrations are recorded
- Which migrations have been executed
- If checkoutData column exists
- Status of critical tables

---

### 🛠️ 3. Full Migration Sync

**File:** `sync-production-migrations.sql`

**Use when:** You want to properly sync ALL migrations for future deployments.

```bash
psql -U your_user -d your_production_db -f src/migrations/scripts/sync-production-migrations.sql
```

**What it does:**
- Marks ALL old migrations as executed (31 migrations)
- Adds checkoutData column
- Records the new migration
- Now `npm run mig:run` will work for future migrations

---

## Which Script Should I Use?

| Scenario | Script to Use |
|----------|--------------|
| Just need checkoutData working ASAP | `quick-fix-add-checkout-data.sql` ✅ |
| Want to understand what's in production | `check-migration-status.sql` |
| Want to fix migration tracking for good | `sync-production-migrations.sql` |
| Deploying for the first time | `sync-production-migrations.sql` |

---

## After Running Scripts

Verify everything worked:

```sql
-- Check column exists
SELECT column_name FROM information_schema.columns
WHERE table_name = 'payin_orders' AND column_name = 'checkoutData';

-- Check migration recorded
SELECT * FROM migrations
WHERE name = 'AddedCheckoutDataColumnInPayinOrder1765647235092';
```

---

## Prevention

To avoid this in the future:

1. **Always use migrations** - Never create tables/columns manually
2. **Track migrations** - Verify migrations table is updated after deployment
3. **Check before deploy:**
   ```bash
   npm run typeorm -- migration:show -d ./src/config/migration.config.ts
   ```
4. **Backup first** - Always backup production before running migrations

---

## Troubleshooting

**Q: Script fails with "migrations table doesn't exist"**  
A: Your database is completely new. Run `npm run mig:run` - it will create the migrations table and run all migrations.

**Q: checkoutData column already exists**  
A: Good! Just run the script to record the migration:
```sql
INSERT INTO migrations (timestamp, name)
VALUES (1765647235092, 'AddedCheckoutDataColumnInPayinOrder1765647235092');
```

**Q: I still get migration errors**  
A: Run `check-migration-status.sql` and share the output for diagnosis.

---

## Contact

If you need help, check the migration files in `src/migrations/` or consult the TypeORM documentation.
