// Main application logic for the ISP Outage Map
import { activeISP, mapboxToken } from './config.js';
import { formatNumber } from './utils.js';

// Global variables
let map = null;
let supabaseClient = null;
let geocoder = null;
let subscribersData = [];
let refreshTimer = null;
let selectedSubscriber = null;
let isDarkMode = false;
let realtimeSubscription = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Check if configuration is valid
    if (!activeISP || !mapboxToken) {
        showError('Invalid configuration. Please check config.js');
        return;
    }

    // Initialize theme
    initializeTheme();

    // Initialize ISP branding
    initializeBranding();

    // Initialize Supabase client
    initializeSupabase();

    // Initialize Mapbox
    initializeMap();

    // Set up realtime subscriptions (with polling fallback)
    setupRealtimeSubscription();

    // Set up event listeners
    setupEventListeners();
});

// Initialize theme (light/dark mode)
function initializeTheme() {
    // Clear any old saved preferences (we always follow system now)
    localStorage.removeItem('theme');

    // Always follow system theme preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    isDarkMode = prefersDark;

    console.log('🎨 Theme initialization:', {
        systemPrefersDark: prefersDark,
        usingDarkMode: isDarkMode
    });

    applyTheme();

    // Listen for system theme changes and always follow them
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    darkModeQuery.addEventListener('change', (e) => {
        console.log('🎨 System theme changed to:', e.matches ? 'dark' : 'light');
        console.log('✅ Following system theme change');
        isDarkMode = e.matches;
        applyTheme();
    });
}

// Apply theme to the document
function applyTheme() {
    document.body.classList.toggle('dark-mode', isDarkMode);

    // Update map style if map is initialized
    if (map) {
        const newStyle = isDarkMode ?
            (activeISP.map.styleDark || activeISP.map.style) :
            (activeISP.map.styleLight || activeISP.map.style);

        if (newStyle) {
            map.setStyle(newStyle);

            // Re-add sources and layers after style change
            map.once('style.load', () => {
                addOutageSources();
                loadOfflineSubscribers();
            });
        }
    }

    // No localStorage saving - always follow system theme
}

// Initialize ISP branding
function initializeBranding() {
    // Set ISP name
    const nameElement = document.getElementById('isp-name');
    if (nameElement) {
        nameElement.textContent = activeISP.name;
    }

    // Set ISP logo if available
    const logoElement = document.getElementById('isp-logo');
    if (logoElement && activeISP.logo) {
        logoElement.src = activeISP.logo;
        logoElement.style.display = 'block';
        logoElement.onerror = () => {
            logoElement.style.display = 'none';
        };
    }

    // Apply brand colors to CSS variables
    if (activeISP.primaryColor) {
        document.documentElement.style.setProperty('--primary-color', activeISP.primaryColor);
    }
    if (activeISP.secondaryColor) {
        document.documentElement.style.setProperty('--secondary-color', activeISP.secondaryColor);
    }
}

// Initialize Supabase client
function initializeSupabase() {
    if (!activeISP.supabase || !activeISP.supabase.url || !activeISP.supabase.anonKey) {
        console.warn('Supabase configuration missing. Running in demo mode.');
        // Load demo data instead
        loadDemoData();
        return;
    }

    try {
        supabaseClient = window.supabase.createClient(
            activeISP.supabase.url,
            activeISP.supabase.anonKey
        );
    } catch (error) {
        console.error('Failed to initialize Supabase:', error);
        loadDemoData();
    }
}

// Initialize Mapbox map
function initializeMap() {
    // Set Mapbox access token
    mapboxgl.accessToken = mapboxToken;

    // Validate token
    if (!mapboxToken || mapboxToken === 'YOUR_MAPBOX_ACCESS_TOKEN') {
        showError('Please add your Mapbox access token to config.js');
        return;
    }

    // Get map style based on theme
    const mapStyle = isDarkMode ?
        (activeISP.map.styleDark || activeISP.map.style || 'mapbox://styles/mapbox/dark-v11') :
        (activeISP.map.styleLight || activeISP.map.style || 'mapbox://styles/mapbox/streets-v12');

    // Create map instance
    const mapOptions = {
        container: 'map',
        style: mapStyle,
        minZoom: activeISP.map.minZoom || 2,
        maxZoom: activeISP.map.maxZoom || 20
    };

    // Add max bounds if configured (restricts panning area)
    if (activeISP.map.maxBounds) {
        mapOptions.maxBounds = activeISP.map.maxBounds;
    }

    map = new mapboxgl.Map(mapOptions);

    // Fit map to bounds instead of using center/zoom
    if (activeISP.map.maxBounds) {
        map.fitBounds(activeISP.map.maxBounds, {
            padding: 0, // No padding for tighter fit
            maxZoom: activeISP.map.zoom || 9 // Use configured zoom level
        });
    } else {
        // Fallback to center/zoom if no bounds are defined
        map.setCenter(activeISP.map.center);
        map.setZoom(activeISP.map.zoom);
    }


    // Initialize geocoder (search)
    initializeGeocoder();

    // Add map event listeners
    map.on('load', () => {
        hideLoading();
        addOutageSources();
        loadOfflineSubscribers();
    });

    // Handle cluster clicks (zoom in)
    map.on('click', 'clusters', (e) => {
        const features = map.queryRenderedFeatures(e.point, {
            layers: ['clusters']
        });
        const clusterId = features[0].properties.cluster_id;
        map.getSource('subscribers').getClusterExpansionZoom(
            clusterId,
            (err, zoom) => {
                if (err) return;

                map.easeTo({
                    center: features[0].geometry.coordinates,
                    zoom: zoom
                });
            }
        );
    });

    // Handle unclustered point clicks (zoom in on single subscriber)
    map.on('click', 'unclustered-point', (e) => {
        const features = map.queryRenderedFeatures(e.point, {
            layers: ['unclustered-point']
        });

        if (features && features.length > 0) {
            // Zoom in on the single subscriber location
            map.easeTo({
                center: features[0].geometry.coordinates,
                zoom: Math.min(map.getZoom() + 2, activeISP.map.maxZoom || 18),
                duration: 1000
            });
        }
    });

    // Change cursor on hover for clusters
    map.on('mouseenter', 'clusters', () => {
        map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'clusters', () => {
        map.getCanvas().style.cursor = '';
    });

    // Change cursor on hover for unclustered points (single subscriber "clusters")
    map.on('mouseenter', 'unclustered-point', () => {
        map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'unclustered-point', () => {
        map.getCanvas().style.cursor = '';
    });
}

// Custom Home Control class
class HomeControl {
    onAdd(map) {
        this._map = map;
        this._container = document.createElement('div');
        this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';

        const homeButton = document.createElement('button');
        homeButton.className = 'mapboxgl-ctrl-icon mapboxgl-ctrl-home';
        homeButton.type = 'button';
        homeButton.title = 'Reset to initial view';
        homeButton.setAttribute('aria-label', 'Reset to initial view');

        // Add home icon (SVG)
        homeButton.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9,22 9,12 15,12 15,22"></polyline>
            </svg>
        `;

        // Add click event to reset map to initial position
        homeButton.addEventListener('click', () => {
            if (activeISP.map.maxBounds) {
                this._map.fitBounds(activeISP.map.maxBounds, {
                    padding: 0,
                    maxZoom: activeISP.map.zoom || 9,
                    duration: 1000
                });
            } else {
                this._map.flyTo({
                    center: activeISP.map.center,
                    zoom: activeISP.map.zoom,
                    duration: 1000
                });
            }
        });

        this._container.appendChild(homeButton);
        return this._container;
    }

    onRemove() {
        this._container.parentNode.removeChild(this._container);
        this._map = undefined;
    }
}

// Initialize geocoder for search functionality
function initializeGeocoder() {
    const geocoderConfig = activeISP.geocoder || {};

    geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl,
        placeholder: geocoderConfig.placeholder || 'Search for address...',
        countries: geocoderConfig.countries,
        bbox: geocoderConfig.bbox,
        limit: geocoderConfig.limit || 5,
        marker: {
            color: '#3FB1CE' // Standard Mapbox blue
        }
    });

    map.addControl(geocoder, 'top-right');

    // Add navigation controls after geocoder
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add geolocate control after geocoder
    map.addControl(new mapboxgl.GeolocateControl({
        positionOptions: {
            enableHighAccuracy: true
        },
        trackUserLocation: false,
        showUserHeading: false
    }), 'top-right');

    // Add home button control
    map.addControl(new HomeControl(), 'top-right');

    // Listen for search results
    geocoder.on('result', (e) => {
        // Optionally zoom to result
        const { center } = e.result;
        map.flyTo({
            center: center,
            zoom: 14,
            duration: 2000
        });

        // Close geocoder on mobile after selecting result
        if (window.innerWidth <= 768) {
            const geocoderElement = document.querySelector('.mapboxgl-ctrl-geocoder');
            if (geocoderElement) {
                setTimeout(() => {
                    geocoderElement.classList.remove('expanded');
                }, 500);
            }
        }
    });
}

// Add subscriber data sources and layers to map
function addOutageSources() {
    const markerSettings = activeISP.markerSettings || {};
    const enableClustering = markerSettings.enableClustering !== false;
    const clusterRadius = markerSettings.clusterRadius || 50;

    // Add source for subscriber data with clustering support
    if (!map.getSource('subscribers')) {
        map.addSource('subscribers', {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: []
            },
            cluster: enableClustering,
            clusterMaxZoom: 14, // Max zoom to cluster points on
            clusterRadius: clusterRadius // Radius of each cluster when clustering points
        });
    }

    const offlineColor = activeISP.statusColors?.offline || '#DC2626';
    const baseSize = markerSettings.size || 8;

    // Add cluster circle layer
    if (!map.getLayer('clusters')) {
        map.addLayer({
            id: 'clusters',
            type: 'circle',
            source: 'subscribers',
            filter: ['has', 'point_count'],
            paint: {
                // Size clusters based on point count
                'circle-radius': [
                    'step',
                    ['get', 'point_count'],
                    20,  // Size for < 10 points
                    10, 30,  // Size for 10-100 points
                    100, 40,  // Size for 100-750 points
                    750, 50   // Size for 750+ points
                ],
                // Single standard color for all clusters
                'circle-color': offlineColor,  // Uses the ISP's configured offline color
                'circle-opacity': 0.8,
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffffff'
            }
        });
    }

    // Add cluster count label layer
    if (!map.getLayer('cluster-count')) {
        map.addLayer({
            id: 'cluster-count',
            type: 'symbol',
            source: 'subscribers',
            filter: ['has', 'point_count'],
            layout: {
                'text-field': '{point_count_abbreviated}',
                'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                'text-size': 14
            },
            paint: {
                'text-color': '#ffffff'
            }
        });
    }

    // Add unclustered point layer (individual subscribers styled as clusters)
    if (!map.getLayer('unclustered-point')) {
        map.addLayer({
            id: 'unclustered-point',
            type: 'circle',
            source: 'subscribers',
            filter: ['!', ['has', 'point_count']],
            paint: {
                'circle-radius': 20,  // Same as smallest cluster size
                'circle-color': offlineColor,  // Same color as clusters
                'circle-opacity': 0.8,
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffffff'
            }
        });
    }

    // Add count label for unclustered points (showing "1")
    if (!map.getLayer('unclustered-count')) {
        map.addLayer({
            id: 'unclustered-count',
            type: 'symbol',
            source: 'subscribers',
            filter: ['!', ['has', 'point_count']],
            layout: {
                'text-field': '1',
                'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                'text-size': 14
            },
            paint: {
                'text-color': '#ffffff'
            }
        });
    }
}

// Load offline subscribers from Supabase
async function loadOfflineSubscribers() {
    if (!supabaseClient) {
        console.log('No Supabase client, using demo data');
        loadDemoData();
        return;
    }

    showLoading();

    try {
        const filters = activeISP.supabase.filters;
        const tableName = activeISP.supabase.tables.subscribers;

        // Build query to get offline subscribers with coordinates
        let query = supabaseClient
            .from(tableName)
            .select('*', { count: 'exact' })
            .eq(filters.statusField, filters.offlineValue);

        // Only get records with valid coordinates
        if (filters.requireCoordinates) {
            query = query
                .not('latitude', 'is', null)
                .not('longitude', 'is', null);
        }

        const { data, error, count } = await query;

        if (error) {
            console.error('Error loading offline subscribers:', error);
            showError('Failed to load offline subscribers');
            loadDemoData();
            return;
        }

        console.log(`📡 Loaded ${count || 0} offline subscribers`);

        // Process and display subscribers
        processSubscriberData(data, count);

    } catch (error) {
        console.error('Error loading offline subscribers:', error);
        loadDemoData();
    } finally {
        hideLoading();
        updateLastUpdateTime();
    }
}

// Process subscriber data and update map
function processSubscriberData(data, count) {
    if (!data || data.length === 0) {
        subscribersData = [];
        updateMap();
        updateSubscriberCount(0);
        console.warn('⚠️ No offline subscribers found');
        return;
    }

    // Convert subscribers to GeoJSON features
    const columns = activeISP.supabase.tables.columns;
    const features = convertSubscribersToGeoJSON(data, columns);

    subscribersData = features;
    updateMap();
    updateSubscriberCount(features.length);

    console.log(`🗺️ Displaying ${features.length} offline subscribers on map`);

    // Optionally fit map to subscribers if count is reasonable
    if (features.length > 0 && features.length <= 100) {
        const bounds = calculateBounds(features);
        if (bounds) {
            map.fitBounds(bounds, { padding: 100 });
        }
    }
}

// Update subscriber count in legend
function updateSubscriberCount(count) {
    const countElement = document.getElementById('subscriber-count');
    if (countElement) {
        countElement.textContent = formatNumber(count);
    }
}

// Convert subscriber data to GeoJSON features
function convertSubscribersToGeoJSON(data, columns) {
    return data.map((subscriber, index) => {
        const lat = parseFloat(subscriber[columns.latitude]);
        const lng = parseFloat(subscriber[columns.longitude]);

        // Validate coordinates
        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            console.warn(`Invalid coordinates for subscriber at index ${index}: [${lng}, ${lat}]`);
            return null;
        }

        return {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [lng, lat] // GeoJSON uses [longitude, latitude]
            },
            properties: {
                // Only include non-personal information for public display
                status: subscriber[columns.status],
                updated_at: subscriber[columns.updated_at]
            }
        };
    }).filter(feature => feature !== null);
}

// Update map with subscriber data
function updateMap() {
    if (!map || !map.getSource('subscribers')) return;

    const collection = {
        type: 'FeatureCollection',
        features: subscribersData
    };

    map.getSource('subscribers').setData(collection);
}

// Load demo data for testing
function loadDemoData() {
    console.log('📊 Loading demo subscriber data...');

    // Generate some demo offline subscriber points around the map center
    const center = activeISP.map.center;
    const demoFeatures = [];

    // Create 25 demo offline subscribers scattered around the center
    for (let i = 0; i < 25; i++) {
        // Random offset from center (roughly 0.1 degrees = ~11km)
        const lngOffset = (Math.random() - 0.5) * 0.2;
        const latOffset = (Math.random() - 0.5) * 0.2;

        demoFeatures.push({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [center[0] + lngOffset, center[1] + latOffset]
            },
            properties: {
                status: 'Offline',
                updated_at: new Date().toISOString()
            }
        });
    }

    subscribersData = demoFeatures;
    updateMap();
    updateSubscriberCount(demoFeatures.length);
    updateLastUpdateTime();

    console.log(`✅ Loaded ${demoFeatures.length} demo offline subscribers`);
}

// Note: Individual marker clicks disabled for public-facing map
// Only cluster clicks are enabled to zoom in

// Set up Supabase realtime subscription for instant updates
function setupRealtimeSubscription() {
    if (!supabaseClient) {
        console.log('⚠️ No Supabase client - using polling fallback');
        startPollingFallback();
        return;
    }

    const tableName = activeISP.supabase.tables.subscribers;
    const filters = activeISP.supabase.filters;

    console.log('🔄 Setting up realtime subscription...');

    // Subscribe to ALL changes on the mfs table (no filter)
    // This allows us to detect when subscribers go from Offline → Online
    realtimeSubscription = supabaseClient
        .channel('offline-subscribers-changes')
        .on(
            'postgres_changes',
            {
                event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
                schema: 'public',
                table: tableName
                // No filter - we handle status filtering in handleRealtimeChange
            },
            (payload) => {
                console.log('📡 Realtime update received:', payload.eventType);
                handleRealtimeChange(payload);
            }
        )
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log('✅ Realtime subscription active');
            } else if (status === 'CHANNEL_ERROR') {
                console.error('❌ Realtime subscription error - falling back to polling');
                startPollingFallback();
            } else if (status === 'TIMED_OUT') {
                console.error('⏱️ Realtime subscription timed out - falling back to polling');
                startPollingFallback();
            }
        });
}

// Handle realtime changes from Supabase
function handleRealtimeChange(payload) {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    const columns = activeISP.supabase.tables.columns;
    const filters = activeISP.supabase.filters;

    switch (eventType) {
        case 'INSERT':
            // New record inserted - check if it's offline
            const newStatus = newRecord[columns.status];
            if (newStatus === filters.offlineValue) {
                console.log('➕ New offline subscriber detected');
                const newFeature = createSubscriberFeature(newRecord, columns);
                if (newFeature) {
                    subscribersData.push(newFeature);
                    updateMap();
                    updateSubscriberCount(subscribersData.length);
                    updateLastUpdateTime();
                }
            }
            break;

        case 'UPDATE':
            // Subscriber updated - use in-memory state to detect status change
            const lat = parseFloat(newRecord[columns.latitude]);
            const lng = parseFloat(newRecord[columns.longitude]);
            const updatedStatus = newRecord[columns.status];

            // Check if subscriber currently exists in our offline list (in-memory)
            const existingIndex = subscribersData.findIndex(f =>
                f.geometry.coordinates[0] === lng &&
                f.geometry.coordinates[1] === lat
            );

            const wasOffline = existingIndex !== -1;
            const isNowOffline = updatedStatus === filters.offlineValue;

            console.log(`🔄 Update: wasOffline=${wasOffline}, isNowOffline=${isNowOffline}`);

            if (isNowOffline && !wasOffline) {
                // Went OFFLINE (Online → Offline)
                console.log('📴 Subscriber went OFFLINE - adding to map');
                const newFeature = createSubscriberFeature(newRecord, columns);
                if (newFeature) {
                    subscribersData.push(newFeature);
                    updateMap();
                    updateSubscriberCount(subscribersData.length);
                    updateLastUpdateTime();
                }
            } else if (!isNowOffline && wasOffline) {
                // Came ONLINE (Offline → Online)
                console.log('✅ Subscriber came ONLINE - removing from map');
                subscribersData = subscribersData.filter(f =>
                    f.geometry.coordinates[0] !== lng ||
                    f.geometry.coordinates[1] !== lat
                );
                updateMap();
                updateSubscriberCount(subscribersData.length);
                updateLastUpdateTime();
            } else if (isNowOffline && wasOffline) {
                // Still offline, just update the data
                console.log('🔄 Offline subscriber updated');
                const updatedFeature = createSubscriberFeature(newRecord, columns);
                if (updatedFeature) {
                    subscribersData[existingIndex] = updatedFeature;
                    updateMap();
                    updateLastUpdateTime();
                }
            }
            // else: was online and still online - ignore
            break;

        case 'DELETE':
            // Subscriber record was deleted entirely
            console.log('🗑️ Subscriber record deleted');
            if (oldRecord) {
                const lat = parseFloat(oldRecord[columns.latitude]);
                const lng = parseFloat(oldRecord[columns.longitude]);

                // Remove from map if it exists
                subscribersData = subscribersData.filter(f =>
                    f.geometry.coordinates[0] !== lng ||
                    f.geometry.coordinates[1] !== lat
                );

                updateMap();
                updateSubscriberCount(subscribersData.length);
                updateLastUpdateTime();
            }
            break;
    }
}

// Create a single subscriber feature
function createSubscriberFeature(record, columns) {
    const lat = parseFloat(record[columns.latitude]);
    const lng = parseFloat(record[columns.longitude]);

    // Validate coordinates
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        console.warn(`Invalid coordinates: [${lng}, ${lat}]`);
        return null;
    }

    return {
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: [lng, lat]
        },
        properties: {
            status: record[columns.status],
            updated_at: record[columns.updated_at]
        }
    };
}

// Fallback to polling if realtime doesn't work
function startPollingFallback() {
    // Clear existing timer if any
    if (refreshTimer) {
        clearInterval(refreshTimer);
    }

    // Set up refresh interval as fallback
    const interval = activeISP.refreshInterval || 60000;
    console.log(`⏱️ Starting polling fallback (${interval / 1000}s interval)`);
    refreshTimer = setInterval(() => {
        loadOfflineSubscribers();
    }, interval);
}

// Update last update time display
function updateLastUpdateTime() {
    const element = document.getElementById('last-update');
    if (element) {
        const now = new Date();
        element.textContent = `Last updated: ${now.toLocaleTimeString()}`;
    }
}

// Set up event listeners
function setupEventListeners() {
    // Search toggle button (mobile only)
    const searchToggle = document.getElementById('search-toggle');

    if (searchToggle) {
        searchToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const geocoderElement = document.querySelector('.mapboxgl-ctrl-geocoder');
            if (geocoderElement) {
                const isExpanded = geocoderElement.classList.toggle('expanded');

                // Focus input when expanded
                if (isExpanded) {
                    const input = geocoderElement.querySelector('.mapboxgl-ctrl-geocoder--input');
                    if (input) {
                        setTimeout(() => input.focus(), 300);
                    }
                }
            }
        });
    }

    // Close geocoder when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            const geocoderElement = document.querySelector('.mapboxgl-ctrl-geocoder');
            const searchToggle = document.getElementById('search-toggle');

            if (geocoderElement &&
                geocoderElement.classList.contains('expanded') &&
                !geocoderElement.contains(e.target) &&
                !searchToggle.contains(e.target)) {
                geocoderElement.classList.remove('expanded');
            }
        }
    });

    // Close button for outage info
    const closeBtn = document.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeOutageInfo);
    }

    // Escape key to close panels and geocoder on mobile
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeOutageInfo();

            // Close geocoder on mobile
            if (window.innerWidth <= 768) {
                const geocoderElement = document.querySelector('.mapboxgl-ctrl-geocoder');
                if (geocoderElement) {
                    geocoderElement.classList.remove('expanded');
                }
            }
        }
    });

    // Window resize handler
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (map) {
                map.resize();
            }
        }, 250);
    });
}

// Show loading spinner
function showLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = 'flex';
    }
}

// Hide loading spinner
function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = 'none';
    }
}

// Show error message
function showError(message) {
    console.error(message);
    hideLoading();

    // Could implement a toast notification here
    // For now, just log to console
    const mapContainer = document.getElementById('map');
    if (mapContainer && !map) {
        mapContainer.innerHTML = `
            <div class="error-message">
                <h3>Error</h3>
                <p>${message}</p>
                <p>Please check the browser console for more details.</p>
            </div>
        `;
    }
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    // Clear polling timer if exists
    if (refreshTimer) {
        clearInterval(refreshTimer);
    }

    // Unsubscribe from realtime channel
    if (realtimeSubscription) {
        supabaseClient.removeChannel(realtimeSubscription);
        console.log('🔌 Realtime subscription closed');
    }
});
