-- 7. Slot Bookings, Limits, and ROI Logic

-- Daily slot configuration (Max 50 per day)
CREATE TABLE IF NOT EXISTS public.daily_slots_config (
  booking_date DATE PRIMARY KEY DEFAULT CURRENT_DATE,
  slots_booked INTEGER DEFAULT 0 CHECK (slots_booked >= 0 AND slots_booked <= 50)
);

-- Slot statuses
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'slot_status') THEN
        CREATE TYPE slot_status AS ENUM ('pending_approval', 'active', 'completed', 'rejected');
    END IF;
END$$;

-- Slot bookings table
CREATE TABLE IF NOT EXISTS public.slot_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT REFERENCES public.profiles(wallet_address) NOT NULL,
  amount NUMERIC NOT NULL,
  daily_roi_rate NUMERIC NOT NULL, -- e.g., 0.10 for 10%
  status slot_status DEFAULT 'pending_approval' NOT NULL,
  total_earned NUMERIC DEFAULT 0.00 NOT NULL,
  booking_date DATE DEFAULT CURRENT_DATE NOT NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add ROI distribution to transaction types
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'roi_distribution';
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'slot_booking';

-- Enable RLS
ALTER TABLE public.daily_slots_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slot_bookings ENABLE ROW LEVEL SECURITY;

-- Basic Policies
CREATE POLICY "Public slot config viewable by everyone" ON public.daily_slots_config FOR SELECT USING (true);
CREATE POLICY "Public slot bookings viewable by everyone" ON public.slot_bookings FOR SELECT USING (true);
CREATE POLICY "Users can insert slot bookings" ON public.slot_bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their bookings" ON public.slot_bookings FOR UPDATE USING (true);


-- Function: Process Slot Booking Application
CREATE OR REPLACE FUNCTION process_slot_booking(p_wallet_address TEXT, p_amount NUMERIC, p_roi_rate NUMERIC)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_slots INTEGER;
  v_user_active_slots INTEGER;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- 1. Check user's total active/pending slots (Max 10)
  SELECT COUNT(*) INTO v_user_active_slots
  FROM public.slot_bookings
  WHERE wallet_address = p_wallet_address 
    AND status IN ('pending_approval', 'active');
    
  IF v_user_active_slots >= 10 THEN
     RAISE EXCEPTION 'You have reached the maximum limit of 10 slots.';
  END IF;

  -- 2. Ensure a config row exists for today
  INSERT INTO public.daily_slots_config (booking_date, slots_booked)
  VALUES (v_today, 0)
  ON CONFLICT (booking_date) DO NOTHING;

  -- 3. Check and update daily slots
  SELECT slots_booked INTO v_current_slots
  FROM public.daily_slots_config
  WHERE booking_date = v_today
  FOR UPDATE;

  IF v_current_slots >= 50 THEN
     RAISE EXCEPTION 'The daily limit of 50 slots has been reached. Please try tomorrow.';
  END IF;

  UPDATE public.daily_slots_config
  SET slots_booked = slots_booked + 1
  WHERE booking_date = v_today;

  -- 4. Deduct balance from profile
  UPDATE public.profiles
  SET total_balance = total_balance - p_amount
  WHERE wallet_address = p_wallet_address AND total_balance >= p_amount;

  IF NOT FOUND THEN
     RAISE EXCEPTION 'Insufficient balance to pre-book slot';
  END IF;

  -- 5. Insert transaction record for the payment
  INSERT INTO public.transactions (wallet_address, type, amount, status)
  VALUES (p_wallet_address, 'slot_booking', p_amount, 'approved');

  -- 6. Insert booking record (pending admin approval)
  INSERT INTO public.slot_bookings (wallet_address, amount, daily_roi_rate, booking_date, status)
  VALUES (p_wallet_address, p_amount, p_roi_rate, v_today, 'pending_approval');

  RETURN json_build_object('status', 'success', 'message', 'Booking successful. Waiting for admin approval.');
END;
$$;


-- Function: Admin Approves Slot
CREATE OR REPLACE FUNCTION admin_approve_slot(p_slot_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.slot_bookings
  SET status = 'active',
      approved_at = NOW()
  WHERE id = p_slot_id AND status = 'pending_approval';

  IF NOT FOUND THEN
     RAISE EXCEPTION 'Slot not found or already approved.';
  END IF;
END;
$$;


-- Function: Distribute Daily ROI (Can be triggered manually by Admin or via Cron)
CREATE OR REPLACE FUNCTION distribute_daily_roi()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  slot_rec RECORD;
  v_daily_earning NUMERIC;
  v_total_distributed NUMERIC := 0;
  v_slots_processed INTEGER := 0;
BEGIN
  -- Iterate through all ACTIVE slots
  FOR slot_rec IN 
      SELECT id, wallet_address, amount, daily_roi_rate 
      FROM public.slot_bookings 
      WHERE status = 'active'
  LOOP
      -- Calculate earning for this slot
      v_daily_earning := slot_rec.amount * slot_rec.daily_roi_rate;

      -- 1. Update Profile Balance
      UPDATE public.profiles
      SET total_balance = total_balance + v_daily_earning
      WHERE wallet_address = slot_rec.wallet_address;

      -- 2. Log transaction
      INSERT INTO public.transactions (wallet_address, type, amount, status)
      VALUES (slot_rec.wallet_address, 'roi_distribution', v_daily_earning, 'approved');

      -- 3. Update Slot stats
      UPDATE public.slot_bookings
      SET total_earned = total_earned + v_daily_earning
      WHERE id = slot_rec.id;

      -- TODO in future: Automatically set status to 'completed' if max cap is reached (e.g. 3x or 20 days)

      v_total_distributed := v_total_distributed + v_daily_earning;
      v_slots_processed := v_slots_processed + 1;
  END LOOP;

  RETURN json_build_object(
      'status', 'success', 
      'slots_processed', v_slots_processed, 
      'total_distributed', v_total_distributed
  );
END;
$$;
