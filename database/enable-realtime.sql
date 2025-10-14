-- Quick Setup: Enable Realtime for Existing mfs Table
-- Run this in Supabase SQL Editor if you already have the mfs table

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE mfs;

-- Verify setup
SELECT * 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'mfs';

-- Expected result: Should return 1 row showing mfs is published

-- All done! Realtime should now work.
-- The application uses in-memory state comparison to detect status changes.
-- Refresh your browser and status transitions should work correctly.

