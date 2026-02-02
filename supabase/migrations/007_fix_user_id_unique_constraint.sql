-- Migration 007: Ensure user_id unique constraint exists
-- This is needed for upsert operations with onConflict: 'user_id'

-- Drop the constraint if it exists (in case it was created with a different name)
ALTER TABLE user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_user_id_key;

-- Add unique constraint on user_id
ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_user_id_key UNIQUE (user_id);

-- Verify the constraint was created
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'user_profiles' AND constraint_type = 'UNIQUE';
