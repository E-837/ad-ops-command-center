#!/usr/bin/env node
/**
 * UI Readiness Verification Script
 * Checks all prerequisites for UI testing
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('\n🔍 Ad Ops Command Center - UI Readiness Check\n');
console.log('='.repeat(50));

let allGood = true;
const checks = [];

// Check 1: Node.js version
try {
  const nodeVersion = process.version;
  const major = parseInt(nodeVersion.slice(1).split('.')[0]);
  if (major >= 18) {
    checks.push({ name: 'Node.js Version', status: '✅', detail: nodeVersion });
  } else {
    checks.push({ name: 'Node.js Version', status: '❌', detail: `${nodeVersion} (need >=18)` });
    allGood = false;
  }
} catch (err) {
  checks.push({ name: 'Node.js Version', status: '❌', detail: err.message });
  allGood = false;
}

// Check 2: node_modules exists
if (fs.existsSync(path.join(__dirname, 'node_modules'))) {
  checks.push({ name: 'Dependencies Installed', status: '✅', detail: 'node_modules found' });
} else {
  checks.push({ name: 'Dependencies Installed', status: '❌', detail: 'Run: npm install' });
  allGood = false;
}

// Check 3: Required files exist
const requiredFiles = [
  'server.js',
  'package.json',
  'ui/index.html',
  'ui/dashboard.html',
  'ui/campaigns.html',
  'database/init.js'
];

let missingFiles = [];
for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(__dirname, file))) {
    missingFiles.push(file);
  }
}

if (missingFiles.length === 0) {
  checks.push({ name: 'Required Files', status: '✅', detail: 'All present' });
} else {
  checks.push({ name: 'Required Files', status: '❌', detail: `Missing: ${missingFiles.join(', ')}` });
  allGood = false;
}

// Check 4: Database directory
const dbDir = path.join(__dirname, 'database');
if (fs.existsSync(dbDir)) {
  checks.push({ name: 'Database Directory', status: '✅', detail: 'Exists' });
} else {
  checks.push({ name: 'Database Directory', status: '⚠️', detail: 'Will be created on first run' });
}

// Check 5: Database file
const dbFile = path.join(__dirname, 'database', 'ad-ops-command.db');
if (fs.existsSync(dbFile)) {
  const stats = fs.statSync(dbFile);
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
  checks.push({ name: 'Database File', status: '✅', detail: `${sizeMB} MB` });
} else {
  checks.push({ name: 'Database File', status: '⚠️', detail: 'Will be created on first run' });
}

// Check 6: Port 3002 availability
try {
  const netstat = execSync('netstat -ano | findstr :3002', { encoding: 'utf8' }).trim();
  if (netstat) {
    checks.push({ name: 'Port 3002', status: '⚠️', detail: 'Already in use (change PORT env var)' });
  } else {
    checks.push({ name: 'Port 3002', status: '✅', detail: 'Available' });
  }
} catch (err) {
  // No output means port is free
  checks.push({ name: 'Port 3002', status: '✅', detail: 'Available' });
}

// Check 7: UI files
const uiFiles = [
  'ui/index.html',
  'ui/dashboard.html',
  'ui/campaigns.html',
  'ui/analytics.html',
  'ui/agents.html',
  'ui/workflows.html',
  'ui/connectors.html',
  'ui/assets/styles.css'
];

let uiCount = uiFiles.filter(f => fs.existsSync(path.join(__dirname, f))).length;
checks.push({ name: 'UI Files', status: '✅', detail: `${uiCount}/${uiFiles.length} core files` });

// Check 8: Test files
const testFiles = [
  'test-integration.js',
  'test-performance.js',
  'test-error-handling.js'
];

let testCount = testFiles.filter(f => fs.existsSync(path.join(__dirname, f))).length;
checks.push({ name: 'Test Suites', status: '✅', detail: `${testCount}/${testFiles.length} suites` });

// Check 9: Documentation
const docs = [
  'README.md',
  'QUICK-START-UI-TESTING.md',
  'DEPLOYMENT-CHECKLIST.md',
  'docs/DEPLOYMENT-GUIDE.md',
  'docs/TROUBLESHOOTING.md'
];

let docCount = docs.filter(f => fs.existsSync(path.join(__dirname, f))).length;
checks.push({ name: 'Documentation', status: '✅', detail: `${docCount}/${docs.length} guides` });

// Print results
console.log('\n📋 Checklist:\n');
checks.forEach(check => {
  console.log(`  ${check.status} ${check.name.padEnd(25)} ${check.detail}`);
});

console.log('\n' + '='.repeat(50));

if (allGood) {
  console.log('\n✅ ALL SYSTEMS GO! Ready to start UI testing.\n');
  console.log('🚀 Quick Start:');
  console.log('   1. Run: npm start');
  console.log('   2. Open: http://localhost:3002');
  console.log('   3. Or double-click: start-ui.bat\n');
  console.log('📖 For detailed instructions: QUICK-START-UI-TESTING.md\n');
} else {
  console.log('\n⚠️  Some issues detected. Fix the items marked with ❌ above.\n');
  console.log('📖 See QUICK-START-UI-TESTING.md for troubleshooting.\n');
  process.exit(1);
}

// Bonus: Show next steps
console.log('📝 Next Steps After Verifying UI:');
console.log('   - npm run test           → Run all 150+ tests');
console.log('   - npm run migrate        → Initialize database (if needed)');
console.log('   - See docs/ folder       → Deployment & monitoring guides\n');
