# Supabase Realtime Integration

This document explains how the application uses Supabase Realtime for instant updates when subscribers go offline or come back online.

## Overview

The ISP Outage Map uses **Supabase Realtime subscriptions** to receive instant notifications when the `mfs` table changes, eliminating the need for polling and providing a better user experience.

## How It Works

### 1. **Initial Data Load**

When the map loads:

```javascript
loadOfflineSubscribers(); // Fetch all offline subscribers
```

### 2. **Realtime Subscription**

Sets up a subscription to listen for **ALL** changes on the table:

```javascript
supabaseClient
  .channel("offline-subscribers-changes")
  .on(
    "postgres_changes",
    {
      event: "*", // INSERT, UPDATE, DELETE
      schema: "public",
      table: "mfs",
      // No filter - listens to all status changes
      // Uses in-memory state comparison to detect transitions
    },
    handleRealtimeChange
  )
  .subscribe();
```

**Smart State Detection:**

- Uses **coordinates** as unique identifier (no database ID needed)
- Compares in-memory `subscribersData` with incoming updates
- **No REPLICA IDENTITY FULL required** - state comparison works without old records

### 3. **Instant Updates**

When a subscriber's status changes:

- **New subscriber goes Offline** → INSERT event (status=Offline) → Marker appears instantly
- **Existing subscriber goes Offline** → UPDATE event (status changes to Offline) → Marker appears instantly
- **Subscriber comes Online** → UPDATE event (status changes from Offline to Online) → Marker disappears instantly
- **Subscriber deleted** → DELETE event → Marker disappears instantly

## Event Handling

### INSERT Event

```javascript
// New subscriber inserted (check if status is Offline)
if (status === 'Offline') {
  ➕ Add marker to map immediately
  📊 Update count: 45 → 46
  🕐 Update "Last updated" time
}
```

### UPDATE Event

```javascript
// Subscriber status changed - check old vs new status

// Case 1: Went Offline (Online → Offline)
if (oldStatus !== 'Offline' && newStatus === 'Offline') {
  📴 Add marker to map
  📊 Update count: 45 → 46
}

// Case 2: Came Online (Offline → Online)
if (oldStatus === 'Offline' && newStatus !== 'Offline') {
  ✅ Remove marker from map
  📊 Update count: 46 → 45
}

// Case 3: Still Offline (Offline → Offline)
if (oldStatus === 'Offline' && newStatus === 'Offline') {
  🔄 Update marker properties
}
```

### DELETE Event

```javascript
// Subscriber record was deleted from database
🗑️ Remove marker from map if exists
📊 Update count: 46 → 45
🕐 Update timestamp
```

## Database Setup

### Enable Realtime on Table

Add to your `schema.sql` or run in Supabase SQL editor:

```sql
-- Enable Realtime for the mfs table
ALTER PUBLICATION supabase_realtime ADD TABLE mfs;
```

**That's it!** No need for REPLICA IDENTITY FULL.

**How it works:**

- Application uses **in-memory state** to detect changes
- Compares coordinates in `subscribersData` with incoming UPDATE
- If in memory + now online → Remove (went online) ✅
- If not in memory + now offline → Add (went offline) ✅

### Verify Realtime is Enabled

In Supabase Dashboard:

1. Go to **Database** → **Replication**
2. Find the `supabase_realtime` publication
3. Verify `mfs` table is listed

## Fallback Strategy

The application includes a **polling fallback** if realtime fails:

```javascript
// If realtime subscription fails:
CHANNEL_ERROR → Fall back to 60-second polling
TIMED_OUT     → Fall back to 60-second polling
No Supabase   → Use demo data
```

This ensures the map works even if:

- Realtime is disabled in Supabase
- Network issues prevent WebSocket connection
- Browser doesn't support WebSockets

## Performance Benefits

### With Realtime Subscriptions

- ✅ **Instant updates** (< 1 second)
- ✅ **Lower database load** (no constant polling)
- ✅ **Fewer API calls** (only when data changes)
- ✅ **Better UX** (map updates as events happen)
- ✅ **Efficient** (WebSocket keeps connection open)

### Without Realtime (Polling)

- ❌ Delayed updates (up to 60 seconds)
- ❌ Constant database queries (every 60s)
- ❌ Wasted API calls (even when nothing changed)
- ❌ Higher latency

## Monitoring

### Browser Console Logs

The application provides detailed logging:

```javascript
// Subscription status
🔄 Setting up realtime subscription...
✅ Realtime subscription active

// Change events
📡 Realtime update received: INSERT
➕ New offline subscriber detected
📊 Displaying 47 offline subscribers on map

📡 Realtime update received: UPDATE
🔄 Subscriber status updated

📡 Realtime update received: DELETE
➖ Subscriber removed from offline list
```

### Supabase Dashboard

Monitor realtime activity:

1. Go to **Database** → **Replication**
2. View active subscriptions
3. Check WAL (Write-Ahead Log) status

## Configuration

### Refresh Interval (Fallback Only)

In `config.js`:

```javascript
refreshInterval: 60000; // Used only if realtime fails (milliseconds)
```

### Subscription Channel Name

In `app.js`:

```javascript
.channel('offline-subscribers-changes')  // Customize if needed
```

## Troubleshooting

### Realtime Not Working

**Check 1: Realtime Enabled**

```sql
-- Verify table is in publication
SELECT * FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'mfs';
```

**Check 2: RLS Policies**

```sql
-- Ensure anonymous can read
SELECT * FROM pg_policies
WHERE tablename = 'mfs';
```

**Check 3: Browser Console**

- Look for "Realtime subscription active" message
- Check for CHANNEL_ERROR or TIMED_OUT
- Verify WebSocket connection (Network tab)

### Fallback Activated

If you see:

```
⚠️ No Supabase client - using polling fallback
⏱️ Starting polling fallback (60s interval)
```

**Possible causes:**

- Supabase credentials missing/incorrect
- Realtime not enabled on table
- Network firewall blocking WebSockets
- Browser doesn't support WebSockets

**Solution:**

- Verify config.js has correct Supabase URL and key
- Run the realtime enable SQL command
- Check firewall/proxy settings
- Use modern browser

## Security Considerations

### Row Level Security (RLS)

The subscription respects RLS policies:

```sql
CREATE POLICY "Allow anonymous read access" ON mfs
    FOR SELECT
    USING (true);  -- Adjust based on your needs
```

### Event Filtering

The subscription listens to ALL changes on the `mfs` table, but the application filters events based on status transitions:

```javascript
// No database-level filter
// Filtering done in handleRealtimeChange() function
```

**Why listen to all changes?**

- ✅ Detects when subscribers go from Offline → Online (can remove marker)
- ✅ Handles all status transitions properly
- ✅ Ensures map accuracy

**Privacy protection:**

- Only coordinates and status are stored in GeoJSON features
- No personal information (names, addresses) included
- RLS policies still protect sensitive data from unauthorized access

## Testing Realtime

### Manual Test

1. **Open the map** in browser
2. **Check console** for "✅ Realtime subscription active"
3. **Update a subscriber** in Supabase:
   ```sql
   UPDATE mfs
   SET status = 'Offline'
   WHERE id = 1;
   ```
4. **Watch the map** - marker should appear instantly!

### Test Subscriber Going Online

```sql
-- Take an offline subscriber and bring them online
UPDATE mfs
SET status = 'Online'
WHERE id = 1 AND status = 'Offline';
```

**Expected behavior:**

1. Console shows: `🔄 Status change: Offline → Online`
2. Console shows: `✅ Subscriber came ONLINE - removing from map`
3. Marker disappears from map **instantly**
4. Count updates: `47 → 46`

### Test Subscriber Going Offline

```sql
-- Take an online subscriber and make them offline
UPDATE mfs
SET status = 'Offline'
WHERE id = 2 AND status = 'Online';
```

**Expected behavior:**

1. Console shows: `🔄 Status change: Online → Offline`
2. Console shows: `📴 Subscriber went OFFLINE - adding to map`
3. Marker appears on map **instantly**
4. Count updates: `46 → 47`

### Test Fallback

1. Disable realtime in Supabase
2. Reload map
3. Should see polling fallback message
4. Map updates every 60 seconds

## Advanced Configuration

### Custom Event Handling

Modify `handleRealtimeChange()` in `app.js` to customize behavior:

```javascript
case 'INSERT':
    // Add custom logic
    // e.g., show notification, play sound, etc.
    showNotification('New offline subscriber detected');
    newFeature = createSubscriberFeature(newRecord, columns);
    subscribersData.push(newFeature);
    break;
```

### Multiple Subscriptions

Subscribe to multiple events or tables:

```javascript
// Subscribe to another table
supabaseClient
  .channel("network-events")
  .on("postgres_changes", { table: "network_status" }, handler)
  .subscribe();
```

## Best Practices

1. **Always enable fallback** - Don't rely solely on realtime
2. **Handle all events** - INSERT, UPDATE, DELETE
3. **Validate data** - Check coordinates before adding to map
4. **Clean up subscriptions** - Unsubscribe on page unload
5. **Monitor performance** - Watch for memory leaks with long sessions
6. **Test thoroughly** - Verify both realtime and fallback modes

## Cost Considerations

### Supabase Realtime Usage

Free tier includes:

- Unlimited realtime connections
- 2GB database size
- 500MB bandwidth

For production:

- Monitor concurrent connections
- Consider Supabase Pro if needed
- Realtime uses WebSockets (efficient)

## Summary

The application provides:

- ✅ **Primary**: Supabase Realtime subscriptions for instant updates
- ✅ **Fallback**: Polling every 60 seconds if realtime unavailable
- ✅ **Resilient**: Works even with network issues
- ✅ **Efficient**: Minimal database load
- ✅ **User-friendly**: Updates appear instantly

Users get the best possible experience with automatic fallback ensuring the map always works!
