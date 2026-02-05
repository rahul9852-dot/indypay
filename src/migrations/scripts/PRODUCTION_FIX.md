# Production Migration Fix - Quick Guide

## Problem
You're getting this error in production:
```
error: relation "user_api_keys" already exists
Migration "Start1736502134195" failed
```

## Root Cause
Your production database has tables that were created previously, but the `migrations` table doesn't have records showing those migrations were executed. TypeORM tries to run all migrations from scratch and fails because tables already exist.

## Immediate Fix (Choose One)

### Option 1: Sync Migrations Table (RECOMMENDED)

Run this SQL script to mark all existing migrations as executed:

```bash
# Connect to your production database
psql -U your_db_user -d your_production_db -f src/migrations/scripts/sync-production-migrations.sql
```

This will:
- Insert all 38 migration records into the migrations table
- Make future `npm run mig:run` commands work correctly
- Safe to run multiple times (idempotent)

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

## Code Changes Made

The `Start1736502134195` migration has been updated to be idempotent:
- All `CREATE TABLE` statements now use `IF NOT EXISTS`
- All `CREATE INDEX` statements now use `IF NOT EXISTS`
- This prevents future "relation already exists" errors

**Note:** You still need to sync the migrations table using the SQL script above.

## Prevention

To avoid this in the future:
1. Always verify migrations table is updated after deployment
2. Check migration status before deploying:
   ```bash
   npm run typeorm -- migration:show -d ./src/config/migration.config.ts
   ```
3. Always backup production before running migrations
