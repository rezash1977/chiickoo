-- Rollback Migration: Remove archived status from ads table
-- This migration removes support for archived ads

-- Drop the functions we created
DROP FUNCTION IF EXISTS archive_old_ads();
DROP FUNCTION IF EXISTS get_ads_needing_archive();
DROP FUNCTION IF EXISTS get_ads_needing_warning();

-- Drop the index we created
DROP INDEX IF EXISTS idx_ads_status_created_at;

-- Drop the new check constraint
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'ads_status_check'
    ) THEN
        ALTER TABLE ads DROP CONSTRAINT ads_status_check;
    END IF;
END $$;

-- Recreate the original check constraint (without 'archived')
ALTER TABLE ads ADD CONSTRAINT ads_status_check 
CHECK (status IN ('pending', 'active', 'expired', 'rejected'));

-- Update any archived ads back to active (or you can choose to delete them)
UPDATE ads SET status = 'active' WHERE status = 'archived';

-- Remove the comment
COMMENT ON COLUMN ads.status IS 'Ad status: pending, active, expired, rejected'; 