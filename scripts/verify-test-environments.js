#!/usr/bin/env node
/**
 * Test Environment Verification Script
 * Checks which ad platforms are configured for test/sandbox mode
 */

const fs = require('fs');
const path = require('path');

console.log('\n🧪 Ad Platform Test Environment Status\n');
console.log('='.repeat(70));

// Load environment variables
function loadEnv(envFile = '.env') {
  const envPath = path.join(__dirname, '..', 'config', envFile);
  const env = {};
  
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        env[trimmed.substring(0, eqIdx).trim()] = trimmed.substring(eqIdx + 1).trim();
      }
    });
  }
  
  return env;
}

// Try loading test environment first, fall back to regular .env
let env = loadEnv('.env.test');
const usingTestEnv = Object.keys(env).length > 0;

if (!usingTestEnv) {
  env = loadEnv('.env');
}

console.log(`\n📋 Configuration Source: ${usingTestEnv ? 'config/.env.test' : 'config/.env'}\n`);

const results = [];

// Check Google Ads
const googleAds = {
  name: 'Google Ads',
  configured: !!(
    env.GOOGLE_ADS_DEVELOPER_TOKEN &&
    env.GOOGLE_ADS_CLIENT_ID &&
    env.GOOGLE_ADS_CLIENT_SECRET &&
    env.GOOGLE_ADS_REFRESH_TOKEN &&
    env.GOOGLE_ADS_CUSTOMER_ID
  ),
  testMode: false,
  details: []
};

if (googleAds.configured) {
  googleAds.details.push(`Customer ID: ${env.GOOGLE_ADS_CUSTOMER_ID}`);
  if (env.GOOGLE_ADS_LOGIN_CUSTOMER_ID) {
    googleAds.details.push(`MCC ID: ${env.GOOGLE_ADS_LOGIN_CUSTOMER_ID}`);
    // Test MCCs typically start with 423 or similar test ranges
    googleAds.testMode = env.GOOGLE_ADS_LOGIN_CUSTOMER_ID.startsWith('423');
  }
  googleAds.details.push(`Mode: ${googleAds.testMode ? 'TEST ACCOUNT' : 'PRODUCTION'}`);
}

results.push(googleAds);

// Check Meta Ads
const metaAds = {
  name: 'Meta Ads',
  configured: !!(
    env.META_APP_ID &&
    env.META_APP_SECRET &&
    env.META_ACCESS_TOKEN &&
    env.META_AD_ACCOUNT_ID
  ),
  testMode: false,
  details: []
};

if (metaAds.configured) {
  metaAds.details.push(`Ad Account: ${env.META_AD_ACCOUNT_ID}`);
  // Test accounts typically have specific naming or can be verified via API
  metaAds.testMode = env.META_TEST_MODE === 'true' || env.META_AD_ACCOUNT_ID.includes('test');
  metaAds.details.push(`Mode: ${metaAds.testMode ? 'TEST ACCOUNT' : 'PRODUCTION'}`);
}

results.push(metaAds);

// Check Pinterest
const pinterest = {
  name: 'Pinterest Ads',
  configured: !!(
    env.PINTEREST_APP_ID &&
    env.PINTEREST_APP_SECRET &&
    env.PINTEREST_ACCESS_TOKEN &&
    env.PINTEREST_AD_ACCOUNT_ID
  ),
  testMode: env.PINTEREST_SANDBOX_MODE === 'true',
  details: []
};

if (pinterest.configured) {
  pinterest.details.push(`Ad Account: ${env.PINTEREST_AD_ACCOUNT_ID}`);
  pinterest.details.push(`Sandbox: ${pinterest.testMode ? 'ENABLED' : 'DISABLED'}`);
}

results.push(pinterest);

// Check Microsoft Ads
const microsoftAds = {
  name: 'Microsoft Ads',
  configured: !!(
    env.MICROSOFT_ADS_CLIENT_ID &&
    env.MICROSOFT_ADS_CLIENT_SECRET &&
    env.MICROSOFT_ADS_REFRESH_TOKEN &&
    env.MICROSOFT_ADS_DEVELOPER_TOKEN &&
    env.MICROSOFT_ADS_ACCOUNT_ID
  ),
  testMode: env.MICROSOFT_ADS_SANDBOX_MODE === 'true',
  details: []
};

if (microsoftAds.configured) {
  microsoftAds.details.push(`Account ID: ${env.MICROSOFT_ADS_ACCOUNT_ID}`);
  microsoftAds.details.push(`Environment: ${microsoftAds.testMode ? 'SANDBOX' : 'PRODUCTION'}`);
}

results.push(microsoftAds);

// Check LinkedIn Ads
const linkedinAds = {
  name: 'LinkedIn Ads',
  configured: !!(
    env.LINKEDIN_CLIENT_ID &&
    env.LINKEDIN_CLIENT_SECRET &&
    env.LINKEDIN_ACCESS_TOKEN &&
    env.LINKEDIN_AD_ACCOUNT_ID
  ),
  testMode: env.LINKEDIN_DEV_MODE === 'true',
  details: []
};

if (linkedinAds.configured) {
  linkedinAds.details.push(`Ad Account: ${env.LINKEDIN_AD_ACCOUNT_ID}`);
  linkedinAds.details.push(`Mode: ${linkedinAds.testMode ? 'DEVELOPMENT' : 'PRODUCTION'}`);
}

results.push(linkedinAds);

// Check TikTok Ads
const tiktokAds = {
  name: 'TikTok Ads',
  configured: !!(
    env.TIKTOK_ACCESS_TOKEN &&
    env.TIKTOK_ADVERTISER_ID
  ),
  testMode: env.TIKTOK_SANDBOX_MODE === 'true',
  details: []
};

if (tiktokAds.configured) {
  tiktokAds.details.push(`Advertiser: ${env.TIKTOK_ADVERTISER_ID}`);
  tiktokAds.details.push(`Sandbox: ${tiktokAds.testMode ? 'ENABLED' : 'DISABLED'}`);
}

results.push(tiktokAds);

// Amazon DSP (always in mock mode by design)
const amazonDsp = {
  name: 'Amazon DSP',
  configured: true,  // Always "configured" via mock data
  testMode: true,
  details: ['Mock mode (built-in test data)']
};

results.push(amazonDsp);

// Print results
console.log('Platform Status:\n');

results.forEach(platform => {
  let icon = '✅';
  let status = 'Configured';
  
  if (!platform.configured) {
    icon = '⚪';
    status = 'Not configured (using mock data)';
  } else if (platform.testMode) {
    icon = '✅';
    status = 'Test/Sandbox mode';
  } else if (platform.configured && !platform.testMode) {
    icon = '⚠️';
    status = 'PRODUCTION MODE';
  }
  
  console.log(`  ${icon} ${platform.name.padEnd(20)} ${status}`);
  
  if (platform.details.length > 0 && platform.configured) {
    platform.details.forEach(detail => {
      console.log(`     ${detail}`);
    });
  }
  
  console.log();
});

console.log('='.repeat(70));

// Summary
const configuredCount = results.filter(p => p.configured).length;
const testModeCount = results.filter(p => p.configured && p.testMode).length;
const productionCount = results.filter(p => p.configured && !p.testMode).length;

console.log('\n📊 Summary:\n');
console.log(`  Total Platforms: ${results.length}`);
console.log(`  Configured: ${configuredCount}`);
console.log(`  Test/Sandbox Mode: ${testModeCount}`);
console.log(`  Production Mode: ${productionCount}`);
console.log(`  Using Mock Data: ${results.length - configuredCount}`);

// Warnings
if (productionCount > 0) {
  console.log('\n⚠️  WARNING: Some platforms are in PRODUCTION mode!');
  console.log('   These will make real API calls and may incur costs.');
  console.log('   Consider using test/sandbox credentials instead.\n');
}

if (configuredCount === 0) {
  console.log('\n💡 TIP: No platforms configured yet.');
  console.log('   All connectors will use mock data (perfect for UI testing!).');
  console.log('   See TEST-ENVIRONMENTS-GUIDE.md to set up test APIs.\n');
}

// Next steps
console.log('\n📖 Next Steps:\n');

if (!usingTestEnv && configuredCount > 0) {
  console.log('  1. Create config/.env.test for test credentials');
  console.log('  2. Copy test account credentials to .env.test');
  console.log('  3. Run this script again to verify');
}

if (configuredCount < results.length - 1) {  // -1 for Amazon DSP which is always configured
  console.log('  • See TEST-ENVIRONMENTS-GUIDE.md for setup instructions');
  console.log('  • Run specific connector tests: npm run test:google-ads');
}

console.log('  • Test all connectors: npm run test:connectors');
console.log('  • Start UI: npm start\n');
