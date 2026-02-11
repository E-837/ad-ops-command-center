/**
 * Notification System
 * Multi-channel notification delivery (Email, Slack, Discord, SMS)
 */

const fs = require('fs');
const path = require('path');

/**
 * Load and render notification template
 * @param {String} templateName - Template file name (without extension)
 * @param {Object} variables - Template variables
 * @returns {String} Rendered template
 */
function renderTemplate(templateName, variables = {}) {
  try {
    const templatePath = path.join(__dirname, 'templates', `${templateName}.html`);
    
    if (!fs.existsSync(templatePath)) {
      console.warn(`Template ${templateName} not found, using plain text`);
      return JSON.stringify(variables, null, 2);
    }
    
    let template = fs.readFileSync(templatePath, 'utf8');
    
    // Simple template variable replacement
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      template = template.replace(regex, value);
    }
    
    return template;
    
  } catch (err) {
    console.error('Error rendering template:', err);
    return JSON.stringify(variables, null, 2);
  }
}

/**
 * Send email notification
 * @param {String} to - Recipient email
 * @param {String} subject - Email subject
 * @param {String} body - Email body (HTML or plain text)
 * @param {Object} options - Additional options
 * @returns {Object} Delivery result
 */
async function sendEmail(to, subject, body, options = {}) {
  try {
    // Mock email delivery
    // In production: use SendGrid, AWS SES, or SMTP
    console.log(`[EMAIL] To: ${to}`);
    console.log(`[EMAIL] Subject: ${subject}`);
    console.log(`[EMAIL] Body preview: ${body.substring(0, 100)}...`);
    
    return {
      success: true,
      channel: 'email',
      recipient: to,
      timestamp: new Date().toISOString()
    };
    
  } catch (err) {
    console.error('Error sending email:', err);
    return {
      success: false,
      channel: 'email',
      error: err.message
    };
  }
}

/**
 * Send Slack notification
 * @param {String} channel - Slack channel (e.g., '#campaigns')
 * @param {Object} message - Slack message object
 * @returns {Object} Delivery result
 */
async function sendSlack(channel, message) {
  try {
    // Mock Slack webhook
    // In production: use Slack Incoming Webhooks API
    
    const payload = typeof message === 'string' 
      ? { text: message }
      : message;
    
    console.log(`[SLACK] Channel: ${channel}`);
    console.log(`[SLACK] Message:`, JSON.stringify(payload, null, 2));
    
    return {
      success: true,
      channel: 'slack',
      recipient: channel,
      timestamp: new Date().toISOString()
    };
    
  } catch (err) {
    console.error('Error sending Slack notification:', err);
    return {
      success: false,
      channel: 'slack',
      error: err.message
    };
  }
}

/**
 * Send Discord notification
 * @param {String} channelOrWebhook - Discord channel ID or webhook URL
 * @param {Object} message - Discord message object
 * @returns {Object} Delivery result
 */
async function sendDiscord(channelOrWebhook, message) {
  try {
    // Mock Discord webhook
    // In production: use Discord Webhook API
    
    const payload = typeof message === 'string'
      ? { content: message }
      : message;
    
    console.log(`[DISCORD] Target: ${channelOrWebhook}`);
    console.log(`[DISCORD] Message:`, JSON.stringify(payload, null, 2));
    
    return {
      success: true,
      channel: 'discord',
      recipient: channelOrWebhook,
      timestamp: new Date().toISOString()
    };
    
  } catch (err) {
    console.error('Error sending Discord notification:', err);
    return {
      success: false,
      channel: 'discord',
      error: err.message
    };
  }
}

/**
 * Send SMS notification
 * @param {String} to - Phone number
 * @param {String} message - SMS message text
 * @returns {Object} Delivery result
 */
async function sendSMS(to, message) {
  try {
    // Mock SMS delivery
    // In production: use Twilio, AWS SNS, or similar
    
    console.log(`[SMS] To: ${to}`);
    console.log(`[SMS] Message: ${message}`);
    
    return {
      success: true,
      channel: 'sms',
      recipient: to,
      timestamp: new Date().toISOString()
    };
    
  } catch (err) {
    console.error('Error sending SMS:', err);
    return {
      success: false,
      channel: 'sms',
      error: err.message
    };
  }
}

/**
 * Send notification based on event
 * @param {String} eventType - Event type (workflow-completed, campaign-alert, etc.)
 * @param {Object} data - Event data
 * @param {Object} recipients - Recipients by channel
 * @returns {Array} Delivery results
 */
async function sendNotification(eventType, data, recipients = {}) {
  const results = [];
  
  // Determine template based on event type
  const templateMap = {
    'workflow.completed': 'workflow-completed',
    'workflow.failed': 'workflow-failed',
    'campaign.pacing': 'campaign-pacing-alert',
    'performance.anomaly': 'anomaly-detected'
  };
  
  const template = templateMap[eventType] || 'generic-notification';
  
  // Send to email recipients
  if (recipients.email && recipients.email.length > 0) {
    const subject = getSubjectForEvent(eventType, data);
    const body = renderTemplate(template, data);
    
    for (const email of recipients.email) {
      const result = await sendEmail(email, subject, body);
      results.push(result);
    }
  }
  
  // Send to Slack channels
  if (recipients.slack && recipients.slack.length > 0) {
    const message = formatSlackMessage(eventType, data);
    
    for (const channel of recipients.slack) {
      const result = await sendSlack(channel, message);
      results.push(result);
    }
  }
  
  // Send to Discord channels
  if (recipients.discord && recipients.discord.length > 0) {
    const message = formatDiscordMessage(eventType, data);
    
    for (const channel of recipients.discord) {
      const result = await sendDiscord(channel, message);
      results.push(result);
    }
  }
  
  // Send SMS
  if (recipients.sms && recipients.sms.length > 0) {
    const message = formatSMSMessage(eventType, data);
    
    for (const phone of recipients.sms) {
      const result = await sendSMS(phone, message);
      results.push(result);
    }
  }
  
  return results;
}

/**
 * Get email subject for event type
 */
function getSubjectForEvent(eventType, data) {
  const subjects = {
    'workflow.completed': `✅ Workflow Completed: ${data.workflowName || 'Unknown'}`,
    'workflow.failed': `❌ Workflow Failed: ${data.workflowName || 'Unknown'}`,
    'campaign.pacing': `⚠️ Budget Alert: ${data.campaignName || 'Campaign'}`,
    'performance.anomaly': `🔍 Anomaly Detected: ${data.campaignName || 'Campaign'}`
  };
  
  return subjects[eventType] || '🎯 Ad Ops Notification';
}

/**
 * Format Slack message for event
 */
function formatSlackMessage(eventType, data) {
  const icons = {
    'workflow.completed': '✅',
    'workflow.failed': '❌',
    'campaign.pacing': '⚠️',
    'performance.anomaly': '🔍'
  };
  
  const icon = icons[eventType] || '🎯';
  
  const message = {
    text: `${icon} ${data.title || 'Notification'}`,
    attachments: []
  };
  
  if (eventType === 'workflow.completed') {
    message.attachments.push({
      color: 'good',
      fields: [
        { title: 'Workflow', value: data.workflowName || 'Unknown', short: true },
        { title: 'Duration', value: `${data.executionTime || 0}s`, short: true },
        { title: 'Status', value: 'Success', short: true }
      ]
    });
  } else if (eventType === 'workflow.failed') {
    message.attachments.push({
      color: 'danger',
      fields: [
        { title: 'Workflow', value: data.workflowName || 'Unknown', short: true },
        { title: 'Error', value: data.error || 'Unknown error', short: false }
      ]
    });
  } else if (eventType === 'campaign.pacing') {
    message.attachments.push({
      color: 'warning',
      fields: [
        { title: 'Campaign', value: data.campaignName || 'Unknown', short: true },
        { title: 'Budget Used', value: `${data.budgetUtilization || 0}%`, short: true },
        { title: 'Recommendation', value: data.recommendation || 'Review campaign', short: false }
      ]
    });
  }
  
  return message;
}

/**
 * Format Discord message for event
 */
function formatDiscordMessage(eventType, data) {
  const colors = {
    'workflow.completed': 0x4CAF50, // Green
    'workflow.failed': 0xF44336,    // Red
    'campaign.pacing': 0xFF9800,    // Orange
    'performance.anomaly': 0x2196F3 // Blue
  };
  
  return {
    embeds: [{
      title: data.title || 'Notification',
      description: data.message || '',
      color: colors[eventType] || 0x64B5F6,
      fields: Object.entries(data)
        .filter(([key, val]) => key !== 'title' && key !== 'message' && typeof val !== 'object')
        .slice(0, 5)
        .map(([key, val]) => ({
          name: key.charAt(0).toUpperCase() + key.slice(1),
          value: String(val),
          inline: true
        })),
      timestamp: new Date().toISOString()
    }]
  };
}

/**
 * Format SMS message for event
 */
function formatSMSMessage(eventType, data) {
  const prefix = {
    'workflow.completed': '✅',
    'workflow.failed': '❌',
    'campaign.pacing': '⚠️',
    'performance.anomaly': '🔍'
  }[eventType] || '🎯';
  
  return `${prefix} Ad Ops: ${data.title || data.workflowName || 'Notification'}`;
}

module.exports = {
  sendEmail,
  sendSlack,
  sendDiscord,
  sendSMS,
  sendNotification,
  renderTemplate
};
