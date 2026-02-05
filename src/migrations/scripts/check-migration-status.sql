-- Check Migration Status
-- This script helps you understand the current state of migrations in your database

-- Check if migrations table exists and show count
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'migrations')
        THEN (SELECT COUNT(*)::text FROM migrations)
        ELSE 'Migrations table does not exist'
    END as migration_count;

-- Show all recorded migrations (if table exists)
SELECT 
    timestamp,
    name,
    TO_TIMESTAMP(timestamp / 1000) as executed_at
FROM migrations
ORDER BY timestamp;

-- Check if key tables exist (from the Start migration)
SELECT 
    table_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = t.table_name
        ) THEN 'EXISTS'
        ELSE 'MISSING'
    END as status
FROM (VALUES 
    ('user_api_keys'),
    ('users'),
    ('wallets'),
    ('payin_orders'),
    ('payout_orders'),
    ('transactions'),
    ('settlements')
) AS t(table_name);

-- Check for specific columns that were added in later migrations
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE (table_name = 'payin_orders' AND column_name = 'checkoutData')
   OR (table_name = 'users' AND column_name = 'googleId')
   OR (table_name = 'wallets' AND column_name = 'version')
ORDER BY table_name, column_name;
