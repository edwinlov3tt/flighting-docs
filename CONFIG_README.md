# Configuration Guide for Media Flight Planning App

## Quick Start

The application now uses centralized configuration for easy deployment and environment management.

## Configuration Files

### 1. `config.js`
This file manages all JavaScript client-side configuration:
- **Development**: Automatically used when running on localhost
- **Production**: Automatically used when deployed to a production domain

### 2. `.env`
Environment variables for server-side configuration (optional):
- Used by the Excel export server
- Set `PORT` environment variable to change the export server port

## Updating for Production

### Step 1: Update `config.js`

Edit the production section in `config.js`:

```javascript
production: {
    APP_URL: 'https://your-domain.com',
    EXCEL_EXPORT_URL: 'https://your-domain.com/export',
    TACTICS_API_URL: 'https://ignite.edwinlovett.com/kpi/api.php'
}
```

### Step 2: Deploy the Export Server

The export server can be deployed separately or as part of your main application:

```bash
# Set the port (optional, defaults to 3001)
export PORT=3001

# Start the server
node excel-export-server.js
```

## Environment Detection

The application automatically detects the environment:
- If hostname is `localhost` or `127.0.0.1` → Uses development config
- Otherwise → Uses production config

You can also force an environment with a URL parameter:
- `http://yoursite.com?env=development` → Forces development config
- `http://yoursite.com?env=production` → Forces production config

## Troubleshooting

### Export not working?

1. Check the browser console for the config being used:
   ```
   Running in [environment] mode {...}
   ```

2. Verify the export server is running:
   ```bash
   curl http://localhost:3001/health
   ```

3. Check CORS settings if deploying to different domains

### Configuration not loading?

Ensure `config.js` is loaded before `excel-export-client.js` in your HTML:
```html
<script src="config.js"></script>
<script src="excel-export-client.js"></script>
```