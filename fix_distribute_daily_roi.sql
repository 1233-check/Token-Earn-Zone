-- =============================================================
-- FIX: distribute_daily_roi() — Dual-table compatible
-- Date: 2026-05-08
-- Problem: The 2x cap migration replaced this function to use
--          public.users instead of public.profiles, causing
--          silent ROI distribution failures.
-- Run this in the Supabase SQL Editor.
-- =============================================================

-- ─── Step 0: Diagnostic — run this FIRST to understand your schema ───
-- SELECT table_name, column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' 
--   AND table_name IN ('users', 'profiles', 'slot_bookings', 'transactions')
-- ORDER BY table_name, ordinal_position;

-- ─── Step 1: Deploy fixed distribute_daily_roi() ───
CREATE OR REPLACE FUNCTION distribute_daily_roi()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  slot_rec RECORD;
  v_daily_earning NUMERIC;
  v_max_earning NUMERIC;
  v_remaining NUMERIC;
  v_actual_payout NUMERIC;
  v_wallet TEXT;
  v_total_distributed NUMERIC := 0;
  v_slots_processed INTEGER := 0;
  v_slots_completed INTEGER := 0;
BEGIN
  -- Iterate through all ACTIVE slots
  FOR slot_rec IN
      SELECT id, wallet_address, user_id, amount, daily_roi_rate, total_earned
      FROM public.slot_bookings
      WHERE status IN ('active', 'confirmed')
  LOOP
      v_max_earning := slot_rec.amount * 2;
      v_remaining   := v_max_earning - slot_rec.total_earned;
      v_wallet      := COALESCE(slot_rec.wallet_address, slot_rec.user_id::text);

      -- Already at or past cap (safety check)
      IF v_remaining <= 0 THEN
          UPDATE public.slot_bookings
          SET status = 'completed', total_earned = v_max_earning
          WHERE id = slot_rec.id;
          v_slots_completed := v_slots_completed + 1;
          CONTINUE;
      END IF;

      -- Calculate daily earning, but cap at remaining room
      v_daily_earning := slot_rec.amount * slot_rec.daily_roi_rate;
      v_actual_payout := LEAST(v_daily_earning, v_remaining);

      -- 1. Credit user balance in users table (new schema)
      IF slot_rec.user_id IS NOT NULL THEN
          UPDATE public.users
          SET total_balance = total_balance + v_actual_payout
          WHERE id = slot_rec.user_id;
      END IF;

      -- 2. Also credit profiles table if wallet_address exists (legacy compat)
      IF slot_rec.wallet_address IS NOT NULL THEN
          UPDATE public.profiles
          SET total_balance = total_balance + v_actual_payout
          WHERE wallet_address = slot_rec.wallet_address;
      END IF;

      -- 3. Log transaction
      INSERT INTO public.transactions (user_id, wallet_address, type, amount, status)
      VALUES (
        slot_rec.user_id,
        v_wallet,
        'roi_distribution',
        v_actual_payout,
        'approved'
      );

      -- 4. Update slot earned total
      UPDATE public.slot_bookings
      SET total_earned = total_earned + v_actual_payout
      WHERE id = slot_rec.id;

      -- 5. If this payout hit the cap, complete the slot
      IF v_actual_payout >= v_remaining THEN
          UPDATE public.slot_bookings
          SET status = 'completed'
          WHERE id = slot_rec.id;
          v_slots_completed := v_slots_completed + 1;
      END IF;

      v_total_distributed := v_total_distributed + v_actual_payout;
      v_slots_processed   := v_slots_processed + 1;
  END LOOP;

  RETURN json_build_object(
      'status', 'success',
      'slots_processed', v_slots_processed,
      'slots_completed', v_slots_completed,
      'total_distributed', v_total_distributed
  );
END;
$$;

-- ─── Step 2: Test the fix ───
-- SELECT distribute_daily_roi();

-- ─── Step 3: Verify results ───
-- SELECT * FROM transactions 
-- WHERE type = 'roi_distribution' 
-- ORDER BY created_at DESC LIMIT 10;
