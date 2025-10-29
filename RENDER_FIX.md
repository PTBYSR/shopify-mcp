# Fixing Render Deployment Issue

## The Problem
Render is looking for `dist/server-http.js` but can't find it. The error shows:
```
Error: Cannot find module '/opt/render/project/src/dist/server-http.js'
```

## Solution Options

### Option 1: Set Root Directory in Render Dashboard (Recommended)

1. Go to your Render dashboard
2. Select your service
3. Go to **Settings**
4. Set **Root Directory** to: `shopify-mcp`
5. Keep `render.yaml` as is, or remove `rootDir` from it

**In Render Dashboard Settings:**
- Root Directory: `shopify-mcp`
- Build Command: `npm install && npm run build`
- Start Command: `node dist/server-http.js`

### Option 2: Update buildCommand to include path

If you can't set rootDir in dashboard, update `render.yaml`:

```yaml
services:
  - type: web
    name: shopify-mcp
    env: node
    plan: starter
    buildCommand: cd shopify-mcp && npm install && npm run build
    startCommand: cd shopify-mcp && node dist/server-http.js
```

Remove the `rootDir` line from render.yaml if using this approach.

### Option 3: Deploy from shopify-mcp directory only

If your repo only contains the shopify-mcp folder (not the parent shopify-connector):
- Root Directory: leave empty or `.`
- Build Command: `npm install && npm run build`
- Start Command: `node dist/server-http.js`

## Verify the Build

After deploying, check the build logs to see:
1. ✅ `npm install` completes
2. ✅ `npm run build` runs successfully
3. ✅ `dist/server-http.js` exists in the build output

If the build succeeds but start fails, it's a path issue (use Option 1 or 2).

## Current render.yaml Configuration

The current file has:
- `rootDir: shopify-mcp` - Make sure this matches your Render dashboard setting
- Build command should create `dist/server-http.js`
- Start command expects `dist/server-http.js` in the rootDir

## Quick Fix

**Easiest solution**: In Render dashboard → Settings → Root Directory: Set to `shopify-mcp`

Then update render.yaml to:
```yaml
buildCommand: npm install && npm run build
startCommand: node dist/server-http.js
```

Remove the `cd shopify-mcp` if rootDir is set in dashboard.

