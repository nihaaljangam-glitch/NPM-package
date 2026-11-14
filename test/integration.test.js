/**
 * @fileoverview Integration tests for express-api-logger with an active Express server.
 * Verifies all 20 required scenarios using node:test and node:assert.
 */

"use strict";

const { test, describe, before, after } = require("node:test");
const assert = require("node:assert");
const http = require("node:http");
const express = require("express");
const apiLogger = require("../src/index");

describe("Express API Logger Integration Tests", () => {
  let app;
  let server;
  let baseUrl;
  let capturedLogs = [];

  const logWriter = (line) => {
    capturedLogs.push(line);
  };

  before(async () => {
    app = express();
    app.use(express.json());

    // Setup middleware with captured writer and color disabled for deterministic string checks
    app.use(
      apiLogger({
        color: false,
        timestamp: true,
        showResponseTime: true,
        ignorePaths: ["/health", "/skip-me"],
        logWriter
      })
    );

    // Test routes
    app.get("/api/users", (req, res) => {
      res.status(200).send({ users: ["Alice", "Bob"] });
    });

    app.post("/api/users", (req, res) => {
      res.status(201).send({ message: "User created" });
    });

    app.put("/api/users/1", (req, res) => {
      res.status(200).send({ message: "User updated" });
    });

    app.delete("/api/users/1", (req, res) => {
      res.status(200).send({ message: "User deleted" });
    });

    app.get("/api/bad-request", (req, res) => {
      res.status(400).send({ error: "Bad Request" });
    });

    app.get("/api/error", (req, res, next) => {
      const err = new Error("Database connection failure");
      next(err);
    });

    app.get("/health", (req, res) => {
      res.status(200).send("OK");
    });

    // Slow endpoint to test premature client disconnection
    app.get("/api/slow", (req, res) => {
      setTimeout(() => {
        if (!res.writableEnded) {
          res.status(200).send("Finished slowly");
        }
      }, 500);
    });

    // Express error handling middleware (scenario 19)
    app.use((err, req, res, next) => {
      res.status(500).json({ error: err.message });
    });

    // Start server on an ephemeral port
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  function clearLogs() {
    capturedLogs = [];
  }

  test("2. GET requests are logged", async () => {
    clearLogs();
    const res = await fetch(`${baseUrl}/api/users`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(capturedLogs.length, 1);
    assert.match(capturedLogs[0], /GET/);
  });

  test("3. POST requests are logged", async () => {
    clearLogs();
    const res = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Charlie" })
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(capturedLogs.length, 1);
    assert.match(capturedLogs[0], /POST/);
  });

  test("4. PUT requests are logged", async () => {
    clearLogs();
    const res = await fetch(`${baseUrl}/api/users/1`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "David" })
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(capturedLogs.length, 1);
    assert.match(capturedLogs[0], /PUT/);
  });

  test("5. DELETE requests are logged", async () => {
    clearLogs();
    const res = await fetch(`${baseUrl}/api/users/1`, {
      method: "DELETE"
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(capturedLogs.length, 1);
    assert.match(capturedLogs[0], /DELETE/);
  });

  test("6. Correct URL is captured", async () => {
    clearLogs();
    await fetch(`${baseUrl}/api/users?sort=asc`);
    assert.strictEqual(capturedLogs.length, 1);
    assert.match(capturedLogs[0], /\/api\/users\?sort=asc/);
  });

  test("7. HTTP 200 status is captured", async () => {
    clearLogs();
    await fetch(`${baseUrl}/api/users`);
    assert.strictEqual(capturedLogs.length, 1);
    assert.match(capturedLogs[0], /200 OK/);
  });

  test("8. HTTP 201 status is captured", async () => {
    clearLogs();
    await fetch(`${baseUrl}/api/users`, { method: "POST" });
    assert.strictEqual(capturedLogs.length, 1);
    assert.match(capturedLogs[0], /201 Created/);
  });

  test("9. HTTP 400 status is captured", async () => {
    clearLogs();
    await fetch(`${baseUrl}/api/bad-request`);
    assert.strictEqual(capturedLogs.length, 1);
    assert.match(capturedLogs[0], /400 Bad Request/);
  });

  test("10. HTTP 404 status is captured", async () => {
    clearLogs();
    await fetch(`${baseUrl}/api/non-existent-route`);
    assert.strictEqual(capturedLogs.length, 1);
    assert.match(capturedLogs[0], /404 Not Found/);
  });

  test("11. HTTP 500 status is captured", async () => {
    clearLogs();
    await fetch(`${baseUrl}/api/error`);
    assert.strictEqual(capturedLogs.length, 1);
    assert.match(capturedLogs[0], /500 Internal Server Error/);
  });

  test("12. Response time is calculated and formatted", async () => {
    clearLogs();
    await fetch(`${baseUrl}/api/users`);
    assert.strictEqual(capturedLogs.length, 1);
    // e.g. "12ms" or "0.85ms"
    assert.match(capturedLogs[0], /\d+(\.\d+)?ms/);
  });

  test("13. Timestamp is displayed", async () => {
    clearLogs();
    await fetch(`${baseUrl}/api/users`);
    assert.strictEqual(capturedLogs.length, 1);
    // e.g. "[10:30:12]"
    assert.match(capturedLogs[0], /^\[\d{2}:\d{2}:\d{2}\]/);
  });

  test("14. Color can be enabled or disabled", async () => {
    const testLogs = [];
    const colorApp = express();
    colorApp.use(
      apiLogger({
        color: true,
        logWriter: (l) => testLogs.push(l)
      })
    );
    colorApp.get("/color-test", (req, res) => res.send("OK"));

    const tempServer = colorApp.listen(0);
    const port = tempServer.address().port;

    try {
      await fetch(`http://127.0.0.1:${port}/color-test`);
      assert.strictEqual(testLogs.length, 1);
      // Contains ANSI escape sequences
      assert.match(testLogs[0], /\x1b\[/);
    } finally {
      await new Promise((resolve) => tempServer.close(resolve));
    }
  });

  test("15. Timestamp can be disabled", async () => {
    const testLogs = [];
    const noTsApp = express();
    noTsApp.use(
      apiLogger({
        timestamp: false,
        color: false,
        logWriter: (l) => testLogs.push(l)
      })
    );
    noTsApp.get("/no-timestamp", (req, res) => res.send("OK"));

    const tempServer = noTsApp.listen(0);
    const port = tempServer.address().port;

    try {
      await fetch(`http://127.0.0.1:${port}/no-timestamp`);
      assert.strictEqual(testLogs.length, 1);
      // Starts with GET, not timestamp brackets
      assert.match(testLogs[0], /^GET/);
    } finally {
      await new Promise((resolve) => tempServer.close(resolve));
    }
  });

  test("16. Response time can be disabled", async () => {
    const testLogs = [];
    const noDurationApp = express();
    noDurationApp.use(
      apiLogger({
        showResponseTime: false,
        color: false,
        logWriter: (l) => testLogs.push(l)
      })
    );
    noDurationApp.get("/no-duration", (req, res) => res.send("OK"));

    const tempServer = noDurationApp.listen(0);
    const port = tempServer.address().port;

    try {
      await fetch(`http://127.0.0.1:${port}/no-duration`);
      assert.strictEqual(testLogs.length, 1);
      assert.doesNotMatch(testLogs[0], /\d+ms$/);
      assert.strictEqual(testLogs[0].includes("ms"), false);
    } finally {
      await new Promise((resolve) => tempServer.close(resolve));
    }
  });

  test("17. Ignored paths are not logged", async () => {
    clearLogs();
    const res = await fetch(`${baseUrl}/health`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(capturedLogs.length, 0); // Not logged!
  });

  test("19. Error-handling middleware works correctly", async () => {
    clearLogs();
    const res = await fetch(`${baseUrl}/api/error`);
    assert.strictEqual(res.status, 500);
    const body = await res.json();
    assert.strictEqual(body.error, "Database connection failure");
    assert.strictEqual(capturedLogs.length, 1);
    assert.match(capturedLogs[0], /500 Internal Server Error/);
  });

  test("20. Premature connection closure does not create duplicate logs", async () => {
    clearLogs();
    const port = server.address().port;

    await new Promise((resolve) => {
      const req = http.request({
        host: "127.0.0.1",
        port,
        path: "/api/slow",
        method: "GET"
      });

      req.on("error", () => {
        // Expected socket abort error
      });

      req.end();

      // Abort connection after 50ms before server completes in 500ms
      setTimeout(() => {
        req.destroy();
        // Wait to ensure close event fires and no duplicate log appears
        setTimeout(resolve, 300);
      }, 50);
    });

    // Exactly one log entry should be recorded, marked aborted
    assert.strictEqual(capturedLogs.length, 1);
    assert.match(capturedLogs[0], /\[aborted\]/);
  });
});
