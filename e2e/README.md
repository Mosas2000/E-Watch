# E2E Testing with Playwright

This directory contains end-to-end tests for the E-Watch application using Playwright.

## Setup

Install dependencies:
```bash
npm install
```

Install Playwright browsers:
```bash
npx playwright install
```

## Running Tests

Run all tests:
```bash
npx playwright test
```

Run tests in UI mode:
```bash
npx playwright test --ui
```

Run tests in headed mode:
```bash
npx playwright test --headed
```

Run specific test file:
```bash
npx playwright test e2e/smoke.spec.ts
```

Run tests in specific browser:
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## Test Structure

- **smoke.spec.ts** - Basic smoke tests to verify app loads
- **wallet-connection.spec.ts** - Wallet connection flow tests
- **event-registration.spec.ts** - Event registration form tests
- **event-dashboard.spec.ts** - Dashboard functionality tests
- **error-handling.spec.ts** - Error scenarios and edge cases
- **accessibility.spec.ts** - Accessibility compliance tests
- **fixtures.ts** - Shared test fixtures and helpers

## Test Reports

After running tests, view the HTML report:
```bash
npx playwright show-report
```

## Writing New Tests

1. Create a new `.spec.ts` file in the `e2e` directory
2. Import test and expect from fixtures:
   ```typescript
   import { test, expect } from './fixtures';
   ```
3. Write your test cases following existing patterns
4. Run tests to verify they pass

## Debugging Tests

Debug specific test:
```bash
npx playwright test --debug e2e/your-test.spec.ts
```

Generate code for tests:
```bash
npx playwright codegen http://localhost:5173
```

## CI/CD Integration

Tests are configured to run in CI with:
- 2 retries on failure
- Single worker for stability
- Screenshots on failure
- Videos on failure
- HTML report generation

## Best Practices

1. Use descriptive test names
2. Keep tests independent and isolated
3. Use proper locators (role, text, testid)
4. Add appropriate waits and assertions
5. Mock external dependencies when needed
6. Clean up after tests
7. Use fixtures for common setup
