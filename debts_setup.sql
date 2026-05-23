-- Copy and paste this into the Supabase SQL Editor and click "Run"

-- Create the debts table
CREATE TABLE debts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('lent', 'borrowed')),
  person TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  settled_amount NUMERIC DEFAULT 0 NOT NULL CHECK (settled_amount >= 0),
  status TEXT DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'settled')),
  due_date DATE,
  note TEXT,
  date DATE DEFAULT CURRENT_DATE NOT NULL,
  payments JSONB DEFAULT '[]'::jsonb NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security (RLS) so users can only see their own data
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to SELECT their own debts
CREATE POLICY "Users can view own debts" ON debts
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow users to INSERT their own debts
CREATE POLICY "Users can insert own debts" ON debts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to UPDATE their own debts
CREATE POLICY "Users can update own debts" ON debts
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to DELETE their own debts
CREATE POLICY "Users can delete own debts" ON debts
  FOR DELETE USING (auth.uid() = user_id);
