// src/debug-helper.js
// Helper for debugging tenant-specific environment variables

export function debugEnvironment(tenantId) {
    console.group(`🔍 Environment Debug for: ${tenantId}`);

    const tenantPrefix = `VITE_${tenantId.toUpperCase().replace('-', '_')}_`;

    const envVars = {
        supabaseUrl: import.meta.env[`${tenantPrefix}SUPABASE_URL`] || import.meta.env.VITE_SUPABASE_URL,
        supabaseKey: import.meta.env[`${tenantPrefix}SUPABASE_KEY`] || import.meta.env.VITE_SUPABASE_ANON_KEY,
        arcgisKey: import.meta.env[`${tenantPrefix}ARCGIS_KEY`] || import.meta.env.VITE_ARCGIS_API_KEY
    };

    console.log('🔑 Environment Variables:');
    console.log(`   ${tenantPrefix}SUPABASE_URL:`, envVars.supabaseUrl ? '✅ Found' : '❌ Missing');
    console.log(`   ${tenantPrefix}SUPABASE_KEY:`, envVars.supabaseKey ? '✅ Found (****)' : '❌ Missing');
    console.log(`   ${tenantPrefix}ARCGIS_KEY:`, envVars.arcgisKey ? '✅ Found (****)' : '⚠️  Optional');

    console.log('');
    console.log('📋 Expected variable names for this tenant:');
    console.log(`   VITE_${tenantId.toUpperCase().replace('-', '_')}_SUPABASE_URL`);
    console.log(`   VITE_${tenantId.toUpperCase().replace('-', '_')}_SUPABASE_KEY`);
    console.log(`   VITE_${tenantId.toUpperCase().replace('-', '_')}_ARCGIS_KEY`);

    console.groupEnd();

    return envVars;
}

export function testDatabaseConnection(dataManager) {
    console.group('🔌 Testing Database Connection');

    dataManager.testConnection()
        .then(success => {
            if (success) {
                console.log('✅ Database connection successful!');
                return dataManager.getOutageStatistics();
            } else {
                console.error('❌ Database connection failed');
                return null;
            }
        })
        .then(stats => {
            if (stats) {
                console.log('📊 Current Statistics:', stats);
            }
        })
        .catch(error => {
            console.error('❌ Connection test failed:', error);
        })
        .finally(() => {
            console.groupEnd();
        });
}

export function debugMapContainer() {
    console.group('🗺️ Map Container Debug');

    const mapContainer = document.getElementById('map');
    const mapContainerParent = document.getElementById('map-container');

    if (!mapContainer) {
        console.error('❌ Map container (#map) not found');
        return;
    }

    if (!mapContainerParent) {
        console.error('❌ Map container parent (#map-container) not found');
        return;
    }

    const containerRect = mapContainer.getBoundingClientRect();
    const parentRect = mapContainerParent.getBoundingClientRect();

    console.log('📏 Container Dimensions:');
    console.log(`   Map Container: ${containerRect.width}x${containerRect.height}`);
    console.log(`   Parent Container: ${parentRect.width}x${parentRect.height}`);
    console.log(`   Visibility: ${window.getComputedStyle(mapContainer).visibility}`);
    console.log(`   Display: ${window.getComputedStyle(mapContainer).display}`);
    console.log(`   Flex: ${window.getComputedStyle(mapContainer).flex}`);
    console.log(`   Position: ${window.getComputedStyle(mapContainer).position}`);

    // Check if container has proper size
    if (containerRect.width === 0 || containerRect.height === 0) {
        console.error('❌ Map container has zero dimensions!');
        console.log('💡 Try refreshing the page or checking CSS styles');
    } else {
        console.log('✅ Map container has proper dimensions');
    }

    console.groupEnd();
} 