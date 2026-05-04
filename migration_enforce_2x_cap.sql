-- =============================================================
-- Migration: Enforce 2× Earnings Cap on All Slots
-- Date: 2026-05-03
-- Run this ONCE in the Supabase SQL Editor
-- =============================================================

-- ─── Step 1: Add roi_correction transaction type ───
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'roi_correction';

-- ─── Step 2: Retroactive 2× cap enforcement ───
-- Finds all slots that earned MORE than 2× their deposit,
-- claws back the excess from user balances, logs a correction
-- transaction, and marks the slot as completed.

DO $$
DECLARE
  slot_rec RECORD;
  v_max_earning NUMERIC;
  v_excess NUMERIC;
  v_wallet TEXT;
  v_corrected INTEGER := 0;
BEGIN
  FOR slot_rec IN
      SELECT id, wallet_address, user_id, amount, total_earned, status
      FROM public.slot_bookings
      WHERE total_earned > amount * 2
        AND status IN ('active', 'confirmed')
  LOOP
      v_max_earning := slot_rec.amount * 2;
      v_excess      := slot_rec.total_earned - v_max_earning;
      v_wallet      := COALESCE(slot_rec.wallet_address, slot_rec.user_id::text);

      -- 1. Deduct excess from user balance
      UPDATE public.users
      SET total_balance = total_balance - v_excess
      WHERE id = slot_rec.user_id;

      -- 2. Log correction transaction
      INSERT INTO public.transactions (user_id, wallet_address, type, amount, status)
      VALUES (
        slot_rec.user_id,
        v_wallet,
        'roi_correction',
        v_excess,
        'approved'
      );

      -- 3. Cap total_earned and complete the slot
      UPDATE public.slot_bookings
      SET total_earned = v_max_earning,
          status = 'completed'
      WHERE id = slot_rec.id;

      v_corrected := v_corrected + 1;
  END LOOP;

  RAISE NOTICE '✅ Retroactive 2x cap enforced. Slots corrected: %', v_corrected;
END $$;

-- ─── Step 3: Complete any slots sitting exactly at the cap ───
UPDATE public.slot_bookings
SET status = 'completed'
WHERE status IN ('active', 'confirmed')
  AND total_earned >= amount * 2;

-- ─── Step 4: Deploy updated distribute_daily_roi() with 2× cap ───
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
      WHERE status = 'active'
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

      -- 1. Credit user balance
      UPDATE public.users
      SET total_balance = total_balance + v_actual_payout
      WHERE id = slot_rec.user_id;

      -- 2. Log transaction
      INSERT INTO public.transactions (user_id, wallet_address, type, amount, status)
      VALUES (
        slot_rec.user_id,
        v_wallet,
        'roi_distribution',
        v_actual_payout,
        'approved'
      );

      -- 3. Update slot earned total
      UPDATE public.slot_bookings
      SET total_earned = total_earned + v_actual_payout
      WHERE id = slot_rec.id;

      -- 4. If this payout hit the cap, complete the slot
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

-- ─── Verification Query (run after migration) ───
-- This should return 0 rows if everything worked:
-- SELECT id, amount, total_earned, status
-- FROM slot_bookings
-- WHERE status = 'active' AND total_earned >= amount * 2;
