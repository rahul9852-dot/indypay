-- ============================================================
-- Fix: Insert migrations into EMPTY migrations table
-- ============================================================
-- This script is for production where migrations table is empty
-- ============================================================

-- First, check the structure of the migrations table
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'migrations'
ORDER BY ordinal_position;

-- Check for any constraints on migrations table
SELECT
    conname as constraint_name,
    contype as constraint_type
FROM pg_constraint
WHERE conrelid = 'migrations'::regclass;

-- Since migrations table is EMPTY and has no unique constraint,
-- we can insert directly WITHOUT ON CONFLICT

-- Insert all old migrations as already executed
INSERT INTO migrations (timestamp, name) VALUES
(1736502134195, 'Start1736502134195'),
(1736590106622, 'WalletPayout1736590106622'),
(1736592548552, 'WalletPayout1736592548552'),
(1736757540444, 'AddPayoutTableBulkId1736757540444'),
(1736764555962, 'AddBankDetailsPayout1736764555962'),
(1736766627084, 'FullNameUser1736766627084'),
(1737291044799, 'AddPurposeRemarksPayout1737291044799'),
(1737364960201, 'WalletTopup1737364960201'),
(1738144846896, 'InvoiceAndCustomerTable1738144846896'),
(1738147513920, 'InvoiceAndCustomerTable1738147513920'),
(1739195019375, 'ApiCredentials1739195019375'),
(1739200719295, 'Mispelled1739200719295'),
(1739349288297, 'InvoiceItem1739349288297'),
(1739464839130, 'Addedextracolumn1739464839130'),
(1739465019127, 'AddpayoutServicecharge1739465019127'),
(1739525569950, 'AddPayoutDisabledFromDashboard1739525569950'),
(1739534192391, 'AddPayoutId1739534192391'),
(1739534526456, 'AddPayoutId1739534526456'),
(1739639191798, 'FixWallet1739639191798'),
(1739681766574, 'Utr1739681766574'),
(1739713288953, 'UpdateUser1739713288953'),
(1739720422226, 'UserUpdate1739720422226'),
(1739920678432, 'IndexingOnTable1739920678432'),
(1740033714595, 'AddTwoFaInUser1740033714595'),
(1740377662509, 'WalletUpdate1740377662509'),
(1742357092281, 'Addpayment-Method1742357092281'),
(1747811069092, 'flatCommissionColumn1747811069092'),
(1750320254019, 'AddBeneMobileNo1750320254019'),
(1753555321852, 'KybDoc1753555321852'),
(1754332826573, 'AddedVersionColumn1754332826573'),
(1754332826575, 'QuickWalletIndexFix1754332826575'),
(1765647235092, 'AddedCheckoutDataColumnInPayinOrder1765647235092');

-- Verify all migrations were inserted
SELECT COUNT(*) as total_migrations FROM migrations;

-- Show last 10 migrations
SELECT
    timestamp,
    name,
    to_char(to_timestamp(timestamp::bigint / 1000), 'YYYY-MM-DD HH24:MI:SS') as migration_date
FROM migrations
ORDER BY timestamp DESC
LIMIT 10;

-- Verify checkoutData migration is recorded
SELECT * FROM migrations WHERE name LIKE '%Checkout%';

-- Verify checkoutData column exists
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'payin_orders' AND column_name = 'checkoutData';

-- ============================================================
-- Done! Now TypeORM knows all migrations have been executed
-- Future migrations will work correctly with npm run mig:run
-- ============================================================
