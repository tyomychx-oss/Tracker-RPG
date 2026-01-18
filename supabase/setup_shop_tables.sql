-- Complete Shop Tables Setup
-- Run this in Supabase SQL Editor to create all shop tables from scratch

-- Step 1: Create shop_rewards table
CREATE TABLE IF NOT EXISTS shop_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cost INTEGER NOT NULL CHECK (cost >= 0),
  category TEXT DEFAULT 'General',
  is_on_market BOOLEAN DEFAULT false,
  is_in_wheel BOOLEAN DEFAULT false,
  drop_chance NUMERIC DEFAULT 10,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for shop_rewards
ALTER TABLE shop_rewards ENABLE ROW LEVEL SECURITY;

-- Policies for shop_rewards
CREATE POLICY "Users can view own rewards"
  ON shop_rewards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rewards"
  ON shop_rewards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rewards"
  ON shop_rewards FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own rewards"
  ON shop_rewards FOR DELETE
  USING (auth.uid() = user_id);

-- Step 2: Create transactions table with ALL activity types
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_snapshot TEXT NOT NULL,
  cost INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'wheel_spin', 'item_created', 'item_deleted', 'item_updated')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policies for transactions
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Step 3: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shop_rewards_user_id ON shop_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

-- Step 4: Verify tables created
SELECT 
  table_name, 
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('shop_rewards', 'transactions')
ORDER BY table_name;
