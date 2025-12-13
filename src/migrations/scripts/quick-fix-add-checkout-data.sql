-- ============================================================
-- Quick Fix: Add checkoutData Column (RECOMMENDED)
-- ============================================================
-- Run this in production to quickly add the checkoutData column
-- without dealing with migration sync issues
-- ============================================================

-- Add the column (safe - won't fail if already exists)
ALTER TABLE payin_orders
ADD COLUMN IF NOT EXISTS "checkoutData" jsonb;

-- Add documentation comment
COMMENT ON COLUMN payin_orders."checkoutData"
IS 'Stores GeoPay checkout form data including merchantId, signature, callback URL, etc.';

-- Mark this migration as executed so it doesn't try to run again
INSERT INTO migrations (timestamp, name)
VALUES (1765647235092, 'AddedCheckoutDataColumnInPayinOrder1765647235092')
ON CONFLICT (timestamp) DO NOTHING;

-- Verification: Check if column was added
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'payin_orders'
    AND column_name = 'checkoutData';

-- Verification: Check if migration was recorded
SELECT * FROM migrations
WHERE name = 'AddedCheckoutDataColumnInPayinOrder1765647235092';

-- ============================================================
-- Done! Your application should work now
-- ============================================================
