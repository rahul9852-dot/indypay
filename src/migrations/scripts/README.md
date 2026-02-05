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

---

### 🔍 1. Check Status First

**File:** `check-migration-status.sql`

**Use when:** You want to understand the current state before making changes.

```bash
psql -U your_user -d your_production_db -f src/migrations/scripts/check-migration-status.sql
```

**What it shows:**
- How many migrations are recorded
- Which migrations have been executed
- Status of critical tables
- Existence of key columns

---

### 🛠️ 2. Full Migration Sync (RECOMMENDED)

**File:** `sync-production-migrations.sql`

**Use when:** You want to properly sync ALL migrations for future deployments.

```bash
psql -U your_user -d your_production_db -f src/migrations/scripts/sync-production-migrations.sql
```

**What it does:**
- Marks ALL old migrations as executed (38 migrations)
- Syncs the migrations table with the actual database state
- Now `npm run mig:run` will work for future migrations
- Safe to run multiple times (idempotent)

---

## Which Script Should I Use?

| Scenario | Script to Use |
|----------|--------------|
| Production database has tables but migrations table is empty | `sync-production-migrations.sql` ✅ |
| Want to understand what's in production | `check-migration-status.sql` |
| Deploying for the first time | `sync-production-migrations.sql` |

## Code Fix Applied

The `Start1736502134195` migration has been updated to be **idempotent** - it now uses `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS` statements. This means:

- ✅ The migration can be run safely even if tables already exist
- ✅ No more "relation already exists" errors
- ✅ Future deployments will be more resilient

**Note:** You still need to sync the migrations table using `sync-production-migrations.sql` to mark existing migrations as executed.

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

**Q: Tables already exist but migrations table is empty**  
A: Run `sync-production-migrations.sql` to mark all migrations as executed. This will sync your migrations table with the actual database state.

**Q: I still get migration errors**  
A: Run `check-migration-status.sql` and share the output for diagnosis.

---

## Contact

If you need help, check the migration files in `src/migrations/` or consult the TypeORM documentation.
