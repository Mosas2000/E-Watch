#!/usr/bin/env node

/**
 * Quick dependency health check.
 * Prints counts of outdated packages for root and frontend.
 *
 * Usage:
 *   node scripts/check-deps.js
 */

const { execSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FRONTEND = path.join(ROOT, 'frontend');

function countOutdated(dir, label) {
  try {
    const output = execSync('npm outdated --json', {
      cwd: dir,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const data = JSON.parse(output || '{}');
    const count = Object.keys(data).length;
    console.log(`  ${label}: ${count === 0 ? 'all up to date' : count + ' outdated'}`);
    return count;
  } catch (err) {
    // npm outdated exits non-zero when packages are outdated
    if (err.stdout) {
      try {
        const data = JSON.parse(err.stdout);
        const count = Object.keys(data).length;
        console.log(`  ${label}: ${count} outdated`);
        return count;
      } catch {
        // parse failure
      }
    }
    console.log(`  ${label}: unable to determine`);
    return -1;
  }
}

console.log('Dependency Health Check');
console.log('-----------------------');

countOutdated(ROOT, 'Root');
countOutdated(FRONTEND, 'Frontend');
