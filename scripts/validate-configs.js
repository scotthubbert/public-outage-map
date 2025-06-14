#!/usr/bin/env node

// scripts/validate-configs.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIGS_DIR = path.join(__dirname, '../public/configs');

const REQUIRED_FIELDS = {
    'tenant.id': 'string',
    'tenant.name': 'string',
    'tenant.domain': 'string',
    'branding.logo': 'string',
    'branding.primaryColor': 'string',
    'branding.companyName': 'string',
    'map.bounds.xmin': 'number',
    'map.bounds.ymin': 'number',
    'map.bounds.xmax': 'number',
    'map.bounds.ymax': 'number',
    'database.tables.fiber': 'string',
    'database.tables.electric': 'string',
    'features.showFiber': 'boolean',
    'features.showElectric': 'boolean',
    'ui.title': 'string'
};

function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
}

function validateConfig(configPath, config) {
    const errors = [];
    const warnings = [];

    // Check required fields
    for (const [fieldPath, expectedType] of Object.entries(REQUIRED_FIELDS)) {
        const value = getNestedValue(config, fieldPath);

        if (value === undefined || value === null) {
            errors.push(`Missing required field: ${fieldPath}`);
        } else if (typeof value !== expectedType) {
            errors.push(`Field ${fieldPath} should be ${expectedType}, got ${typeof value}`);
        }
    }

    // Validate map bounds
    const bounds = config.map?.bounds;
    if (bounds) {
        if (bounds.xmin >= bounds.xmax) {
            errors.push('Map bounds: xmin should be less than xmax');
        }
        if (bounds.ymin >= bounds.ymax) {
            errors.push('Map bounds: ymin should be less than ymax');
        }
    }

    // Check for color format
    const colors = ['primaryColor', 'secondaryColor', 'accentColor'];
    colors.forEach(colorField => {
        const color = config.branding?.[colorField];
        if (color && !color.match(/^#[0-9a-fA-F]{6}$/)) {
            warnings.push(`${colorField} should be a valid hex color (e.g., #2563eb)`);
        }
    });

    // Check refresh interval
    const refreshInterval = config.features?.refreshInterval;
    if (refreshInterval && (refreshInterval < 10000 || refreshInterval > 300000)) {
        warnings.push('Refresh interval should be between 10 seconds and 5 minutes');
    }

    return { errors, warnings };
}

async function main() {
    console.log('🔍 Validating tenant configuration files...\n');

    try {
        const configFiles = fs.readdirSync(CONFIGS_DIR)
            .filter(file => file.endsWith('.json'));

        let totalErrors = 0;
        let totalWarnings = 0;

        for (const configFile of configFiles) {
            const configPath = path.join(CONFIGS_DIR, configFile);
            const tenantId = path.basename(configFile, '.json');

            console.log(`📋 Validating ${tenantId}...`);

            try {
                const configContent = fs.readFileSync(configPath, 'utf8');

                // Check if file is empty
                if (!configContent.trim()) {
                    console.log(`   ❌ Config file is empty`);
                    totalErrors++;
                    continue;
                }

                const config = JSON.parse(configContent);
                const { errors, warnings } = validateConfig(configPath, config);

                if (errors.length === 0 && warnings.length === 0) {
                    console.log(`   ✅ Valid configuration`);
                } else {
                    if (errors.length > 0) {
                        console.log(`   ❌ ${errors.length} error(s):`);
                        errors.forEach(error => console.log(`      • ${error}`));
                        totalErrors += errors.length;
                    }

                    if (warnings.length > 0) {
                        console.log(`   ⚠️  ${warnings.length} warning(s):`);
                        warnings.forEach(warning => console.log(`      • ${warning}`));
                        totalWarnings += warnings.length;
                    }
                }
            } catch (parseError) {
                console.log(`   ❌ JSON parse error: ${parseError.message}`);
                totalErrors++;
            }

            console.log('');
        }

        // Summary
        console.log('📊 Validation Summary:');
        console.log(`   Configs checked: ${configFiles.length}`);
        console.log(`   Total errors: ${totalErrors}`);
        console.log(`   Total warnings: ${totalWarnings}`);

        if (totalErrors > 0) {
            console.log('\n❌ Validation failed! Please fix the errors above.');
            process.exit(1);
        } else if (totalWarnings > 0) {
            console.log('\n⚠️  Validation completed with warnings.');
        } else {
            console.log('\n✅ All configurations are valid!');
        }

    } catch (error) {
        console.error('Error during validation:', error);
        process.exit(1);
    }
}

main();
