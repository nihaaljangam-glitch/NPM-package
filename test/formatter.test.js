/**
 * @fileoverview Unit tests for log formatter and ANSI color utilities.
 */

"use strict";

const { test, describe } = require("node:test");
const assert = require("node:assert");
const { formatTimestamp, formatDuration, getStatusMessage, formatLog } = require("../src/formatter");
const { colorize, colorizeStatus, colorizeMethod, ANSI } = require("../src/colors");

describe("formatter & colors unit tests", () => {
  test("formatTimestamp returns [HH:mm:ss] format", () => {
    const ts = formatTimestamp(new Date(2026, 0, 15, 10, 30, 45));
    assert.strictEqual(ts, "[10:30:45]");
  });

  test("formatDuration converts nanoseconds to human readable milliseconds", () => {
    const start = 1000000000n;
    const end = 1012000000n; // 12ms
    assert.strictEqual(formatDuration(start, end), "12ms");

    const subMsEnd = 1000450000n; // 0.45ms
    assert.strictEqual(formatDuration(start, subMsEnd), "0.45ms");

    assert.strictEqual(formatDuration(null, null), "0ms");
  });

  test("getStatusMessage returns standard HTTP status messages", () => {
    assert.strictEqual(getStatusMessage(200), "OK");
    assert.strictEqual(getStatusMessage(201), "Created");
    assert.strictEqual(getStatusMessage(404), "Not Found");
    assert.strictEqual(getStatusMessage(500), "Internal Server Error");
    assert.strictEqual(getStatusMessage(999), "Unknown");
    assert.strictEqual(getStatusMessage(200, "Custom OK"), "Custom OK");
  });

  test("colorize applies ANSI code when enabled and plain text when disabled", () => {
    const colored = colorize("hello", ANSI.green, true);
    assert.strictEqual(colored, `\x1b[32mhello\x1b[0m`);

    const plain = colorize("hello", ANSI.green, false);
    assert.strictEqual(plain, "hello");
  });

  test("colorizeStatus applies correct colors for 2xx, 3xx, 4xx, 5xx", () => {
    assert.match(colorizeStatus(200, "200 OK", true), /\x1b\[32m/); // green
    assert.match(colorizeStatus(301, "301 Moved", true), /\x1b\[36m/); // cyan
    assert.match(colorizeStatus(404, "404 Not Found", true), /\x1b\[33m/); // yellow
    assert.match(colorizeStatus(500, "500 Error", true), /\x1b\[31m/); // red

    // When disabled, no ANSI escape sequences
    const disabled = colorizeStatus(200, "200 OK", false);
    assert.strictEqual(disabled, "200 OK");
  });

  test("formatLog standard format without color produces clean plain text", () => {
    const log = formatLog(
      {
        method: "GET",
        url: "/api/users",
        statusCode: 200,
        statusMessage: "OK",
        duration: "12ms",
        timestamp: "[10:30:12]"
      },
      { color: false }
    );

    assert.strictEqual(log, "[10:30:12]  GET      /api/users  200 OK  12ms");
  });

  test("formatLog combined format produces expected structured output", () => {
    const log = formatLog(
      {
        method: "POST",
        url: "/api/items",
        statusCode: 201,
        statusMessage: "Created",
        duration: "25ms",
        timestamp: "[10:30:15]",
        ip: "127.0.0.1",
        httpVersion: "1.1"
      },
      { color: false, format: "combined" }
    );

    assert.strictEqual(
      log,
      "[10:30:15] 127.0.0.1 HTTP/1.1 POST /api/items 201 Created 25ms"
    );
  });
});
