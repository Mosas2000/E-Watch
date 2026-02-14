# E-Watch

Blockchain event monitoring system for Stacks network.

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

## Setup
npm install
npm run test
npm run deploy

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
