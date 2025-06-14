// src/main.js - Updated with multi-tenant support
import './style.css';
import { initializeCalcite } from './calcite-setup.js';
import { ConfigManager } from './config-manager.js';
import { MapManager } from './map-manager.js';
import { DataManager } from './data-manager.js';
import { UIManager } from './ui-manager.js';
import { ErrorHandler } from './error-handler.js';
import { debugEnvironment, testDatabaseConnection, debugMapContainer } from './debug-helper.js';

class JWECApp {
    constructor() {
        this.configManager = null;
        this.mapManager = null;
        this.dataManager = null;
        this.uiManager = null;
        this.refreshInterval = null;
        this.config = null;
    }

    async init() {
        try {
            // Initialize error handling first
            ErrorHandler.init();

            // Initialize configuration first
            this.configManager = new ConfigManager();
            this.config = await this.configManager.init();

            console.log(`Initializing app for tenant: ${this.config.tenant.name}`);

            // Debug environment variables (in development)
            if (import.meta.env.DEV || import.meta.env.VITE_DEBUG) {
                debugEnvironment(this.config.tenant.id);
            }

            // Initialize Calcite Components
            await initializeCalcite();

            // Initialize managers with configuration
            this.dataManager = new DataManager(this.config);
            this.mapManager = new MapManager(this.config);
            this.uiManager = new UIManager(this.config);

            // Initialize the map
            await this.mapManager.init();

            // Debug map container in development
            if (import.meta.env.DEV || import.meta.env.VITE_DEBUG) {
                setTimeout(() => debugMapContainer(), 500);
            }

            // Set up UI event handlers
            this.setupEventHandlers();

            // Test database connection in development
            if (import.meta.env.DEV || import.meta.env.VITE_DEBUG) {
                testDatabaseConnection(this.dataManager);
            }

            // Load initial data
            await this.loadData();

            // Set up system theme monitoring
            this.setupSystemTheme();

            // Start auto-refresh if enabled
            if (this.config.features.autoRefresh) {
                this.startAutoRefresh();
            }

            // Hide loading indicator
            this.uiManager.hideLoading();

            console.log(`${this.config.tenant.name} app initialized successfully`);

        } catch (error) {
            console.error('Error initializing app:', error);
            this.uiManager?.showAlert(`Error initializing ${this.config?.tenant?.name || 'application'}`, 'red');
        }
    }

    setupEventHandlers() {
        // Home button
        document.getElementById('home-action').addEventListener('click', () => {
            this.mapManager.goHome();
        });

        // Locate button - only if enabled
        if (this.config.features.enableGeolocation) {
            document.getElementById('locate-action').addEventListener('click', () => {
                this.mapManager.locateUser();
            });
        } else {
            // Hide locate button if disabled
            const locateAction = document.getElementById('locate-action');
            if (locateAction) locateAction.style.display = 'none';
        }

        // Refresh button
        document.getElementById('refresh-action').addEventListener('click', () => {
            this.loadData();
            this.uiManager.showAlert('Data refreshed', 'green');
        });

        // Layers panel toggle - only if enabled
        if (this.config.features.enableLayersPanel) {
            document.getElementById('layers-action').addEventListener('click', () => {
                this.uiManager.toggleLayersPanel();
            });
        } else {
            // Hide layers button if disabled
            const layersAction = document.getElementById('layers-action');
            if (layersAction) layersAction.style.display = 'none';
        }

        // Layer visibility toggles
        if (this.config.features.showFiber) {
            document.getElementById('fiber-toggle').addEventListener('calciteCheckboxChange', (e) => {
                this.mapManager.toggleLayer('fiber', e.target.checked);
            });
        }

        if (this.config.features.showElectric) {
            document.getElementById('electric-toggle').addEventListener('calciteCheckboxChange', (e) => {
                this.mapManager.toggleLayer('electric', e.target.checked);
            });
        }

        // Basemap selection - only if enabled
        if (this.config.features.enableBasemapSwitcher) {
            document.getElementById('basemap-group').addEventListener('calciteRadioButtonGroupChange', (e) => {
                this.mapManager.changeBasemap(e.target.selectedItem.value);
            });
        }

        // Window resize handler
        window.addEventListener('resize', () => {
            this.mapManager.resize();
        });

        // Tenant-specific event handlers
        this.setupTenantSpecificHandlers();
    }

    setupTenantSpecificHandlers() {
        // Add any tenant-specific functionality here
        switch (this.config.tenant.id) {
            case 'jwec':
                // JWEC-specific features
                break;
            case 'flashfiber':
                // Flash Fiber-specific features
                break;
            default:
                // Default behavior
                break;
        }
    }

    setupSystemTheme() {
        // Initialize theme based on system preference
        const isDarkTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (isDarkTheme) {
            document.documentElement.classList.add('calcite-mode-dark');
        } else {
            document.documentElement.classList.remove('calcite-mode-dark');
        }

        // Listen for system theme changes
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addListener((e) => {
                if (e.matches) {
                    document.documentElement.classList.add('calcite-mode-dark');
                } else {
                    document.documentElement.classList.remove('calcite-mode-dark');
                }

                // Update map theme if MapManager supports it
                if (this.mapManager && this.mapManager.updateTheme) {
                    this.mapManager.updateTheme();
                }

                console.log(`System theme changed to ${e.matches ? 'dark' : 'light'} mode`);
            });
        }

        console.log(`System theme initialized: ${isDarkTheme ? 'dark' : 'light'} mode`);
    }

    async loadData() {
        try {
            // Show loading state for counters
            this.uiManager.showCounterLoading();

            const promises = [];

            // Load fiber data if enabled
            if (this.config.features.showFiber) {
                promises.push(this.dataManager.fetchFiberData());
            } else {
                promises.push(Promise.resolve([]));
            }

            // Load electric data if enabled
            if (this.config.features.showElectric) {
                promises.push(this.dataManager.fetchElectricData());
            } else {
                promises.push(Promise.resolve([]));
            }

            const [fiberData, electricData] = await Promise.all(promises);

            // Update map layers
            if (this.config.features.showFiber) {
                await this.mapManager.updateFiberLayer(fiberData);
            }

            if (this.config.features.showElectric) {
                await this.mapManager.updateElectricLayer(electricData);
            }

            // Update counters
            this.uiManager.updateCounters(
                this.config.features.showFiber ? fiberData.length : 0,
                this.config.features.showElectric ? electricData.length : 0
            );

            console.log(`Data loaded for ${this.config.tenant.name}: ${fiberData.length} fiber, ${electricData.length} electric`);

        } catch (error) {
            console.error('Error loading data:', error);
            this.uiManager.showAlert('Error loading data', 'red');
        }
    }

    startAutoRefresh() {
        const interval = this.config.features.refreshInterval || 60000;

        this.refreshInterval = setInterval(() => {
            this.loadData();
        }, interval);

        console.log(`Auto-refresh enabled: ${interval / 1000}s interval`);
    }

    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        if (this.mapManager) {
            this.mapManager.destroy();
        }
    }

    // Public API for debugging and external access
    getConfig() {
        return this.config;
    }

    getTenant() {
        return this.config?.tenant;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    const app = new JWECApp();
    await app.init();

    // Store app instance globally for debugging
    window.jwecApp = app;

    // Add debug functions to window (development only)
    if (import.meta.env.DEV || import.meta.env.VITE_DEBUG) {
        window.debugTenant = () => debugEnvironment(app.config.tenant.id);
        window.testConnection = () => testDatabaseConnection(app.dataManager);
        window.debugMap = () => debugMapContainer();
        window.debugBounds = () => {
            console.log('🗺️  Map Bounds:', app.mapManager.bounds);
            console.log('📍 Center Point:', app.mapManager.centerPoint);
            console.log('🌙 Theme:', app.mapManager.isDarkTheme ? 'Dark' : 'Light');
            console.log('🎨 Current Basemap:', app.mapManager.map?.basemap?.id);
            const clustering = app.config?.clustering;
            if (clustering?.enabled) {
                console.log('🔒 Privacy: Tenant-specific clustering enabled');
                console.log(`📊 Cluster radius: ${clustering.radius}px, min: ${clustering.minSize}px, max: ${clustering.maxSize}px`);
                console.log('🛡️  Privacy mode:', clustering.privacyMode ? 'ON' : 'OFF');
            } else {
                console.log('📊 Clustering: Disabled for this tenant');
            }
        };
        window.debugClustering = () => {
            console.log('🏗️  Layer Types:');
            console.log('   Fiber Layer Type:', app.mapManager.fiberLayer?.type);
            console.log('   Electric Layer Type:', app.mapManager.electricLayer?.type);
            console.log('');
            console.log('🔍 Clustering Configuration:');
            console.log('   Fiber Layer Clustering:', app.mapManager.fiberLayer?.featureReduction);
            console.log('   Electric Layer Clustering:', app.mapManager.electricLayer?.featureReduction);
            console.log('');
            console.log('📊 Data Counts:');
            if (app.mapManager.fiberLayer?.type === 'feature') {
                console.log('   Fiber FeatureLayer Features:', app.mapManager.fiberLayer?.source?.length);
            } else {
                console.log('   Fiber GraphicsLayer Graphics:', app.mapManager.fiberLayer?.graphics?.length);
            }
            if (app.mapManager.electricLayer?.type === 'feature') {
                console.log('   Electric FeatureLayer Features:', app.mapManager.electricLayer?.source?.length);
            } else {
                console.log('   Electric GraphicsLayer Graphics:', app.mapManager.electricLayer?.graphics?.length);
            }
        };
        window.toggleTheme = () => {
            const isDark = document.documentElement.classList.toggle('calcite-mode-dark');
            app.mapManager.updateTheme();
            console.log(`Manually toggled to ${isDark ? 'dark' : 'light'} theme`);
        };

        console.log('🛠️  Debug functions available:');
        console.log('   debugTenant() - Show environment variables');
        console.log('   testConnection() - Test database connection');
        console.log('   debugMap() - Debug map container');
        console.log('   debugBounds() - Show map bounds and theme info');
        console.log('   debugClustering() - Show clustering configuration and data');
        console.log('   toggleTheme() - Manually toggle dark/light theme');
    }

    // Log tenant info for debugging
    console.log('Tenant Configuration:', app.getConfig());
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.jwecApp) {
        window.jwecApp.destroy();
    }
});