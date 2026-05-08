-- =============================================================
-- BACKFILL: Distribute missed ROI for days the function was broken
-- Date: 2026-05-08
-- The distribution was broken from May 4 to May 8 = 4 missed days
-- 
-- This script calls distribute_daily_roi() multiple times to
-- compensate for the missed distributions.
--
-- IMPORTANT: Run this AFTER the fix_distribute_daily_roi.sql fix
-- has been applied. Run this ONCE only.
-- =============================================================

-- Verify the fix is working first (should return slots_processed > 0)
-- SELECT distribute_daily_roi();

-- ─── Backfill 4 missed days ───
-- Each call = 1 day's worth of ROI for all active slots
DO $$
DECLARE
  v_missed_days INTEGER := 4;  -- May 4, 5, 6, 7 (today May 8 will be handled by the cron)
  v_day INTEGER;
  v_result json;
BEGIN
  FOR v_day IN 1..v_missed_days LOOP
    SELECT distribute_daily_roi() INTO v_result;
    RAISE NOTICE 'Backfill day %/% completed: %', v_day, v_missed_days, v_result;
  END LOOP;

  RAISE NOTICE '✅ Backfill complete. % missed days of ROI have been distributed.', v_missed_days;
END $$;

-- ─── Verify backfill results ───
-- Check recent ROI transactions created by the backfill:
-- SELECT user_id, COUNT(*) as tx_count, SUM(amount) as total_credited
-- FROM transactions
-- WHERE type = 'roi_distribution'
--   AND created_at >= NOW() - INTERVAL '1 hour'
-- GROUP BY user_id
-- ORDER BY total_credited DESC;
