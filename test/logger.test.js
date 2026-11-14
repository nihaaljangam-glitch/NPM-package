/**
 * @fileoverview Unit tests for logger middleware initialization, options normalization, and path filtering.
 */

"use strict";

const { test, describe } = require("node:test");
const assert = require("node:assert");
const apiLogger = require("../src/index");
const { normalizeOptions } = require("../src/index");

describe("logger initialization and configuration tests", () => {
  test("1. Middleware initializes correctly with defaults", () => {
    const middleware = apiLogger();
    assert.strictEqual(typeof middleware, "function");
    assert.strictEqual(middleware.length, 3); // (req, res, next)
  });

  test("18. Invalid configuration is handled safely", () => {
    // Null, numbers, arrays, or invalid properties shouldn't crash the middleware
    assert.doesNotThrow(() => apiLogger(null));
    assert.doesNotThrow(() => apiLogger(undefined));
    assert.doesNotThrow(() => apiLogger("invalid string"));
    assert.doesNotThrow(() => apiLogger(12345));
    assert.doesNotThrow(() => apiLogger({ color: "yes", timestamp: 42, format: 999 }));

    const config = normalizeOptions({
      color: "not-a-bool",
      timestamp: null,
      showResponseTime: "invalid",
      format: "unsupported",
      ignorePaths: "not-an-array"
    });

    assert.strictEqual(config.color, true);
    assert.strictEqual(config.timestamp, true);
    assert.strictEqual(config.showResponseTime, true);
    assert.strictEqual(config.format, "standard");
    assert.deepStrictEqual(config.ignorePaths, []);
  });

  test("custom valid configuration options are properly recognized", () => {
    const customConfig = normalizeOptions({
      color: false,
      timestamp: false,
      showResponseTime: false,
      format: "combined",
      ignorePaths: ["/health", /^\/metrics/]
    });

    assert.strictEqual(customConfig.color, false);
    assert.strictEqual(customConfig.timestamp, false);
    assert.strictEqual(customConfig.showResponseTime, false);
    assert.strictEqual(customConfig.format, "combined");
    assert.strictEqual(customConfig.ignorePaths.length, 2);
  });
});
