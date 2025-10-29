# Render Deployment Guide for Shopify MCP Server

## ⚠️ Important Note

The original `shopify-mcp` server uses **StdioServerTransport** which is designed for local execution or with MCP clients. Render requires HTTP services, so an HTTP wrapper (`server-http.ts`) has been created.

## Render Configuration

### Option 1: Using render.yaml (Recommended)

If you push your code with `render.yaml`, Render will auto-detect these settings:

**Root Directory:** `shopify-mcp`

**Build Command:** `npm install && npm run build && npm run build:http`

**Start Command:** `node dist/server-http.js`

### Option 2: Manual Configuration in Render Dashboard

1. **Root Directory:** `shopify-mcp`

2. **Build Command:**
   ```bash
   npm install && npm run build && npm run build:http
   ```

3. **Start Command:**
   ```bash
   node dist/server-http.js
   ```

4. **Environment Variables:**
   - `SHOPIFY_ACCESS_TOKEN` - Your Shopify admin API access token
   - `MYSHOPIFY_DOMAIN` - Your store domain (e.g., `store.myshopify.com`)
   - `PORT` - Will be automatically set by Render (defaults to 3000 if not set)

## HTTP Endpoints

The HTTP server exposes:

- **Health Check:** `GET /health`
- **MCP Tools List:** `POST /mcp` with `{ "method": "tools/list" }`
- **Call Tool:** `POST /mcp` with `{ "method": "tools/call", "params": { "name": "get-products", "arguments": {...} } }`

## Example Usage

### List available tools:
```bash
curl -X POST https://your-render-app.onrender.com/mcp \
  -H "Content-Type: application/json" \
  -d '{"method": "tools/list"}'
```

### Call a tool:
```bash
curl -X POST https://your-render-app.onrender.com/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "get-products",
      "arguments": {"limit": 5}
    }
  }'
```

## Limitations

⚠️ **Note:** The HTTP wrapper provides a REST-like interface, but it's not a full MCP HTTP transport implementation. For full MCP protocol support over HTTP, you would need to implement the MCP HTTP transport layer.

For most use cases, this REST wrapper will work fine for accessing Shopify tools via HTTP.

