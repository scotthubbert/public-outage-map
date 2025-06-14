#!/usr/bin/env node

// scripts/update-version.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const versionType = process.argv[2];

if (!versionType || !['patch', 'minor', 'major'].includes(versionType)) {
    console.log('❌ Usage: node update-version.js [patch|minor|major]');
    console.log('');
    console.log('Examples:');
    console.log('  npm run version:patch  # 1.0.0 → 1.0.1');
    console.log('  npm run version:minor  # 1.0.0 → 1.1.0');
    console.log('  npm run version:major  # 1.0.0 → 2.0.0');
    process.exit(1);
}

const packagePath = path.join(__dirname, '..', 'package.json');

try {
    // Read current package.json
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const currentVersion = pkg.version;

    console.log(`📦 Current version: ${currentVersion}`);

    // Parse version numbers
    const [major, minor, patch] = currentVersion.split('.').map(Number);

    // Calculate new version
    let newVersion;
    switch (versionType) {
        case 'patch':
            newVersion = `${major}.${minor}.${patch + 1}`;
            break;
        case 'minor':
            newVersion = `${major}.${minor + 1}.0`;
            break;
        case 'major':
            newVersion = `${major + 1}.0.0`;
            break;
    }

    console.log(`🚀 New version: ${newVersion}`);

    // Update package.json
    pkg.version = newVersion;
    fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');

    // Update all tenant configs with new version info
    const configsDir = path.join(__dirname, '..', 'public', 'configs');
    const configFiles = fs.readdirSync(configsDir).filter(f => f.endsWith('.json'));

    let configsUpdated = 0;
    configFiles.forEach(configFile => {
        try {
            const configPath = path.join(configsDir, configFile);
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

            // Add version info to config
            config.version = newVersion;
            config.lastUpdated = new Date().toISOString();

            fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
            configsUpdated++;
        } catch (error) {
            console.log(`⚠️  Could not update ${configFile}: ${error.message}`);
        }
    });

    // Create version info file for runtime access
    const versionInfo = {
        version: newVersion,
        buildDate: new Date().toISOString(),
        versionType: versionType,
        previousVersion: currentVersion
    };

    fs.writeFileSync(
        path.join(__dirname, '..', 'public', 'version.json'),
        JSON.stringify(versionInfo, null, 2) + '\n'
    );

    console.log('');
    console.log('✅ Version update complete!');
    console.log(`   📦 Package version: ${currentVersion} → ${newVersion}`);
    console.log(`   ⚙️  Updated ${configsUpdated} tenant configs`);
    console.log(`   📄 Created public/version.json`);

    console.log('');
    console.log('💡 Next steps:');
    console.log('   1. Review changes with: git diff');
    console.log('   2. Commit changes: git add . && git commit -m "chore: bump version to v' + newVersion + '"');
    console.log('   3. Create tag: git tag v' + newVersion);
    console.log('   4. Build for production: npm run build:prod');

} catch (error) {
    console.error('❌ Error updating version:', error.message);
    process.exit(1);
} 