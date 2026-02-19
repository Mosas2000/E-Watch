# Environment Configuration

E-Watch uses environment variables to manage network targeting,
contract addresses, and API endpoints across development, staging,
and production environments.

## Quick start

1. Copy the example file to create your local config:

```bash
cd frontend
cp .env.example .env.local
```

2. Edit `.env.local` and set values appropriate for your target
   environment.

3. Start the development server:

```bash
npm run dev           # uses .env (or .env.local override)
npm run dev:testnet   # uses .env.development (testnet defaults)
```

## Available variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_NETWORK` | Yes | `mainnet` or `testnet` |
| `VITE_CONTRACT_ADDRESS` | Yes | Deployed contract principal (SP/ST address) |
| `VITE_CONTRACT_NAME` | Yes | Contract name (e.g. `ewatch`) |
| `VITE_API_ENDPOINT` | No | Stacks node API URL (auto-detected from network) |
| `VITE_EXPLORER_URL` | No | Block explorer base URL |
| `VITE_GOVERNANCE_CONTRACT_NAME` | No | Governance contract name |
| `VITE_APP_ENV` | No | `development`, `staging`, or `production` |

## Preset environment files

| File | Purpose |
|------|---------|
| `.env.example` | Template with documentation. Copy to `.env.local`. |
| `.env.development` | Testnet defaults for local dev (`npm run dev:testnet`). |
| `.env.staging` | Testnet config for staging builds. |
| `.env.production` | Mainnet config for production builds. |
| `.env.local` | **Gitignored.** Your personal overrides. |

## Vite mode resolution

Vite loads environment files in this order, with later files
overriding earlier ones:

1. `.env` -- always loaded
2. `.env.local` -- always loaded, gitignored
3. `.env.[mode]` -- loaded for the specified mode
4. `.env.[mode].local` -- loaded for the specified mode, gitignored

The `mode` is set by the `--mode` flag or defaults to `development`
for `vite` and `production` for `vite build`.

## Build commands

```bash
npm run build              # default production build
npm run build:staging      # staging build (testnet)
npm run build:production   # explicit production build (mainnet)
```

## Validation

Environment variables are validated at application startup. In
development mode, warnings are logged to the console if any
required variables are missing or contain invalid values.

The validation checks:
- Network is either `mainnet` or `testnet`
- Contract address matches Stacks address format
- Contract name is present
- API endpoint and explorer URL are valid URLs (if set)
- App environment is a known value (if set)

## Adding new variables

1. Add the variable to `.env.example` with documentation.
2. Add a type entry in `src/types/env.ts` (`ImportMetaEnv` interface).
3. Add the field to `EnvConfig` in `src/types/env.ts`.
4. Read it in `src/config/env.ts` with a sensible default.
5. Add validation in `src/utils/envValidation.ts` if needed.
6. Update this document.
