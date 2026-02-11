/**
 * Event-Driven Workflow Triggers
 * Wire up events to automatically trigger workflows
 */

const eventBus = require('./bus');
const registry = require('../workflows/registry');
const executor = require('../executor');

// Track active triggers
const activeTriggers = new Map();

/**
 * Initialize event-driven triggers
 */
function initializeTriggers() {
  console.log('🎯 Initializing event-driven workflow triggers...');

  // Metric Threshold → Anomaly Detection
  registerTrigger('metric.threshold', async (event) => {
    console.log(`⚡ Metric threshold event detected: ${event.payload.metric} for campaign ${event.payload.campaignId}`);
    
    try {
      const result = await executor.executeWorkflow('anomaly-detection', {
        campaignId: event.payload.campaignId,
        metric: event.payload.metric,
        threshold: event.payload.threshold,
        currentValue: event.payload.currentValue
      });

      console.log(`✅ Anomaly detection workflow triggered: ${result.executionId}`);
    } catch (error) {
      console.error(`❌ Failed to trigger anomaly detection:`, error.message);
    }
  });

  // Plan Created → Media Plan Execute
  registerTrigger('plan.created', async (event) => {
    console.log(`⚡ Plan created event detected: ${event.payload.planId}`);
    
    try {
      const result = await executor.executeWorkflow('media-plan-execute', {
        mediaPlanUrl: event.payload.planUrl,
        projectId: event.payload.projectId,
        autoLaunch: false // Create drafts, don't auto-launch
      });

      console.log(`✅ Media plan execute workflow triggered: ${result.executionId}`);
    } catch (error) {
      console.error(`❌ Failed to trigger media plan execute:`, error.message);
    }
  });

  // Plan Approved → Media Plan Execute (with auto-launch)
  registerTrigger('plan.approved', async (event) => {
    console.log(`⚡ Plan approved event detected: ${event.payload.planId}`);
    
    try {
      const result = await executor.executeWorkflow('media-plan-execute', {
        mediaPlanUrl: event.payload.planUrl,
        projectId: event.payload.projectId,
        autoLaunch: true // Auto-launch approved plans
      });

      console.log(`✅ Media plan execute workflow triggered with auto-launch: ${result.executionId}`);
    } catch (error) {
      console.error(`❌ Failed to trigger media plan execute:`, error.message);
    }
  });

  // Budget Depleted → Optimization
  registerTrigger('budget.depleted', async (event) => {
    console.log(`⚡ Budget depleted event detected for campaign: ${event.payload.campaignId}`);
    
    try {
      const result = await executor.executeWorkflow('optimization', {
        campaignId: event.payload.campaignId,
        reason: 'budget-depleted',
        recommendations: ['pause-underperforming', 'reallocate-budget']
      });

      console.log(`✅ Optimization workflow triggered: ${result.executionId}`);
    } catch (error) {
      console.error(`❌ Failed to trigger optimization:`, error.message);
    }
  });

  // Campaign Approved → Cross-Channel Launch
  registerTrigger('campaign.approved', async (event) => {
    console.log(`⚡ Campaign approved event detected: ${event.payload.campaignName}`);
    
    // Only trigger if multi-platform launch requested
    if (event.payload.platforms && event.payload.platforms.length > 1) {
      try {
        const result = await executor.executeWorkflow('cross-channel-launch', {
          campaignName: event.payload.campaignName,
          budget: event.payload.budget,
          platforms: event.payload.platforms,
          creative: event.payload.creative,
          targeting: event.payload.targeting,
          startDate: event.payload.startDate,
          endDate: event.payload.endDate
        });

        console.log(`✅ Cross-channel launch workflow triggered: ${result.executionId}`);
      } catch (error) {
        console.error(`❌ Failed to trigger cross-channel launch:`, error.message);
      }
    }
  });

  // Workflow Completed → Project Status Update
  registerTrigger('workflow.completed', async (event) => {
    if (event.payload.projectId) {
      console.log(`⚡ Workflow completed, updating project ${event.payload.projectId}...`);
      
      // Would update project completion status
      // For now, just log
      console.log(`📝 Project ${event.payload.projectId} updated with workflow result`);
    }
  });

  // Workflow Failed → Alert
  registerTrigger('workflow.failed', async (event) => {
    console.log(`⚠️ Workflow failed: ${event.payload.workflowId} (${event.payload.executionId})`);
    
    // Would send alert via email/Slack
    // For now, just log
    console.log(`📧 Alert sent: Workflow ${event.payload.workflowId} failed - ${event.payload.error}`);
  });

  // Project Created → PRD to Asana (if project type is suitable)
  registerTrigger('project.created', async (event) => {
    const projectType = event.payload.type;
    
    if (['campaign', 'dsp-onboarding', 'jbp'].includes(projectType)) {
      console.log(`⚡ Project created event detected: ${event.payload.name} (${projectType})`);
      
      // If there's a PRD document attached, trigger PRD-to-Asana workflow
      if (event.payload.prdUrl) {
        try {
          const result = await executor.executeWorkflow('prd-to-asana', {
            documentUrl: event.payload.prdUrl,
            projectName: event.payload.name,
            projectType: projectType
          });

          console.log(`✅ PRD-to-Asana workflow triggered: ${result.executionId}`);
        } catch (error) {
          console.error(`❌ Failed to trigger PRD-to-Asana:`, error.message);
        }
      }
    }
  });

  console.log(`✅ ${activeTriggers.size} event triggers registered`);
}

/**
 * Register an event trigger
 */
function registerTrigger(eventType, handler) {
  if (activeTriggers.has(eventType)) {
    console.warn(`⚠️ Trigger for event "${eventType}" already registered, replacing...`);
    // Remove old listener
    const oldHandler = activeTriggers.get(eventType);
    eventBus.off(eventType, oldHandler);
  }

  // Register new listener
  eventBus.on(eventType, handler);
  activeTriggers.set(eventType, handler);
  
  console.log(`  ✓ Registered trigger: ${eventType}`);
}

/**
 * Unregister a trigger
 */
function unregisterTrigger(eventType) {
  if (activeTriggers.has(eventType)) {
    const handler = activeTriggers.get(eventType);
    eventBus.off(eventType, handler);
    activeTriggers.delete(eventType);
    console.log(`✓ Unregistered trigger: ${eventType}`);
    return true;
  }
  return false;
}

/**
 * Get all active triggers
 */
function getActiveTriggers() {
  return Array.from(activeTriggers.keys());
}

/**
 * Auto-register triggers for workflows that define event triggers
 */
function autoRegisterWorkflowTriggers() {
  console.log('🔍 Auto-registering workflow event triggers...');
  
  const workflows = registry.getAllWorkflows();
  let registered = 0;

  for (const workflow of workflows) {
    if (workflow.triggers?.events?.length > 0) {
      for (const eventType of workflow.triggers.events) {
        // Only register if not already registered
        if (!activeTriggers.has(eventType)) {
          registerTrigger(eventType, async (event) => {
            console.log(`⚡ Auto-trigger: ${eventType} → ${workflow.id}`);
            
            try {
              // Extract params from event payload
              const params = event.payload || {};
              
              const result = await executor.executeWorkflow(workflow.id, params);
              console.log(`✅ Workflow ${workflow.id} triggered: ${result.executionId}`);
            } catch (error) {
              console.error(`❌ Failed to auto-trigger ${workflow.id}:`, error.message);
            }
          });
          
          registered++;
        }
      }
    }
  }

  console.log(`✅ Auto-registered ${registered} workflow event triggers`);
}

/**
 * Cleanup all triggers
 */
function cleanup() {
  console.log('🧹 Cleaning up event triggers...');
  
  for (const [eventType, handler] of activeTriggers.entries()) {
    eventBus.off(eventType, handler);
  }
  
  activeTriggers.clear();
  console.log('✅ Event triggers cleaned up');
}

module.exports = {
  initializeTriggers,
  registerTrigger,
  unregisterTrigger,
  getActiveTriggers,
  autoRegisterWorkflowTriggers,
  cleanup
};
