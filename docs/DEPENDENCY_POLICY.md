# Dependency Management Policy

This document describes how dependencies are managed, updated, and audited in the E-Watch project.

## Automated Scanning

### Dependabot

GitHub Dependabot is configured to scan both the root and frontend packages weekly on Mondays at 09:00 UTC. It opens pull requests for:

- Security advisories (immediate)
- Minor and patch version bumps (grouped by category)

Configuration lives in `.github/dependabot.yml`.

### CI Security Audit

The `security-audit.yml` GitHub Actions workflow runs on every push to main, every pull request targeting main, and on a weekly cron schedule. It:

1. Runs `npm audit --audit-level=high` for root and frontend
2. Lists outdated packages for visibility
3. Checks license compliance, blocking GPL-3.0 and AGPL-3.0 in production dependencies

### Pre-Commit Hook

A pre-commit hook in `.hooks/pre-commit` audits any staged `package-lock.json` changes before they are committed. Install hooks by running:

```
npm run hooks:install
```

## Update Process

### Routine Updates (Weekly)

1. Review Dependabot PRs on Monday or Tuesday.
2. Merge grouped PRs (dev dependencies, patch updates) after CI passes.
3. For major version bumps, test locally before merging.

### Security Patches (Immediate)

1. Dependabot will open a PR as soon as a security advisory is published.
2. Review the advisory severity and affected code paths.
3. For high or critical severity, merge the same day.
4. For moderate severity, merge within the week.
5. For low severity, batch with the next weekly update.

### Manual Audit

Run a full audit at any time:

```
npm run audit:all
```

To auto-fix what can be resolved without breaking changes:

```
npm run audit:fix
```

To check for outdated packages:

```
npm run deps:check
```

## Severity Response Times

| Severity | Response Target     |
| -------- | ------------------- |
| Critical | Same day            |
| High     | Within 24 hours     |
| Moderate | Within one week     |
| Low      | Next scheduled scan |

## License Compliance

Production dependencies must use permissive licenses (MIT, Apache-2.0, BSD, ISC). The CI workflow flags GPL-3.0 and AGPL-3.0 dependencies automatically.

Development dependencies are not restricted but should be reviewed if they introduce unusual license terms.

## Responsibilities

- **Dependabot** handles automated version bumps and security advisories.
- **CI** blocks merges when high-severity vulnerabilities exist.
- **Pre-commit hook** catches issues before code reaches the remote.
- **Maintainers** review and merge dependency PRs, especially major bumps.
