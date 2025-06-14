#!/usr/bin/env node

// scripts/test-tenant-connection.js
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tenantId = process.argv[2];

if (!tenantId) {
    console.log('❌ Usage: node test-tenant-connection.js <tenant-id>');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/test-tenant-connection.js freedomfiber');
    console.log('  node scripts/test-tenant-connection.js jwec');
    console.log('  node scripts/test-tenant-connection.js flashfiber');
    process.exit(1);
}

async function testTenantConnection() {
    console.log(`🔍 Testing connection for tenant: ${tenantId}`);
    console.log('');

    try {
        // Load tenant configuration
        const configPath = path.join(__dirname, '../public/configs', `${tenantId}.json`);

        if (!fs.existsSync(configPath)) {
            throw new Error(`Configuration file not found: ${configPath}`);
        }

        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        console.log(`✅ Loaded config for: ${config.tenant.name}`);

        // Get database configuration with tenant-specific env vars
        const tenantPrefix = `VITE_${tenantId.toUpperCase().replace('-', '_')}_`;

        const supabaseUrl = process.env[`${tenantPrefix}SUPABASE_URL`] ||
            process.env.VITE_SUPABASE_URL;

        const supabaseKey = process.env[`${tenantPrefix}SUPABASE_KEY`] ||
            process.env.VITE_SUPABASE_ANON_KEY;

        const arcgisKey = process.env[`${tenantPrefix}ARCGIS_KEY`] ||
            process.env.VITE_ARCGIS_API_KEY;

        console.log(`🔑 Environment variables:`);
        console.log(`   Supabase URL: ${supabaseUrl ? '✅ Found' : '❌ Missing'}`);
        console.log(`   Supabase Key: ${supabaseKey ? '✅ Found' : '❌ Missing'}`);
        console.log(`   ArcGIS Key: ${arcgisKey ? '✅ Found' : '⚠️  Optional'}`);
        console.log('');

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Missing required Supabase credentials');
        }

        // Test Supabase connection
        console.log('🔌 Testing Supabase connection...');
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Test basic connection
        const { data: healthCheck, error: healthError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .limit(1);

        if (healthError) {
            throw new Error(`Supabase connection failed: ${healthError.message}`);
        }

        console.log('   ✅ Supabase connection successful');

        // Test tenant-specific tables
        const tables = config.database.tables;
        console.log('');
        console.log('📊 Testing tenant tables:');

        for (const [type, tableName] of Object.entries(tables)) {
            try {
                const { count, error } = await supabase
                    .from(tableName)
                    .select('*', { count: 'exact', head: true });

                if (error) {
                    console.log(`   ❌ ${type} (${tableName}): ${error.message}`);
                } else {
                    console.log(`   ✅ ${type} (${tableName}): ${count || 0} records`);
                }
            } catch (tableError) {
                console.log(`   ❌ ${type} (${tableName}): ${tableError.message}`);
            }
        }

        console.log('');
        console.log('🎉 Connection test completed successfully!');
        console.log('');
        console.log('💡 Next steps:');
        console.log(`   1. Start development: npm run dev:${tenantId}`);
        console.log(`   2. Visit: http://localhost:5173?tenant=${tenantId}`);
        console.log(`   3. Check browser console for any additional errors`);

    } catch (error) {
        console.error('❌ Connection test failed:', error.message);
        console.log('');
        console.log('🔧 Troubleshooting:');
        console.log('   1. Check your .env file for correct credentials');
        console.log('   2. Verify Supabase project is active');
        console.log('   3. Ensure tables exist in the database');
        console.log('   4. Check Row Level Security policies');
        process.exit(1);
    }
}

testTenantConnection(); 