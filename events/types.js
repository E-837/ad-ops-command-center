/**
 * Event Types
 * Constants for all system event types
 */

// Workflow events
const WORKFLOW_STARTED = 'workflow.started';
const WORKFLOW_COMPLETED = 'workflow.completed';
const WORKFLOW_FAILED = 'workflow.failed';
const WORKFLOW_STAGE_STARTED = 'workflow.stage.started';
const WORKFLOW_STAGE_COMPLETED = 'workflow.stage.completed';
const WORKFLOW_STAGE_FAILED = 'workflow.stage.failed';

// Campaign events
const CAMPAIGN_CREATED = 'campaign.created';
const CAMPAIGN_UPDATED = 'campaign.updated';
const CAMPAIGN_STATUS_CHANGED = 'campaign.status.changed';
const CAMPAIGN_PAUSED = 'campaign.paused';
const CAMPAIGN_RESUMED = 'campaign.resumed';

// Project events
const PROJECT_CREATED = 'project.created';
const PROJECT_UPDATED = 'project.updated';
const PROJECT_STATUS_CHANGED = 'project.status.changed';
const PROJECT_MILESTONE_REACHED = 'project.milestone.reached';
const PROJECT_RISK_DETECTED = 'project.risk.detected';

// Metric events
const METRIC_THRESHOLD = 'metric.threshold';
const METRIC_ANOMALY = 'metric.anomaly';
const BUDGET_PACING_ALERT = 'budget.pacing.alert';

// Document events
const DOCUMENT_CREATED = 'document.created';
const DOCUMENT_UPDATED = 'document.updated';
const DOCUMENT_TAGGED = 'document.tagged';

// Plan events
const PLAN_CREATED = 'plan.created';
const PLAN_APPROVED = 'plan.approved';

// Schedule events
const SCHEDULE_TICK = 'schedule.tick';

module.exports = {
  // Workflow events
  WORKFLOW_STARTED,
  WORKFLOW_COMPLETED,
  WORKFLOW_FAILED,
  WORKFLOW_STAGE_STARTED,
  WORKFLOW_STAGE_COMPLETED,
  WORKFLOW_STAGE_FAILED,
  
  // Campaign events
  CAMPAIGN_CREATED,
  CAMPAIGN_UPDATED,
  CAMPAIGN_STATUS_CHANGED,
  CAMPAIGN_PAUSED,
  CAMPAIGN_RESUMED,
  
  // Project events
  PROJECT_CREATED,
  PROJECT_UPDATED,
  PROJECT_STATUS_CHANGED,
  PROJECT_MILESTONE_REACHED,
  PROJECT_RISK_DETECTED,
  
  // Metric events
  METRIC_THRESHOLD,
  METRIC_ANOMALY,
  BUDGET_PACING_ALERT,
  
  // Document events
  DOCUMENT_CREATED,
  DOCUMENT_UPDATED,
  DOCUMENT_TAGGED,
  
  // Plan events
  PLAN_CREATED,
  PLAN_APPROVED,
  
  // Schedule events
  SCHEDULE_TICK
};
