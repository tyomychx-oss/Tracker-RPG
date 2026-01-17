-- Add sparks column to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS sparks INTEGER DEFAULT 0;
