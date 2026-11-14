/**
 * @fileoverview Log formatting module for express-api-logger.
 * Formats request and response metadata into clean, consistent terminal lines.
 */

"use strict";

const http = require("http");
const { colorize, colorizeStatus, colorizeMethod, ANSI } = require("./colors");

/**
 * Pads a number with a leading zero if less than 10.
 * @param {number} n
 * @returns {string}
 */
function padZero(n) {
  return n < 10 ? `0${n}` : String(n);
}

/**
 * Returns formatted local time string `[HH:mm:ss]`.
 * @param {Date} [date=new Date()]
 * @returns {string}
 */
function formatTimestamp(date = new Date()) {
  const h = padZero(date.getHours());
  const m = padZero(date.getMinutes());
  const s = padZero(date.getSeconds());
  return `[${h}:${m}:${s}]`;
}

/**
 * Formats elapsed nanoseconds into human-readable milliseconds (e.g., "12ms", "0.45ms").
 * @param {bigint} startNs Start time in nanoseconds from process.hrtime.bigint().
 * @param {bigint} endNs End time in nanoseconds from process.hrtime.bigint().
 * @returns {string} Formatted duration.
 */
function formatDuration(startNs, endNs) {
  if (typeof startNs !== "bigint" || typeof endNs !== "bigint") {
    return "0ms";
  }
  const diffNs = endNs - startNs;
  const ms = Number(diffNs) / 1e6;

  if (ms < 1) {
    return `${ms.toFixed(2)}ms`;
  }
  return `${Math.round(ms)}ms`;
}

/**
 * Resolves the HTTP status text for a status code.
 * @param {number} statusCode
 * @param {string} [customMessage]
 * @returns {string}
 */
function getStatusMessage(statusCode, customMessage) {
  if (customMessage && typeof customMessage === "string" && customMessage.trim().length > 0) {
    return customMessage;
  }
  return http.STATUS_CODES[statusCode] || "Unknown";
}

/**
 * Formats a log line in standard or combined format.
 *
 * @param {Object} data Log event data.
 * @param {string} data.method HTTP method (GET, POST, etc.)
 * @param {string} data.url Requested URL path
 * @param {number} data.statusCode HTTP status code
 * @param {string} [data.statusMessage] HTTP status message
 * @param {string} data.duration Response duration string
 * @param {string} [data.timestamp] Formatted timestamp
 * @param {string} [data.ip] Remote client IP (sanitized)
 * @param {string} [data.httpVersion] HTTP version (1.1, 2.0)
 * @param {boolean} [data.completed=true] Whether request completed normally
 * @param {Object} options Formatting options
 * @param {boolean} [options.color=true] Whether colors are enabled
 * @param {boolean} [options.timestamp=true] Whether to include timestamp
 * @param {boolean} [options.showResponseTime=true] Whether to include response time
 * @param {string} [options.format="standard"] "standard" or "combined"
 * @returns {string} Formatted log line
 */
function formatLog(data, options = {}) {
  const {
    method = "GET",
    url = "/",
    statusCode = 200,
    statusMessage,
    duration = "0ms",
    timestamp = formatTimestamp(),
    ip = "-",
    httpVersion = "1.1",
    completed = true
  } = data;

  const color = options.color !== false;
  const showTimestamp = options.timestamp !== false;
  const showResponseTime = options.showResponseTime !== false;
  const format = options.format === "combined" ? "combined" : "standard";

  const resolvedStatusMsg = getStatusMessage(statusCode, statusMessage);
  const statusNumberStr = String(statusCode);

  // Status and status text colored together according to 2xx, 3xx, 4xx, 5xx
  const statusDisplay = `${statusNumberStr} ${resolvedStatusMsg}`;
  const coloredStatus = colorizeStatus(statusCode, statusDisplay, color);
  const coloredMethod = colorizeMethod(method, color);
  const grayDim = (text) => colorize(text, ANSI.gray, color);

  // Completion indicator if request was aborted/closed prematurely
  const completionBadge = !completed ? colorize(" [aborted]", ANSI.red, color) : "";

  if (format === "combined") {
    // Combined format: [timestamp] IP HTTP/version METHOD URL STATUS DURATION [status]
    const parts = [];
    if (showTimestamp) {
      parts.push(grayDim(timestamp));
    }
    parts.push(ip);
    parts.push(`HTTP/${httpVersion}`);
    parts.push(coloredMethod);
    parts.push(url);
    parts.push(coloredStatus + completionBadge);
    if (showResponseTime) {
      parts.push(grayDim(duration));
    }
    return parts.join(" ");
  }

  // Standard format:
  // [10:30:12] GET    /api/users       200 OK          12ms
  const parts = [];
  if (showTimestamp) {
    parts.push(grayDim(timestamp));
  }

  // Align HTTP method to 7 characters (e.g. "GET    ", "DELETE ")
  const paddedMethod = method.padEnd(7, " ");
  // We colorize the padded string so spacing is preserved
  parts.push(colorizeMethod(paddedMethod, color));

  // URL path
  parts.push(url);

  // Colored status code + message
  parts.push(coloredStatus + completionBadge);

  // Response duration
  if (showResponseTime) {
    parts.push(grayDim(duration));
  }

  return parts.join("  ");
}

module.exports = {
  formatTimestamp,
  formatDuration,
  getStatusMessage,
  formatLog
};
