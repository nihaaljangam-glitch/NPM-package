# API Reference — Express API Logger

`express-api-logger` is a lightweight, zero-dependency HTTP request and response logging middleware designed for Express.js applications.

---

## Table of Contents

- [Exported Functions](#exported-functions)
  - [`apiLogger([options])`](#apiloggeroptions)
- [Configuration Options](#configuration-options)
  - [`color`](#color)
  - [`timestamp`](#timestamp)
  - [`showResponseTime`](#showresponsetime)
  - [`format`](#format)
  - [`ignorePaths`](#ignorepaths)
  - [`logWriter`](#logwriter)
- [Log Formats](#log-formats)
  - [Standard Format](#standard-format)
  - [Combined Format](#combined-format)
- [Color Palette](#color-palette)
- [Reliability & Lifecycle Guarantees](#reliability--lifecycle-guarantees)
- [Security Guarantees](#security-guarantees)

---

## Exported Functions

### `apiLogger([options])`

Creates and returns an Express middleware function `(req, res, next)`.

```javascript
const apiLogger = require("@nihaaljangam-glitch/express-api-logger");
app.use(apiLogger(options));
```

- **Parameters:**
  - `options` *(Object, optional)*: Configuration object modifying logging behavior.
- **Returns:**
  - `Function`: Express-compliant middleware `(req, res, next)`.

---

## Configuration Options

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `color` | `boolean` | `true` | Enables or disables ANSI color escape sequences in terminal output. |
| `timestamp` | `boolean` | `true` | Displays request arrival timestamp in `[HH:mm:ss]` format. |
| `showResponseTime` | `boolean` | `true` | Calculates and displays processing duration (e.g., `12ms`, `0.45ms`). |
| `format` | `string` | `"standard"` | Output style: `"standard"` (columnar) or `"combined"` (audit-style). |
| `ignorePaths` | `Array<string\|RegExp>` | `[]` | List of routes/patterns that bypass the logger completely. |
| `logWriter` | `Function` | `null` | Optional custom stream sink: `(line: string) => void`. Defaults to `process.stdout.write`. |

---

### `color`
- **Type**: `boolean`
- **Default**: `true`
- **Behavior**: When `true`, formats status codes and HTTP methods with terminal colors. When `false`, produces pure uncolored plaintext.

```javascript
app.use(apiLogger({ color: false }));
```

---

### `timestamp`
- **Type**: `boolean`
- **Default**: `true`
- **Behavior**: When `true`, prepends `[HH:mm:ss]` to every log line. When `false`, the timestamp prefix is omitted.

```javascript
app.use(apiLogger({ timestamp: false }));
```

---

### `showResponseTime`
- **Type**: `boolean`
- **Default**: `true`
- **Behavior**: When `true`, measures elapsed execution time using `process.hrtime.bigint()` and appends duration in milliseconds.

```javascript
app.use(apiLogger({ showResponseTime: false }));
```

---

### `format`
- **Type**: `string` (`"standard"` | `"combined"`)
- **Default**: `"standard"`
- **Behavior**:
  - `"standard"`: Clean, aligned columns intended for developer consoles:
    ```text
    [10:30:12]  GET      /api/users       200 OK           12ms
    ```
  - `"combined"`: Extended log entry containing remote IP and HTTP protocol version:
    ```text
    [10:30:12] 127.0.0.1 HTTP/1.1 GET /api/users 200 OK 12ms
    ```

```javascript
app.use(apiLogger({ format: "combined" }));
```

---

### `ignorePaths`
- **Type**: `Array<string | RegExp>`
- **Default**: `[]`
- **Behavior**: Exact match strings, path prefixes, or regular expressions that should not trigger log output (ideal for health checks, Kubernetes probes, or metrics scrapers).

```javascript
app.use(apiLogger({
  ignorePaths: [
    "/health",
    "/metrics",
    /^\/static\//
  ]
}));
```

---

### `logWriter`
- **Type**: `Function (string) => void`
- **Default**: `null` (writes to `process.stdout.write(line + "\n")`)
- **Behavior**: Allows redirecting output to external log collectors, custom Winston/Pino transports, or in-memory arrays for unit testing.

```javascript
app.use(apiLogger({
  logWriter: (logLine) => {
    myCustomLogger.info(logLine);
  }
}));
```

---

## Color Palette

Status codes are styled according to HTTP specification categories:

| Status Code Range | Meaning | ANSI Color | Terminal Appearance |
| :--- | :--- | :--- | :--- |
| **2xx** | Success | Green (`\x1b[32m`) | Green status code and text |
| **3xx** | Redirection | Cyan (`\x1b[36m`) | Cyan status code and text |
| **4xx** | Client Error | Yellow (`\x1b[33m`) | Yellow status code and text |
| **5xx** | Server Error | Red (`\x1b[31m`) | Red status code and text |

---

## Reliability & Lifecycle Guarantees

1. **Non-Blocking Execution**: The middleware captures start time and immediately forwards the request via `next()`. No asynchronous event loop locks or delays are introduced into request handling.
2. **Monotonic High-Resolution Timing**: Uses `process.hrtime.bigint()`, ensuring clock skew or NTP synchronization adjustments never produce negative or erratic response durations.
3. **Response Completion Listening**: Subscribes to Node.js `finish` and `close` streams on `res`.
4. **Duplicate Prevention**: Encapsulates an internal `logged` lock per request lifecycle, ensuring that even if both `finish` and `close` fire on aborted sockets, exactly one log entry is rendered.

---

## Security Guarantees

- **Zero Credential Exposure**: `express-api-logger` strictly logs HTTP metadata (method, route path, status code, response time).
- **No Request / Response Bodies**: Request payloads, JSON objects, and multipart form fields are never inspected or written to disk.
- **No Header Snooping**: Cookies, `Authorization: Bearer` tokens, API keys, and session IDs are excluded by design.
