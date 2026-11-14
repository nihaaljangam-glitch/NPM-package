# Express API Logger

A lightweight, zero-dependency, and customizable HTTP request logging middleware for Express.js applications.

---

## Problem Statement

When building an Express.js API, developers have no built-in way to see which routes are being hit, what status codes are returned, or how long responses take. Without visibility into these details, debugging slowdowns, catching errors, and monitoring API health becomes tedious.

Developers typically end up writing repetitive `console.log` statements inside every route handler — a brittle, inconsistent, and time-consuming approach.

---

## Why Use Express API Logger?

- **Zero configuration required** — add one line and every request is logged automatically.
- **Zero production dependencies** — the entire package is built on Node.js built-ins.
- **Readable, colorized output** — HTTP methods and status codes are color-coded so you can spot errors instantly in the terminal.
- **Performance-safe** — timing uses a monotonic high-resolution clock; logging happens after the response is sent, not before.
- **Fully configurable** — disable colors, timestamps, response time, or entire paths without modifying your routes.
- **Privacy-first** — no request bodies, cookies, authorization tokens, or passwords are ever logged.

---

## Features

- Automatic request and response logging
- HTTP method detection (GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD)
- Request URL capture including query strings
- HTTP status code and status message display
- High-resolution response time measurement
- Local timestamp display in `[HH:mm:ss]` format
- ANSI terminal colors: green (2xx), cyan (3xx), yellow (4xx), red (5xx)
- Standard and combined output formats
- Path ignore list (strings and regular expressions)
- Custom log writer / output sink
- Duplicate-log prevention on aborted connections
- Graceful handling of premature client disconnections (`[aborted]` badge)
- Safe fallback for all invalid configuration values

---

## Technology Stack

| Component | Technology |
| :--- | :--- |
| Language | JavaScript (CommonJS) |
| Runtime | Node.js >= 18 |
| Framework | Express.js 4.x / 5.x (peer dependency) |
| Testing | Node.js built-in `node:test` and `node:assert` |
| CI | GitHub Actions |
| Registry | NPM |

---

## Requirements

- Node.js version 18 or higher
- Express.js version 4.18 or higher (or Express 5)

---

## Installation

```bash
npm install @nihaljangam/express-api-logger
```

---

## Basic Usage

```javascript
const express = require("express");
const apiLogger = require("@nihaljangam/express-api-logger");

const app = express();

app.use(apiLogger());

app.get("/", (req, res) => {
  res.send("API Logger is working!");
});

app.listen(3000);
```

Terminal output:

```
[10:30:12]  GET      /               200 OK           4ms
[10:30:15]  POST     /api/users      201 Created      12ms
[10:30:18]  GET      /api/products   404 Not Found    3ms
[10:30:20]  DELETE   /api/users/5    500 Internal Server Error  8ms
```

---

## Advanced Usage

```javascript
const express = require("express");
const apiLogger = require("@nihaljangam/express-api-logger");

const app = express();

app.use(
  apiLogger({
    color: true,
    timestamp: true,
    showResponseTime: true,
    format: "combined",
    ignorePaths: ["/health", "/metrics", /^\/static\//]
  })
);

app.get("/health", (req, res) => res.send("OK")); // not logged
app.get("/api/users", (req, res) => res.json([]));

app.listen(3000);
```

Combined format output:

```
[10:30:12] 127.0.0.1 HTTP/1.1 GET /api/users 200 OK 5ms
```

---

## Configuration Options

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `color` | `boolean` | `true` | Enable or disable ANSI terminal colors. |
| `timestamp` | `boolean` | `true` | Show or hide the `[HH:mm:ss]` timestamp prefix. |
| `showResponseTime` | `boolean` | `true` | Show or hide response duration (e.g., `12ms`). |
| `format` | `string` | `"standard"` | Output style: `"standard"` or `"combined"`. |
| `ignorePaths` | `Array<string\|RegExp>` | `[]` | Paths or patterns to exclude from logging. |
| `logWriter` | `Function` | `null` | Custom output sink: `(line: string) => void`. |

Invalid values are silently replaced by the defaults — the middleware will never throw due to bad configuration.

---

## API Documentation

### `apiLogger([options])`

Creates and returns an Express middleware function.

**Parameters:**

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `options` | `Object` | No | Configuration object. All fields are optional. |

**Returns:** `Function` — an Express middleware `(req, res, next)`.

**Example:**

```javascript
const middleware = apiLogger({ color: false, format: "combined" });
app.use(middleware);
```

---

## Terminal Output Examples

**Standard format (default):**

```
[10:30:12]  GET      /api/users       200 OK                    12ms
[10:30:15]  POST     /api/users       201 Created               25ms
[10:30:18]  GET      /api/products    404 Not Found              8ms
[10:30:20]  DELETE   /api/users/5     500 Internal Server Error 15ms
```

**Combined format:**

```
[10:30:12] 127.0.0.1 HTTP/1.1 GET /api/users 200 OK 12ms
```

**Aborted connection:**

```
[10:30:22]  GET      /api/slow        200 OK  [aborted]  51ms
```

---

## Error Handling

The middleware integrates transparently with Express error-handling middleware. When a route calls `next(err)`, Express invokes your error handler which sets the status code and sends the response. The logger captures the final status code after the response finishes.

```javascript
app.get("/api/data", (req, res, next) => {
  next(new Error("Something went wrong"));
});

// Error handler — must have 4 parameters
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});
// Logger captures: 500 Internal Server Error
```

---

## Limitations

- Does not log request or response bodies by design.
- Does not log request headers (cookies, authorization, etc.) by design.
- WebSocket connections are not logged.
- Server-Sent Events streams log once on connection close.

---

## Security Considerations

- No request bodies, form fields, or JSON payloads are ever read or stored.
- No headers (including `Authorization`, `Cookie`, or `X-API-Key`) are logged.
- Only HTTP metadata is captured: method, path, status code, timing.
- The `ignorePaths` option lets you exclude sensitive routes entirely.

---

## Project Structure

```
express-api-logger/
├── src/
│   ├── index.js        # Middleware factory and configuration normalization
│   ├── formatter.js    # Log line formatting (timestamp, duration, layout)
│   └── colors.js       # ANSI terminal color utilities
├── test/
│   ├── logger.test.js       # Initialization and configuration tests
│   ├── formatter.test.js    # Formatter and color unit tests
│   └── integration.test.js  # Express integration tests (live server)
├── examples/
│   ├── basic-example.js     # Default configuration example
│   └── custom-example.js    # Custom configuration example
├── docs/
│   └── API.md          # Full API reference
├── .github/
│   └── workflows/
│       └── test.yml    # GitHub Actions CI
├── .gitignore
├── .npmignore
├── CHANGELOG.md
├── CONTRIBUTING.md
├── LICENSE
├── package.json
└── README.md
```

---

## Running Tests

```bash
npm test
```

Expected output:

```
ℹ tests 28
ℹ pass 28
ℹ fail 0
```

---

## Contribution Instructions

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full contributor guide, including:

- How to clone the repository
- How to install dependencies
- How to run tests
- How to report bugs
- How to submit improvements

---

## License

This project is licensed under the [MIT License](./LICENSE).

---

## Author

**Nihal Jangam**

- GitHub: https://github.com/nihaljangam
- NPM: https://www.npmjs.com/~nihaljangam
