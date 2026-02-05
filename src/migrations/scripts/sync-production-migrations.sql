-- Sync Production Migrations
-- This script marks all existing migrations as executed in the migrations table
-- Use this when your database has tables but the migrations table is out of sync

-- Ensure migrations table exists (TypeORM creates this, but just in case)
CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    timestamp BIGINT NOT NULL,
    name VARCHAR NOT NULL UNIQUE
);

-- Insert all migrations (using ON CONFLICT to make it idempotent)
-- This will only insert migrations that don't already exist in the table

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
(1742357092281, 'AddpaymentMethod1742357092281'),
(1747811069092, 'FlatCommissionColumn1747811069092'),
(1750320254019, 'AddBeneMobileNo1750320254019'),
(1753555321852, 'KybDoc1753555321852'),
(1754332826573, 'AddedVersionColumn1754332826573'),
(1754332826575, 'QuickWalletIndexFix1754332826575'),
(1765647235092, 'AddedCheckoutDataColumnInPayinOrder1765647235092'),
(1767781624597, 'CreateIntegrationMapping1767781624597'),
(1768561542242, 'CommissionPayinWallet1768561542242'),
(1768993130033, 'AddedGoogleId1768993130033'),
(1769065919943, 'RemoveNotNullInMobileUser1769065919943'),
(1769065995157, 'RemoveNotNullInPasswordUser1769065995157'),
(1770042132181, 'AddHSNCode1770042132181')
ON CONFLICT (name) DO NOTHING;

-- Verify the insert
SELECT COUNT(*) as total_migrations FROM migrations;
SELECT name FROM migrations ORDER BY timestamp;
