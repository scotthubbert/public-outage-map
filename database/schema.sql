-- Supabase Database Schema for ISP Outage Map
-- This file contains the SQL schema for setting up the subscribers (mfs) table in Supabase

-- Create the subscribers table (mfs = managed fiber subscribers)
CREATE TABLE IF NOT EXISTS mfs (
    id SERIAL PRIMARY KEY,
    
    -- Subscriber information
    name VARCHAR(255),
    address TEXT,
    
    -- Geographic coordinates
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    
    -- Status: 'Online', 'Offline', 'Degraded', etc.
    status VARCHAR(20) NOT NULL DEFAULT 'Online',
    
    -- Timestamp fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Additional fields you might have
    service_plan VARCHAR(100),
    connection_type VARCHAR(50),
    last_seen TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

-- Create indexes for better query performance
CREATE INDEX idx_mfs_status ON mfs(status);
CREATE INDEX idx_mfs_coordinates ON mfs(latitude, longitude);
CREATE INDEX idx_mfs_updated_at ON mfs(updated_at DESC);
CREATE INDEX idx_mfs_name ON mfs(name);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to call the function before update
CREATE TRIGGER update_mfs_updated_at BEFORE UPDATE
    ON mfs FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE mfs ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow anonymous users to read subscribers
-- (Adjust based on your security requirements)
CREATE POLICY "Allow anonymous read access" ON mfs
    FOR SELECT
    USING (true);

-- Enable Realtime for the mfs table (for instant updates)
-- This allows the frontend to subscribe to changes
ALTER PUBLICATION supabase_realtime ADD TABLE mfs;

-- Sample data insertion (remove or modify for production)
INSERT INTO mfs (name, address, latitude, longitude, status, service_plan, connection_type)
VALUES 
    (
        'John Smith',
        '123 Main Street, San Francisco, CA 94102',
        37.7749,
        -122.4194,
        'Offline',
        '1 Gbps Fiber',
        'FTTH'
    ),
    (
        'Jane Doe',
        '456 Market Street, San Francisco, CA 94103',
        37.7899,
        -122.3999,
        'Offline',
        '500 Mbps Fiber',
        'FTTH'
    ),
    (
        'Acme Corporation',
        '789 Business Blvd, San Francisco, CA 94104',
        37.7919,
        -122.3980,
        'Online',
        '10 Gbps Business Fiber',
        'FTTH'
    ),
    (
        'Sarah Johnson',
        '321 Oak Street, San Francisco, CA 94102',
        37.7765,
        -122.4220,
        'Offline',
        '1 Gbps Fiber',
        'FTTH'
    ),
    (
        'Tech Startup Inc',
        '555 Innovation Way, San Francisco, CA 94110',
        37.7510,
        -122.4180,
        'Offline',
        '5 Gbps Business Fiber',
        'FTTH'
    );

-- Create a view for easier querying with formatted data
CREATE OR REPLACE VIEW outages_view AS
SELECT 
    id,
    geometry,
    status,
    area_name,
    affected_services,
    estimated_restoration,
    description,
    affected_customers,
    created_at,
    updated_at,
    CASE 
        WHEN estimated_restoration > NOW() THEN 
            EXTRACT(EPOCH FROM (estimated_restoration - NOW())) / 3600
        ELSE 0
    END as hours_to_restoration,
    CASE
        WHEN status = 'critical' THEN 4
        WHEN status = 'major' THEN 3
        WHEN status = 'minor' THEN 2
        WHEN status = 'resolved' THEN 1
        ELSE 0
    END as severity_level
FROM outages;

-- Function to get active outages (non-resolved)
CREATE OR REPLACE FUNCTION get_active_outages()
RETURNS TABLE (
    id INTEGER,
    geometry JSONB,
    status VARCHAR,
    area_name VARCHAR,
    affected_services JSONB,
    estimated_restoration TIMESTAMP WITH TIME ZONE,
    description TEXT,
    affected_customers INTEGER,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.geometry,
        o.status,
        o.area_name,
        o.affected_services,
        o.estimated_restoration,
        o.description,
        o.affected_customers,
        o.updated_at
    FROM outages o
    WHERE o.status != 'resolved'
       OR (o.status = 'resolved' AND o.updated_at > NOW() - INTERVAL '1 hour')
    ORDER BY 
        CASE o.status
            WHEN 'critical' THEN 1
            WHEN 'major' THEN 2
            WHEN 'minor' THEN 3
            WHEN 'resolved' THEN 4
        END,
        o.updated_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get outages by area
CREATE OR REPLACE FUNCTION get_outages_by_area(search_area VARCHAR)
RETURNS TABLE (
    id INTEGER,
    geometry JSONB,
    status VARCHAR,
    area_name VARCHAR,
    affected_services JSONB,
    estimated_restoration TIMESTAMP WITH TIME ZONE,
    description TEXT,
    affected_customers INTEGER,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.geometry,
        o.status,
        o.area_name,
        o.affected_services,
        o.estimated_restoration,
        o.description,
        o.affected_customers,
        o.updated_at
    FROM outages o
    WHERE LOWER(o.area_name) LIKE LOWER('%' || search_area || '%')
    ORDER BY o.updated_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions for anonymous access (adjust as needed)
GRANT SELECT ON outages TO anon;
GRANT SELECT ON outages_view TO anon;
GRANT EXECUTE ON FUNCTION get_active_outages() TO anon;
GRANT EXECUTE ON FUNCTION get_outages_by_area(VARCHAR) TO anon;
