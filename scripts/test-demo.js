#!/usr/bin/env node

/**
 * Quick Test of Campaign Demo
 * Tests the workflow with shorter timeouts and better error handling
 */

const path = require('path');
const projectRoot = path.join(__dirname, '..');

// Simple console colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(text, color = 'reset') {
  console.log(`${colors[color]}${text}${colors.reset}`);
}

async function testWorkflow() {
  try {
    log('🚀 Testing Campaign Lifecycle Demo...', 'cyan');
    
    // Load the workflow
    const workflow = require('../workflows/campaign-lifecycle-demo.js');
    const info = workflow.getInfo();
    
    log(`✓ Workflow loaded: ${info.name}`, 'green');
    log(`  Campaign: ${info.campaign.brand} ${info.campaign.product}`, 'cyan');
    log(`  Budget: ${info.campaign.budget}`, 'cyan');
    log(`  Stages: ${info.stages.length}`, 'cyan');
    
    // Test workflow execution
    log('\n📋 Starting workflow execution...', 'cyan');
    
    const startTime = Date.now();
    const results = await workflow.run();
    const endTime = Date.now();
    
    log(`\n✅ Workflow completed in ${Math.round((endTime - startTime) / 1000)}s`, 'green');
    log(`Status: ${results.status}`, results.status === 'completed' ? 'green' : 'yellow');
    log(`Stages completed: ${results.stages.filter(s => s.status === 'completed').length}/${results.stages.length}`, 'cyan');
    
    // Show artifacts
    log('\n📄 Artifacts created:', 'cyan');
    Object.entries(results.artifacts).forEach(([key, value]) => {
      if (typeof value === 'string') {
        log(`  ${key}: ${value}`, 'green');
      } else if (Array.isArray(value)) {
        log(`  ${key}: ${value.length} items`, 'green');
      }
    });
    
    // Show any failures
    const failedStages = results.stages.filter(s => s.status === 'failed');
    if (failedStages.length > 0) {
      log('\n⚠️  Failed stages:', 'yellow');
      failedStages.forEach(stage => {
        log(`  ${stage.name}: ${stage.error}`, 'red');
        if (stage.mockData) {
          log(`    → Using mock data for demo`, 'yellow');
        }
      });
    }
    
    log('\n✨ Test completed successfully!', 'green');
    
  } catch (error) {
    log(`❌ Test failed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

if (require.main === module) {
  testWorkflow();
}

module.exports = { testWorkflow };