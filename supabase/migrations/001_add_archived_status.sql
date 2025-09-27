-- Migration: Add archived status to ads table
-- This migration adds support for archived ads that are older than 1 month

-- First, drop the existing check constraint if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'ads_status_check'
    ) THEN
        ALTER TABLE ads DROP CONSTRAINT ads_status_check;
    END IF;
END $$;

-- Create a new check constraint that includes 'archived'
ALTER TABLE ads ADD CONSTRAINT ads_status_check 
CHECK (status IN ('pending', 'active', 'expired', 'rejected', 'archived'));

-- Add a comment to document the archive functionality
COMMENT ON COLUMN ads.status IS 'Ad status: pending, active, expired, rejected, archived. Archived ads are older than 1 month and not shown to public.';

-- Create an index to improve performance for archive queries
CREATE INDEX IF NOT EXISTS idx_ads_status_created_at ON ads(status, created_at);

-- Create a function to automatically archive old ads
CREATE OR REPLACE FUNCTION archive_old_ads()
RETURNS void AS $$
BEGIN
  UPDATE ads 
  SET status = 'archived'
  WHERE status = 'active' 
    AND created_at < (NOW() - INTERVAL '1 month');
END;
$$ LANGUAGE plpgsql;

-- Create a function to get ads that need archiving
CREATE OR REPLACE FUNCTION get_ads_needing_archive()
RETURNS TABLE (
  id uuid,
  title text,
  user_id uuid,
  created_at timestamptz,
  days_old integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.title,
    a.user_id,
    a.created_at,
    EXTRACT(day FROM (NOW() - a.created_at))::integer as days_old
  FROM ads a
  WHERE a.status = 'active' 
    AND a.created_at < (NOW() - INTERVAL '1 month');
END;
$$ LANGUAGE plpgsql;

-- Create a function to get ads that need archive warnings (5 days before archive)
CREATE OR REPLACE FUNCTION get_ads_needing_warning()
RETURNS TABLE (
  id uuid,
  title text,
  user_id uuid,
  created_at timestamptz,
  days_until_archive integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.title,
    a.user_id,
    a.created_at,
    (30 - EXTRACT(day FROM (NOW() - a.created_at)))::integer as days_until_archive
  FROM ads a
  WHERE a.status = 'active' 
    AND a.created_at < (NOW() - INTERVAL '25 days')
    AND a.created_at >= (NOW() - INTERVAL '30 days');
END;
$$ LANGUAGE plpgsql; 