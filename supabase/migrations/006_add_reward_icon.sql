-- Add icon column to shop_rewards table
-- This migration is idempotent and safe to run multiple times

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'shop_rewards' 
    AND column_name = 'icon'
  ) THEN
    ALTER TABLE shop_rewards ADD COLUMN icon TEXT DEFAULT '🎁';
  END IF;
END $$;
