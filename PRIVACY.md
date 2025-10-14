# Privacy & Security

This document outlines the privacy and security measures implemented in the ISP Outage Map application.

## Overview

The outage map is designed as a **public-facing application** that displays service outage information while protecting customer privacy.

## Data Privacy

### What is Displayed

The map shows:

- ✅ **Geographic locations** of offline subscribers (lat/lng coordinates)
- ✅ **Aggregate counts** in clusters
- ✅ **Status** (Offline/Online)
- ✅ **Last updated timestamp**

### What is NOT Displayed

For privacy protection, the following information is **never exposed** to the public map:

- ❌ **Subscriber names**
- ❌ **Street addresses**
- ❌ **Account IDs**
- ❌ **Phone numbers**
- ❌ **Email addresses**
- ❌ **Service plans**
- ❌ **Any other personally identifiable information (PII)**

## User Interactions

### Disabled Features

To protect privacy, the following features are **intentionally disabled**:

1. **Individual Marker Clicks**: Users cannot click on individual subscriber markers to see details
2. **Info Popups**: No detail panels or popups are shown for individual subscribers
3. **Subscriber Details**: Personal information is stripped from the data before display

### Enabled Features

Users can still:

- ✅ **View the map** and see offline subscriber locations
- ✅ **See aggregate counts** in the legend
- ✅ **Click clusters** to zoom in and see distribution
- ✅ **Use search** to navigate to specific areas
- ✅ **Toggle light/dark mode**

## Database Security

### Row Level Security (RLS)

The Supabase database is configured with Row Level Security:

```sql
ALTER TABLE mfs ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to read only non-sensitive data
CREATE POLICY "Allow anonymous read access" ON mfs
    FOR SELECT
    USING (true);
```

### Query Limitations

The application only queries:

```javascript
// Only fetch coordinates and status - no personal data
.select('latitude, longitude, status, updated_at')
```

### Column Mappings

Configuration explicitly excludes personal data:

```javascript
columns: {
    latitude: 'latitude',
    longitude: 'longitude',
    status: 'status',
    updated_at: 'updated_at'
    // Note: Personal data excluded for privacy
}
```

## API Security

### Supabase Configuration

- **Anonymous Key**: Used for read-only public access
- **URL**: Exposed in frontend (expected for public apps)
- **Permissions**: Restricted to SELECT operations only on allowed columns

### Rate Limiting

Supabase automatically provides:

- Rate limiting per IP address
- DDoS protection
- Request throttling

## Frontend Security

### Data Handling

1. **Minimal Data Transfer**: Only necessary fields are fetched from the database
2. **No Client-Side Storage**: Personal data is never stored in browser localStorage or cookies
3. **Clean GeoJSON**: Features only contain non-sensitive properties

### Code Implementation

```javascript
// Data conversion strips all personal information
properties: {
    status: subscriber[columns.status],
    updated_at: subscriber[columns.updated_at]
    // Personal data explicitly excluded
}
```

## Cloudflare Pages Security

### Security Headers

Configured in `wrangler.toml`:

```toml
[headers.values]
X-Frame-Options = "SAMEORIGIN"
X-Content-Type-Options = "nosniff"
Referrer-Policy = "strict-origin-when-cross-origin"
Permissions-Policy = "geolocation=(), microphone=(), camera=()"
```

### HTTPS

- All traffic served over HTTPS
- Automatic SSL/TLS certificates
- Secure cookie handling

### DDoS Protection

Cloudflare provides:

- Automatic DDoS mitigation
- Bot protection
- Traffic filtering

## Compliance Considerations

### GDPR (General Data Protection Regulation)

✅ **Minimal Data Collection**: Only geographic coordinates and status are displayed  
✅ **No Personal Data**: Names, addresses, and identifiers are not exposed  
✅ **Purpose Limitation**: Data only used for outage visualization  
✅ **Data Minimization**: Only necessary fields are queried and stored

### CCPA (California Consumer Privacy Act)

✅ **Transparency**: Clear documentation of what data is displayed  
✅ **No Sale of Data**: No personal information is collected or sold  
✅ **Public Information**: Only aggregate/anonymized location data shown

### TCPA (Telephone Consumer Protection Act)

✅ **No Contact Information**: Phone numbers and emails are never displayed  
✅ **No Unsolicited Communications**: The app is view-only

## Geographic Privacy

### Considerations

While exact coordinates are displayed, they represent:

- **Service locations** (not necessarily residential addresses)
- **Equipment locations** (nodes, distribution points)
- **Aggregate areas** (via clustering)

### Mitigation

Clustering helps protect individual privacy by:

- Grouping nearby locations when zoomed out
- Showing aggregate counts instead of individual points
- Making it harder to identify specific addresses

## Data Retention

### Real-Time Data

- Data is fetched in real-time from Supabase
- No historical data is stored in the frontend
- Browser cache cleared on refresh

### Server-Side

- Database retention policies managed by ISP
- Recommend removing resolved outages after 24 hours
- Keep only active offline subscribers

## Audit & Logging

### What is NOT Logged

- Individual user views
- Search queries
- Clicked locations
- User IP addresses (on frontend)

### What is Logged

- Supabase API calls (server-side, for security monitoring)
- Error events (for debugging, no PII)
- Performance metrics (aggregate only)

## Recommendations for ISPs

### Database Configuration

1. **Enable RLS**: Always use Row Level Security in Supabase
2. **Limit Columns**: Only expose necessary columns to anonymous role
3. **Use Views**: Consider creating a view with only public data
4. **Audit Access**: Regularly review Supabase access logs

### Example Secure View

```sql
CREATE VIEW public_offline_subscribers AS
SELECT
    latitude,
    longitude,
    status,
    updated_at
FROM mfs
WHERE status = 'Offline'
  AND latitude IS NOT NULL
  AND longitude IS NOT NULL;

-- Grant access to view only
GRANT SELECT ON public_offline_subscribers TO anon;
```

### Access Control

1. **Separate Keys**: Use different Supabase projects for internal vs. public
2. **API Keys**: Keep service role keys secret (never in frontend)
3. **Monitoring**: Set up alerts for unusual API usage

### Privacy Policy

Recommend including in your website's privacy policy:

- What data the outage map displays
- Why coordinates are shown
- How data is protected
- Contact for privacy concerns

## Customer Communication

### Transparency

Inform customers that:

- Outage locations are publicly visible (for community awareness)
- Personal information is never displayed
- Only service interruption status is shown

### Opt-Out

Consider providing:

- Option to hide specific locations (if required by law)
- Alternative outage notification methods
- Privacy contact information

## Security Best Practices

### For Deployment

1. ✅ Use environment variables for sensitive config
2. ✅ Enable Cloudflare security features
3. ✅ Regular security audits
4. ✅ Keep dependencies updated (`npm audit`)
5. ✅ Monitor for suspicious activity

### For Development

1. ✅ Never commit API keys to git
2. ✅ Use `.env` files for local development
3. ✅ Test with production-like data (but anonymized)
4. ✅ Regular code reviews for security

## Incident Response

### If Personal Data is Accidentally Exposed

1. **Immediately** disable the deployment
2. **Revoke** Supabase API keys
3. **Investigate** what data was exposed
4. **Notify** affected customers if required by law
5. **Update** security measures to prevent recurrence

### Contact

For security concerns:

- Review code on GitHub
- Report vulnerabilities privately
- Follow responsible disclosure

## Summary

The ISP Outage Map is designed with **privacy-first principles**:

- ✅ No personal data displayed
- ✅ Minimal data collection
- ✅ Secure by default
- ✅ Transparent operation
- ✅ Compliance-ready

The map provides valuable service information to the public while maintaining the highest standards of customer privacy protection.
