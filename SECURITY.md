# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 1.x     | Yes       |

## Reporting a Vulnerability

If you find a security issue in E-Watch, please report it responsibly:

1. **Do not** open a public issue for security vulnerabilities.
2. Email details to the repository owner or use GitHub's private vulnerability reporting feature.
3. Include steps to reproduce, affected version, and potential impact.
4. We aim to acknowledge reports within 48 hours and provide a fix within 7 days for critical issues.

## Dependency Security

- Dependabot scans run weekly and open PRs for known vulnerabilities.
- CI blocks merges when `npm audit` finds high-severity issues.
- Pre-commit hooks audit lock file changes before they reach the remote.
- See `docs/DEPENDENCY_POLICY.md` for the full dependency management process.

## Disclosure Timeline

| Step                        | Target     |
| --------------------------- | ---------- |
| Acknowledge report          | 48 hours   |
| Confirm vulnerability       | 72 hours   |
| Release patch (critical)    | 7 days     |
| Release patch (high)        | 14 days    |
| Public disclosure            | 30 days    |
