# E-Watch

Blockchain event monitoring system for Stacks network.

![CI](https://github.com/Mosas2000/E-Watch/actions/workflows/ci.yml/badge.svg)
![Security Audit](https://github.com/Mosas2000/E-Watch/actions/workflows/security-audit.yml/badge.svg)

## 🚀 Live on Mainnet
- **Contract**: `SP31PKQVQZVZCK3FM3NH67CGD6G1FMR17VQVS2W5T.ewatch`
- **Network**: Stacks Mainnet
- **Explorer**: [View Contract](https://explorer.hiro.so/txid/08b7510ae768dc595ce769d628ae44c4da8cfa56f274f5b38028a8ba6238cc78?chain=mainnet)

## Architecture
- Smart contract for event storage and retrieval
- Web interface for event management
- Real-time blockchain monitoring

## Technology Stack
- Clarity smart contracts
- React TypeScript frontend
- Stacks blockchain integration
- Winston structured logging with rotation
- Comprehensive E2E testing with Playwright

## Setup
npm install
npm run test
npm run deploy

## Logging

E-Watch uses structured logging with Winston for backend/scripts and a custom logger for frontend. Logs include:
- Multiple log levels (error, warn, info, debug)
- Automatic log rotation with retention policies
- Sensitive data sanitization
- Request ID tracking for correlation
- JSON format for production monitoring

For complete logging documentation, see [LOGGING.md](LOGGING.md).

### Log Configuration

Set the log level via environment variable:
```bash
export LOG_LEVEL=debug  # Development
export LOG_LEVEL=info   # Production
```

View logs:
```bash
tail -f logs/application-$(date +%Y-%m-%d).log
tail -f logs/error-$(date +%Y-%m-%d).log
```

## Testing

### Unit Tests
Run Vitest unit tests for smart contract logic:
```bash
npm run test
```

### End-to-End Tests
E-Watch includes comprehensive E2E tests using Playwright to verify the entire application flow across multiple browsers.

**Run all E2E tests (headless mode):**
```bash
npm run test:e2e
```

**Run tests with interactive UI:**
```bash
npm run test:e2e:ui
```

**Run tests in headed mode (see browser):**
```bash
npm run test:e2e:headed
```

**Debug tests step-by-step:**
```bash
npm run test:e2e:debug
```

**View test report:**
```bash
npm run test:e2e:report
```

For detailed information about E2E test structure, fixtures, and best practices, see [e2e/README.md](e2e/README.md).

## Features
- Event registration on-chain
- Query events by ID
- Owner-based access control
- Event deactivation capability
