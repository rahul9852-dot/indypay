-- Step 1: First, let's see what's currently in the migrations table
SELECT COUNT(*) as current_migration_count FROM migrations;

-- Step 2: Check if the migrations table is empty or has some records
SELECT * FROM migrations ORDER BY timestamp DESC LIMIT 5;

-- Step 3: Insert ALL migration records (marking them as already executed)
-- This tells TypeORM: "These migrations already ran, don't run them again"

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
(1754332826575, 'QuickWalletIndexFix1754332826575')
ON CONFLICT (timestamp) DO NOTHING;

-- Step 4: Verify all old migrations are now marked as executed
SELECT COUNT(*) as total_migrations_now FROM migrations;

-- Step 5: Check the last migration
SELECT timestamp, name FROM migrations ORDER BY timestamp DESC LIMIT 1;

-- Step 6: Now you can safely add the new checkoutData column
ALTER TABLE payin_orders ADD COLUMN IF NOT EXISTS "checkoutData" jsonb;

-- Step 7: Mark the new migration as executed
INSERT INTO migrations (timestamp, name)
VALUES (1765647235092, 'AddedCheckoutDataColumnInPayinOrder1765647235092')
ON CONFLICT (timestamp) DO NOTHING;

-- Step 8: Final verification
SELECT * FROM migrations WHERE name LIKE '%Checkout%';
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'payin_orders' AND column_name = 'checkoutData';

-- Success! Now TypeORM thinks all migrations are up to date
