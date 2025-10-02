# Fix: NPM/Export Server Hanging Issue

## Problem
The export server hangs on startup when trying to load Express or other npm packages. This is preventing the server from starting.

## Root Cause
- Corrupted `node_modules` directory
- Express 5.x compatibility issues (though we downgraded to 4.x in package.json)
- npm cache corruption

## Solution Steps

### Option 1: Clean Reinstall (Recommended)
```bash
cd /Users/edwinlovettiii/Desktop/flighting-docs

# 1. Delete everything npm-related
rm -rf node_modules
rm -f package-lock.json

# 2. Clear npm cache
npm cache clean --force

# 3. Reinstall packages (this may take a few minutes)
npm install

# 4. Verify express version
npm ls express
# Should show: express@4.18.2

# 5. Test export server
npm run start-export
```

### Option 2: Use Yarn (If npm still hangs)
```bash
# 1. Install yarn if not already installed
npm install -g yarn

# 2. Clean up
rm -rf node_modules
rm -f package-lock.json yarn.lock

# 3. Install with yarn
yarn install

# 4. Test server
yarn start-export
```

### Option 3: Manual Express Install
```bash
# If full reinstall hangs, try installing packages individually

# 1. Start fresh
rm -rf node_modules package-lock.json

# 2. Install express first
npm install express@4.18.2 --save --verbose

# 3. Then install others one by one
npm install cors@2.8.5 --save
npm install xlsx-populate@1.21.0 --save
npm install xlsx@0.18.5 --save
npm install node-fetch@2.7.0 --save
npm install concurrently@7.6.0 --save-dev

# 4. Test server
npm run start-export
```

## Verification

After successful install, you should see:

### 1. Correct Dependencies
```bash
npm ls | grep express
# └── express@4.18.2
```

### 2. Server Starts Successfully
```bash
npm run start-export
```

Expected output:
```
============================================================
📊 Excel Export Server
============================================================
Status: ✅ READY
Port: 3001
Library: xlsx-populate v1.21.0
Express: v4.18.2
Node: v18.x.x
============================================================

📁 Template Status:
  ✅ programmatic    (XX.X KB)
  ✅ youtube         (XX.X KB)
  ✅ sem-social      (XX.X KB)
  ✅ full            (XX.X KB)

🌐 Endpoints:
  GET  http://localhost:3001/health
  POST http://localhost:3001/api/export/single
  POST http://localhost:3001/api/export/bulk
  GET  http://localhost:3001/api/templates/info

============================================================
```

### 3. Health Check Works
```bash
curl http://localhost:3001/health
```

Should return JSON with status "OK"

## If Still Having Issues

### Check Node Version
```bash
node --version
# Recommended: v18.x or v20.x
```

If using very old or very new Node:
```bash
# Install Node 18 LTS (recommended)
# Use nvm: https://github.com/nvm-sh/nvm

nvm install 18
nvm use 18
```

### Check for Process Conflicts
```bash
# Check if port 3001 is already in use
lsof -ti:3001

# Kill any process on that port
lsof -ti:3001 | xargs kill -9
```

### Run with Debug Output
```bash
# Start server with detailed logging
NODE_DEBUG=module node server/excel-export-server.js
```

This will show exactly where it's hanging.

## Alternative: Use Existing node_modules

If you have a backup or another machine with working node_modules:
```bash
# Copy from working machine/backup
cp -r /path/to/working/node_modules ./

# Test immediately
npm run start-export
```

## Prevention

To avoid this in the future:
```bash
# 1. Lock dependency versions (already done in package.json)
# 2. Commit package-lock.json to git
git add package-lock.json
git commit -m "Lock dependencies"

# 3. Use npm ci instead of npm install (faster, more reliable)
npm ci
```

## Emergency Fallback

If absolutely nothing works, you can run the old server temporarily:
```bash
# Use an archived version
node server/archive/excel-export-server-simple.js
```

But note: This won't have the new improvements (validation, retries, etc.)

## Summary

**Most likely fix:**
```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
npm run start-export
```

This should resolve 90% of cases. If not, try Option 2 (Yarn) or Option 3 (manual install).
