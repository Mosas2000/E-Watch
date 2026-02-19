# Test Suites

Overview of all test suites in the repository and how to run them.

---

## Running Tests

```bash
# Run all tests
npx vitest run

# Run with coverage
npx vitest run --coverage

# Run a specific test file
npx vitest run tests/ewatch.test.ts

# Run tests in watch mode
npx vitest
```

---

## Test Suites

### Contract Tests

| File                        | Scope                                    | Tests |
|-----------------------------|------------------------------------------|-------|
| `tests/ewatch.test.ts`      | v1 contract functions and error codes    | ~20   |
| `tests/ewatch-v2.test.ts`   | v2 admin, pause, migration, error codes  | ~30   |
| `tests/compatibility.test.ts`| v1/v2 behavioral parity                 | ~15   |

### Migration Tests

| File                        | Scope                                    | Tests |
|-----------------------------|------------------------------------------|-------|
| `tests/migration.test.ts`   | Full v1-to-v2 migration lifecycle        | ~20   |
| `tests/rollback.test.ts`    | Recovery scenarios per ROLLBACK.md       | ~12   |

### Integration Tests

| File                        | Scope                                    | Tests |
|-----------------------------|------------------------------------------|-------|
| `tests/integration.test.ts` | Cross-function workflows and access control | ~18 |

### Frontend Tests

| File                              | Scope                              | Tests |
|-----------------------------------|------------------------------------|-------|
| `frontend/tests/contractConfig.test.ts` | Contract config module validation | ~12 |

---

## Test Architecture

All contract tests use **simulated contract state** (TypeScript
Maps and variables) rather than Clarinet simnet. This provides:

- Fast execution (no blockchain simulation startup)
- Deterministic results (no block timing variability)
- Easy parallel execution across test files

The simulations mirror the Clarity contract logic precisely,
including error codes, authorization checks, and state mutations.

---

## Adding New Tests

1. Create a new `.test.ts` file in `tests/` or `frontend/tests/`.
2. Import from `vitest` (`describe`, `it`, `expect`, `beforeEach`).
3. Simulate the relevant contract functions as TypeScript helpers.
4. Run `npx vitest run <your-file>` to verify.
5. The vitest config automatically discovers files matching
   `tests/**/*.test.ts` and `frontend/tests/**/*.test.ts`.
