-- Add wants_offers boolean to listings
-- This explicitly tracks whether a lister is open to offers,
-- separate from cash (price) and card trades (looking_for_*)
ALTER TABLE listings ADD COLUMN IF NOT EXISTS wants_offers boolean NOT NULL DEFAULT false;

-- Backfill: set wants_offers = true for listings that have no price and no looking_for data
UPDATE listings
SET wants_offers = true
WHERE price IS NULL
  AND (looking_for_description IS NULL OR looking_for_description = '')
  AND (looking_for_images IS NULL OR looking_for_images = '{}');
