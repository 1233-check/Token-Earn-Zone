-- 1. Drop the old policies (PostgreSQL sometimes throws errors if you use schema paths in DROP POLICY)
DO $$
BEGIN
    EXECUTE 'DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles';
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can insert a profile" ON profiles';
    EXECUTE 'DROP POLICY IF EXISTS "Public transactions are viewable by everyone" ON transactions';
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can insert a transaction" ON transactions';
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can update a transaction" ON transactions';
EXCEPTION WHEN OTHERS THEN
    -- Ignore errors during policy drop
END $$;

-- 2. Drop the old trigger and tables completely
DROP TRIGGER IF EXISTS transaction_approval_trigger ON public.transactions;
DROP FUNCTION IF EXISTS update_user_balance_on_approval();
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 3. Create the new profiles table
CREATE TABLE public.profiles (
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

-- 4. Create transactions table
CREATE TABLE public.transactions (
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

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 6. Create Policies again
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

-- 7. Create a trigger function to update the user's balance when a transaction is approved
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

-- 8. Attach the trigger to the transactions table
CREATE TRIGGER transaction_approval_trigger
AFTER UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION update_user_balance_on_approval();
