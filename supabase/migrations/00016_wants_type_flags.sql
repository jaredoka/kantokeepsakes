-- Add wants type flags to listings
-- These track what specific trade types a lister is open to
ALTER TABLE listings ADD COLUMN IF NOT EXISTS wants_cash boolean NOT NULL DEFAULT false;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS wants_singles boolean NOT NULL DEFAULT false;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS wants_graded boolean NOT NULL DEFAULT false;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS wants_sealed boolean NOT NULL DEFAULT false;

-- Backfill: listings with a price probably want cash
UPDATE listings SET wants_cash = true WHERE price IS NOT NULL AND wants_cash = false;
