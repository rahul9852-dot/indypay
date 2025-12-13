-- ============================================================
-- Check Production Migration Status
-- ============================================================
-- Run this in production to understand the current state
-- ============================================================

-- 1. Total migrations in database
SELECT COUNT(*) as total_migrations FROM migrations;

-- 2. List all migrations (most recent first)
SELECT
    id,
    timestamp,
    name,
    to_char(to_timestamp(timestamp::bigint / 1000), 'YYYY-MM-DD HH24:MI:SS') as executed_date
FROM migrations
ORDER BY timestamp DESC
LIMIT 20;

-- 3. Find the last executed migration
SELECT
    timestamp,
    name,
    to_char(to_timestamp(timestamp::bigint / 1000), 'YYYY-MM-DD HH24:MI:SS') as last_executed
FROM migrations
ORDER BY timestamp DESC
LIMIT 1;

-- 4. Check if checkoutData column exists
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'payin_orders'
    AND column_name = 'checkoutData';

-- 5. Check if checkoutData migration was recorded
SELECT * FROM migrations
WHERE name LIKE '%Checkout%';

-- 6. Check critical tables exist
SELECT
    table_name,
    CASE
        WHEN EXISTS (
            SELECT FROM information_schema.tables t
            WHERE t.table_schema = 'public'
            AND t.table_name = tables.table_name
        ) THEN 'EXISTS ✓'
        ELSE 'MISSING ✗'
    END as status
FROM (
    VALUES
        ('user_api_keys'),
        ('payin_orders'),
        ('payout_orders'),
        ('users'),
        ('wallets'),
        ('transactions'),
        ('migrations')
) AS tables(table_name);

-- 7. Check payin_orders structure
SELECT
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'payin_orders'
ORDER BY ordinal_position;

-- ============================================================
-- Use this information to decide which fix script to run
-- ============================================================
