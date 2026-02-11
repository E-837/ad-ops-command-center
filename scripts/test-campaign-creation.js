#!/usr/bin/env node
/**
 * Test script: Create 1 campaign + 2 ad groups via Google Ads API
 * Codex execution - Feb 10, 2026
 */

const path = require('path');
const connector = require('../connectors/google-ads.js');

async function main() {
  console.log('=== Google Ads Campaign Creation Test ===\n');
  
  // Test connection first
  console.log('Testing Google Ads API connection...');
  const connectionTest = await connector.testConnection();
  console.log('Connection:', connectionTest);
  
  if (!connectionTest.connected) {
    console.error('❌ Connection failed:', connectionTest.error);
    process.exit(1);
  }
  
  console.log('✅ Connected to Google Ads API\n');
  
  // Step 1: Create Campaign
  console.log('Step 1: Creating campaign...');
  const campaignParams = {
    name: `Codex Test Campaign ${Date.now()}`,
    budget_micros: 10000000, // $10/day
    campaign_type: 'SEARCH',
    bidding_strategy: 'MANUAL_CPC',
    start_date: '2026-02-10',
    end_date: '2026-03-10'
  };
  
  console.log('Campaign params:', JSON.stringify(campaignParams, null, 2));
  
  const campaignResult = await connector.createCampaign(campaignParams);
  console.log('✅ Campaign created!');
  console.log('Campaign resource:', campaignResult.campaign.resourceName);
  console.log('Campaign ID:', campaignResult.campaign.resourceName.split('/').pop());
  
  const campaignResourceName = campaignResult.campaign.resourceName;
  
  // Step 2: Create Ad Group 1
  console.log('\nStep 2: Creating ad group 1...');
  const adGroup1Params = {
    campaign_id: campaignResourceName,
    name: 'Test Ad Group 1 - Brand Keywords',
    cpc_bid_micros: 2000000, // $2.00 CPC
    ad_group_type: 'SEARCH_STANDARD'
  };
  
  console.log('Ad Group 1 params:', JSON.stringify(adGroup1Params, null, 2));
  
  const adGroup1Result = await connector.createAdGroup(adGroup1Params);
  console.log('✅ Ad Group 1 created!');
  console.log('Ad Group 1 resource:', adGroup1Result.adGroup.resourceName);
  console.log('Ad Group 1 ID:', adGroup1Result.adGroup.resourceName.split('/').pop());
  
  // Step 3: Create Ad Group 2
  console.log('\nStep 3: Creating ad group 2...');
  const adGroup2Params = {
    campaign_id: campaignResourceName,
    name: 'Test Ad Group 2 - Generic Keywords',
    cpc_bid_micros: 1500000, // $1.50 CPC
    ad_group_type: 'SEARCH_STANDARD'
  };
  
  console.log('Ad Group 2 params:', JSON.stringify(adGroup2Params, null, 2));
  
  const adGroup2Result = await connector.createAdGroup(adGroup2Params);
  console.log('✅ Ad Group 2 created!');
  console.log('Ad Group 2 resource:', adGroup2Result.adGroup.resourceName);
  console.log('Ad Group 2 ID:', adGroup2Result.adGroup.resourceName.split('/').pop());
  
  // Summary
  console.log('\n=== SUMMARY ===');
  console.log('✅ Campaign created:', campaignResourceName);
  console.log('✅ Ad Group 1 created:', adGroup1Result.adGroup.resourceName);
  console.log('✅ Ad Group 2 created:', adGroup2Result.adGroup.resourceName);
  console.log('\nAll entities created successfully in test account 298-013-9280');
  console.log('View in Google Ads UI: https://ads.google.com/');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
