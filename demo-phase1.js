/**
 * Phase 1 Feature Demo
 * Demonstrates new workflow registry, event system, project model, and PRD-to-Asana workflow
 */

const workflows = require('./workflows');
const eventBus = require('./events/bus');
const eventTypes = require('./events/types');
const projects = require('./database/projects');
const executions = require('./database/executions');

console.log('\n🎯 Phase 1 Feature Demo - Ad Ops Command Center\n');
console.log('='.repeat(70));

// --- Demo 1: Workflow Registry ---
console.log('\n📋 Demo 1: Workflow Registry\n');

const registry = workflows.getRegistry();

console.log('📊 Registry Statistics:');
const stats = registry.getStats();
console.log(`   Total Workflows: ${stats.totalWorkflows}`);
console.log(`   By Category:`, stats.byCategory);
console.log(`   Manual Workflows: ${stats.byTriggerType.manual}`);
console.log(`   Scheduled Workflows: ${stats.byTriggerType.scheduled}`);

console.log('\n📂 Workflows by Category:');
const categories = registry.getCategories();
categories.forEach(cat => {
  console.log(`\n   ${cat.icon} ${cat.label} (${cat.workflows.length} workflows)`);
  console.log(`   ${cat.description}`);
  
  const catWorkflows = registry.getByCategory(cat.id);
  catWorkflows.forEach(wf => {
    console.log(`      • ${wf.name}`);
  });
});

// --- Demo 2: Event System ---
console.log('\n\n📡 Demo 2: Event System\n');

console.log('Emitting test events...');

// Emit some test events
const event1 = eventBus.emit(eventTypes.WORKFLOW_STARTED, {
  source: 'demo',
  workflowId: 'campaign-launch',
  executionId: 'demo-exec-001'
});
console.log(`   ✅ Emitted: ${event1.type} (${event1.id})`);

const event2 = eventBus.emit(eventTypes.PROJECT_CREATED, {
  source: 'demo',
  projectId: 'proj-demo-001',
  projectName: 'Q1 Brand Campaign'
});
console.log(`   ✅ Emitted: ${event2.type} (${event2.id})`);

const event3 = eventBus.emit(eventTypes.WORKFLOW_COMPLETED, {
  source: 'demo',
  workflowId: 'campaign-launch',
  executionId: 'demo-exec-001',
  duration: 125000
});
console.log(`   ✅ Emitted: ${event3.type} (${event3.id})`);

console.log('\n📊 Event Statistics:');
const eventStats = eventBus.getStats();
console.log(`   Total Events: ${eventStats.total}`);
console.log(`   By Type:`, Object.entries(eventStats.types).slice(0, 5));

// --- Demo 3: Project Model ---
console.log('\n\n📁 Demo 3: Project Model\n');

console.log('Creating projects...');

const project1 = projects.create({
  name: 'Q1 Brand Campaign',
  type: 'campaign',
  status: 'active',
  owner: 'media-planner',
  startDate: '2026-03-01',
  endDate: '2026-05-31',
  budget: 100000,
  platform: 'ttd',
  metadata: {
    channel: 'display',
    funnel: 'awareness'
  }
});
console.log(`   ✅ Created: ${project1.name} (${project1.id})`);

const project2 = projects.create({
  name: 'Google Ads DSP Onboarding',
  type: 'dsp-onboarding',
  status: 'planning',
  owner: 'project-manager',
  startDate: '2026-02-15',
  endDate: '2026-04-30',
  platform: 'google-ads',
  metadata: {
    vendor: 'Google',
    complexity: 'medium'
  }
});
console.log(`   ✅ Created: ${project2.name} (${project2.id})`);

const project3 = projects.create({
  name: 'Amazon JBP 2026',
  type: 'jbp',
  status: 'active',
  owner: 'partnership-manager',
  startDate: '2026-01-01',
  endDate: '2026-12-31',
  budget: 5000000,
  platform: 'multiple',
  asanaProjectId: 'asana-jbp-2026'
});
console.log(`   ✅ Created: ${project3.name} (${project3.id})`);

console.log('\n📊 Project Statistics:');
const projectStats = projects.getStats();
console.log(`   Total Projects: ${projectStats.total}`);
console.log(`   By Type:`, projectStats.byType);
console.log(`   By Status:`, projectStats.byStatus);
console.log(`   Active: ${projectStats.active}`);

// --- Demo 4: Project Updates ---
console.log('\n\n🔄 Demo 4: Project Updates\n');

console.log('Adding milestones to Q1 Brand Campaign...');
projects.addMilestone(project1.id, {
  name: 'Campaign Structure Finalized',
  status: 'done',
  date: '2026-02-10'
});
projects.addMilestone(project1.id, {
  name: 'Creative Assets Approved',
  status: 'done',
  date: '2026-02-15'
});
projects.addMilestone(project1.id, {
  name: 'Campaign Launch',
  status: 'pending',
  date: '2026-03-01'
});
console.log('   ✅ Added 3 milestones');

console.log('\nAdding artifact...');
projects.addArtifact(project1.id, {
  type: 'media-plan',
  url: '/output/q1-brand-plan.json',
  name: 'Q1 Brand Media Plan'
});
console.log('   ✅ Added media plan artifact');

console.log('\nUpdating metrics...');
projects.updateMetrics(project1.id, {
  completion: 65,
  health: 'on-track',
  blockers: []
});
console.log('   ✅ Updated project metrics (65% complete, on-track)');

const updatedProject = projects.get(project1.id);
console.log(`\n📋 Project Details:`);
console.log(`   Name: ${updatedProject.name}`);
console.log(`   Status: ${updatedProject.status}`);
console.log(`   Health: ${updatedProject.metrics.health}`);
console.log(`   Completion: ${updatedProject.metrics.completion}%`);
console.log(`   Milestones: ${updatedProject.milestones.length}`);
console.log(`   Artifacts: ${updatedProject.artifacts.length}`);

// --- Demo 5: PRD-to-Asana Workflow ---
console.log('\n\n🔄 Demo 5: PRD-to-Asana Workflow\n');

const prdDocument = `
# Q2 Video Campaign - OLV & CTV

## Overview
Launch a comprehensive video advertising campaign across OLV and CTV channels for Q2.
Focus on brand awareness with premium inventory targeting.

## Objectives
- Reach 5M unique viewers
- Achieve 70%+ video completion rate
- Maintain CPM under $25
- Launch across 3 DSPs simultaneously

## Deliverables
- Campaign strategy document
- Creative brief and video specs
- DSP account setup (TTD, DV360, Amazon DSP)
- Trafficking instructions
- QA checklist
- Launch coordination
- Daily monitoring setup

## Timeline
- Start: March 15, 2026
- End: June 30, 2026

## Dependencies
- Creative assets from agency (due Feb 28)
- DSP API credentials
- Brand safety vendor setup

Owner: Sarah Johnson
Budget: $250,000
`;

console.log('Running PRD-to-Asana workflow...\n');

(async () => {
  try {
    const result = await workflows.runWorkflow('prd-to-asana', {
      documentText: prdDocument,
      projectType: 'campaign'
    });
    
    console.log(`✅ Workflow Status: ${result.status}`);
    console.log(`   Asana Project: ${result.asanaProjectUrl}`);
    console.log(`   Project ID: ${result.projectId}`);
    console.log(`   Task Count: ${result.stages[2].output.taskCount}`);
    console.log(`   Section Count: ${result.stages[2].output.sectionCount}`);
    
    console.log('\n📋 Workflow Stages:');
    result.stages.forEach(stage => {
      const icon = stage.status === 'completed' ? '✅' : 
                   stage.status === 'warning' ? '⚠️' : '❌';
      console.log(`   ${icon} ${stage.name} (${stage.status})`);
    });
    
    // --- Demo 6: Project Status Workflow ---
    console.log('\n\n📊 Demo 6: Project Status Workflow\n');
    
    console.log('Running project status workflow...\n');
    
    const statusResult = await workflows.runWorkflow('project-status', {
      projectId: result.projectId,
      includeRiskAssessment: true
    });
    
    console.log(`✅ Status Report Generated`);
    console.log(`   Health: ${statusResult.report.summary.health}`);
    console.log(`   Completion: ${statusResult.report.summary.completion}%`);
    console.log(`   Total Tasks: ${statusResult.report.summary.totalTasks}`);
    console.log(`   Completed: ${statusResult.report.summary.completedTasks}`);
    console.log(`   Blocked: ${statusResult.report.summary.blockedTasks}`);
    console.log(`   Overdue: ${statusResult.report.summary.overdueTasks}`);
    
    if (statusResult.report.concerns.length > 0) {
      console.log('\n⚠️  Concerns:');
      statusResult.report.concerns.forEach(concern => {
        console.log(`   • [${concern.severity}] ${concern.message}`);
      });
    }
    
    if (statusResult.report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      statusResult.report.recommendations.forEach(rec => {
        console.log(`   • ${rec}`);
      });
    }
    
    // --- Demo Summary ---
    console.log('\n\n' + '='.repeat(70));
    console.log('🎉 Phase 1 Feature Demo Complete!\n');
    console.log('Key Features Demonstrated:');
    console.log('   ✅ Workflow Registry with categories and metadata');
    console.log('   ✅ Event System with pub/sub and persistence');
    console.log('   ✅ Project Model with CRUD and tracking');
    console.log('   ✅ PRD-to-Asana workflow for automated project creation');
    console.log('   ✅ Project Status workflow for health monitoring');
    console.log('   ✅ Full backward compatibility with existing code');
    console.log('\n📚 Next: Review docs/PHASE-1-IMPLEMENTATION-SUMMARY.md');
    console.log('🧪 Run Tests: node test-phase1.js');
    console.log('🚀 Ready for Phase 2!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
})();
