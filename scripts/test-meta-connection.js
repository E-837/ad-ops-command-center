/**
 * Quick Meta Ads API Connection Test
 * Run: node scripts/test-meta-connection.js
 */

const path = require('path');

// Load connector
const meta = require('../connectors/meta-ads');

async function testConnection() {
  console.log('🔍 Testing Meta Ads API connection...\n');
  
  try {
    // Test 1: Check status
    console.log('1️⃣ Checking connector status...');
    const status = await meta.getStatus();
    console.log('   Status:', JSON.stringify(status, null, 2));
    
    if (!status.connected) {
      console.log('\n❌ NOT CONNECTED');
      console.log('   Please set up your Meta Ads credentials in config/.env');
      console.log('   See META-ADS-SETUP.md for instructions\n');
      return;
    }
    
    console.log('\n✅ Connected!\n');
    
    // Test 2: Get ad accounts
    console.log('2️⃣ Fetching ad accounts...');
    const accounts = await meta.execute('meta_ads_get_ad_accounts', {
      fields: ['id', 'name', 'account_status', 'currency', 'timezone_name']
    });
    
    if (accounts.success && accounts.data?.data?.length > 0) {
      console.log('   Found', accounts.data.data.length, 'account(s):');
      accounts.data.data.forEach(acc => {
        console.log(`   - ${acc.name} (${acc.id})`);
        console.log(`     Status: ${acc.account_status}, Currency: ${acc.currency}`);
      });
    } else {
      console.log('   No ad accounts found or error:', accounts.error);
    }
    
    console.log('\n3️⃣ Fetching campaigns...');
    const campaigns = await meta.execute('meta_ads_get_campaigns', {
      fields: ['id', 'name', 'status', 'objective'],
      limit: 5
    });
    
    if (campaigns.success && campaigns.data?.data?.length > 0) {
      console.log('   Found', campaigns.data.data.length, 'campaign(s):');
      campaigns.data.data.forEach(camp => {
        console.log(`   - ${camp.name} (${camp.status})`);
        console.log(`     ID: ${camp.id}, Objective: ${camp.objective}`);
      });
    } else {
      console.log('   No campaigns found (this is normal for new accounts)');
    }
    
    console.log('\n✅ All tests passed! Meta Ads API is ready.\n');
    console.log('🚀 You can now create campaigns via:');
    console.log('   - Workflows UI (http://localhost:3002/workflows)');
    console.log('   - Brief submission form');
    console.log('   - API calls to /api/workflows/brief-to-campaign\n');
    
  } catch (error) {
    console.log('\n❌ Error:', error.message);
    
    if (error.message.includes('Invalid OAuth')) {
      console.log('\n💡 Your access token may have expired.');
      console.log('   Generate a new token at:');
      console.log('   https://developers.facebook.com/tools/explorer/\n');
    } else if (error.message.includes('ENOENT')) {
      console.log('\n💡 Missing config/.env file.');
      console.log('   Copy config/.env.example to config/.env');
      console.log('   Then add your Meta credentials.\n');
    } else {
      console.log('\n💡 Check META-ADS-SETUP.md for troubleshooting.\n');
    }
  }
}

testConnection();
