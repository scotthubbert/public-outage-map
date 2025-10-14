# ISP Outage Map Application

A lightweight, multi-ISP web-based map application for displaying service outages to subscribers. Built with Mapbox GL JS, plain JavaScript (no framework), and Supabase for data storage.

> **🚀 New to this project?** Check out the [QUICKSTART.md](./QUICKSTART.md) guide to get running in 5 minutes!

## Features

- 🗺️ **Interactive Map Display** - Real-time visualization of offline subscribers on a Mapbox-powered map
- 🎨 **Light/Dark Mode** - Automatic theme detection with manual toggle
- 🔍 **Search Functionality** - Geocoding search to find specific addresses or areas
- 🏢 **Multi-ISP Support** - Configurable for different ISPs with custom branding and data sources
- 📊 **Marker Clustering** - Automatic grouping of nearby offline subscribers with count badges
- 🔄 **Realtime Updates** - Supabase realtime subscriptions for instant map updates (with polling fallback)
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices
- ⚡ **Lightweight** - No framework dependencies, pure vanilla JavaScript
- 🔒 **Privacy-First** - No personal information displayed, public-facing design

## Prerequisites

- Node.js 18+ and npm
- Mapbox account and API token
- Supabase project (optional - demo mode available)
- Cloudflare account (for deployment)

## Quick Start

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd mapbox-js

# Install dependencies
npm install
```

### 2. Configure Mapbox Access Token

Edit `config.js` and add your Mapbox access token:

```javascript
mapbox: {
  accessToken: "YOUR_MAPBOX_ACCESS_TOKEN_HERE";
}
```

Get a free token at: https://account.mapbox.com/

### 3. Configure Your ISP Settings

In `config.js`, customize the ISP configuration:

```javascript
// Set which ISP config to use
activeConfig: 'isp1', // Change to your ISP identifier

// Configure your ISP details
isps: {
    isp1: {
        name: 'Your ISP Name',
        logo: '/path/to/logo.png',
        primaryColor: '#0066CC',
        // ... other settings
    }
}
```

### 4. Set Up Supabase (Optional)

If using Supabase for data storage:

1. Create a Supabase project at https://supabase.com
2. Create an outages table with the following structure:

```sql
CREATE TABLE outages (
    id SERIAL PRIMARY KEY,
    geometry JSONB NOT NULL, -- GeoJSON geometry
    status VARCHAR(20) NOT NULL, -- 'critical', 'major', 'minor', 'resolved'
    area_name VARCHAR(255),
    affected_services JSONB,
    estimated_restoration TIMESTAMP,
    description TEXT,
    affected_customers INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

3. Update the Supabase configuration in `config.js`:

```javascript
supabase: {
    url: 'https://your-project.supabase.co',
    anonKey: 'your-anon-key-here',
    // ... table mappings
}
```

### 5. Run the Development Server

Start the Vite development server:

```bash
npm run dev
```

The application will automatically open in your browser at `http://localhost:3000`

### 6. Build for Production

Create an optimized production build:

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Configuration Options

### ISP Configuration

Each ISP configuration in `config.js` supports:

- **Branding**: Name, logo, colors
- **Map Settings**: Initial center, zoom levels, map style
- **Geocoder**: Search boundaries, placeholder text
- **Supabase**: Database connection and table mappings
- **Refresh Interval**: How often to check for new data
- **Severity Colors**: Custom colors for outage levels

### Map Styles

The application supports separate map styles for light and dark modes:

```javascript
map: {
    styleLight: 'mapbox://styles/mapbox/streets-v12',    // Light mode style
    styleDark: 'mapbox://styles/mapbox/dark-v11',        // Dark mode style
    // Or use your custom Mapbox Studio styles:
    // styleLight: 'mapbox://styles/username/style-id-light',
    // styleDark: 'mapbox://styles/username/style-id-dark'
}
```

The map will automatically switch between these styles when the user toggles dark mode.

## Deployment to Cloudflare Pages

### Option 1: Automatic Deployment via GitHub

1. **Push to GitHub:**

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Set up Cloudflare Pages:**

   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - Navigate to Pages
   - Click "Create a project" → "Connect to Git"
   - Select your repository
   - Configure build settings:
     - **Build command:** `npm run build`
     - **Build output directory:** `dist`
     - **Root directory:** (leave empty)

3. **Add GitHub Secrets (for Actions):**

   - Go to your GitHub repository → Settings → Secrets and variables → Actions
   - Add these secrets:
     - `CLOUDFLARE_API_TOKEN`: Get from Cloudflare dashboard
     - `CLOUDFLARE_ACCOUNT_ID`: Found in Cloudflare dashboard

4. **Push to trigger deployment:**
   Every push to `main` branch will automatically deploy to Cloudflare Pages.

### Option 2: Manual Deployment with Wrangler

1. **Install Wrangler:**

   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare:**

   ```bash
   wrangler login
   ```

3. **Build and deploy:**
   ```bash
   npm run build
   wrangler pages deploy dist --project-name=isp-outage-map
   ```

### Environment Variables in Cloudflare

Add environment variables through the Cloudflare dashboard:

- Navigate to your Pages project → Settings → Environment variables
- Add variables like `VITE_MAPBOX_TOKEN` if you want to use env vars instead of hardcoded config

**Note:** For security, consider using environment variables for API tokens in production.

## Data Format

### GeoJSON Geometry

Outages can be displayed as:

- **Points**: Single location outages
- **Polygons**: Area-wide outages
- **LineStrings**: Linear infrastructure outages (fiber cuts, etc.)

Example geometry:

```json
{
  "type": "Polygon",
  "coordinates": [
    [
      [-122.4, 37.8],
      [-122.4, 37.7],
      [-122.3, 37.7],
      [-122.3, 37.8],
      [-122.4, 37.8]
    ]
  ]
}
```

### Status Levels

- `critical`: Major outages affecting many customers
- `major`: Significant service disruptions
- `minor`: Limited impact outages
- `resolved`: Recently resolved (for transparency)

## Customization

### Adding Custom Branding

1. Add your logo file to an `assets/logos/` directory
2. Update the logo path in config.js
3. Customize colors using the primaryColor and secondaryColor settings

### Modifying the UI

- Edit `styles.css` for visual customization
- Modify `index.html` for structural changes
- Update `app.js` for behavioral modifications

### Adding New Features

The modular structure makes it easy to extend:

- `utils.js`: Add utility functions
- `app.js`: Add new map interactions or data processing
- `config.js`: Add new configuration options

## Demo Mode

If Supabase is not configured or unavailable, the application automatically runs in demo mode with sample data. This is useful for:

- Testing the application
- Development without database setup
- Demonstration purposes

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Optimization

- Lightweight vanilla JavaScript (no framework overhead)
- Efficient map rendering with Mapbox GL JS
- Configurable data refresh intervals
- Minimal external dependencies

## Troubleshooting

### Map not displaying

- Verify Mapbox access token is correct
- Check browser console for errors
- Ensure you're serving files through a web server (not file://)

### Data not loading

- Verify Supabase credentials
- Check table and column names match configuration
- Review browser console for API errors

### Dark mode not working

- Clear browser cache
- Check localStorage permissions
- Verify CSS variables are properly set

## Security Considerations

- Use Supabase Row Level Security (RLS) for data protection
- Keep API keys secure (use environment variables in production)
- Implement rate limiting for production deployments
- Use HTTPS in production environments

## License

This application is provided as-is for use by ISPs to display outage information to their subscribers.

## Development Workflow

### Available Scripts

- **`npm run dev`** - Start development server with hot reload at http://localhost:3000
- **`npm run build`** - Create production build in `dist/` directory
- **`npm run preview`** - Preview production build locally at http://localhost:8080
- **`npm run deploy`** - Build and deploy to Cloudflare Pages (requires Wrangler setup)

### Project Structure

```
mapbox-js/
├── index.html          # Main HTML file
├── config.js           # ISP configurations
├── app.js              # Main application logic
├── utils.js            # Utility functions
├── styles.css          # Styling
├── vite.config.js      # Vite configuration
├── wrangler.toml       # Cloudflare configuration
├── database/           # Database schemas
│   └── schema.sql
├── .github/
│   └── workflows/
│       └── deploy.yml  # Auto-deployment workflow
└── dist/               # Build output (generated)
```

### Making Changes

1. Edit files locally
2. Test with `npm run dev`
3. Commit changes
4. Push to GitHub
5. Automatic deployment triggers (if configured)

### Testing Production Build

```bash
# Build the project
npm run build

# Preview locally
npm run preview
```

## Support

For issues or questions:

1. Check the browser console for errors
2. Verify configuration in `config.js`
3. Ensure all prerequisites are met
4. Test in demo mode first
5. Review the [DEPLOYMENT.md](./DEPLOYMENT.md) guide for deployment issues

## Privacy & Security

This application is designed to be **public-facing** while protecting customer privacy. See [PRIVACY.md](./PRIVACY.md) for complete details:

- No personal information (names, addresses, IDs) is displayed
- Individual markers are not clickable
- Only geographic locations and offline status are shown
- Full GDPR/CCPA compliance considerations included

## Documentation

- **[QUICKSTART.md](./QUICKSTART.md)** - Get started in 5 minutes
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deploy to Cloudflare Pages
- **[CLUSTERING-FEATURES.md](./CLUSTERING-FEATURES.md)** - Clustering functionality
- **[REALTIME.md](./REALTIME.md)** - Supabase realtime subscriptions
- **[PRIVACY.md](./PRIVACY.md)** - Privacy and security details
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - How to contribute

## Additional Resources

- [Vite Documentation](https://vitejs.dev/)
- [Mapbox GL JS Documentation](https://docs.mapbox.com/mapbox-gl-js/)
- [Supabase Documentation](https://supabase.com/docs)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)

---

Built with ❤️ for reliable ISP communication
