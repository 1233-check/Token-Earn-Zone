-- =============================================================
-- Step 1 of 2: Add missing enum values
-- Run this FIRST, then run migration_step2_enforce_cap.sql
-- =============================================================

-- Add 'roi_correction' to transaction_type (may already exist from previous run)
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'roi_correction';

-- Add 'completed' to booking_status
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'completed';
