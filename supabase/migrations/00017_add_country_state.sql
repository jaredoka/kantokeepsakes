-- Add country and state columns to listings for geographic filtering
ALTER TABLE listings ADD COLUMN IF NOT EXISTS country text DEFAULT 'Brunei';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS state text;

-- Backfill existing listings to Brunei
UPDATE listings SET country = 'Brunei' WHERE country IS NULL;

-- Index for country filtering
CREATE INDEX IF NOT EXISTS idx_listings_country ON listings (country);
