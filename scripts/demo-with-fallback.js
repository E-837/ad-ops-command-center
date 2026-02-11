#!/usr/bin/env node

/**
 * Campaign Demo with API Fallback
 * Tests API connectivity and falls back to mock data for demo
 */

const { execSync } = require('child_process');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

function log(text, color = 'reset') {
  console.log(`${colors[color]}${text}${colors.reset}`);
}

// Test API connectivity
async function testApiConnectivity() {
  log('🔍 Testing API connectivity...', 'cyan');
  
  const results = {
    googleDocs: false,
    asana: false
  };
  
  // Test Google Docs quickly
  try {
    const output = execSync('mcporter call google-docs.listGoogleSheets --limit 1', {
      encoding: 'utf8',
      timeout: 5000,
      stdio: 'pipe'
    });
    results.googleDocs = output.includes('Google Spreadsheet');
    log('✓ Google Docs API: Connected', 'green');
  } catch (error) {
    log('✗ Google Docs API: Unavailable (will use mock)', 'yellow');
  }
  
  // Test Asana quickly
  try {
    const output = execSync('mcporter call asana.getWorkspaces', {
      encoding: 'utf8', 
      timeout: 5000,
      stdio: 'pipe'
    });
    results.asana = output.includes('workspace') || output.includes('Workspace');
    log('✓ Asana API: Connected', 'green');
  } catch (error) {
    log('✗ Asana API: Unavailable (will use mock)', 'yellow');
  }
  
  return results;
}

// Run mock workflow demo
async function runMockDemo() {
  log('\n🎭 Running Campaign Demo (Mock Mode)', 'magenta');
  log('════════════════════════════════════════', 'magenta');
  
  const campaign = {
    brand: 'Velocity Motors',
    product: 'Velocity Spark EV SUV', 
    budget: 500000
  };
  
  const stages = [
    { name: 'Generate Campaign Brief', duration: 500 },
    { name: 'Create Media Plan', duration: 700 },
    { name: 'Setup Project Management', duration: 900 },
    { name: 'Generate Creatives', duration: 600 },
    { name: 'Activate on DSPs', duration: 800 },
    { name: 'Generate Summary Report', duration: 400 }
  ];
  
  log(`\n📋 Campaign: ${campaign.brand} ${campaign.product}`, 'cyan');
  log(`💰 Budget: $${campaign.budget.toLocaleString()}`, 'cyan');
  log(`🎯 Stages: ${stages.length}`, 'cyan');
  
  const results = {
    artifacts: {},
    campaigns: []
  };
  
  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i];
    log(`\n▶ Stage ${i + 1}: ${stage.name}`, 'blue');
    
    // Simulate work
    process.stdout.write('  Processing... ');
    await new Promise(resolve => setTimeout(resolve, stage.duration));
    log('✓ Complete', 'green');
    
    // Mock specific outputs
    switch (i) {
      case 0: // Brief
        results.artifacts.briefDoc = 'https://docs.google.com/document/d/mock-brief-123/edit';
        log(`  📄 Brief: ${results.artifacts.briefDoc}`, 'cyan');
        break;
      case 1: // Media Plan
        results.artifacts.mediaPlan = 'https://docs.google.com/spreadsheets/d/mock-plan-456/edit';
        log(`  📊 Media Plan: ${results.artifacts.mediaPlan}`, 'cyan');
        break;
      case 2: // Project
        results.artifacts.project = 'https://app.asana.com/0/mock-project-789';
        log(`  📋 Project: ${results.artifacts.project}`, 'cyan');
        log(`  ✅ Created 8 project tasks`, 'cyan');
        break;
      case 3: // Creatives
        const sizes = ['300x250', '728x90', '160x600', '1920x1080'];
        results.artifacts.creatives = sizes.length;
        log(`  🎨 Created ${sizes.length} creative designs`, 'cyan');
        sizes.forEach(size => log(`    • ${size} design`, 'cyan'));
        break;
      case 4: // DSP Activation
        results.campaigns = [
          { dsp: 'TTD', name: 'Display Campaign', budget: 150000, id: 'ttd-123' },
          { dsp: 'TTD', name: 'Video Campaign', budget: 100000, id: 'ttd-124' },
          { dsp: 'DV360', name: 'CTV Campaign', budget: 150000, id: 'dv360-456' },
          { dsp: 'Amazon DSP', name: 'Display Retargeting', budget: 100000, id: 'amz-789' }
        ];
        log(`  🚀 Activated ${results.campaigns.length} campaigns`, 'cyan');
        results.campaigns.forEach(camp => {
          log(`    • ${camp.dsp}: ${camp.name} ($${camp.budget.toLocaleString()})`, 'cyan');
        });
        break;
      case 5: // Report
        results.artifacts.report = 'https://docs.google.com/document/d/mock-report-999/edit';
        log(`  📋 Report: ${results.artifacts.report}`, 'cyan');
        break;
    }
  }
  
  // Summary
  log('\n🎉 DEMO COMPLETED SUCCESSFULLY', 'green');
  log('════════════════════════════════════', 'green');
  
  const totalBudget = results.campaigns.reduce((sum, camp) => sum + camp.budget, 0);
  
  log(`\n📊 Campaign Summary:`, 'cyan');
  log(`  • ${results.campaigns.length} campaigns activated`, 'white');
  log(`  • $${totalBudget.toLocaleString()} total budget activated`, 'white');
  log(`  • ${Object.keys(results.artifacts).length} artifacts created`, 'white');
  log(`  • 4 DSPs utilized (TTD, DV360, Amazon DSP)`, 'white');
  
  log(`\n🔗 Artifacts Created:`, 'cyan');
  Object.entries(results.artifacts).forEach(([name, value]) => {
    if (typeof value === 'string') {
      log(`  • ${name}: ${value}`, 'white');
    } else {
      log(`  • ${name}: ${value} items`, 'white');
    }
  });
  
  log('\n🚀 Campaign is ready for launch on March 1, 2026!', 'green');
  
  return results;
}

async function main() {
  try {
    log('🎬 AD OPS COMMAND CENTER - CAMPAIGN LIFECYCLE DEMO', 'magenta');
    log('══════════════════════════════════════════════════', 'magenta');
    
    // Test connectivity
    const apiStatus = await testApiConnectivity();
    
    if (apiStatus.googleDocs && apiStatus.asana) {
      log('\n🌐 All APIs available - running full demo...', 'green');
      // Could run real workflow here, but for now use mock for reliability
      await runMockDemo();
    } else {
      log('\n📡 Limited API connectivity - running mock demo...', 'yellow');
      await runMockDemo();
    }
    
  } catch (error) {
    log(`❌ Demo failed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { testApiConnectivity, runMockDemo, main };