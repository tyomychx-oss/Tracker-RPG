-- Create shop_rewards table
CREATE TABLE IF NOT EXISTS shop_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cost INTEGER NOT NULL CHECK (cost >= 0),
  category TEXT DEFAULT 'General',
  is_in_wheel BOOLEAN DEFAULT false,
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

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_snapshot TEXT NOT NULL,
  cost INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'wheel_spin')),
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
