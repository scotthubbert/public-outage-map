// scripts/build-tenant.js
import { build } from 'vite';
import fs from 'fs';
import path from 'path';

const tenant = process.argv[2];
if (!tenant) {
    console.error('Usage: node scripts/build-tenant.js <tenant-id>');
    process.exit(1);
}

// Validate tenant config exists
const configPath = `public/configs/${tenant}.json`;
if (!fs.existsSync(configPath)) {
    console.error(`Config file not found: ${configPath}`);
    process.exit(1);
}

console.log(`Building for tenant: ${tenant}`);

// Set environment variables for tenant-specific build
process.env.VITE_TENANT_ID = tenant;
process.env.VITE_BUILD_TENANT = tenant;

// Build the project
try {
    await build({
        define: {
            __TENANT_ID__: JSON.stringify(tenant)
        },
        build: {
            outDir: `dist/${tenant}`,
            assetsDir: 'assets'
        }
    });

    console.log(`Build completed for tenant: ${tenant}`);
    console.log(`Output directory: dist/${tenant}`);
} catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
}

// scripts/deploy-all.js
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Read all tenant configs
const configsDir = 'public/configs';
const tenants = fs.readdirSync(configsDir)
    .filter(file => file.endsWith('.json') && file !== 'default.json')
    .map(file => file.replace('.json', ''));

console.log(`Found tenants: ${tenants.join(', ')}`);

// Deploy each tenant
for (const tenant of tenants) {
    console.log(`\n🚀 Deploying ${tenant}...`);

    try {
        // Build for tenant
        execSync(`npm run build:tenant ${tenant}`, { stdio: 'inherit' });

        // Deploy based on tenant configuration
        const config = JSON.parse(fs.readFileSync(`${configsDir}/${tenant}.json`, 'utf8'));

        if (config.deployment?.type === 'vercel') {
            execSync(`vercel --prod --name ${tenant}-outage-map --cwd dist/${tenant}`, { stdio: 'inherit' });
        } else if (config.deployment?.type === 'netlify') {
            execSync(`netlify deploy --prod --dir dist/${tenant}`, { stdio: 'inherit' });
        } else {
            console.log(`No deployment config for ${tenant}, skipping...`);
        }

        console.log(`✅ ${tenant} deployed successfully`);
    } catch (error) {
        console.error(`❌ Failed to deploy ${tenant}:`, error.message);
    }
}

// package.json scripts addition
const packageJsonScripts = {
    "build:tenant": "node scripts/build-tenant.js",
    "build:all": "node scripts/build-all.js",
    "deploy:all": "node scripts/deploy-all.js",
    "dev:tenant": "VITE_TENANT_ID=jwec npm run dev",
    "validate:configs": "node scripts/validate-configs.js"
};

console.log('\nAdd these scripts to your package.json:');
console.log(JSON.stringify(packageJsonScripts, null, 2));