#!/usr/bin/env node

// scripts/cleanup-for-production.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧹 Cleaning up for production build...\n');

const filesToRemove = [
    // Development files
    '.env.example',
    '.DS_Store',
    'README.md',

    // Development scripts (keep only essential ones)
    'scripts/test-setup.js',

    // IDE files
    '.idea',
    '.vscode',

    // Git files (if deploying without git)
    // '.git',
    // '.gitignore',
];

const directoriesToClean = [
    'node_modules/.cache',
    'dist',
    '.vite',
];

let removedCount = 0;
let cleanedCount = 0;

// Remove specified files
filesToRemove.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    try {
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            if (stats.isDirectory()) {
                fs.rmSync(filePath, { recursive: true, force: true });
            } else {
                fs.unlinkSync(filePath);
            }
            console.log(`   ❌ Removed: ${file}`);
            removedCount++;
        }
    } catch (error) {
        console.log(`   ⚠️  Could not remove ${file}: ${error.message}`);
    }
});

// Clean cache directories
directoriesToClean.forEach(dir => {
    const dirPath = path.join(__dirname, '..', dir);
    try {
        if (fs.existsSync(dirPath)) {
            fs.rmSync(dirPath, { recursive: true, force: true });
            console.log(`   🗑️  Cleaned: ${dir}`);
            cleanedCount++;
        }
    } catch (error) {
        console.log(`   ⚠️  Could not clean ${dir}: ${error.message}`);
    }
});

// Create production environment check
const prodEnvContent = `# Production Environment
# Generated automatically - do not edit
VITE_ENVIRONMENT=production
VITE_APP_VERSION=${process.env.npm_package_version || '1.0.0'}
VITE_BUILD_TIME=${new Date().toISOString()}
`;

try {
    fs.writeFileSync('.env.production', prodEnvContent);
    console.log('   ✅ Created .env.production');
} catch (error) {
    console.log(`   ⚠️  Could not create .env.production: ${error.message}`);
}

// Update package.json for production (remove dev scripts)
try {
    const packagePath = path.join(__dirname, '..', 'package.json');
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

    // Keep only essential scripts for production
    const productionScripts = {
        'build': pkg.scripts.build,
        'preview': pkg.scripts.preview,
        'validate:configs': pkg.scripts['validate:configs']
    };

    // Create production package.json (backup original first)
    fs.writeFileSync(packagePath + '.backup', JSON.stringify(pkg, null, 2));

    const prodPkg = {
        ...pkg,
        scripts: productionScripts,
        devDependencies: {}, // Remove dev dependencies for production
        private: true
    };

    fs.writeFileSync(packagePath, JSON.stringify(prodPkg, null, 2));
    console.log('   📦 Updated package.json for production (backup created)');

} catch (error) {
    console.log(`   ⚠️  Could not update package.json: ${error.message}`);
}

console.log(`\n📊 Cleanup Summary:`);
console.log(`   Files removed: ${removedCount}`);
console.log(`   Directories cleaned: ${cleanedCount}`);
console.log(`   Ready for production build! 🚀`);

console.log('\n💡 Next steps:');
console.log('   1. Run: npm run build');
console.log('   2. Deploy the dist/ folder');
console.log('   3. To restore dev environment: npm run reinstall'); 