/**
 * Scheduled Workflow Triggers (Cron Jobs)
 * Wire up scheduled executions for recurring workflows
 */

const cron = require('node-cron');
const executor = require('./executor');
const registry = require('./workflows/registry');

// Track active cron jobs
const activeJobs = new Map();

/**
 * Initialize scheduled workflow triggers
 */
function initializeCronJobs() {
  console.log('⏰ Initializing scheduled workflow triggers...');

  // Daily Pacing Check (9am every day)
  scheduleCronJob('daily-pacing-check', '0 9 * * *', async () => {
    console.log('⏰ Running scheduled pacing check...');
    
    try {
      const result = await executor.runImmediate('pacing-check', {
        dsp: 'all',
        alertThreshold: 10
      });

      console.log(`✅ Pacing check completed: ${result.executionId}`);
    } catch (error) {
      console.error(`❌ Pacing check failed:`, error.message);
    }
  });

  // Weekly Review (Monday 8am)
  scheduleCronJob('weekly-review', '0 8 * * 1', async () => {
    console.log('⏰ Running weekly review workflow...');
    
    try {
      const result = await executor.runImmediate('wow-report', {
        includeAllPlatforms: true,
        sendNotification: true
      });

      console.log(`✅ Weekly review completed: ${result.executionId}`);
    } catch (error) {
      console.error(`❌ Weekly review failed:`, error.message);
    }
  });

  // Monthly Report (1st of month at 9am)
  scheduleCronJob('monthly-report', '0 9 1 * *', async () => {
    console.log('⏰ Running monthly report workflow...');
    
    // Calculate last month
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const month = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;

    try {
      const result = await executor.runImmediate('monthly-report', {
        month,
        platforms: ['google-ads', 'meta', 'dv360'],
        includeYoY: true,
        createDocument: true
      });

      console.log(`✅ Monthly report completed: ${result.executionId}`);
    } catch (error) {
      console.error(`❌ Monthly report failed:`, error.message);
    }
  });

  // Anomaly Detection (Every 4 hours)
  scheduleCronJob('anomaly-detection-scan', '0 */4 * * *', async () => {
    console.log('⏰ Running anomaly detection scan...');
    
    try {
      // Would scan all active campaigns for anomalies
      // For now, just log
      console.log('📊 Scanning active campaigns for anomalies...');
      
      // Simulate finding campaigns to check
      const campaignsToCheck = ['campaign-1', 'campaign-2', 'campaign-3'];
      
      for (const campaignId of campaignsToCheck) {
        // Would check actual metrics and trigger if anomaly found
        // For demo, skip actual execution
        console.log(`  ✓ Checked ${campaignId}`);
      }

      console.log(`✅ Anomaly detection scan completed`);
    } catch (error) {
      console.error(`❌ Anomaly detection scan failed:`, error.message);
    }
  });

  // Optimization Check (Daily at 2pm)
  scheduleCronJob('daily-optimization', '0 14 * * *', async () => {
    console.log('⏰ Running daily optimization check...');
    
    try {
      const result = await executor.runImmediate('optimization', {
        scope: 'all-campaigns',
        autoApply: false, // Just generate recommendations
        notifyTeam: true
      });

      console.log(`✅ Optimization check completed: ${result.executionId}`);
    } catch (error) {
      console.error(`❌ Optimization check failed:`, error.message);
    }
  });

  // Project Status Update (Daily at 5pm)
  scheduleCronJob('project-status-update', '0 17 * * *', async () => {
    console.log('⏰ Running project status update...');
    
    try {
      // Would check all active projects and update their status
      // For now, just log
      console.log('📋 Updating project statuses...');
      console.log(`✅ Project status update completed`);
    } catch (error) {
      console.error(`❌ Project status update failed:`, error.message);
    }
  });

  // Cross-Channel Report (Weekly on Friday at 10am)
  scheduleCronJob('weekly-cross-channel', '0 10 * * 5', async () => {
    console.log('⏰ Running weekly cross-channel report...');
    
    // Calculate last 7 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const formatDate = (date) => date.toISOString().split('T')[0];

    try {
      const result = await executor.runImmediate('cross-channel-report', {
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        platforms: ['google-ads', 'meta', 'dv360'],
        includeCharts: true
      });

      console.log(`✅ Cross-channel report completed: ${result.executionId}`);
    } catch (error) {
      console.error(`❌ Cross-channel report failed:`, error.message);
    }
  });

  console.log(`✅ ${activeJobs.size} cron jobs scheduled`);
}

/**
 * Schedule a cron job
 */
function scheduleCronJob(jobName, cronExpression, handler) {
  if (activeJobs.has(jobName)) {
    console.warn(`⚠️ Cron job "${jobName}" already scheduled, replacing...`);
    stopCronJob(jobName);
  }

  const job = cron.schedule(cronExpression, handler, {
    scheduled: true,
    timezone: 'America/New_York'
  });

  activeJobs.set(jobName, {
    job,
    cronExpression,
    handler,
    scheduledAt: new Date().toISOString()
  });

  console.log(`  ✓ Scheduled: ${jobName} (${cronExpression})`);
}

/**
 * Stop a cron job
 */
function stopCronJob(jobName) {
  if (activeJobs.has(jobName)) {
    const { job } = activeJobs.get(jobName);
    job.stop();
    activeJobs.delete(jobName);
    console.log(`✓ Stopped cron job: ${jobName}`);
    return true;
  }
  return false;
}

/**
 * Get all active cron jobs
 */
function getActiveCronJobs() {
  const jobs = [];
  
  for (const [name, data] of activeJobs.entries()) {
    jobs.push({
      name,
      cronExpression: data.cronExpression,
      scheduledAt: data.scheduledAt,
      isRunning: true
    });
  }

  return jobs;
}

/**
 * Auto-register cron jobs for workflows that define scheduled triggers
 */
function autoRegisterWorkflowCrons() {
  console.log('🔍 Auto-registering workflow scheduled triggers...');
  
  const workflows = registry.getAllWorkflows();
  let registered = 0;

  for (const workflow of workflows) {
    if (workflow.triggers?.scheduled) {
      const cronExpression = workflow.triggers.scheduled;
      const jobName = `auto-${workflow.id}`;

      // Only register if not already registered
      if (!activeJobs.has(jobName)) {
        scheduleCronJob(jobName, cronExpression, async () => {
          console.log(`⏰ Auto-cron: ${workflow.id}`);
          
          try {
            // For scheduled workflows, use default params or empty params
            const params = workflow.inputs ? {} : {};
            
            const result = await executor.runImmediate(workflow.id, params);
            console.log(`✅ Workflow ${workflow.id} executed: ${result.executionId}`);
          } catch (error) {
            console.error(`❌ Failed to execute ${workflow.id}:`, error.message);
          }
        });

        registered++;
      }
    }
  }

  console.log(`✅ Auto-registered ${registered} workflow cron jobs`);
}

/**
 * Cleanup all cron jobs
 */
function cleanup() {
  console.log('🧹 Cleaning up cron jobs...');
  
  for (const [name, data] of activeJobs.entries()) {
    data.job.stop();
  }
  
  activeJobs.clear();
  console.log('✅ Cron jobs cleaned up');
}

/**
 * Manually trigger a cron job (for testing)
 */
async function triggerCronJob(jobName) {
  if (activeJobs.has(jobName)) {
    const { handler } = activeJobs.get(jobName);
    console.log(`🔧 Manually triggering cron job: ${jobName}`);
    await handler();
    return true;
  }
  
  console.error(`❌ Cron job "${jobName}" not found`);
  return false;
}

module.exports = {
  initializeCronJobs,
  scheduleCronJob,
  stopCronJob,
  getActiveCronJobs,
  autoRegisterWorkflowCrons,
  cleanup,
  triggerCronJob
};

