-- Apply migration 005: Add shop activity types
-- Run this in Supabase SQL Editor

-- Step 1: Drop existing constraint
ALTER TABLE transactions 
DROP CONSTRAINT IF EXISTS transactions_type_check;

-- Step 2: Add new constraint with additional types
ALTER TABLE transactions 
ADD CONSTRAINT transactions_type_check 
CHECK (type IN ('purchase', 'wheel_spin', 'item_created', 'item_deleted', 'item_updated'));

-- Step 3: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

-- Step 4: Verify the change
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'transactions_type_check';
