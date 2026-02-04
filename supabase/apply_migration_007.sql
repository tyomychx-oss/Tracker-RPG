-- Apply migration 007: Fix user_id unique constraint
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new)

-- Step 1: Drop the constraint if it exists
ALTER TABLE user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_user_id_key;

-- Step 2: Add unique constraint on user_id
ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_user_id_key UNIQUE (user_id);

-- Step 3: Verify the constraint was created
SELECT 
    constraint_name, 
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'user_profiles' 
    AND constraint_type = 'UNIQUE'
    AND constraint_name = 'user_profiles_user_id_key';

-- Expected output: One row showing the unique constraint on user_id
