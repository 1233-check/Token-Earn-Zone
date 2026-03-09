-- Run these queries in your Supabase SQL Editor to set up the central wallet structure

-- 1. Create the profiles table (using wallet_address as the primary key since we don't use email auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  wallet_address TEXT PRIMARY KEY,
  total_balance NUMERIC DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Note: We use ENUMs to enforce status states
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_status') THEN
        CREATE TYPE transaction_status AS ENUM ('pending', 'approved', 'rejected');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type') THEN
        CREATE TYPE transaction_type AS ENUM ('deposit', 'withdrawal');
    END IF;
END$$;

-- 2. Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT REFERENCES public.profiles(wallet_address) NOT NULL,
  type transaction_type NOT NULL,
  amount NUMERIC NOT NULL,
  
  -- The hash the user pastes as proof (only required for deposits)
  tx_hash TEXT UNIQUE,
  
  -- The destination address where the admin needs to send funds (only required for withdrawals)
  destination_address TEXT,
  
  status transaction_status DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies (Since this is a Web3 app without a custom JWT backend, we make it open for inserting their own wallet)
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Anyone can insert a profile" 
ON public.profiles FOR INSERT WITH CHECK (true);

-- Transactions Policies
CREATE POLICY "Public transactions are viewable by everyone" 
ON public.transactions FOR SELECT USING (true);

CREATE POLICY "Anyone can insert a transaction" 
ON public.transactions FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update a transaction" 
ON public.transactions FOR UPDATE USING (true);

-- 5. Create a trigger function to update the user's balance when a transaction is approved
CREATE OR REPLACE FUNCTION update_user_balance_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Only act if the status changed to 'approved'
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    IF NEW.type = 'deposit' THEN
      UPDATE public.profiles SET total_balance = total_balance + NEW.amount WHERE wallet_address = NEW.wallet_address;
    ELSIF NEW.type = 'withdrawal' THEN
      UPDATE public.profiles SET total_balance = total_balance - NEW.amount WHERE wallet_address = NEW.wallet_address;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Attach the trigger to the transactions table
DROP TRIGGER IF EXISTS transaction_approval_trigger ON public.transactions;
CREATE TRIGGER transaction_approval_trigger
AFTER UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION update_user_balance_on_approval();
