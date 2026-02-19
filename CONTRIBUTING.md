# Contributing to E-Watch

## Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Code Standards

- Use TypeScript for all frontend code
- Follow Clarity best practices for smart contracts
- Write tests for new features
- Document all public APIs

## Testing

Before submitting:
- Run all tests: npm run test
- Test manually with testnet
- Verify build succeeds

## Dependency Management

- Install project git hooks after cloning: `npm run hooks:install`
- Run `npm run audit:all` before adding new dependencies
- Pin exact versions (enforced by `.npmrc`)
- Check `docs/DEPENDENCY_POLICY.md` for update schedules and severity response times
- Never commit a lock file that introduces high-severity vulnerabilities

## Questions

Open an issue for any questions or concerns.
