# Contributing to Express API Logger

Thank you for your interest in contributing! This guide explains how to set up the project locally, run the tests, report issues, and submit changes.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Clone the Repository](#clone-the-repository)
- [Install Dependencies](#install-dependencies)
- [Project Structure](#project-structure)
- [Running the Tests](#running-the-tests)
- [Running the Examples](#running-the-examples)
- [Reporting Bugs](#reporting-bugs)
- [Submitting Improvements](#submitting-improvements)
- [Code Style Guidelines](#code-style-guidelines)

---

## Prerequisites

Before you start, make sure the following are installed on your machine:

- **Node.js** version 18 or higher: https://nodejs.org
- **NPM** version 9 or higher (included with Node.js)
- **Git**: https://git-scm.com

Check your installed versions:

```bash
node -v
npm -v
git --version
```

---

## Clone the Repository

```bash
git clone https://github.com/nihaaljangam-glitch/NPM-package.git
cd NPM-package
```

---

## Install Dependencies

This package has no production runtime dependencies. The only development dependency is Express (used for integration tests and examples).

```bash
npm install
```

---

## Project Structure

```
express-api-logger/
├── src/
│   ├── index.js        # Core middleware factory
│   ├── formatter.js    # Log line formatting utilities
│   └── colors.js       # ANSI terminal color helpers
├── test/
│   ├── logger.test.js       # Middleware initialization and config tests
│   ├── formatter.test.js    # Formatter and color unit tests
│   └── integration.test.js  # Full Express integration tests
├── examples/
│   ├── basic-example.js     # Default usage example
│   └── custom-example.js    # Custom configuration example
├── docs/
│   └── API.md          # Full API reference
├── .github/
│   └── workflows/
│       └── test.yml    # GitHub Actions CI workflow
├── package.json
├── README.md
├── CHANGELOG.md
├── CONTRIBUTING.md
└── LICENSE
```

---

## Running the Tests

All tests use Node.js's built-in `node:test` runner — no additional test libraries are required.

Run all tests once:

```bash
npm test
```

Run tests in watch mode (re-runs on file changes):

```bash
npm run test:watch
```

A passing run will show output similar to:

```
✔ formatter & colors unit tests (4ms)
✔ Express API Logger Integration Tests (450ms)
✔ logger initialization and configuration tests (3ms)
ℹ tests 28
ℹ pass 28
ℹ fail 0
```

All 28 tests must pass before submitting a pull request.

---

## Running the Examples

Basic usage example (default options):

```bash
npm run example
```

Custom configuration example:

```bash
npm run example:custom
```

---

## Reporting Bugs

If you find a bug, please open an issue at:

https://github.com/nihaaljangam-glitch/NPM-package/issues

Include the following in your report:

1. Node.js and NPM version (`node -v` and `npm -v`).
2. Operating system and version.
3. The code or configuration that triggered the issue.
4. The expected behavior.
5. The actual behavior or error message.

---

## Submitting Improvements

1. **Fork** the repository on GitHub.
2. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** in the appropriate files under `src/`.
4. **Add or update tests** in `test/` to cover the change.
5. **Run all tests** and confirm they pass:
   ```bash
   npm test
   ```
6. **Commit your changes** with a clear message:
   ```bash
   git commit -m "feat: add support for custom log prefix"
   ```
7. **Push your branch** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
8. **Open a Pull Request** against the `main` branch of this repository at https://github.com/nihaaljangam-glitch/NPM-package.

---

## Code Style Guidelines

- Use `"use strict"` at the top of every source file.
- Use clear JSDoc comments on all exported functions.
- Keep functions small and focused on a single responsibility.
- Avoid adding external runtime dependencies.
- Validate all user-supplied configuration defensively.
- Do not log request bodies, headers, cookies, or any sensitive data.
