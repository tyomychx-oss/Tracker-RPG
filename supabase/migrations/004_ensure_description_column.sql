-- Ensure description column exists in shop_rewards table
-- This migration is idempotent and safe to run multiple times

-- Add description column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'shop_rewards' 
    AND column_name = 'description'
  ) THEN
    ALTER TABLE shop_rewards ADD COLUMN description TEXT;
  END IF;
END $$;
