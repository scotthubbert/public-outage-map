#!/usr/bin/env node

// scripts/setup-freedomfiber-env.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.join(__dirname, '..');
const envPath = path.join(projectRoot, '.env');

console.log('🔧 Setting up Freedom Fiber Environment Variables\n');

// Check if .env exists
if (!fs.existsSync(envPath)) {
    console.log('📄 Creating new .env file...');

    const envTemplate = `# =================================
# Multi-Tenant ISP Outage Map
# Environment Configuration
# =================================

# Freedom Fiber Specific Configuration
# Replace with your actual Freedom Fiber Supabase credentials
VITE_FREEDOMFIBER_SUPABASE_URL=https://your-freedomfiber-project.supabase.co
VITE_FREEDOMFIBER_SUPABASE_KEY=your_freedomfiber_supabase_anon_key

# Optional: Freedom Fiber ArcGIS API Key
VITE_FREEDOMFIBER_ARCGIS_KEY=your_freedomfiber_arcgis_api_key

# =================================
# Default/Fallback Configuration
# =================================

VITE_SUPABASE_URL=https://your-default-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_default_supabase_anon_key
VITE_ARCGIS_API_KEY=your_default_arcgis_api_key

# =================================
# Development Settings
# =================================

VITE_DEBUG=true
VITE_ENVIRONMENT=development
VITE_APP_VERSION=1.0.0
`;

    try {
        fs.writeFileSync(envPath, envTemplate);
        console.log('✅ Created .env file with template');
        console.log('');
        console.log('📝 Next steps:');
        console.log('   1. Edit .env file with your actual credentials');
        console.log('   2. Replace "your-freedomfiber-project" with your Supabase URL');
        console.log('   3. Replace "your_freedomfiber_supabase_anon_key" with your key');
        console.log('   4. Run: npm run dev:freedomfiber');

    } catch (error) {
        console.error('❌ Error creating .env file:', error.message);
        process.exit(1);
    }
} else {
    console.log('📄 Found existing .env file');

    try {
        let envContent = fs.readFileSync(envPath, 'utf8');

        // Check if Freedom Fiber variables already exist
        if (envContent.includes('VITE_FREEDOMFIBER_SUPABASE_URL')) {
            console.log('✅ Freedom Fiber variables already configured');
            process.exit(0);
        }

        // Add Freedom Fiber section
        const freedomFiberSection = `

# =================================
# Freedom Fiber Specific Configuration
# Added by setup script
# =================================

# Replace with your actual Freedom Fiber Supabase credentials
VITE_FREEDOMFIBER_SUPABASE_URL=https://your-freedomfiber-project.supabase.co
VITE_FREEDOMFIBER_SUPABASE_KEY=your_freedomfiber_supabase_anon_key

# Optional: Freedom Fiber ArcGIS API Key
VITE_FREEDOMFIBER_ARCGIS_KEY=your_freedomfiber_arcgis_api_key
`;

        // Append to existing file
        fs.writeFileSync(envPath, envContent + freedomFiberSection);

        console.log('✅ Added Freedom Fiber variables to existing .env file');
        console.log('');
        console.log('📝 Next steps:');
        console.log('   1. Edit .env file to update the Freedom Fiber credentials');
        console.log('   2. Replace placeholder URLs and keys with your actual values');
        console.log('   3. Run: npm run dev:freedomfiber');

    } catch (error) {
        console.error('❌ Error updating .env file:', error.message);
        process.exit(1);
    }
}

console.log('');
console.log('🎯 Expected format:');
console.log('   VITE_FREEDOMFIBER_SUPABASE_URL=https://abc123.supabase.co');
console.log('   VITE_FREEDOMFIBER_SUPABASE_KEY=eyJ0eXAiOiJKV1QiLCJhbGc...');
console.log('');
console.log('💡 Tip: You can copy your existing credentials and just add "FREEDOMFIBER_" to the variable names'); 