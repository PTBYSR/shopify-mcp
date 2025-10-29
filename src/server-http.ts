#!/usr/bin/env node

/**
 * HTTP Server Wrapper for Shopify MCP Server
 * This allows the MCP server to run on platforms like Render that require HTTP services
 */

import express from 'express';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import dotenv from "dotenv";
import { GraphQLClient } from "graphql-request";
import minimist from "minimist";
import { z } from "zod";

// Import tools
import { getCustomerOrders } from "./tools/getCustomerOrders.js";
import { getCustomers } from "./tools/getCustomers.js";
import { getOrderById } from "./tools/getOrderById.js";
import { getOrders } from "./tools/getOrders.js";
import { getProductById } from "./tools/getProductById.js";
import { getProducts } from "./tools/getProducts.js";
import { updateCustomer } from "./tools/updateCustomer.js";
import { updateOrder } from "./tools/updateOrder.js";
import { createProduct } from "./tools/createProduct.js";

// Parse command line arguments
const argv = minimist(process.argv.slice(2));

// Load environment variables
dotenv.config();

// Define environment variables
const SHOPIFY_ACCESS_TOKEN =
  argv.accessToken || process.env.SHOPIFY_ACCESS_TOKEN;
const MYSHOPIFY_DOMAIN = argv.domain || process.env.MYSHOPIFY_DOMAIN;
const PORT = process.env.PORT || 3000;

// Validate required environment variables
if (!SHOPIFY_ACCESS_TOKEN) {
  console.error("Error: SHOPIFY_ACCESS_TOKEN is required.");
  process.exit(1);
}

if (!MYSHOPIFY_DOMAIN) {
  console.error("Error: MYSHOPIFY_DOMAIN is required.");
  process.exit(1);
}

// Create Shopify GraphQL client
const shopifyClient = new GraphQLClient(
  `https://${MYSHOPIFY_DOMAIN}/admin/api/2023-07/graphql.json`,
  {
    headers: {
      "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
      "Content-Type": "application/json"
    }
  }
);

// Initialize tools with shopifyClient
getProducts.initialize(shopifyClient);
getProductById.initialize(shopifyClient);
getCustomers.initialize(shopifyClient);
getOrders.initialize(shopifyClient);
getOrderById.initialize(shopifyClient);
updateOrder.initialize(shopifyClient);
getCustomerOrders.initialize(shopifyClient);
updateCustomer.initialize(shopifyClient);
createProduct.initialize(shopifyClient);

// Store tool handlers for direct access
const toolHandlers: Record<string, (args: any) => Promise<any>> = {};

// Helper to register a tool
function registerTool(name: string, handler: (args: any) => Promise<any>) {
  toolHandlers[name] = handler;
}

// Set up MCP server (for protocol compatibility, but we'll use direct handlers)
const mcpServer = new McpServer({
  name: "shopify",
  version: "1.0.0",
  description:
    "MCP Server for Shopify API, enabling interaction with store data through GraphQL API"
});

// Register and add all tools
registerTool("get-products", async (args) => {
  // Ensure limit has a default value if not provided
  const processedArgs = {
    searchTitle: args?.searchTitle,
    limit: args?.limit ?? 10  // Default to 10 if not provided
  };
  const result = await getProducts.execute(processedArgs);
  return { content: [{ type: "text", text: JSON.stringify(result) }] };
});

mcpServer.tool("get-products", {
  searchTitle: z.string().optional(),
  limit: z.number().default(10)
}, async (args) => {
  const result = await getProducts.execute(args);
  return { content: [{ type: "text", text: JSON.stringify(result) }] };
});

registerTool("get-product-by-id", async (args) => {
  const result = await getProductById.execute(args);
  return { content: [{ type: "text", text: JSON.stringify(result) }] };
});

mcpServer.tool("get-product-by-id", {
  productId: z.string().min(1)
}, async (args) => {
  const result = await getProductById.execute(args);
  return { content: [{ type: "text", text: JSON.stringify(result) }] };
});

registerTool("get-customers", async (args) => {
  // Ensure limit has a default value if not provided
  const processedArgs = {
    searchQuery: args?.searchQuery,
    limit: args?.limit ?? 10  // Default to 10 if not provided
  };
  const result = await getCustomers.execute(processedArgs);
  return { content: [{ type: "text", text: JSON.stringify(result) }] };
});

mcpServer.tool("get-customers", {
  searchQuery: z.string().optional(),
  limit: z.number().default(10)
}, async (args) => {
  const result = await getCustomers.execute(args);
  return { content: [{ type: "text", text: JSON.stringify(result) }] };
});

registerTool("get-orders", async (args) => {
  // Ensure defaults are provided
  const processedArgs = {
    status: args?.status ?? "any",
    limit: args?.limit ?? 10  // Default to 10 if not provided
  };
  const result = await getOrders.execute(processedArgs);
  return { content: [{ type: "text", text: JSON.stringify(result) }] };
});

mcpServer.tool("get-orders", {
  status: z.enum(["any", "open", "closed", "cancelled"]).default("any"),
  limit: z.number().default(10)
}, async (args) => {
  const result = await getOrders.execute(args);
  return { content: [{ type: "text", text: JSON.stringify(result) }] };
});

registerTool("get-order-by-id", async (args) => {
  const result = await getOrderById.execute(args);
  return { content: [{ type: "text", text: JSON.stringify(result) }] };
});

mcpServer.tool("get-order-by-id", {
  orderId: z.string().min(1)
}, async (args) => {
  const result = await getOrderById.execute(args);
  return { content: [{ type: "text", text: JSON.stringify(result) }] };
});

registerTool("update-order", async (args) => {
  const result = await updateOrder.execute(args);
  return { content: [{ type: "text", text: JSON.stringify(result) }] };
});

mcpServer.tool("update-order", {
  id: z.string().min(1),
  tags: z.array(z.string()).optional(),
  email: z.string().email().optional(),
  note: z.string().optional(),
  customAttributes: z.array(z.object({
    key: z.string(),
    value: z.string()
  })).optional(),
  metafields: z.array(z.object({
    id: z.string().optional(),
    namespace: z.string().optional(),
    key: z.string().optional(),
    value: z.string(),
    type: z.string().optional()
  })).optional(),
  shippingAddress: z.object({
    address1: z.string().optional(),
    address2: z.string().optional(),
    city: z.string().optional(),
    company: z.string().optional(),
    country: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
    province: z.string().optional(),
    zip: z.string().optional()
  }).optional()
}, async (args) => {
  const result = await updateOrder.execute(args);
  return { content: [{ type: "text", text: JSON.stringify(result) }] };
});

registerTool("get-customer-orders", async (args) => {
  // Ensure limit has a default value if not provided
  const processedArgs = {
    customerId: args?.customerId,
    limit: args?.limit ?? 10  // Default to 10 if not provided
  };
  const result = await getCustomerOrders.execute(processedArgs);
  return { content: [{ type: "text", text: JSON.stringify(result) }] };
});

mcpServer.tool("get-customer-orders", {
  customerId: z.string().regex(/^\d+$/, "Customer ID must be numeric"),
  limit: z.number().default(10)
}, async (args) => {
  const result = await getCustomerOrders.execute(args);
  return { content: [{ type: "text", text: JSON.stringify(result) }] };
});

registerTool("update-customer", async (args) => {
  const result = await updateCustomer.execute(args);
  return { content: [{ type: "text", text: JSON.stringify(result) }] };
});

mcpServer.tool("update-customer", {
  id: z.string().regex(/^\d+$/, "Customer ID must be numeric"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  tags: z.array(z.string()).optional(),
  note: z.string().optional(),
  taxExempt: z.boolean().optional(),
  metafields: z.array(z.object({
    id: z.string().optional(),
    namespace: z.string().optional(),
    key: z.string().optional(),
    value: z.string(),
    type: z.string().optional()
  })).optional()
}, async (args) => {
  const result = await updateCustomer.execute(args);
  return { content: [{ type: "text", text: JSON.stringify(result) }] };
});

registerTool("create-product", async (args) => {
  const result = await createProduct.execute(args);
  return { content: [{ type: "text", text: JSON.stringify(result) }] };
});

mcpServer.tool("create-product", {
  title: z.string().min(1),
  descriptionHtml: z.string().optional(),
  vendor: z.string().optional(),
  productType: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["ACTIVE", "DRAFT", "ARCHIVED"]).default("DRAFT"),
}, async (args) => {
  const result = await createProduct.execute(args);
  return { content: [{ type: "text", text: JSON.stringify(result) }] };
});

// Create Express app for HTTP interface
const app = express();
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'shopify-mcp' });
});

// MCP endpoint - accepts MCP protocol requests
app.post('/mcp', async (req, res) => {
  try {
    const { method, params } = req.body;
    
    if (method === 'tools/list') {
      // List available tools
      const toolNames = Object.keys(toolHandlers);
      res.json({
        tools: toolNames.map(name => ({
          name,
          description: `Shopify ${name} tool`
        }))
      });
    } else if (method === 'tools/call') {
      // Call a tool
      const { name, arguments: args } = params || {};
      
      if (!name) {
        res.status(400).json({ error: 'Tool name is required' });
        return;
      }
      
      if (!toolHandlers[name]) {
        res.status(404).json({ error: `Tool '${name}' not found` });
        return;
      }
      
      // Ensure args is an object, not undefined or null
      const toolArgs = args && typeof args === 'object' ? args : {};
      
      try {
        const result = await toolHandlers[name](toolArgs);
        res.json(result);
      } catch (error: any) {
        console.error(`Error executing tool ${name}:`, error);
        res.status(500).json({ 
          error: error.message || 'Tool execution failed',
          details: error.stack 
        });
      }
    } else {
      res.status(400).json({ error: 'Unknown method' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Start HTTP server
app.listen(PORT, () => {
  console.log(`🚀 Shopify MCP Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📍 MCP endpoint: http://localhost:${PORT}/mcp`);
});

