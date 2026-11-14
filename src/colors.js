/**
 * @fileoverview Terminal ANSI color utilities for express-api-logger.
 * Zero external dependencies. Uses standard ANSI escape sequences.
 */

"use strict";

const ANSI = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  gray: "\x1b[90m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m"
};

/**
 * Wraps text with an ANSI escape code if color is enabled.
 * @param {string} text The string to colorize.
 * @param {string} code The ANSI color code.
 * @param {boolean} [enabled=true] Whether color output is enabled.
 * @returns {string} The formatted string or plain text.
 */
function colorize(text, code, enabled = true) {
  if (!enabled || !text) {
    return String(text);
  }
  return `${code}${text}${ANSI.reset}`;
}

/**
 * Returns colorized status code and status text based on HTTP status code category.
 * - 2xx: Green
 * - 3xx: Cyan
 * - 4xx: Yellow
 * - 5xx: Red
 * - Other/Default: Plain text or White
 *
 * @param {number|string} statusCode HTTP status code (e.g. 200, 404).
 * @param {string} text Text to display with the status color.
 * @param {boolean} [enabled=true] Whether color is enabled.
 * @returns {string} Colorized string.
 */
function colorizeStatus(statusCode, text, enabled = true) {
  const codeNum = Number(statusCode);

  if (!enabled || isNaN(codeNum)) {
    return String(text);
  }

  if (codeNum >= 200 && codeNum < 300) {
    return colorize(text, ANSI.green, enabled);
  }
  if (codeNum >= 300 && codeNum < 400) {
    return colorize(text, ANSI.cyan, enabled);
  }
  if (codeNum >= 400 && codeNum < 500) {
    return colorize(text, ANSI.yellow, enabled);
  }
  if (codeNum >= 500 && codeNum < 600) {
    return colorize(text, ANSI.red, enabled);
  }

  return String(text);
}

/**
 * Colors HTTP method strings for clear terminal distinction.
 * @param {string} method HTTP method (GET, POST, PUT, DELETE, etc.).
 * @param {boolean} [enabled=true] Whether color is enabled.
 * @returns {string} Colorized HTTP method.
 */
function colorizeMethod(method, enabled = true) {
  if (!enabled || !method) {
    return String(method);
  }

  const upper = String(method).toUpperCase();
  switch (upper) {
    case "GET":
      return colorize(upper, ANSI.green, enabled);
    case "POST":
      return colorize(upper, ANSI.cyan, enabled);
    case "PUT":
    case "PATCH":
      return colorize(upper, ANSI.yellow, enabled);
    case "DELETE":
      return colorize(upper, ANSI.red, enabled);
    case "OPTIONS":
    case "HEAD":
      return colorize(upper, ANSI.gray, enabled);
    default:
      return colorize(upper, ANSI.magenta, enabled);
  }
}

module.exports = {
  ANSI,
  colorize,
  colorizeStatus,
  colorizeMethod
};
