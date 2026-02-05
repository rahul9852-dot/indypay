# Production Migration Fix - Quick Guide

## Problem
You're getting this error in production:
```
error: relation "user_api_keys" already exists
Migration "Start1736502134195" failed
```

## Root Cause
Your production database has tables that were created previously, but the `migrations` table doesn't have records showing those migrations were executed. TypeORM tries to run all migrations from scratch and fails because tables already exist.

## ⚠️ IMPORTANT: The Real Solution

**The root cause is that your migrations table is out of sync with your database.** The proper fix is to sync the migrations table, not to make all migrations idempotent.

### ✅ RECOMMENDED: Sync Migrations Table

Run this SQL script to mark all existing migrations as executed:

```bash
# Connect to your production database
psql -U your_db_user -d your_production_db -f src/migrations/scripts/sync-production-migrations.sql
```

This will:
- Insert all 39 migration records into the migrations table
- Make future `npm run mig:run` commands work correctly
- Safe to run multiple times (idempotent)
- **This is the proper solution** - it tells TypeORM which migrations have already run

### Option 2: Check Status First

If you want to see what's in your database first:

```bash
psql -U your_db_user -d your_production_db -f src/migrations/scripts/check-migration-status.sql
```

This will show you:
- How many migrations are currently recorded
- Which tables exist
- Current migration state

## After Running the Fix

1. **Verify the fix worked:**
   ```sql
   SELECT COUNT(*) FROM migrations;
   -- Should show 38 migrations
   ```

2. **Try running migrations again:**
   ```bash
   npm run mig:run
   ```
   This should now work without errors.

## Code Changes Made (Safety Measures)

Some migrations have been updated to be idempotent as a safety measure:
- `Start1736502134195`: All `CREATE TABLE` and `CREATE INDEX` statements use `IF NOT EXISTS`
- `Start1736502134195`: All foreign key constraints check for existence before adding
- `WalletPayout1736590106622`: Column additions check for existence before adding

**However, the proper solution is still to sync your migrations table.** Making migrations idempotent is a safety measure, but the real fix is ensuring TypeORM knows which migrations have already run.

## Prevention

To avoid this in the future:
1. Always verify migrations table is updated after deployment
2. Check migration status before deploying:
   ```bash
   npm run typeorm -- migration:show -d ./src/config/migration.config.ts
   ```
3. Always backup production before running migrations
