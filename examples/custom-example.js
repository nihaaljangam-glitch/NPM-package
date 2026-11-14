/**
 * @fileoverview Custom configuration example for express-api-logger.
 * Run using: npm run example:custom
 */

"use strict";

const express = require("express");
const apiLogger = require("../src/index");

const app = express();

// Register the middleware with custom configuration
app.use(
  apiLogger({
    color: true,
    timestamp: true,
    showResponseTime: true,
    format: "combined",
    ignorePaths: ["/health", "/metrics", /^\/private\//]
  })
);

// Ignored routes - no logs will be printed for these
app.get("/health", (req, res) => {
  res.status(200).send("System Healthy (Unlogged)");
});

app.get("/metrics", (req, res) => {
  res.status(200).send("Prometheus metrics (Unlogged)");
});

// Logged routes
app.get("/api/products", (req, res) => {
  res.json({
    products: [
      { id: 1, name: "Mechanical Keyboard", price: 120 },
      { id: 2, name: "Ergonomic Mouse", price: 85 }
    ]
  });
});

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(`🚀 Custom example server running at http://localhost:${PORT}`);
  console.log("Ignored paths (no logs):");
  console.log(` - GET http://localhost:${PORT}/health`);
  console.log(` - GET http://localhost:${PORT}/metrics`);
  console.log("Logged paths (with combined format):");
  console.log(` - GET http://localhost:${PORT}/api/products`);
});

module.exports = { app, server };
