-- scripts/create-freedomfiber-tables.sql
-- Database setup for Freedom Fiber tenant using existing mfs table

-- NOTE: This script assumes you already have the 'mfs' table
-- The app will query: SELECT * FROM mfs WHERE status = 'Offline'

-- Verify the mfs table exists and has the required columns
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'mfs' 
    AND table_schema = 'public'
    AND column_name IN ('id', 'longitude', 'latitude', 'status')
ORDER BY column_name;

-- Check if we have any offline records to display
SELECT 
    'mfs' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE status = 'Offline') as offline_records,
    COUNT(*) FILTER (WHERE longitude IS NOT NULL AND latitude IS NOT NULL) as records_with_location
FROM mfs;

-- Sample query that the app will run
SELECT 
    id,
    longitude,
    latitude,
    status,
    city,
    county,
    state,
    service_type,
    last_update,
    updated_at,
    created_at
FROM mfs 
WHERE status = 'Offline'
    AND longitude IS NOT NULL 
    AND latitude IS NOT NULL
LIMIT 5;

-- Optional: Create index for better performance if not exists
-- CREATE INDEX IF NOT EXISTS idx_mfs_status ON mfs (status);
-- CREATE INDEX IF NOT EXISTS idx_mfs_location ON mfs USING GIST (ST_Point(longitude, latitude));

-- Verify RLS policy allows public read access
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'mfs' AND schemaname = 'public'; 