-- Add market visibility and probability columns to shop_rewards
-- This migration is idempotent and safe to run multiple times

-- Add is_on_market column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'shop_rewards' 
    AND column_name = 'is_on_market'
  ) THEN
    ALTER TABLE shop_rewards ADD COLUMN is_on_market BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Add drop_chance column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'shop_rewards' 
    AND column_name = 'drop_chance'
  ) THEN
    ALTER TABLE shop_rewards ADD COLUMN drop_chance INTEGER DEFAULT 10 CHECK (drop_chance >= 1 AND drop_chance <= 100);
  END IF;
END $$;
