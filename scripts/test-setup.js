#!/usr/bin/env node

// scripts/test-setup.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Testing Multi-Tenant Outage Map Setup...\n');

const tests = [
    {
        name: 'Configuration Files',
        check: () => {
            const configsDir = path.join(__dirname, '../public/configs');
            const configs = fs.readdirSync(configsDir).filter(f => f.endsWith('.json'));
            return configs.length >= 3 ? `✅ Found ${configs.length} tenant configs` : `❌ Only ${configs.length} configs found`;
        }
    },
    {
        name: 'Package Dependencies',
        check: () => {
            const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            const required = ['@arcgis/core', '@esri/calcite-components', '@supabase/supabase-js'];
            const missing = required.filter(dep => !pkg.dependencies[dep]);
            return missing.length === 0 ? '✅ All dependencies present' : `❌ Missing: ${missing.join(', ')}`;
        }
    },
    {
        name: 'Source Files',
        check: () => {
            const srcFiles = ['main.js', 'config-manager.js', 'map-manager.js', 'data-manager.js', 'ui-manager.js'];
            const missing = srcFiles.filter(file => !fs.existsSync(`src/${file}`));
            return missing.length === 0 ? '✅ All source files present' : `❌ Missing: ${missing.join(', ')}`;
        }
    },
    {
        name: 'Build Configuration',
        check: () => {
            const hasVite = fs.existsSync('vite.config.js');
            const hasIndex = fs.existsSync('index.html');
            return hasVite && hasIndex ? '✅ Build setup complete' : '❌ Missing build configuration';
        }
    },
    {
        name: 'Environment Template',
        check: () => {
            const hasEnvExample = fs.existsSync('.env.example');
            return hasEnvExample ? '✅ Environment template exists' : '⚠️  Create .env.example for easier setup';
        }
    }
];

console.log('Running setup tests:\n');

let passed = 0;
tests.forEach((test, index) => {
    const result = test.check();
    console.log(`${index + 1}. ${test.name}: ${result}`);
    if (result.startsWith('✅')) passed++;
});

console.log(`\n📊 Results: ${passed}/${tests.length} tests passed\n`);

if (passed >= tests.length - 1) {
    console.log('🎉 Setup looks good! Ready for development.');
    console.log('\nNext steps:');
    console.log('1. Copy .env.example to .env and configure your Supabase credentials');
    console.log('2. Run: npm run dev');
    console.log('3. Visit: http://localhost:5173');
} else {
    console.log('⚠️  Some issues found. Please review the results above.');
}

console.log('\n🔗 Quick Links:');
console.log('• JWEC Tenant: http://localhost:5173?tenant=jwec');
console.log('• Flash Fiber: http://localhost:5173?tenant=flashfiber');
console.log('• Freedom Fiber: http://localhost:5173?tenant=freedomfiber');
console.log('• Validate Configs: npm run validate:configs'); 