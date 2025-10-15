// ISP Configuration File
// Select which ISP configuration to use by changing the 'activeConfig' value
const CONFIG = {
    // Set the active ISP configuration (change this to switch between ISPs)
    activeConfig: 'isp1', // Options: 'isp1', 'isp2', 'isp3', etc.

    // Mapbox Configuration
    mapbox: {
        // Add your Mapbox access token here
        accessToken: 'pk.eyJ1Ijoic2h1YmJlcnQiLCJhIjoiY2w3dDRxbHc3MDI3djNwbzlla21mdGN1ayJ9.JtobQxO6Y03DqV9wd8KmYA'
    },

    // ISP Configurations
    isps: {
        // ISP 1 Configuration
        isp1: {
            // ISP Branding
            // name: 'Freedom Fiber',
            logo: 'https://sp-ao.shortpixel.ai/client/to_webp,q_glossy,ret_img,w_235/https://freedomfiber.com/wp-content/uploads/2022/06/freedomfiber.png',
            primaryColor: '#0066CC',
            secondaryColor: '#004499',

            // Map Settings
            map: {
                // Initial map view - bounds covering Columbus MS to Town Creek AL
                // Columbus MS: 33.4957, -88.4273
                // Town Creek AL: 34.6795, -87.4064
                center: [-87.9169, 34.0876], // Center point between the two cities
                zoom: 8,
                minZoom: 7,
                maxZoom: 13,
                // Max bounds to limit panning [SW, NE] - expanded for better zoom out
                // maxBounds: [
                //     [-90.0, 32.0], // Southwest coordinates (expanded)
                //     [-85.0, 36.0]  // Northeast coordinates (expanded)
                // ],
                // Map styles for light and dark modes
                styleLight: 'mapbox://styles/shubbert/clrxt6zz1015s01p16n6b5idi',
                styleDark: 'mapbox://styles/shubbert/cm53iohp000j301s25zzkeqhg'
            },

            // Geocoder Settings (search box)
            geocoder: {
                // Limit search to specific country/region
                countries: 'us',
                // Bounding box for search results [minLng, minLat, maxLng, maxLat]
                // Covers Columbus MS to Town Creek AL area
                bbox: [-89.0, 33.0, -86.8, 35.2],
                // Placeholder text
                placeholder: 'Search for address or area...',
                // Limit number of results
                limit: 5
            },

            // Supabase Configuration
            supabase: {
                url: 'https://edgylwgzemacxrehvxcs.supabase.co',
                anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZ3lsd2d6ZW1hY3hyZWh2eGNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTQ3NDkzNDQsImV4cCI6MjAzMDMyNTM0NH0.fEPeJ_61AD3XNzTnLOLQdnBe6Oxwz_Xze9W4-AdZu54',
                // Table and column mappings
                tables: {
                    subscribers: 'mfs', // Main table for subscribers
                    // Column mappings (only non-personal data for public display)
                    columns: {
                        latitude: 'latitude',
                        longitude: 'longitude',
                        status: 'status', // Offline, Online, etc.
                        updated_at: 'updated_at'
                        // Note: Personal data (name, address, ID) excluded for privacy
                    }
                },
                // Query filters
                filters: {
                    statusField: 'status',
                    offlineValue: 'Offline',
                    requireCoordinates: true
                }
            },

            // Data refresh interval (milliseconds)
            // Note: Only used as fallback if realtime subscriptions fail
            // With realtime enabled, updates are instant (< 1 second)
            refreshInterval: 60000, // 1 minute (fallback only)

            // Subscriber status colors
            statusColors: {
                offline: '#DC2626',  // Red - for offline subscribers
                online: '#10B981',   // Green - for online (if shown)
                degraded: '#F59E0B'  // Amber - for degraded service (if applicable)
            },

            // Marker settings
            markerSettings: {
                size: 8,              // Base marker size
                hoverSize: 12,        // Size on hover
                clusterRadius: 50,    // Cluster radius in pixels
                enableClustering: true // Enable/disable marker clustering
            }
        },

        // ISP 2 Configuration
        isp2: {
            name: 'Metro Broadband Services',
            logo: '/assets/logos/metro-logo.png',
            primaryColor: '#7C3AED',
            secondaryColor: '#6D28D9',

            map: {
                center: [-74.0060, 40.7128], // New York City
                zoom: 8,
                minZoom: 6,
                maxZoom: 18,
                // Map styles for light and dark modes
                styleLight: 'mapbox://styles/mapbox/streets-v12',
                styleDark: 'mapbox://styles/mapbox/dark-v11'
            },

            geocoder: {
                countries: 'us',
                bbox: [-74.5, 40.4, -73.5, 41.0],
                placeholder: 'Search New York area...',
                limit: 5
            },

            supabase: {
                url: 'https://your-project-2.supabase.co',
                anonKey: 'your-anon-key-2',
                tables: {
                    subscribers: 'mfs',
                    columns: {
                        latitude: 'latitude',
                        longitude: 'longitude',
                        status: 'status',
                        updated_at: 'updated_at'
                        // Note: Personal data excluded for privacy
                    }
                },
                filters: {
                    statusField: 'status',
                    offlineValue: 'Offline',
                    requireCoordinates: true
                }
            },

            refreshInterval: 30000, // 30 seconds

            statusColors: {
                offline: '#EF4444',
                online: '#34D399',
                degraded: '#FCD34D'
            },

            markerSettings: {
                size: 8,
                hoverSize: 12,
                clusterRadius: 50,
                enableClustering: true
            }
        },

        // ISP 3 Configuration
        isp3: {
            name: 'Pacific Coast Internet',
            logo: '/assets/logos/pacific-logo.png',
            primaryColor: '#0891B2',
            secondaryColor: '#0E7490',

            map: {
                center: [-122.4194, 37.7749], // San Francisco
                zoom: 9,
                minZoom: 7,
                maxZoom: 18,
                // Map styles for light and dark modes
                styleLight: 'mapbox://styles/mapbox/streets-v12',
                styleDark: 'mapbox://styles/mapbox/dark-v11'
            },

            geocoder: {
                countries: 'us',
                bbox: [-123.5, 37.0, -121.5, 38.5],
                placeholder: 'Search Bay Area...',
                limit: 5
            },

            supabase: {
                url: 'https://your-project-3.supabase.co',
                anonKey: 'your-anon-key-3',
                tables: {
                    subscribers: 'mfs',
                    columns: {
                        latitude: 'latitude',
                        longitude: 'longitude',
                        status: 'status',
                        updated_at: 'updated_at'
                        // Note: Personal data excluded for privacy
                    }
                },
                filters: {
                    statusField: 'status',
                    offlineValue: 'Offline',
                    requireCoordinates: true
                }
            },

            refreshInterval: 45000, // 45 seconds

            statusColors: {
                offline: '#B91C1C',
                online: '#059669',
                degraded: '#FBBF24'
            },

            markerSettings: {
                size: 8,
                hoverSize: 12,
                clusterRadius: 50,
                enableClustering: true
            }
        }
    }
};

// Export the active configuration
export const activeISP = CONFIG.isps[CONFIG.activeConfig];
export const mapboxToken = CONFIG.mapbox.accessToken;

// Validate configuration
if (!activeISP) {
    console.error(`Invalid ISP configuration: ${CONFIG.activeConfig}`);
    alert('Invalid ISP configuration. Please check config.js');
}
