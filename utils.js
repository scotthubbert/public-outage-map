// Utility functions for the outage map application

// Format date/time for display
function formatDateTime(dateString) {
    if (!dateString) return 'Unknown';

    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    // If less than 1 hour ago, show minutes
    if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return minutes <= 1 ? 'Just now' : `${minutes} minutes ago`;
    }

    // If less than 24 hours ago, show hours
    if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
    }

    // Otherwise show date and time
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

// Format ETA for restoration
function formatETA(etaString) {
    if (!etaString) return 'To be determined';

    const eta = new Date(etaString);
    const now = new Date();

    if (eta < now) {
        return 'Restoration in progress';
    }

    const diff = eta - now;
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);

    if (hours > 24) {
        return eta.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }

    if (hours > 0) {
        return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }

    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
}

// Get severity level from status
function getSeverityLevel(status) {
    const levels = {
        'critical': 4,
        'major': 3,
        'minor': 2,
        'resolved': 1
    };
    return levels[status?.toLowerCase()] || 0;
}

// Create GeoJSON feature from outage data
function createOutageFeature(outage, columns) {
    // Map the database columns to standard properties
    const geometry = outage[columns.geometry];

    // If geometry is a string, parse it
    let geoData = geometry;
    if (typeof geometry === 'string') {
        try {
            geoData = JSON.parse(geometry);
        } catch (e) {
            console.error('Failed to parse geometry:', e);
            return null;
        }
    }

    // Ensure we have valid geometry
    if (!geoData || !geoData.type || !geoData.coordinates) {
        console.error('Invalid geometry data:', geoData);
        return null;
    }

    return {
        type: 'Feature',
        geometry: geoData,
        properties: {
            id: outage[columns.id],
            status: outage[columns.status],
            area_name: outage[columns.area_name],
            affected_services: outage[columns.affected_services],
            estimated_restoration: outage[columns.estimated_restoration],
            description: outage[columns.description],
            created_at: outage[columns.created_at],
            updated_at: outage[columns.updated_at],
            customer_count: outage[columns.customer_count] || 0
        }
    };
}

// Create GeoJSON FeatureCollection from outages array
function createOutageCollection(outages, columns) {
    const features = outages
        .map(outage => createOutageFeature(outage, columns))
        .filter(feature => feature !== null);

    return {
        type: 'FeatureCollection',
        features: features
    };
}

// Get color for outage based on status
function getOutageColor(status, colors) {
    const statusLower = status?.toLowerCase();
    return colors[statusLower] || '#888888';
}

// Calculate bounds for a set of features
function calculateBounds(features) {
    if (!features || features.length === 0) return null;

    let minLng = Infinity, minLat = Infinity;
    let maxLng = -Infinity, maxLat = -Infinity;

    features.forEach(feature => {
        const coords = getFeatureCoordinates(feature);
        coords.forEach(coord => {
            minLng = Math.min(minLng, coord[0]);
            maxLng = Math.max(maxLng, coord[0]);
            minLat = Math.min(minLat, coord[1]);
            maxLat = Math.max(maxLat, coord[1]);
        });
    });

    if (!isFinite(minLng) || !isFinite(minLat) || !isFinite(maxLng) || !isFinite(maxLat)) {
        return null;
    }

    return [[minLng, minLat], [maxLng, maxLat]];
}

// Extract coordinates from various geometry types
function getFeatureCoordinates(feature) {
    const geometry = feature.geometry;
    const coords = [];

    switch (geometry.type) {
        case 'Point':
            coords.push(geometry.coordinates);
            break;
        case 'LineString':
            coords.push(...geometry.coordinates);
            break;
        case 'Polygon':
            coords.push(...geometry.coordinates[0]);
            break;
        case 'MultiPoint':
            coords.push(...geometry.coordinates);
            break;
        case 'MultiLineString':
            geometry.coordinates.forEach(line => coords.push(...line));
            break;
        case 'MultiPolygon':
            geometry.coordinates.forEach(polygon => coords.push(...polygon[0]));
            break;
    }

    return coords;
}

// Get center point of a feature
function getFeatureCenter(feature) {
    const coords = getFeatureCoordinates(feature);
    if (coords.length === 0) return null;

    const center = coords.reduce((acc, coord) => {
        acc[0] += coord[0];
        acc[1] += coord[1];
        return acc;
    }, [0, 0]);

    center[0] /= coords.length;
    center[1] /= coords.length;

    return center;
}

// Format number with commas
function formatNumber(num) {
    if (num === null || num === undefined) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Parse services list (could be string or array)
function parseServices(services) {
    if (!services) return 'All services';

    if (Array.isArray(services)) {
        return services.join(', ');
    }

    if (typeof services === 'string') {
        // Try to parse as JSON array
        try {
            const parsed = JSON.parse(services);
            if (Array.isArray(parsed)) {
                return parsed.join(', ');
            }
        } catch (e) {
            // If not JSON, return as is
            return services;
        }
    }

    return 'All services';
}

// Debounce function for search and other inputs
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Check if coordinates are within bounds
function isWithinBounds(coords, bounds) {
    if (!bounds || bounds.length !== 2) return true;

    const [minLng, minLat] = bounds[0];
    const [maxLng, maxLat] = bounds[1];
    const [lng, lat] = coords;

    return lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat;
}

// Get contrast color for text on colored background
function getContrastColor(hexColor) {
    // Convert hex to RGB
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);

    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance > 0.5 ? '#000000' : '#FFFFFF';
}
