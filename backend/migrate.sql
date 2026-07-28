-- ============================================================
-- PowerShare Schema Migration
-- Aligns DB with redesigned entities from the marketplace overhaul
-- ============================================================

-- ============================================================
-- 1. batteries table
-- ============================================================

-- Add available_energy_kwh (replaces current_charge_kwh concept)
ALTER TABLE batteries ADD COLUMN IF NOT EXISTS available_energy_kwh double precision;

-- Populate it from current_charge_kwh if not null, else capacity_kwh
UPDATE batteries
SET available_energy_kwh = COALESCE(current_charge_kwh, capacity_kwh)
WHERE available_energy_kwh IS NULL;

-- Make it not null after populating
ALTER TABLE batteries ALTER COLUMN available_energy_kwh SET NOT NULL;

-- Drop old check constraint on status (has wrong allowed values)
ALTER TABLE batteries DROP CONSTRAINT IF EXISTS batteries_status_check;

-- Add new status check constraint matching new BatteryStatus enum
ALTER TABLE batteries ADD CONSTRAINT batteries_status_check
    CHECK (status::text = ANY (ARRAY[
        'AVAILABLE',
        'CHARGING',
        'RESERVED',
        'MAINTENANCE',
        'SOLD_OUT'
    ]::text[]));

-- Update any old status values to valid new ones
UPDATE batteries SET status = 'AVAILABLE' WHERE status IN ('RENTED', 'IN_TRANSIT');

-- ============================================================
-- 2. orders table
-- ============================================================

-- Drop the foreign key from delivery_assignments first (blocks drop table)
ALTER TABLE delivery_assignments DROP CONSTRAINT IF EXISTS fkal6lp5gq27djtgpdsn2907uq5;

-- Drop delivery_assignments table entirely
DROP TABLE IF EXISTS delivery_assignments;

-- Drop old status check constraint on orders
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add new simplified status check
ALTER TABLE orders ADD CONSTRAINT orders_status_check
    CHECK (status::text = ANY (ARRAY[
        'PENDING',
        'ACCEPTED',
        'COMPLETED',
        'CANCELLED'
    ]::text[]));

-- Migrate old order statuses to valid new ones
UPDATE orders SET status = 'ACCEPTED'   WHERE status = 'DISPATCHED';
UPDATE orders SET status = 'COMPLETED'  WHERE status IN ('RETURN_PENDING', 'RETURNED');

-- ============================================================
-- 3. Clean up users table ROLE_DELIVERY if any exist
-- ============================================================
UPDATE users SET role = 'ROLE_BUYER' WHERE role = 'ROLE_DELIVERY';

-- ============================================================
-- Done
-- ============================================================
SELECT 'Migration complete!' AS result;
