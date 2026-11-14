/**
 * @fileoverview Basic Express API Logger usage example.
 * Run using: npm run example
 */

"use strict";

const express = require("express");
const apiLogger = require("../src/index");

const app = express();

// Register the middleware with sensible defaults
app.use(apiLogger());

// Sample routes demonstrating various HTTP methods and status codes
app.get("/", (req, res) => {
  res.send("API Logger is working!");
});

app.get("/api/users", (req, res) => {
  res.json([
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" }
  ]);
});

app.post("/api/users", (req, res) => {
  res.status(201).json({ id: 3, name: "Charlie" });
});

app.get("/api/products", (req, res) => {
  res.status(404).json({ error: "Product not found" });
});

app.delete("/api/users/:id", (req, res) => {
  res.status(500).json({ error: "Database transaction failed" });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Basic example server running at http://localhost:${PORT}`);
  console.log("Try visiting:");
  console.log(` - GET    http://localhost:${PORT}/`);
  console.log(` - GET    http://localhost:${PORT}/api/users`);
  console.log(` - POST   http://localhost:${PORT}/api/users`);
  console.log(` - GET    http://localhost:${PORT}/api/products`);
  console.log(` - DELETE http://localhost:${PORT}/api/users/5`);
});

module.exports = { app, server };
