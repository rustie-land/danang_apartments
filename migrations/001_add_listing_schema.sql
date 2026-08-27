-- Migration 001: extend apartments table with structured listing fields
-- from the PropertyListingSchema extractor.
-- Idempotent: each ADD COLUMN is guarded with a existence check.

ALTER TABLE apartments ADD COLUMN IF NOT EXISTS is_rent boolean;
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS property_type text;
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS price_amount numeric;
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS price_currency text;
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS raw_address text;
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS area_sqm numeric;
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS floor integer;
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS total_floors integer;
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS description_clean text;

-- Optional indexes for common filters
CREATE INDEX IF NOT EXISTS idx_apartments_is_rent ON apartments (is_rent);
CREATE INDEX IF NOT EXISTS idx_apartments_property_type ON apartments (property_type);
CREATE INDEX IF NOT EXISTS idx_apartments_price_currency ON apartments (price_currency);
