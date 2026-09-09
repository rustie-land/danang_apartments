-- Migration: Add parser v2 columns to apartments table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- New columns for parser v2
ALTER TABLE apartments
  ADD COLUMN IF NOT EXISTS listing_hash TEXT,
  ADD COLUMN IF NOT EXISTS needs_manual_review BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS message_thread_id BIGINT,
  ADD COLUMN IF NOT EXISTS reply_to_top_id BIGINT;

-- Index for deduplication lookups
CREATE INDEX IF NOT EXISTS idx_apartments_listing_hash ON apartments(listing_hash);
CREATE INDEX IF NOT EXISTS idx_apartments_needs_review ON apartments(needs_manual_review) WHERE needs_manual_review = TRUE;

-- Backfill: mark existing rows with hash if district + rooms + price exist
-- UPDATE apartments SET listing_hash = md5(district || '|' || COALESCE(rooms, 0) || '|' || COALESCE(numeric_price, 0))
-- WHERE listing_hash IS NULL;
