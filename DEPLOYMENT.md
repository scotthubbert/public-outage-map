# Deployment Guide

This guide covers deploying the ISP Outage Map to Cloudflare Pages.

## Quick Deployment Checklist

- [ ] Configure Mapbox token in `config.js`
- [ ] Configure Supabase (or use demo mode)
- [ ] Test locally with `npm run dev`
- [ ] Build successfully with `npm run build`
- [ ] Push to GitHub
- [ ] Set up Cloudflare Pages
- [ ] Configure environment variables (if using)
- [ ] Verify deployment

## Detailed Steps

### 1. Prepare Your Repository

```bash
# Initialize git (if not already)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: ISP Outage Map"

# Add remote repository
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### 2. Connect to Cloudflare Pages

1. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Go to **Workers & Pages**
3. Click **Create application** → **Pages** → **Connect to Git**
4. Authorize GitHub and select your repository
5. Configure build settings:

   - **Project name:** `isp-outage-map` (or your preferred name)
   - **Production branch:** `main`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** (leave empty)
   - **Node version:** `18` or higher

6. Click **Save and Deploy**

### 3. Set Up Environment Variables (Optional)

If you want to use environment variables instead of hardcoding in `config.js`:

1. In Cloudflare Pages, go to your project
2. Navigate to **Settings** → **Environment variables**
3. Add variables for **Production** and **Preview**:

   - `VITE_MAPBOX_TOKEN` - Your Mapbox access token
   - `VITE_SUPABASE_URL` - Your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
   - `VITE_ACTIVE_ISP` - Which ISP config to use (e.g., `isp1`)

4. Redeploy to apply the new environment variables

### 4. Configure GitHub Actions (Automated Deployments)

The repository includes a GitHub Actions workflow in `.github/workflows/deploy.yml`.

To enable automated deployments:

1. Generate a Cloudflare API Token:

   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
   - Click **Create Token**
   - Use the **Edit Cloudflare Workers** template
   - Add **Account.Cloudflare Pages** permissions
   - Copy the generated token

2. Find your Cloudflare Account ID:

   - Go to your Cloudflare dashboard
   - Select **Workers & Pages**
   - Your Account ID is shown on the right sidebar

3. Add secrets to GitHub:

   - Go to your repository on GitHub
   - Navigate to **Settings** → **Secrets and variables** → **Actions**
   - Click **New repository secret**
   - Add:
     - Name: `CLOUDFLARE_API_TOKEN`, Value: (paste your token)
     - Name: `CLOUDFLARE_ACCOUNT_ID`, Value: (paste your account ID)

4. Push to trigger deployment:
   ```bash
   git add .
   git commit -m "Update configuration"
   git push
   ```

The workflow will automatically build and deploy on every push to `main`.

### 5. Manual Deployment with Wrangler CLI

For direct deployment without GitHub:

```bash
# Install Wrangler globally
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Build the project
npm run build

# Deploy to Cloudflare Pages
wrangler pages deploy dist --project-name=isp-outage-map
```

For subsequent deployments:

```bash
npm run deploy
```

## Custom Domain Setup

1. In Cloudflare Pages, go to your project
2. Navigate to **Custom domains**
3. Click **Set up a custom domain**
4. Enter your domain (e.g., `outages.yourisp.com`)
5. Cloudflare will automatically configure DNS if the domain is in Cloudflare
6. Wait for SSL certificate provisioning (usually a few minutes)

## Branch Previews

Cloudflare Pages automatically creates preview deployments for:

- Pull requests
- Non-production branches

Each preview gets a unique URL like:
`https://abc123.isp-outage-map.pages.dev`

## Rollback

To rollback to a previous deployment:

1. Go to your project in Cloudflare Pages
2. Navigate to **Deployments**
3. Find the deployment you want to rollback to
4. Click the three dots → **Rollback to this deployment**

## Production Configuration

### Security Headers

The `wrangler.toml` file includes security headers:

- `X-Frame-Options`
- `X-Content-Type-Options`
- `Referrer-Policy`
- `Permissions-Policy`

### Caching

Static assets are cached for 1 year:

- JavaScript files
- CSS files
- Images and fonts in `/assets/`

### Performance Optimization

Cloudflare automatically provides:

- Global CDN distribution
- HTTP/2 and HTTP/3
- Brotli compression
- DDoS protection
- Automatic SSL/TLS

## Monitoring

1. **Analytics:** Available in Cloudflare Pages dashboard
2. **Logs:** Use `wrangler pages deployment tail` for real-time logs
3. **Errors:** Check Functions → Logs in Cloudflare dashboard

## Troubleshooting

### Build fails with "command not found"

- Ensure Node version is 18+ in build settings
- Check that `package.json` includes all dependencies

### Site shows 404 error

- Verify build output directory is set to `dist`
- Check that build completed successfully
- Ensure `base: './'` is set in `vite.config.js`

### API tokens not working

- Verify environment variables are prefixed with `VITE_`
- Redeploy after adding environment variables
- Check that variables are set for the correct environment (Production/Preview)

### Map not loading

- Check browser console for errors
- Verify Mapbox token is correct
- Ensure CORS is properly configured

## Cost Considerations

Cloudflare Pages Free Tier includes:

- Unlimited static requests
- Unlimited bandwidth
- 500 builds per month
- 1 build at a time

This is typically more than sufficient for an ISP outage map.

## Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
