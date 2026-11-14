# Changelog

All notable changes to this project are documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-11-24

### Added

**Core middleware**
- `apiLogger()` factory function returns an Express-compatible `(req, res, next)` middleware.
- Automatic logging of every HTTP request on response completion.
- Logs: HTTP method, request URL (including query string), status code, status message, timestamp, and response duration.

**Formatting**
- Standard columnar format: `[HH:mm:ss]  METHOD  /path  STATUS  Xms`
- Combined audit format including remote IP and HTTP protocol version.
- Sub-millisecond precision for fast responses (e.g. `0.45ms`).

**Colors**
- ANSI terminal colors: green (2xx), cyan (3xx), yellow (4xx), red (5xx).
- Per-method colors: green (GET), cyan (POST), yellow (PUT/PATCH), red (DELETE).
- Color output can be fully disabled via `color: false`.

**Configuration options**
- `color` — enable/disable ANSI colors (default: `true`).
- `timestamp` — show/hide `[HH:mm:ss]` prefix (default: `true`).
- `showResponseTime` — show/hide duration suffix (default: `true`).
- `format` — `"standard"` or `"combined"` output style (default: `"standard"`).
- `ignorePaths` — array of string paths or RegExp patterns to skip (default: `[]`).
- `logWriter` — optional custom sink function `(line: string) => void` (default: `process.stdout`).

**Reliability**
- Non-blocking: `next()` is called immediately without waiting for logging.
- High-resolution monotonic timer via `process.hrtime.bigint()`.
- Duplicate-log prevention: internal `logged` flag ensures exactly one entry per request lifecycle.
- Premature connection closure handled via `res` `close` event with `[aborted]` badge.
- Invalid or missing configuration falls back to safe defaults without throwing.

**Security**
- No request/response bodies, cookies, authorization headers, or session tokens are logged.
- Only HTTP metadata is captured.

**Zero dependencies**
- Production bundle has no runtime dependencies.
- Express is a peer dependency only.

**Testing**
- 28 automated tests across three files using Node.js built-in `node:test` and `node:assert`.
- Unit tests for formatter, color utilities, and configuration normalization.
- Full integration tests with a live Express server covering all 20 required scenarios.

**Documentation**
- Complete `README.md` with installation, usage, configuration, and security sections.
- `docs/API.md` with full API reference.
- `CONTRIBUTING.md` with contributor workflow.
- `CHANGELOG.md` (this file).
- `examples/basic-example.js` and `examples/custom-example.js`.

**CI**
- GitHub Actions workflow (`test.yml`) runs tests on Node 18, 20, and 22 across Ubuntu and macOS.
