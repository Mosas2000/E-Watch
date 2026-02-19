#!/usr/bin/env node

/**
 * Local dependency audit script.
 *
 * Runs npm audit on root and frontend projects, aggregates the
 * results, and prints a summary with actionable next steps.
 *
 * Usage:
 *   node scripts/audit-deps.js
 *   node scripts/audit-deps.js --fix
 */

const { execSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FRONTEND = path.join(ROOT, 'frontend');
const FIX_MODE = process.argv.includes('--fix');

function runAudit(dir, label) {
  const cmd = FIX_MODE ? 'npm audit fix --audit-level=moderate' : 'npm audit --json';

  console.log(`\n--- ${label} ---`);

  try {
    const output = execSync(cmd, {
      cwd: dir,
      encoding: 'utf-8',
      stdio: FIX_MODE ? 'inherit' : 'pipe',
    });

    if (!FIX_MODE) {
      const report = JSON.parse(output);
      const meta = report.metadata?.vulnerabilities || {};
      const total =
        (meta.low || 0) +
        (meta.moderate || 0) +
        (meta.high || 0) +
        (meta.critical || 0);

      if (total === 0) {
        console.log('  No vulnerabilities found.');
      } else {
        console.log(`  Vulnerabilities: ${total}`);
        console.log(`    Critical: ${meta.critical || 0}`);
        console.log(`    High:     ${meta.high || 0}`);
        console.log(`    Moderate: ${meta.moderate || 0}`);
        console.log(`    Low:      ${meta.low || 0}`);
      }
      return total;
    }
    return 0;
  } catch (err) {
    if (!FIX_MODE && err.stdout) {
      try {
        const report = JSON.parse(err.stdout);
        const meta = report.metadata?.vulnerabilities || {};
        const total =
          (meta.low || 0) +
          (meta.moderate || 0) +
          (meta.high || 0) +
          (meta.critical || 0);

        console.log(`  Vulnerabilities: ${total}`);
        console.log(`    Critical: ${meta.critical || 0}`);
        console.log(`    High:     ${meta.high || 0}`);
        console.log(`    Moderate: ${meta.moderate || 0}`);
        console.log(`    Low:      ${meta.low || 0}`);
        return total;
      } catch {
        // Could not parse JSON output
      }
    }
    console.log('  Audit completed with warnings (see output above).');
    return -1;
  }
}

console.log('E-Watch Dependency Audit');
console.log('========================');
if (FIX_MODE) {
  console.log('Mode: auto-fix');
}

const rootCount = runAudit(ROOT, 'Root Project');
const frontendCount = runAudit(FRONTEND, 'Frontend');

if (!FIX_MODE) {
  console.log('\n========================');
  const totalIssues = Math.max(rootCount, 0) + Math.max(frontendCount, 0);
  if (totalIssues === 0) {
    console.log('All clear. No vulnerabilities detected.');
  } else {
    console.log(`Total issues: ${totalIssues}`);
    console.log('Run with --fix to attempt automatic resolution.');
  }
}
