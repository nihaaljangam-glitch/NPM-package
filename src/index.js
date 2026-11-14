/**
 * @fileoverview Express API Logger middleware.
 * Zero-dependency, lightweight, high-performance request and response logger.
 */

"use strict";

const { formatTimestamp, formatDuration, formatLog } = require("./formatter");

/**
 * Validates and normalizes user-provided configuration options.
 * Falls back to sensible defaults on invalid or missing properties.
 *
 * @param {Object} [options]
 * @returns {Object} Normalized configuration.
 */
function normalizeOptions(options) {
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    return {
      color: true,
      timestamp: true,
      showResponseTime: true,
      format: "standard",
      ignorePaths: [],
      logWriter: null
    };
  }

  // Safe boolean validations
  const color = typeof options.color === "boolean" ? options.color : true;
  const timestamp = typeof options.timestamp === "boolean" ? options.timestamp : true;
  const showResponseTime = typeof options.showResponseTime === "boolean" ? options.showResponseTime : true;

  // Format validation ("standard" or "combined")
  const format = options.format === "combined" ? "combined" : "standard";

  // Ignore paths normalization (ensure array of strings or RegExp)
  let ignorePaths = [];
  if (Array.isArray(options.ignorePaths)) {
    ignorePaths = options.ignorePaths.filter(
      (p) => typeof p === "string" || (p && typeof p.test === "function")
    );
  }

  // Custom log sink (useful for testing or redirection, defaults to stdout)
  const logWriter = typeof options.logWriter === "function" ? options.logWriter : null;

  return {
    color,
    timestamp,
    showResponseTime,
    format,
    ignorePaths,
    logWriter
  };
}

/**
 * Checks whether a request URL matches any configured ignore path rule.
 *
 * @param {string} requestUrl The URL path of the incoming request.
 * @param {Array<string|RegExp>} ignorePaths Array of paths or regexes to ignore.
 * @returns {boolean} True if the path should be ignored.
 */
function shouldIgnore(requestUrl, ignorePaths) {
  if (!ignorePaths || ignorePaths.length === 0 || !requestUrl) {
    return false;
  }

  // Strip query string for path matching
  const cleanPath = requestUrl.split("?")[0];

  return ignorePaths.some((rule) => {
    if (typeof rule === "string") {
      return cleanPath === rule || cleanPath.startsWith(rule.endsWith("/") ? rule : `${rule}/`);
    }
    if (rule && typeof rule.test === "function") {
      return rule.test(cleanPath);
    }
    return false;
  });
}

/**
 * Creates the Express API Logger middleware.
 *
 * @param {Object} [userOptions={}] Logger configuration options.
 * @param {boolean} [userOptions.color=true] Enable or disable colored terminal output.
 * @param {boolean} [userOptions.timestamp=true] Show or hide timestamp [HH:mm:ss].
 * @param {boolean} [userOptions.showResponseTime=true] Show or hide response duration.
 * @param {string} [userOptions.format="standard"] "standard" or "combined".
 * @param {Array<string|RegExp>} [userOptions.ignorePaths=[]] Paths to exclude from logging.
 * @param {Function} [userOptions.logWriter] Optional custom logging function (fn(line)).
 * @returns {Function} Express middleware function (req, res, next).
 */
function apiLogger(userOptions = {}) {
  const config = normalizeOptions(userOptions);

  return function expressApiLoggerMiddleware(req, res, next) {
    // 1. URL resolution
    const url = req.originalUrl || req.url || "/";

    // 2. Check if route should be ignored
    if (shouldIgnore(url, config.ignorePaths)) {
      return next();
    }

    // 3. Monotonic high-resolution timer start
    const startNs = process.hrtime.bigint();
    const requestTimestamp = formatTimestamp();
    const method = req.method || "GET";
    const ip = req.ip || req.socket?.remoteAddress || "-";
    const httpVersion = req.httpVersion || "1.1";

    // 4. Guard against duplicate logs (finish and close events)
    let logged = false;

    function handleLog(completed = true) {
      if (logged) {
        return;
      }
      logged = true;

      const endNs = process.hrtime.bigint();
      const duration = formatDuration(startNs, endNs);
      const statusCode = res.statusCode || 200;
      const statusMessage = res.statusMessage;

      const logLine = formatLog(
        {
          method,
          url,
          statusCode,
          statusMessage,
          duration,
          timestamp: requestTimestamp,
          ip,
          httpVersion,
          completed
        },
        config
      );

      if (config.logWriter) {
        config.logWriter(logLine);
      } else {
        process.stdout.write(logLine + "\n");
      }
    }

    // 5. Response finish listener (successful or errored lifecycle completion)
    res.on("finish", () => {
      handleLog(true);
    });

    // 6. Response close listener (handles prematurely aborted/closed connections)
    res.on("close", () => {
      // If the response didn't finish normally before socket closed
      const isCompleted = Boolean(res.writableEnded || res.finished);
      if (!isCompleted) {
        handleLog(false);
      }
    });

    // 7. Proceed to next middleware without blocking
    next();
  };
}

module.exports = apiLogger;
module.exports.apiLogger = apiLogger;
module.exports.normalizeOptions = normalizeOptions;
