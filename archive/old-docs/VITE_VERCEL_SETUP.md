# Vite + Vercel Setup Guide

## Overview

The app has been migrated to use **Vite** for build tooling and **Vercel** for serverless deployment, while **keeping the monolithic `index.html` structure intact**. This gives you production-ready deployment without breaking the existing architecture.

## What Changed

### ✅ What We DID
- Added Vite for fast builds and environment variable support
- Created serverless API functions in `/api` directory
- Set up environment variables (`.env.local`, `.env.production`)
- Configured Vercel deployment (`vercel.json`)
- Copied templates to `/public` for serverless access
- Updated API calls to use environment-based URLs

### ❌ What We DID NOT Do
- **Did NOT** break up `index.html` into separate components
- **Did NOT** refactor the React code structure
- **Did NOT** change the monolithic architecture
- App structure remains exactly as it was, just wrapped in Vite

## Project Structure

```
flighting-docs/
├── api/                        # Serverless functions (NEW)
│   ├── tactics.js             # KPI data proxy
│   ├── order.js               # Lumina order proxy
│   └── export-single.js       # Excel export endpoint
├── public/                     # Public assets (NEW)
│   └── templates/             # Excel templates (copied from /templates)
├── server/                     # Local development servers
│   ├── proxy-server.js        # CORS proxy (dev only)
│   └── excel-export-server.js # Excel export (dev only)
├── index.html                  # Main app (unchanged structure!)
├── excel-export-client.js      # Export client (uses env vars now)
├── vite.config.js             # Vite configuration (NEW)
├── vercel.json                # Vercel deployment config (NEW)
├── .env.local                 # Dev environment variables (NEW)
└── .env.production            # Production env vars (NEW)
```

## Development Workflow

### Local Development (With Vite)

```bash
# 1. Start Vite dev server (port 8000)
npm run dev

# 2. In another terminal, start local servers (if needed for testing)
npm run start-proxy   # CORS proxy on port 3003
npm run start-export  # Excel export on port 3001

# Or run all together
npm run dev-all
```

### Environment Variables

**Development (`.env.local`):**
```
VITE_TACTICS_API=http://localhost:3003/api/tactics
VITE_ORDER_API=http://localhost:3003/api/order
VITE_EXPORT_API=http://localhost:3001
```

**Production (`.env.production`):**
```
VITE_TACTICS_API=/api/tactics
VITE_ORDER_API=/api/order
VITE_EXPORT_API=/api/export-single
```

In production, these resolve to Vercel serverless functions automatically.

## Building for Production

```bash
# Build the app
npm run build

# Preview the production build locally
npm run preview
```

This creates a `dist/` directory with optimized static files.

## Vercel Deployment

### First Time Setup

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Link your project
vercel link

# 4. Set environment variables (if needed)
vercel env add VITE_TACTICS_API production
vercel env add VITE_ORDER_API production
vercel env add VITE_EXPORT_API production
```

### Deploy to Production

```bash
# Deploy to production
vercel --prod
```

### Test Serverless Functions Locally

```bash
# Run Vercel dev server (tests serverless functions)
npm run vercel-dev
```

This starts a local Vercel environment that mimics production.

## How It Works

### Environment Variables in Monolithic HTML

We added a small config script in `index.html` that reads Vite environment variables:

```html
<!-- Environment Configuration -->
<script type="module">
    window.APP_CONFIG = {
        TACTICS_API: import.meta.env.VITE_TACTICS_API || 'http://localhost:3003/api/tactics',
        ORDER_API: import.meta.env.VITE_ORDER_API || 'http://localhost:3003/api/order',
        EXPORT_API: import.meta.env.VITE_EXPORT_API || 'http://localhost:3001'
    };
</script>
```

Then the app uses `window.APP_CONFIG.TACTICS_API` instead of hardcoded URLs.

### Serverless API Functions

All API functions follow Vercel's serverless format:

```javascript
// api/tactics.js
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');

    const response = await fetch('https://ignite.edwinlovett.com/kpi/api.php?action=get_tactics');
    const data = await response.json();

    res.json(data);
}
```

Vercel automatically deploys these as serverless functions at `/api/*` routes.

## Deployment Architecture

```
Production:
┌─────────────────┐
│  Vercel CDN     │
│  (Global)       │
└────────┬────────┘
         │
         ├─> /index.html          (Static HTML - monolithic!)
         ├─> /excel-export-client.js (Static JS)
         │
         ├─> /api/tactics         (Serverless Function)
         ├─> /api/order           (Serverless Function)
         └─> /api/export-single   (Serverless Function)
```

## Testing Checklist

Before deploying to production:

- [ ] Run `npm run build` successfully
- [ ] Test with `npm run preview` - verify all features work
- [ ] Test API endpoints: tactics, order, export
- [ ] Verify environment variables are loading correctly
- [ ] Check Excel exports generate properly
- [ ] Test Lumina import functionality
- [ ] Verify date preservation works

## Troubleshooting

### Issue: `import.meta.env` is undefined

**Solution:** Make sure you're running with Vite:
```bash
npm run dev  # NOT python3 -m http.server
```

### Issue: API calls fail in production

**Solution:** Check Vercel function logs:
```bash
vercel logs
```

### Issue: Templates not found in serverless function

**Solution:** Templates must be in `/public/templates` (already done). Vercel packages `/public` with serverless functions.

### Issue: Excel export times out

**Solution:** The free Vercel tier has a 10-second timeout. For large exports, consider:
1. Upgrade to Vercel Pro (30-second timeout)
2. Use a dedicated server for exports (hybrid approach)

## Next Steps (Optional)

If you want to further improve production readiness:

1. **Add monitoring** - Install Sentry for error tracking
2. **Add rate limiting** - Use Upstash Redis with Vercel
3. **Add caching** - Leverage Vercel's edge caching
4. **Add tests** - Set up Vitest for unit tests
5. **Add CI/CD** - Use GitHub Actions for automated deployments

See `PRODUCTION_READINESS.md` for detailed implementation guide.

## Cost Estimate

- **Vercel Free Tier:** $0/month
  - 100GB bandwidth
  - 100GB-hours compute
  - Enough for development and small production use

- **Vercel Pro:** $20/month
  - Unlimited bandwidth
  - Unlimited compute
  - 30-second function timeout (vs 10s free)
  - Priority support

For most use cases, the free tier is sufficient.

## Summary

✅ **Vite migration complete** - Fast builds, environment variables
✅ **Serverless APIs ready** - 3 functions in `/api` directory
✅ **Vercel deployment configured** - `vercel.json` ready
✅ **Monolithic structure preserved** - `index.html` unchanged
✅ **Templates accessible** - Copied to `/public`

**The app is now production-ready without breaking the original structure!**
