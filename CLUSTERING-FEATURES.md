# Map Clustering Features

This document explains the clustering functionality implemented for the ISP Outage Map.

## Overview

The application now displays **offline subscribers** as individual points on the map, with automatic clustering when zoomed out for better visualization and performance.

## How It Works

### 1. **Individual Markers (Zoomed In)**

- When zoomed in (zoom level 14+), each offline subscriber appears as a cluster with "1" displayed
- Individual markers are styled to match clusters for consistency (light red circle with white text)
- **Privacy Note**: Individual subscriber details (names, addresses) are NOT displayed to protect customer privacy
- This is a public-facing map showing only the location and count of offline subscribers

### 2. **Clustered Markers (Zoomed Out)**

- When zoomed out, nearby subscribers automatically cluster together
- Clusters show:
  - **Count badge** - number of subscribers in that cluster
  - **Color gradient** - darker red = more subscribers
  - **Size scaling** - larger circles = more subscribers

### 3. **Cluster Interaction**

- **Click on a cluster** to zoom in and expand it (including clusters showing "1")
- **Hover over clusters** to see cursor change (indicating clickable)
- **Note**: Both multi-subscriber clusters and single-subscriber clusters (showing "1") are clickable to zoom in
- Clusters automatically break apart as you zoom in

## Clustering Levels

The clustering uses a size-based scale with consistent color:

| Subscriber Count | Circle Size | Color                              |
| ---------------- | ----------- | ---------------------------------- |
| 1                | 20px        | ISP configured offline color (red) |
| 2 - 9            | 20px        | ISP configured offline color (red) |
| 10 - 100         | 30px        | ISP configured offline color (red) |
| 100 - 750        | 40px        | ISP configured offline color (red) |
| 750+             | 50px        | ISP configured offline color (red) |

**Note:** All clusters use the same color - only the size changes based on count. This provides a cleaner, more consistent visual appearance.

## Configuration Options

You can customize clustering in `config.js`:

```javascript
markerSettings: {
    size: 8,                      // Base marker size for individual points
    hoverSize: 12,                // Size when hovering over marker
    clusterRadius: 50,            // Clustering radius in pixels (default: 50)
    enableClustering: true        // Enable/disable clustering
}
```

### Adjusting Cluster Behavior

**To make clusters tighter (more aggressive clustering):**

```javascript
clusterRadius: 80; // Larger radius = more clustering
```

**To spread clusters out (less clustering):**

```javascript
clusterRadius: 30; // Smaller radius = less clustering
```

**To disable clustering completely:**

```javascript
enableClustering: false; // Shows all individual markers at all zoom levels
```

## Database Query

The application fetches offline subscribers using:

```javascript
// Query: Get all offline subscribers with valid coordinates
const { data, error, count } = await supabaseClient
  .from("mfs")
  .select("*", { count: "exact" })
  .eq("status", "Offline")
  .not("latitude", "is", null)
  .not("longitude", "is", null);
```

## Legend Display

The legend shows:

- **Offline Subscriber** - Red dot indicator
- **Clustered** - Gradient indicator
- **Total count** - Real-time count of offline subscribers

## Performance Considerations

### Benefits of Clustering

1. **Better Performance**

   - Reduces number of rendered elements
   - Maintains smooth map interaction even with thousands of markers
   - Efficient memory usage

2. **Better UX**

   - Cleaner visual presentation at low zoom levels
   - Easy to see concentration areas
   - Quick overview of affected regions

3. **Auto-refresh Compatible**
   - Data refreshes every 60 seconds by default
   - Clusters update automatically
   - No performance impact on updates

### Recommended Settings by Scale

**Small ISP (< 1,000 subscribers):**

```javascript
clusterRadius: 40,
enableClustering: true,
refreshInterval: 30000  // 30 seconds
```

**Medium ISP (1,000 - 10,000 subscribers):**

```javascript
clusterRadius: 50,
enableClustering: true,
refreshInterval: 60000  // 1 minute
```

**Large ISP (10,000+ subscribers):**

```javascript
clusterRadius: 60,
enableClustering: true,
refreshInterval: 120000  // 2 minutes
```

## Map Controls

### Zoom Levels

- **Zoom 1-8**: Maximum clustering, overview of entire service area
- **Zoom 9-13**: Progressive cluster breakdown
- **Zoom 14+**: Individual markers visible

### Navigation

- **Mouse wheel** - Zoom in/out
- **Click + Drag** - Pan the map
- **Double click** - Zoom in to that location
- **Shift + Click + Drag** - Draw box to zoom to area

## Real-time Updates

The map automatically refreshes offline subscriber data at the configured interval:

```javascript
refreshInterval: 60000; // 1 minute (60,000 milliseconds)
```

During refresh:

- New offline subscribers appear immediately
- Restored subscribers disappear
- Clusters recalculate automatically
- Total count updates

## Testing

### Demo Mode

If Supabase is not configured, the app loads 25 demo subscribers:

```bash
npm run dev
# Map loads with demo data scattered around the center point
```

### With Real Data

Once Supabase is configured:

```bash
npm run dev
# Map loads actual offline subscribers from your mfs table
```

### Verify Clustering

1. Zoom out to see clusters form
2. Click cluster to zoom in
3. Verify individual markers appear
4. Check subscriber details on click

## Troubleshooting

### Clusters not appearing

- Check if `enableClustering: true` in config
- Verify zoom level is below 14
- Ensure you have multiple subscribers close together

### Markers not clickable

- Check browser console for errors
- Verify Supabase credentials are correct
- Ensure `mfs` table has data with valid lat/lng

### Count not updating

- Check refresh interval setting
- Verify Supabase connection
- Check browser network tab for API calls

## Example Use Cases

### 1. Outage Visualization

Quickly identify affected areas by cluster density and size.

### 2. Service Area Monitoring

See geographic distribution of offline subscribers at a glance.

### 3. Incident Response

Click clusters to drill down to specific affected subscribers.

### 4. Customer Service

Search for specific addresses and view nearby affected subscribers.

## Future Enhancements

Potential additions:

- Heat map overlay for offline concentration
- Time-based cluster coloring (how long offline)
- Service type filtering
- Export affected subscriber list
- Click cluster to see summary stats

---

**Current Configuration:**

- Supabase: Connected to `edgylwgzemacxrehvxcs.supabase.co`
- Table: `mfs`
- Status Filter: `Offline`
- Refresh Rate: 60 seconds
- Clustering: Enabled (radius: 50px)
