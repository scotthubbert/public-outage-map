# Freedom Fiber Environment Setup

## 🔧 Create Your `.env` File

Create a `.env` file in your project root with these variables:

```bash
# =================================
# Freedom Fiber Specific Configuration
# =================================

# Replace with your actual Freedom Fiber Supabase credentials
VITE_FREEDOMFIBER_SUPABASE_URL=https://your-freedomfiber-project.supabase.co
VITE_FREEDOMFIBER_SUPABASE_KEY=your_freedomfiber_supabase_anon_key

# Optional: Freedom Fiber ArcGIS API Key
VITE_FREEDOMFIBER_ARCGIS_KEY=your_freedomfiber_arcgis_api_key

# =================================
# Default/Fallback Configuration
# =================================

VITE_SUPABASE_URL=https://your-default-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_default_supabase_anon_key
VITE_ARCGIS_API_KEY=your_default_arcgis_api_key

# =================================
# Development Settings
# =================================

VITE_DEBUG=true
VITE_ENVIRONMENT=development
VITE_APP_VERSION=1.0.0
```

## 📋 Quick Setup Steps

1. **Create `.env` file:**

   ```bash
   touch .env
   ```

2. **Copy your existing credentials** and format them as Freedom Fiber variables:

   If you have:

   ```
   VITE_SUPABASE_URL=https://abc123.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGc...
   ```

   Add Freedom Fiber specific versions:

   ```
   VITE_FREEDOMFIBER_SUPABASE_URL=https://abc123.supabase.co
   VITE_FREEDOMFIBER_SUPABASE_KEY=eyJ0eXAiOiJKV1QiLCJhbGc...
   ```

3. **Test the setup:**
   ```bash
   npm run dev:freedomfiber
   ```

## 🎯 Expected Variable Names

The system looks for these specific variable names for Freedom Fiber:

- `VITE_FREEDOMFIBER_SUPABASE_URL`
- `VITE_FREEDOMFIBER_SUPABASE_KEY`
- `VITE_FREEDOMFIBER_ARCGIS_KEY` (optional)

## ✅ Verification

After setting up, you should see in the browser console:

```
🔍 Environment Debug for: freedomfiber
🔑 Environment Variables:
   VITE_FREEDOMFIBER_SUPABASE_URL: ✅ Found
   VITE_FREEDOMFIBER_SUPABASE_KEY: ✅ Found (****)
   VITE_FREEDOMFIBER_ARCGIS_KEY: ✅ Found (****)
```

## 🔄 Alternative: Use Same Credentials

If you want Freedom Fiber to use the same database as your other tenants, you can set:

```bash
VITE_FREEDOMFIBER_SUPABASE_URL=$VITE_SUPABASE_URL
VITE_FREEDOMFIBER_SUPABASE_KEY=$VITE_SUPABASE_ANON_KEY
```

But make sure you have the `freedomfiber_outages` and `freedomfiber_power` tables in that database.
