# Final Submission — Express API Logger

**Course Assignment:** Publish an NPM Package
**Submission Date:** 2026-11-24
**Student:** Nihal Jangam

---

## 1. Project Name

`@nihaaljangam-glitch/express-api-logger` — Express API Logger

---

## 2. Problem Definition

Express.js has no built-in mechanism to log HTTP requests and responses. Developers who need visibility into which routes are called, what status codes are returned, or how long responses take must write repetitive `console.log` statements in every route handler. This approach is inconsistent, error-prone, and difficult to maintain as a project grows.

**Express API Logger** solves this by providing a single reusable middleware function that intercepts every request-response cycle and automatically logs structured information to the terminal — without touching any route handler.

---

## 3. Solution Overview

A lightweight, zero-dependency Express.js middleware package that automatically logs HTTP request and response metadata to the terminal on every response completion. It is installed with `npm install`, registered with `app.use(apiLogger())`, and requires no further configuration to work.

---

## 4. Feature List

- Automatic request and response logging
- HTTP method detection (GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD)
- Request URL capture including query strings
- HTTP status code and status message display
- High-resolution monotonic response time measurement (`process.hrtime.bigint()`)
- Local timestamp display in `[HH:mm:ss]` format
- ANSI terminal colors: green (2xx), cyan (3xx), yellow (4xx), red (5xx)
- Standard and combined output formats
- Path ignore list (strings and regular expressions)
- Custom log writer / output sink
- Duplicate-log prevention via internal `logged` flag
- Aborted connection detection with `[aborted]` badge
- Safe fallback for all invalid configuration values
- Zero production runtime dependencies

---

## 5. Project Architecture

```
Request arrives
      │
      ▼
┌─────────────────────────┐
│   apiLogger() factory   │  ← normalizeOptions() validates config
└─────────────┬───────────┘
              │
              ▼
┌─────────────────────────┐
│  expressApiLoggerMiddle │  ← Records startNs (hrtime), captures
│  ware(req, res, next)   │    method, url, timestamp
└──────────┬──────────────┘
           │  next()          ← Non-blocking: request continues immediately
           ▼
  [Route handlers / other middleware]
           │
           ▼
  res emits "finish"  ──────────────────────────────────────────┐
  res emits "close"   ──→ if !writableEnded → handleLog(false)  │
                                                                 │
                          handleLog(true/false)                  │
                               │                                 │
                               ▼                                 │
                    ┌──────────────────────┐                     │
                    │  formatLog()         │ ◄───────────────────┘
                    │  formatTimestamp()   │
                    │  formatDuration()    │
                    │  colorizeStatus()    │
                    │  colorizeMethod()    │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │  logWriter() or      │
                    │  process.stdout      │
                    └──────────────────────┘
```

---

## 6. Technology Stack

| Component | Technology |
| :--- | :--- |
| Language | JavaScript (CommonJS, ES5+) |
| Runtime | Node.js >= 18 |
| Framework | Express.js 4.x / 5.x (peer dependency) |
| Testing | Node.js built-in `node:test` + `node:assert` |
| CI/CD | GitHub Actions |
| Package Manager | NPM |
| Source Control | Git + GitHub |
| Registry | NPM (`@nihaljangam` scope) |

---

## 7. Project Structure

```
express-api-logger/
├── src/
│   ├── index.js             # Middleware factory + config normalizer
│   ├── formatter.js         # Timestamp, duration, log line formatting
│   └── colors.js            # ANSI color constants and utilities
├── test/
│   ├── logger.test.js       # Init and configuration unit tests
│   ├── formatter.test.js    # Formatter and color unit tests
│   └── integration.test.js  # Full Express integration tests
├── examples/
│   ├── basic-example.js     # Default usage
│   └── custom-example.js    # Custom config + ignorePaths
├── docs/
│   └── API.md               # Full API reference
├── .github/
│   └── workflows/
│       └── test.yml         # GitHub Actions CI
├── .gitignore
├── .npmignore
├── CHANGELOG.md
├── CONTRIBUTING.md
├── LICENSE                  # MIT
├── package.json
├── package-lock.json
└── README.md
```

---

## 8. Implementation Details

### src/index.js — Core Middleware

- `normalizeOptions(options)`: validates every config field. Invalid types silently revert to defaults. Prevents misconfiguration from crashing the middleware.
- `shouldIgnore(url, ignorePaths)`: checks the request URL against string prefixes and RegExp patterns.
- `apiLogger(userOptions)`: the exported factory. Captures `process.hrtime.bigint()` at request start, attaches `finish` and `close` listeners on `res`, calls `next()` immediately.
- `handleLog(completed)`: guarded by a per-request `logged` boolean so exactly one log entry is ever emitted.

### src/formatter.js — Log Formatting

- `formatTimestamp(date)`: returns `[HH:mm:ss]` using local time.
- `formatDuration(startNs, endNs)`: subtracts BigInt nanoseconds, converts to ms. Displays `0.45ms` for sub-millisecond responses, whole numbers otherwise.
- `getStatusMessage(code, custom)`: uses Node.js `http.STATUS_CODES` lookup.
- `formatLog(data, options)`: assembles the final log string in standard or combined layout.

### src/colors.js — Terminal Colors

- Uses raw ANSI escape sequences — no external library.
- `colorize(text, code, enabled)`: wraps text with the given code or returns plain text.
- `colorizeStatus(code, text, enabled)`: selects color by HTTP status category.
- `colorizeMethod(method, enabled)`: per-method color assignment.

---

## 9. Testing Strategy

Three test files using Node.js's built-in `node:test` runner:

| File | Scope | Tests |
| :--- | :--- | :--- |
| `formatter.test.js` | Unit | Timestamp, duration, status messages, ANSI colors, log format |
| `logger.test.js` | Unit | Middleware init, config normalization, invalid config |
| `integration.test.js` | Integration (live server) | All 20 required HTTP scenarios |

Tests run with `npm test` — no external test runner required.

---

## 10. Test Results

**Command:** `npm test`

```
▶ formatter & colors unit tests
  ✔ formatTimestamp returns [HH:mm:ss] format
  ✔ formatDuration converts nanoseconds to human readable milliseconds
  ✔ getStatusMessage returns standard HTTP status messages
  ✔ colorize applies ANSI code when enabled and plain text when disabled
  ✔ colorizeStatus applies correct colors for 2xx, 3xx, 4xx, 5xx
  ✔ formatLog standard format without color produces clean plain text
  ✔ formatLog combined format produces expected structured output
✔ formatter & colors unit tests (8ms)

▶ Express API Logger Integration Tests
  ✔ 2. GET requests are logged
  ✔ 3. POST requests are logged
  ✔ 4. PUT requests are logged
  ✔ 5. DELETE requests are logged
  ✔ 6. Correct URL is captured
  ✔ 7. HTTP 200 status is captured
  ✔ 8. HTTP 201 status is captured
  ✔ 9. HTTP 400 status is captured
  ✔ 10. HTTP 404 status is captured
  ✔ 11. HTTP 500 status is captured
  ✔ 12. Response time is calculated and formatted
  ✔ 13. Timestamp is displayed
  ✔ 14. Color can be enabled or disabled
  ✔ 15. Timestamp can be disabled
  ✔ 16. Response time can be disabled
  ✔ 17. Ignored paths are not logged
  ✔ 19. Error-handling middleware works correctly
  ✔ 20. Premature connection closure does not create duplicate logs
✔ Express API Logger Integration Tests (464ms)

▶ logger initialization and configuration tests
  ✔ 1. Middleware initializes correctly with defaults
  ✔ 18. Invalid configuration is handled safely
  ✔ custom valid configuration options are properly recognized
✔ logger initialization and configuration tests (3ms)

ℹ tests 28 | pass 28 | fail 0
```

---

## 11. Terminal Output Demonstration

**Standard format (actual output from npm run example):**

```
[17:47:48]  GET      /api/users     200 OK                    4ms
[17:47:48]  POST     /api/users     201 Created               0.47ms
[17:47:48]  GET      /api/products  404 Not Found             0.22ms
[17:47:48]  DELETE   /api/users/5   500 Internal Server Error 0.30ms
```

**Combined format with ignorePaths (actual output from npm run example:custom):**

```
(GET /health → not logged)
(GET /metrics → not logged)
[17:47:55] ::ffff:127.0.0.1 HTTP/1.1 GET /api/products 200 OK 1ms
```

---

## 12. Installation Instructions

```bash
npm install @nihaaljangam-glitch/express-api-logger
```

---

## 13. Usage Examples

**Basic:**

```javascript
const express = require("express");
const apiLogger = require("@nihaaljangam-glitch/express-api-logger");

const app = express();
app.use(apiLogger());
app.get("/", (req, res) => res.send("Hello!"));
app.listen(3000);
```

**Custom:**

```javascript
app.use(apiLogger({
  color: true,
  timestamp: true,
  showResponseTime: true,
  format: "combined",
  ignorePaths: ["/health", "/metrics", /^\/static\//]
}));
```

---

## 14. GitHub Repository

**Status:** ✅ Local Git repository initialized with initial commit.

**Repository URL:** https://github.com/nihaaljangam-glitch/NPM-package

> **Status:** ✅ Pushed to GitHub.

---

## 15. Published NPM Package URL

**Status:** ⏳ Pending your approval and login.

**Expected URL after publish:** https://www.npmjs.com/package/@nihaaljangam-glitch/express-api-logger

> **Action required:** See NPM Publication Steps below.

---

## 16. Package Version

`1.0.0`

---

## GitHub Publication Steps

When you are ready to push to GitHub:

```bash
# 1. Create the repository on github.com (name: express-api-logger, public, no README)
# 2. Add the remote and push:
cd /Users/nihaljangam/express-api-logger
git remote add origin https://github.com/nihaljangam/express-api-logger.git
git branch -M main
git push -u origin main
```

**I will NOT push without your approval.**

---

## NPM Publication Steps

```bash
# Step 1 — Log in (opens browser for secure authentication)
npm login

# Step 2 — Confirm you are logged in
npm whoami

# Step 3 — Final dry run to verify package contents
npm pack --dry-run

# Step 4 — Publish the scoped package as public
npm publish --access public
```

**Explanation of flags:**
- `--access public` is required for scoped packages (`@nihaljangam/...`). Without it, NPM would default to restricted (private), which requires a paid plan.
- `npm login` uses your browser — no password is ever stored in a script or terminal.

**I will NOT publish without your explicit approval.**

---

## Completed Deliverables Checklist

| Requirement | Status |
| :--- | :--- |
| Problem statement and documentation | ✅ Done |
| Project folder structure | ✅ Done |
| Core middleware (`src/index.js`) | ✅ Done |
| Formatter (`src/formatter.js`) | ✅ Done |
| Color utilities (`src/colors.js`) | ✅ Done |
| Configuration options (all 5+1) | ✅ Done |
| Colored output (2xx/3xx/4xx/5xx) | ✅ Done |
| Non-blocking, monotonic timer | ✅ Done |
| Duplicate-log prevention | ✅ Done |
| Aborted connection handling | ✅ Done |
| Security — no credentials logged | ✅ Done |
| `package.json` (all required fields) | ✅ Done |
| NPM package name checked (`express-api-logger` taken → scoped) | ✅ Done |
| `npm test` script | ✅ Done |
| `npm run test:watch` script | ✅ Done |
| `npm run example` script | ✅ Done |
| 28 automated tests — all passing | ✅ Done |
| `README.md` (all 25 required sections) | ✅ Done |
| `docs/API.md` | ✅ Done |
| `CONTRIBUTING.md` | ✅ Done |
| `CHANGELOG.md` | ✅ Done |
| `LICENSE` (MIT, Nihal Jangam) | ✅ Done |
| `.gitignore` | ✅ Done |
| `.npmignore` | ✅ Done |
| `examples/basic-example.js` | ✅ Done |
| `examples/custom-example.js` | ✅ Done |
| GitHub Actions CI (`test.yml`) | ✅ Done |
| Git repository initialized, initial commit | ✅ Done |
| `npm pack --dry-run` passes (10.5 kB, 8 files) | ✅ Done |
| GitHub push | ⏳ Awaiting your approval |
| NPM publish | ⏳ Awaiting your approval |
