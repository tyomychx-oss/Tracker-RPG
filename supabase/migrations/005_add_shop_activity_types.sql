-- Add new activity types to transactions table
-- This migration extends the transaction types to include item management activities

-- Drop existing constraint
ALTER TABLE transactions 
DROP CONSTRAINT IF EXISTS transactions_type_check;

-- Add new constraint with additional types
ALTER TABLE transactions 
ADD CONSTRAINT transactions_type_check 
CHECK (type IN ('purchase', 'wheel_spin', 'item_created', 'item_deleted', 'item_updated'));

-- Add index for better query performance on type
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

-- Add index for better query performance on created_at
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
