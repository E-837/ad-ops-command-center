/**
 * Real-time Demo Script
 * Demonstrates SSE + Chart.js integration
 */

const eventBus = require('./events/bus');
const eventTypes = require('./events/types');
const workflows = require('./workflows');
const executor = require('./executor');

console.log('\n🎬 Real-time SSE + Chart.js Demo\n');
console.log('═'.repeat(60));
console.log('\nThis demo will:');
console.log('  1. Start the server (if not running)');
console.log('  2. Establish SSE connection');
console.log('  3. Execute a workflow');
console.log('  4. Show real-time events streaming');
console.log('  5. Display chart updates\n');
console.log('Open http://localhost:3002/dashboard in your browser');
console.log('to see the charts update in real-time!\n');
console.log('═'.repeat(60));

/**
 * Simulate a multi-stage workflow execution
 */
async function simulateWorkflowExecution() {
  console.log('\n📋 Simulating workflow execution...\n');
  
  const executionId = `demo-exec-${Date.now()}`;
  const stages = [
    { id: 'stage-1', name: 'Planning', duration: 2000 },
    { id: 'stage-2', name: 'Data Collection', duration: 3000 },
    { id: 'stage-3', name: 'Analysis', duration: 4000 },
    { id: 'stage-4', name: 'Optimization', duration: 2500 },
    { id: 'stage-5', name: 'Reporting', duration: 1500 }
  ];
  
  // Emit workflow started
  console.log('🚀 Workflow started');
  eventBus.emit(eventTypes.WORKFLOW_STARTED, {
    executionId,
    workflowId: 'demo-campaign-optimization',
    workflowName: 'Campaign Optimization',
    startedAt: new Date().toISOString()
  });
  
  // Execute each stage
  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i];
    
    // Stage started
    console.log(`   ▶️  Stage ${i + 1}/${stages.length}: ${stage.name}`);
    eventBus.emit(eventTypes.WORKFLOW_STAGE_STARTED, {
      executionId,
      workflowId: 'demo-campaign-optimization',
      stageId: stage.id,
      stageName: stage.name,
      stageIndex: i,
      totalStages: stages.length,
      startedAt: new Date().toISOString()
    });
    
    // Simulate stage progress
    const progressSteps = 5;
    const progressInterval = stage.duration / progressSteps;
    
    for (let p = 1; p <= progressSteps; p++) {
      await new Promise(resolve => setTimeout(resolve, progressInterval));
      
      const progress = Math.round((p / progressSteps) * 100);
      eventBus.emit(eventTypes.WORKFLOW_STAGE_PROGRESS, {
        executionId,
        workflowId: 'demo-campaign-optimization',
        stageId: stage.id,
        stageName: stage.name,
        progress,
        stageIndex: i,
        totalStages: stages.length
      });
      
      // Show progress bar
      const bar = '█'.repeat(Math.floor(progress / 10)) + '░'.repeat(10 - Math.floor(progress / 10));
      process.stdout.write(`\r      Progress: [${bar}] ${progress}%`);
    }
    
    console.log(''); // New line after progress
    
    // Stage completed
    eventBus.emit(eventTypes.WORKFLOW_STAGE_COMPLETED, {
      executionId,
      workflowId: 'demo-campaign-optimization',
      stageId: stage.id,
      stageName: stage.name,
      stageIndex: i,
      totalStages: stages.length,
      duration: stage.duration,
      completedAt: new Date().toISOString()
    });
    
    console.log(`   ✅ Stage completed (${stage.duration}ms)\n`);
  }
  
  // Workflow completed
  const totalDuration = stages.reduce((sum, s) => sum + s.duration, 0);
  console.log('✨ Workflow completed successfully!');
  console.log(`   Total duration: ${totalDuration}ms`);
  
  eventBus.emit(eventTypes.WORKFLOW_COMPLETED, {
    executionId,
    workflowId: 'demo-campaign-optimization',
    workflowName: 'Campaign Optimization',
    duration: totalDuration,
    result: {
      optimizationsApplied: 12,
      budgetAdjusted: true,
      bidsUpdated: 45,
      performanceImprovement: '+15%'
    },
    completedAt: new Date().toISOString()
  });
}

/**
 * Simulate multiple workflow executions
 */
async function simulateMultipleWorkflows() {
  console.log('\n📊 Simulating multiple workflows for chart data...\n');
  
  const workflowTypes = [
    { id: 'pacing-check', name: 'Pacing Check', avgDuration: 3000 },
    { id: 'wow-report', name: 'WoW Report', avgDuration: 5000 },
    { id: 'optimization', name: 'Campaign Optimization', avgDuration: 8000 },
    { id: 'sync', name: 'Data Sync', avgDuration: 2000 }
  ];
  
  for (let i = 0; i < 5; i++) {
    const workflow = workflowTypes[Math.floor(Math.random() * workflowTypes.length)];
    const executionId = `batch-exec-${i}-${Date.now()}`;
    const duration = workflow.avgDuration + Math.random() * 2000 - 1000;
    const success = Math.random() > 0.15; // 85% success rate
    
    console.log(`   ${i + 1}/5: ${workflow.name} ${success ? '✅' : '❌'}`);
    
    // Started
    eventBus.emit(eventTypes.WORKFLOW_STARTED, {
      executionId,
      workflowId: workflow.id,
      workflowName: workflow.name,
      startedAt: new Date().toISOString()
    });
    
    await new Promise(resolve => setTimeout(resolve, duration));
    
    // Completed or failed
    if (success) {
      eventBus.emit(eventTypes.WORKFLOW_COMPLETED, {
        executionId,
        workflowId: workflow.id,
        workflowName: workflow.name,
        duration: Math.round(duration),
        result: { status: 'success' },
        completedAt: new Date().toISOString()
      });
    } else {
      eventBus.emit(eventTypes.WORKFLOW_FAILED, {
        executionId,
        workflowId: workflow.id,
        workflowName: workflow.name,
        error: 'Simulated failure for demo',
        duration: Math.round(duration),
        failedAt: new Date().toISOString()
      });
    }
  }
  
  console.log('\n✨ Batch workflows completed!\n');
}

/**
 * Simulate campaign events
 */
async function simulateCampaignEvents() {
  console.log('\n📈 Simulating campaign events...\n');
  
  const platforms = ['ttd', 'dv360', 'meta', 'pinterest'];
  
  for (let i = 0; i < 3; i++) {
    const platform = platforms[i % platforms.length];
    const campaignId = `demo-campaign-${platform}-${i}`;
    
    console.log(`   Creating campaign on ${platform.toUpperCase()}`);
    
    eventBus.emit(eventTypes.CAMPAIGN_CREATED, {
      campaignId,
      platform,
      name: `Demo Campaign ${i + 1}`,
      budget: Math.round(Math.random() * 50000 + 10000),
      status: 'active',
      createdAt: new Date().toISOString()
    });
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n✨ Campaign events completed!\n');
}

/**
 * Show event statistics
 */
function showEventStats() {
  console.log('\n📊 Event Statistics:\n');
  
  const stats = eventBus.getStats();
  
  console.log(`   Total events emitted: ${stats.total}`);
  console.log(`   Event types:`);
  
  Object.entries(stats.types || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([type, count]) => {
      console.log(`      ${type.padEnd(35)} ${count}`);
    });
  
  console.log('');
}

/**
 * Interactive demo menu
 */
function showMenu() {
  console.log('\n' + '═'.repeat(60));
  console.log('\n🎯 Demo Menu:\n');
  console.log('  1. Execute single workflow with real-time updates');
  console.log('  2. Execute batch of workflows (chart data)');
  console.log('  3. Simulate campaign events');
  console.log('  4. Show event statistics');
  console.log('  5. Run all demos');
  console.log('  6. Exit\n');
  console.log('Open http://localhost:3002/dashboard to see live updates!');
  console.log('');
}

/**
 * Run demo based on choice
 */
async function runDemo(choice) {
  switch(choice) {
    case '1':
      await simulateWorkflowExecution();
      break;
    case '2':
      await simulateMultipleWorkflows();
      break;
    case '3':
      await simulateCampaignEvents();
      break;
    case '4':
      showEventStats();
      break;
    case '5':
      await simulateWorkflowExecution();
      await new Promise(resolve => setTimeout(resolve, 1000));
      await simulateMultipleWorkflows();
      await new Promise(resolve => setTimeout(resolve, 1000));
      await simulateCampaignEvents();
      await new Promise(resolve => setTimeout(resolve, 1000));
      showEventStats();
      break;
    case '6':
      console.log('\n👋 Demo ended. Keep the server running to test SSE!\n');
      return false;
    default:
      console.log('\n⚠️  Invalid choice\n');
  }
  
  return true;
}

/**
 * Main interactive loop
 */
async function main() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const question = (prompt) => new Promise(resolve => rl.question(prompt, resolve));
  
  showMenu();
  
  let running = true;
  while (running) {
    const choice = await question('Select option (1-6): ');
    running = await runDemo(choice.trim());
    
    if (running) {
      await question('\nPress Enter to continue...');
      showMenu();
    }
  }
  
  rl.close();
}

// Run if main module
if (require.main === module) {
  main().catch(error => {
    console.error('\n❌ Demo error:', error);
    process.exit(1);
  });
}

module.exports = {
  simulateWorkflowExecution,
  simulateMultipleWorkflows,
  simulateCampaignEvents,
  showEventStats
};
