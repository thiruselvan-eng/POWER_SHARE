-- ============================================================
-- PowerShare Schema Migration Script
-- Run on PostgreSQL DB (Render / Supabase / Neon / Local)
-- ============================================================

-- 1. Add available_energy_kwh to batteries if missing
ALTER TABLE batteries ADD COLUMN IF NOT EXISTS available_energy_kwh double precision;

-- Populate available_energy_kwh from current_charge_kwh or capacity_kwh
UPDATE batteries
SET available_energy_kwh = COALESCE(current_charge_kwh, capacity_kwh)
WHERE available_energy_kwh IS NULL;

-- Drop legacy NOT NULL constraints on batteries
ALTER TABLE batteries ALTER COLUMN current_charge_kwh DROP NOT NULL;
ALTER TABLE batteries ALTER COLUMN voltage DROP NOT NULL;
ALTER TABLE batteries ALTER COLUMN serial_number DROP NOT NULL;

-- Drop old status check constraint on batteries
ALTER TABLE batteries DROP CONSTRAINT IF EXISTS batteries_status_check;

-- Add new status check constraint matching BatteryStatus enum
ALTER TABLE batteries ADD CONSTRAINT batteries_status_check
    CHECK (status::text = ANY (ARRAY[
        'AVAILABLE',
        'CHARGING',
        'RESERVED',
        'MAINTENANCE',
        'SOLD_OUT'
    ]::text[]));

-- Update old status values
UPDATE batteries SET status = 'AVAILABLE' WHERE status IN ('RENTED', 'IN_TRANSIT');

-- 2. Add missing columns and drop legacy constraints on energy_listings
ALTER TABLE energy_listings ADD COLUMN IF NOT EXISTS delivery_available boolean NOT NULL DEFAULT false;
ALTER TABLE energy_listings ADD COLUMN IF NOT EXISTS min_purchase_kwh double precision;
ALTER TABLE energy_listings ALTER COLUMN delivery_radius_km DROP NOT NULL;

-- 3. Drop delivery_assignments table & update orders status
ALTER TABLE delivery_assignments DROP CONSTRAINT IF EXISTS fkal6lp5gq27djtgpdsn2907uq5;
DROP TABLE IF EXISTS delivery_assignments;

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
    CHECK (status::text = ANY (ARRAY[
        'PENDING',
        'ACCEPTED',
        'COMPLETED',
        'CANCELLED'
    ]::text[]));

UPDATE orders SET status = 'ACCEPTED'  WHERE status = 'DISPATCHED';
UPDATE orders SET status = 'COMPLETED' WHERE status IN ('RETURN_PENDING', 'RETURNED');

-- 4. Clean up legacy roles
UPDATE users SET role = 'ROLE_BUYER' WHERE role = 'ROLE_DELIVERY';

SELECT 'PowerShare DB Migration Completed Successfully!' AS status;
