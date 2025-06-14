// src/config-manager.js
export class ConfigManager {
    constructor() {
        this.config = null;
        this.tenantId = null;
    }

    async init() {
        // For development: Check environment variable first
        if (import.meta.env.VITE_TENANT_ID) {
            this.tenantId = import.meta.env.VITE_TENANT_ID;
        }
        // Method 1: URL parameter (for testing)
        else if (this.detectTenantFromParams()) {
            this.tenantId = this.detectTenantFromParams();
        }
        // Method 2: Domain-based tenant detection  
        else {
            this.tenantId = this.detectTenantFromDomain();
        }

        // Load configuration
        this.config = await this.loadTenantConfig(this.tenantId);

        // Apply configuration
        this.applyConfiguration();

        return this.config;
    }

    detectTenantFromDomain() {
        const hostname = window.location.hostname;

        // Domain mapping examples:
        const domainMap = {
            'jwec.fiberoms.cloud': 'jwec',
            'flashfiber.fiberoms.cloud': 'flashfiber',
            'freedomfiber.fiberoms.cloud': 'freedomfiber',
            'centralelectric.fiberoms.cloud': 'centralelectric',
            'southerntel.fiberoms.cloud': 'southerntel',
            'localhost': 'freedomfiber', // Default for development (most recent tenant)
            '127.0.0.1': 'freedomfiber'
        };

        // Subdomain detection (alternative approach)
        const subdomain = hostname.split('.')[0];
        if (subdomain && subdomain !== 'www') {
            return subdomain;
        }

        return domainMap[hostname] || 'default';
    }

    detectTenantFromPath() {
        // For deployments like: yoursite.com/jwec/, yoursite.com/flashfiber/
        const pathSegments = window.location.pathname.split('/').filter(Boolean);
        return pathSegments[0] || 'default';
    }

    detectTenantFromParams() {
        // For testing: yoursite.com?tenant=jwec
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('tenant') || 'default';
    }

    async loadTenantConfig(tenantId) {
        try {
            // Method 1: Static config files
            const response = await fetch(`/configs/${tenantId}.json`);
            if (!response.ok) {
                throw new Error(`Config not found for tenant: ${tenantId}`);
            }
            return await response.json();

        } catch (error) {
            console.warn(`Failed to load config for ${tenantId}, using default:`, error);

            // Fallback to default config
            try {
                const defaultResponse = await fetch('/configs/default.json');
                return await defaultResponse.json();
            } catch (defaultError) {
                console.error('Failed to load default config:', defaultError);
                return this.getHardcodedDefaultConfig();
            }
        }
    }

    getHardcodedDefaultConfig() {
        // Use detected tenant ID if available, otherwise default
        const tenantId = this.tenantId || 'default';

        return {
            tenant: {
                id: tenantId,
                name: 'Default ISP',
                domain: 'localhost'
            },
            branding: {
                logo: '/logo-default.png',
                favicon: '/favicon.ico',
                primaryColor: '#2563eb',
                secondaryColor: '#dc2626',
                companyName: 'Default ISP'
            },
            map: {
                bounds: {
                    xmin: -87.526,
                    ymin: 34.2596,
                    xmax: -86.530,
                    ymax: 34.9244
                },
                basemap: 'streets-navigation-vector',
                minZoom: 7,
                maxZoom: 16
            },
            database: {
                // Use tenant-specific environment variables if available
                supabaseUrl: this.getEnvironmentConfig().supabaseUrl,
                supabaseKey: this.getEnvironmentConfig().supabaseKey,
                tables: {
                    fiber: 'offline',
                    electric: 'electric'
                }
            },
            features: {
                showElectric: true,
                showFiber: true,
                enableClustering: true,
                enableSearch: true,
                enableGeolocation: true,
                autoRefresh: true,
                refreshInterval: 60000
            },
            ui: {
                title: 'Outage Map',
                counters: {
                    fiber: 'Fiber Offline',
                    electric: 'Power Outage'
                },
                theme: 'light'
            }
        };
    }

    applyConfiguration() {
        if (!this.config) return;

        // Apply branding
        this.applyBranding();

        // Apply meta tags
        this.applyMetaTags();

        // Apply CSS custom properties
        this.applyCSSVariables();
    }

    applyBranding() {
        const { branding } = this.config;

        // Update logo
        const logoImg = document.querySelector('#map-logo img');
        if (logoImg && branding.logo) {
            logoImg.src = branding.logo;
            logoImg.alt = `${branding.companyName} Logo`;
        }

        // Update favicon
        if (branding.favicon) {
            let favicon = document.querySelector('link[rel="icon"]');
            if (!favicon) {
                favicon = document.createElement('link');
                favicon.rel = 'icon';
                document.head.appendChild(favicon);
            }
            favicon.href = branding.favicon;
        }
    }

    applyMetaTags() {
        const { tenant, branding } = this.config;

        // Update title
        document.title = `${branding.companyName} - ${this.config.ui.title}`;

        // Update meta description
        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
            metaDescription = document.createElement('meta');
            metaDescription.name = 'description';
            document.head.appendChild(metaDescription);
        }
        metaDescription.content = `Real-time outage tracking map for ${branding.companyName} service area`;
    }

    applyCSSVariables() {
        const { branding } = this.config;
        const root = document.documentElement;

        // Apply custom colors
        if (branding.primaryColor) {
            root.style.setProperty('--tenant-primary', branding.primaryColor);
        }
        if (branding.secondaryColor) {
            root.style.setProperty('--tenant-secondary', branding.secondaryColor);
        }
    }

    // Getter methods for easy access
    getTenantId() {
        return this.tenantId;
    }

    getConfig() {
        return this.config;
    }

    getBranding() {
        return this.config?.branding || {};
    }

    getMapConfig() {
        return this.config?.map || {};
    }

    getDatabaseConfig() {
        return this.config?.database || {};
    }

    getFeatures() {
        return this.config?.features || {};
    }

    getUIConfig() {
        return this.config?.ui || {};
    }

    // Dynamic environment variable loading
    getEnvironmentConfig() {
        const tenantPrefix = `VITE_${this.tenantId.toUpperCase().replace('-', '_')}_`;

        return {
            supabaseUrl: import.meta.env[`${tenantPrefix}SUPABASE_URL`] || import.meta.env.VITE_SUPABASE_URL,
            supabaseKey: import.meta.env[`${tenantPrefix}SUPABASE_KEY`] || import.meta.env.VITE_SUPABASE_ANON_KEY,
            arcgisKey: import.meta.env[`${tenantPrefix}ARCGIS_KEY`] || import.meta.env.VITE_ARCGIS_API_KEY
        };
    }
}