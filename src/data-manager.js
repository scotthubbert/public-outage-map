// src/data-manager.js - Updated with multi-tenant support
import { createClient } from '@supabase/supabase-js';

export class DataManager {
    constructor(config) {
        this.config = config;
        this.tenantId = config.tenant.id;

        // Get database configuration from config (which includes env variable overrides)
        const dbConfig = {
            url: config.database.supabaseUrl,
            key: config.database.supabaseKey
        };

        // Fallback to tenant-specific environment variables if not in config
        if (!dbConfig.url || !dbConfig.key) {
            const envConfig = this.getDatabaseConfig();
            dbConfig.url = dbConfig.url || envConfig.url;
            dbConfig.key = dbConfig.key || envConfig.key;
        }

        // Initialize Supabase client with tenant-specific config
        this.supabase = createClient(dbConfig.url, dbConfig.key);

        // Get table names from config
        this.tables = config.database.tables;

        console.log(`DataManager initialized for tenant: ${this.tenantId}`);
    }

    getDatabaseConfig() {
        // Check for tenant-specific environment variables first
        const tenantPrefix = `VITE_${this.tenantId.toUpperCase().replace('-', '_')}_`;

        const url = import.meta.env[`${tenantPrefix}SUPABASE_URL`] ||
            import.meta.env.VITE_SUPABASE_URL;

        const key = import.meta.env[`${tenantPrefix}SUPABASE_KEY`] ||
            import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (!url || !key) {
            throw new Error(`Missing Supabase configuration for tenant: ${this.tenantId}`);
        }

        return { url, key };
    }

    async fetchFiberData() {
        try {
            const tableName = this.tables.fiber;

            let query = this.supabase.from(tableName).select('*');

            // Add tenant filtering if using shared database
            if (this.config.database.multiTenant) {
                query = query.eq('tenant_id', this.tenantId);
            }

            // Apply tenant-specific filters (e.g., status = 'Offline')
            if (this.config.database.filters?.fiber) {
                const filters = this.config.database.filters.fiber;
                Object.entries(filters).forEach(([key, value]) => {
                    query = query.eq(key, value);
                });
            }

            const { data, error } = await query;

            if (error) {
                console.error(`Error fetching fiber data for ${this.tenantId}:`, error);
                throw error;
            }

            // Transform data to standardized format - simplified for public data
            return data.map(item => ({
                id: item.id,
                longitude: item.longitude || item.Longitude,
                latitude: item.latitude || item.Latitude,
                type: 'fiber_offline',
                tenant_id: this.tenantId,
                status: item.status,
                last_update: item.last_update || item.updated_at || item.created_at,
                // Add any tenant-specific fields
                ...this.transformTenantSpecificFields(item, 'fiber')
            }));

        } catch (error) {
            console.error(`Error in fetchFiberData for ${this.tenantId}:`, error);
            throw error;
        }
    }

    async fetchElectricData() {
        try {
            const tableName = this.tables.electric;

            let query = this.supabase.from(tableName).select('*');

            // Add tenant filtering if using shared database
            if (this.config.database.multiTenant) {
                query = query.eq('tenant_id', this.tenantId);
            }

            // Apply tenant-specific filters
            if (this.config.database.filters?.electric) {
                const filters = this.config.database.filters.electric;
                Object.entries(filters).forEach(([key, value]) => {
                    query = query.eq(key, value);
                });
            }

            const { data, error } = await query;

            if (error) {
                console.error(`Error fetching electric data for ${this.tenantId}:`, error);
                throw error;
            }

            // Transform data to standardized format
            return data.map(item => ({
                id: item.id,
                longitude: item.Longitude || item.longitude,
                latitude: item.Latitude || item.latitude,
                type: 'electric_outage',
                tenant_id: this.tenantId,
                created_at: item.created_at,
                // Add any tenant-specific fields
                ...this.transformTenantSpecificFields(item, 'electric')
            }));

        } catch (error) {
            console.error(`Error in fetchElectricData for ${this.tenantId}:`, error);
            throw error;
        }
    }

    transformTenantSpecificFields(item, type) {
        // Handle tenant-specific data transformations
        const transformations = {};

        switch (this.tenantId) {
            case 'jwec':
                // JWEC might have additional fields like 'priority', 'affected_customers'
                if (item.priority) transformations.priority = item.priority;
                if (item.affected_customers) transformations.affectedCustomers = item.affected_customers;
                break;

            case 'flashfiber':
                // Flash Fiber might track 'estimated_repair_time'
                if (item.estimated_repair_time) transformations.estimatedRepair = item.estimated_repair_time;
                if (item.service_type) transformations.serviceType = item.service_type;
                break;

            case 'freedomfiber':
                // Freedom Fiber public data - minimal fields for location plotting
                if (item.city) transformations.city = item.city;
                if (item.county) transformations.county = item.county;
                if (item.state) transformations.state = item.state;
                // Only include non-sensitive technical fields if needed
                if (item.service_type) transformations.serviceType = item.service_type;
                break;

            default:
                // Default transformation
                break;
        }

        return transformations;
    }

    // Real-time subscriptions with tenant isolation
    subscribeToFiberChanges(callback) {
        const tableName = this.tables.fiber;

        let channel = this.supabase
            .channel(`${this.tenantId}_fiber_changes`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: tableName,
                // Add tenant filter if using shared database
                ...(this.config.database.multiTenant && {
                    filter: `tenant_id=eq.${this.tenantId}`
                })
            }, callback);

        return channel.subscribe();
    }

    subscribeToElectricChanges(callback) {
        const tableName = this.tables.electric;

        let channel = this.supabase
            .channel(`${this.tenantId}_electric_changes`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: tableName,
                // Add tenant filter if using shared database
                ...(this.config.database.multiTenant && {
                    filter: `tenant_id=eq.${this.tenantId}`
                })
            }, callback);

        return channel.subscribe();
    }

    // Advanced querying with tenant-specific logic
    async fetchDataWithFilters(type, filters = {}) {
        try {
            const tableName = type === 'fiber' ? this.tables.fiber : this.tables.electric;

            let query = this.supabase.from(tableName).select('*');

            // Add tenant filtering
            if (this.config.database.multiTenant) {
                query = query.eq('tenant_id', this.tenantId);
            }

            // Apply additional filters
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    query = query.eq(key, value);
                }
            });

            // Add date range if specified
            if (filters.startDate) {
                query = query.gte('created_at', filters.startDate);
            }
            if (filters.endDate) {
                query = query.lte('created_at', filters.endDate);
            }

            const { data, error } = await query;

            if (error) throw error;

            return data.map(item => ({
                id: item.id,
                longitude: item.Longitude || item.longitude,
                latitude: item.Latitude || item.latitude,
                type: type === 'fiber' ? 'fiber_offline' : 'electric_outage',
                tenant_id: this.tenantId,
                created_at: item.created_at,
                ...this.transformTenantSpecificFields(item, type)
            }));

        } catch (error) {
            console.error(`Error fetching ${type} data with filters:`, error);
            throw error;
        }
    }

    // Get statistics for dashboard
    async getOutageStatistics() {
        try {
            const promises = [];

            if (this.config.features.showFiber) {
                promises.push(this.getTableCount(this.tables.fiber));
            } else {
                promises.push(Promise.resolve(0));
            }

            if (this.config.features.showElectric) {
                promises.push(this.getTableCount(this.tables.electric));
            } else {
                promises.push(Promise.resolve(0));
            }

            const [fiberCount, electricCount] = await Promise.all(promises);

            return {
                fiber: fiberCount,
                electric: electricCount,
                total: fiberCount + electricCount,
                lastUpdated: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error getting outage statistics:', error);
            return { fiber: 0, electric: 0, total: 0, lastUpdated: null };
        }
    }

    async getTableCount(tableName) {
        try {
            let query = this.supabase
                .from(tableName)
                .select('*', { count: 'exact', head: true });

            if (this.config.database.multiTenant) {
                query = query.eq('tenant_id', this.tenantId);
            }

            const { count, error } = await query;

            if (error) throw error;

            return count || 0;
        } catch (error) {
            console.error(`Error counting records in ${tableName}:`, error);
            return 0;
        }
    }

    // Utility method to test tenant-specific connection
    async testConnection() {
        try {
            let query = this.supabase
                .from(this.tables.fiber)
                .select('*', { count: 'exact', head: true });

            // Apply the same filters as fetchFiberData
            if (this.config.database.filters?.fiber) {
                const filters = this.config.database.filters.fiber;
                Object.entries(filters).forEach(([key, value]) => {
                    query = query.eq(key, value);
                });
            }

            const { count, error } = await query;

            if (error) throw error;

            console.log(`Supabase connection successful for tenant: ${this.tenantId}`);
            return true;
        } catch (error) {
            console.error(`Supabase connection failed for tenant ${this.tenantId}:`, error);
            return false;
        }
    }

    // Data export functionality
    async exportData(type, format = 'json') {
        try {
            const data = type === 'fiber'
                ? await this.fetchFiberData()
                : await this.fetchElectricData();

            switch (format) {
                case 'csv':
                    return this.convertToCSV(data);
                case 'json':
                default:
                    return JSON.stringify(data, null, 2);
            }
        } catch (error) {
            console.error(`Error exporting ${type} data:`, error);
            throw error;
        }
    }

    convertToCSV(data) {
        if (!data || data.length === 0) return '';

        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(row =>
            Object.values(row).map(value =>
                typeof value === 'string' ? `"${value}"` : value
            ).join(',')
        );

        return [headers, ...rows].join('\n');
    }
}