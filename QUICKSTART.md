# Quick Start Guide

Get your ISP Outage Map up and running in 5 minutes!

## Step 1: Install Dependencies (1 minute)

```bash
# Clone and navigate to the project
cd public-outage-map

# Install dependencies
npm install
```

## Step 2: Get a Mapbox Token (2 minutes)

1. Go to https://account.mapbox.com/
2. Sign up or log in
3. Click "Create a token" or use your default token
4. Copy the token

## Step 3: Configure (1 minute)

Open `config.js` and add your token:

```javascript
const CONFIG = {
  // Set the active ISP configuration
  activeConfig: "isp1",

  // Mapbox Configuration
  mapbox: {
    accessToken: "PASTE_YOUR_TOKEN_HERE", // ← Add your token here
  },
  // ...
};
```

## Step 4: Run Development Server (30 seconds)

```bash
npm run dev
```

Your map will open automatically at http://localhost:3000

## Step 5: See Demo Data (30 seconds)

The app runs in demo mode by default (no database needed). You should see:

- An interactive map
- Sample outage areas
- A legend showing different outage types
- A working search box

## What's Next?

### Customize for Your ISP

Edit the ISP configuration in `config.js`:

```javascript
isps: {
    isp1: {
        name: 'Your ISP Name',           // ← Change this
        primaryColor: '#0066CC',          // ← Your brand color
        map: {
            center: [-122.4, 37.7],       // ← Your service area center
            zoom: 10,                     // ← Initial zoom level
            styleLight: 'mapbox://...',   // ← Light mode map style
            styleDark: 'mapbox://...',    // ← Dark mode map style
        },
        // ... more options
    }
}
```

### Connect to Supabase (Optional)

1. Create a free Supabase account: https://supabase.com
2. Run the SQL from `database/schema.sql` (includes realtime setup)
   - **OR** if you already have the `mfs` table, run `database/enable-realtime.sql` instead
3. Add credentials to `config.js`:
   ```javascript
   supabase: {
       url: 'https://your-project.supabase.co',
       anonKey: 'your-anon-key',
   }
   ```

**Note:** The app uses Supabase Realtime for instant updates! When a subscriber goes offline, the map updates immediately without polling. See [REALTIME.md](./REALTIME.md) for details.

### Deploy to Cloudflare Pages

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

Quick version:

```bash
# Build for production
npm run build

# Deploy with Wrangler
npm run deploy
```

## Troubleshooting

**Map not showing?**

- Check that you added your Mapbox token
- Look for errors in browser console (F12)
- Make sure you're running `npm run dev`

**Port already in use?**

- Stop other servers running on port 3000
- Or edit `vite.config.js` to change the port

**Dependencies won't install?**

- Make sure you have Node.js 18+ installed
- Run `node --version` to check
- Try `rm -rf node_modules package-lock.json && npm install`

## Need Help?

- Check the full [README.md](./README.md)
- Review [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment
- Look at browser console for error messages
- Verify your configuration in `config.js`

---

**You're all set! 🎉**

Your ISP outage map is now running. Start customizing it for your needs!
