/**
 * Event-Driven Workflow Triggers
 * Wire up events to automatically trigger workflows
 */

const eventBus = require('./bus');
const registry = require('../workflows/registry');
const executor = require('../executor');
const logger = require('../utils/logger');

// Track active triggers
const activeTriggers = new Map();

/**
 * Initialize event-driven triggers
 */
function initializeTriggers() {
  logger.info('🎯 Initializing event-driven workflow triggers...');

  // Metric Threshold → Anomaly Detection
  registerTrigger('metric.threshold', async (event) => {
    logger.info('Event trigger');
    
    try {
      const result = await executor.executeWorkflow('anomaly-detection', {
        campaignId: event.payload.campaignId,
        metric: event.payload.metric,
        threshold: event.payload.threshold,
        currentValue: event.payload.currentValue
      });

      logger.info('Event trigger');
    } catch (error) {
      logger.error('❌ Failed to trigger anomaly detection:', { error: error.message });
    }
  });

  // Plan Created → Media Plan Execute
  registerTrigger('plan.created', async (event) => {
    logger.info('Event trigger');
    
    try {
      const result = await executor.executeWorkflow('media-plan-execute', {
        mediaPlanUrl: event.payload.planUrl,
        projectId: event.payload.projectId,
        autoLaunch: false // Create drafts, don't auto-launch
      });

      logger.info('Event trigger');
    } catch (error) {
      logger.error('❌ Failed to trigger media plan execute:', { error: error.message });
    }
  });

  // Plan Approved → Media Plan Execute (with auto-launch)
  registerTrigger('plan.approved', async (event) => {
    logger.info('Event trigger');
    
    try {
      const result = await executor.executeWorkflow('media-plan-execute', {
        mediaPlanUrl: event.payload.planUrl,
        projectId: event.payload.projectId,
        autoLaunch: true // Auto-launch approved plans
      });

      logger.info('Event trigger');
    } catch (error) {
      logger.error('❌ Failed to trigger media plan execute:', { error: error.message });
    }
  });

  // Budget Depleted → Optimization
  registerTrigger('budget.depleted', async (event) => {
    logger.info('Event trigger');
    
    try {
      const result = await executor.executeWorkflow('optimization', {
        campaignId: event.payload.campaignId,
        reason: 'budget-depleted',
        recommendations: ['pause-underperforming', 'reallocate-budget']
      });

      logger.info('Event trigger');
    } catch (error) {
      logger.error('❌ Failed to trigger optimization:', { error: error.message });
    }
  });

  // Campaign Approved → Cross-Channel Launch
  registerTrigger('campaign.approved', async (event) => {
    logger.info('Event trigger');
    
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

        logger.info('Event trigger');
      } catch (error) {
        logger.error('❌ Failed to trigger cross-channel launch:', { error: error.message });
      }
    }
  });

  // Workflow Completed → Project Status Update
  registerTrigger('workflow.completed', async (event) => {
    if (event.payload.projectId) {
      logger.info('Event trigger');
      
      // Would update project completion status
      // For now, just log
      logger.info('Event trigger');
    }
  });

  // Workflow Failed → Alert
  registerTrigger('workflow.failed', async (event) => {
    logger.info('Event trigger');
    
    // Would send alert via email/Slack
    // For now, just log
    logger.info('Event trigger');
  });

  // Project Created → PRD to Asana (if project type is suitable)
  registerTrigger('project.created', async (event) => {
    const projectType = event.payload.type;
    
    if (['campaign', 'dsp-onboarding', 'jbp'].includes(projectType)) {
      logger.info('Event trigger');
      
      // If there's a PRD document attached, trigger PRD-to-Asana workflow
      if (event.payload.prdUrl) {
        try {
          const result = await executor.executeWorkflow('prd-to-asana', {
            documentUrl: event.payload.prdUrl,
            projectName: event.payload.name,
            projectType: projectType
          });

          logger.info('Event trigger');
        } catch (error) {
          logger.error('❌ Failed to trigger PRD-to-Asana:', { error: error.message });
        }
      }
    }
  });

  logger.info('Event trigger');
}

/**
 * Register an event trigger
 */
function registerTrigger(eventType, handler) {
  if (activeTriggers.has(eventType)) {
    logger.warn('⚠️ Trigger for event "${eventType}" already registered, replacing...');
    // Remove old listener
    const oldHandler = activeTriggers.get(eventType);
    eventBus.off(eventType, oldHandler);
  }

  // Register new listener
  eventBus.on(eventType, handler);
  activeTriggers.set(eventType, handler);
  
  logger.info('Event trigger');
}

/**
 * Unregister a trigger
 */
function unregisterTrigger(eventType) {
  if (activeTriggers.has(eventType)) {
    const handler = activeTriggers.get(eventType);
    eventBus.off(eventType, handler);
    activeTriggers.delete(eventType);
    logger.info('Event trigger');
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
  logger.info('🔍 Auto-registering workflow event triggers...');
  
  const workflows = registry.getAllWorkflows();
  let registered = 0;

  for (const workflow of workflows) {
    if (workflow.triggers?.events?.length > 0) {
      for (const eventType of workflow.triggers.events) {
        // Only register if not already registered
        if (!activeTriggers.has(eventType)) {
          registerTrigger(eventType, async (event) => {
            logger.info('Event trigger');
            
            try {
              // Extract params from event payload
              const params = event.payload || {};
              
              const result = await executor.executeWorkflow(workflow.id, params);
              logger.info('Event trigger');
            } catch (error) {
              logger.error('❌ Failed to auto-trigger ${workflow.id}:', { error: error.message });
            }
          });
          
          registered++;
        }
      }
    }
  }

  logger.info('Event trigger');
}

/**
 * Cleanup all triggers
 */
function cleanup() {
  logger.info('🧹 Cleaning up event triggers...');
  
  for (const [eventType, handler] of activeTriggers.entries()) {
    eventBus.off(eventType, handler);
  }
  
  activeTriggers.clear();
  logger.info('✅ Event triggers cleaned up');
}

module.exports = {
  initializeTriggers,
  registerTrigger,
  unregisterTrigger,
  getActiveTriggers,
  autoRegisterWorkflowTriggers,
  cleanup
};
