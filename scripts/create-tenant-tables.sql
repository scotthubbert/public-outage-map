-- scripts/create-tenant-tables.sql
-- Template for creating tenant-specific tables
-- Replace {{TENANT_ID}} with actual tenant ID

-- Fiber offline locations table
CREATE TABLE {{TENANT_ID}}_offline (
    id BIGSERIAL PRIMARY KEY,
    longitude DECIMAL(10, 7) NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    description TEXT,
    severity VARCHAR(20) DEFAULT 'medium',
    reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Electric outage locations table  
CREATE TABLE {{TENANT_ID}}_electric (
    id BIGSERIAL PRIMARY KEY,
    longitude DECIMAL(10, 7) NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    description TEXT,
    severity VARCHAR(20) DEFAULT 'medium',
    estimated_customers_affected INTEGER,
    reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_{{TENANT_ID}}_offline_location ON {{TENANT_ID}}_offline USING GIST (
    ST_Point(longitude, latitude)
);

CREATE INDEX idx_{{TENANT_ID}}_electric_location ON {{TENANT_ID}}_electric USING GIST (
    ST_Point(longitude, latitude)
);

CREATE INDEX idx_{{TENANT_ID}}_offline_reported ON {{TENANT_ID}}_offline (reported_at DESC);
CREATE INDEX idx_{{TENANT_ID}}_electric_reported ON {{TENANT_ID}}_electric (reported_at DESC);

-- Enable Row Level Security
ALTER TABLE {{TENANT_ID}}_offline ENABLE ROW LEVEL SECURITY;
ALTER TABLE {{TENANT_ID}}_electric ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Public read access" ON {{TENANT_ID}}_offline 
    FOR SELECT USING (true);

CREATE POLICY "Public read access" ON {{TENANT_ID}}_electric 
    FOR SELECT USING (true);

-- Optional: Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_{{TENANT_ID}}_offline_updated_at 
    BEFORE UPDATE ON {{TENANT_ID}}_offline 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_{{TENANT_ID}}_electric_updated_at 
    BEFORE UPDATE ON {{TENANT_ID}}_electric 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 