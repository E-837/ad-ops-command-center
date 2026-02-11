/**
 * Webhook System
 * Handles incoming and outgoing webhooks with retry logic and signature verification
 */

const crypto = require('crypto');
const WebhooksModel = require('../database/models/webhooks');

/**
 * Verify webhook signature
 * @param {String} payload - Webhook payload (JSON string)
 * @param {String} signature - Provided signature
 * @param {String} secret - Webhook secret
 * @returns {Boolean} Is signature valid
 */
function verifySignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  // Use timing-safe comparison to prevent timing attacks
  const sigBuffer = Buffer.from(signature || '', 'utf8');
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
  if (sigBuffer.length !== expectedBuffer.length) return false;
  return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
}

/**
 * Generate webhook signature
 * @param {String} payload - Webhook payload (JSON string)
 * @param {String} secret - Webhook secret
 * @returns {String} HMAC-SHA256 signature
 */
function generateSignature(payload, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

/**
 * Handle incoming webhook
 * @param {String} webhookId - Webhook ID
 * @param {Object} payload - Request payload
 * @param {String} signature - Provided signature from header
 * @returns {Object} Processing result
 */
async function handleIncomingWebhook(webhookId, payload, signature) {
  try {
    const webhook = WebhooksModel.get(webhookId);
    
    if (!webhook) {
      return {
        success: false,
        error: 'Webhook not found'
      };
    }
    
    if (!webhook.enabled) {
      return {
        success: false,
        error: 'Webhook disabled'
      };
    }
    
    // Verify signature
    const payloadString = JSON.stringify(payload);
    if (!verifySignature(payloadString, signature, webhook.secret)) {
      return {
        success: false,
        error: 'Invalid signature'
      };
    }
    
    // Process webhook based on event type
    const eventType = payload.event || 'unknown';
    
    // Emit event to event bus
    const eventBus = require('../events/bus');
    eventBus.emit(`webhook.${eventType}`, {
      webhookId: webhook.id,
      webhookName: webhook.name,
      payload: payload,
      timestamp: new Date().toISOString()
    });
    
    // Log successful delivery
    WebhooksModel.logDelivery(webhook.id, eventType, 'success', {
      receivedAt: new Date().toISOString()
    });
    
    return {
      success: true,
      eventType: eventType,
      webhookId: webhook.id
    };
    
  } catch (err) {
    console.error('Error handling incoming webhook:', err);
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * Send outgoing webhook with retry logic
 * @param {String} url - Webhook URL
 * @param {String} event - Event type
 * @param {Object} data - Event data
 * @param {String} secret - Optional webhook secret
 * @param {Number} maxRetries - Maximum retry attempts
 * @returns {Object} Delivery result
 */
async function sendWebhook(url, event, data, secret = null, maxRetries = 3) {
  const payload = {
    event: event,
    timestamp: new Date().toISOString(),
    data: data
  };
  
  const payloadString = JSON.stringify(payload);
  const signature = secret ? generateSignature(payloadString, secret) : null;
  
  let lastError = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Use node-fetch for HTTP request (mock for now)
      const response = await mockHTTPRequest(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature || '',
          'User-Agent': 'AdOps-Command-Webhook/1.0'
        },
        body: payloadString
      });
      
      if (response.ok) {
        return {
          success: true,
          attempt: attempt + 1,
          status: response.status
        };
      }
      
      lastError = `HTTP ${response.status}: ${response.statusText}`;
      
    } catch (err) {
      lastError = err.message;
    }
    
    // Exponential backoff
    if (attempt < maxRetries - 1) {
      const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return {
    success: false,
    attempts: maxRetries,
    error: lastError
  };
}

/**
 * Send webhook to registered webhook endpoint
 * @param {String} webhookId - Webhook ID from registry
 * @param {String} event - Event type
 * @param {Object} data - Event data
 */
async function sendToWebhook(webhookId, event, data) {
  try {
    const webhook = WebhooksModel.get(webhookId);
    
    if (!webhook || !webhook.enabled) {
      console.warn(`Webhook ${webhookId} not found or disabled`);
      return;
    }
    
    const result = await sendWebhook(webhook.url, event, data, webhook.secret);
    
    // Log delivery
    WebhooksModel.logDelivery(
      webhook.id,
      event,
      result.success ? 'success' : 'failure',
      {
        attempts: result.attempts || result.attempt || 1,
        error: result.error || null,
        status: result.status || null
      }
    );
    
    return result;
    
  } catch (err) {
    console.error('Error sending to webhook:', err);
    throw err;
  }
}

/**
 * Mock HTTP request for webhook delivery
 * In production, use node-fetch or axios
 */
async function mockHTTPRequest(url, options) {
  console.log(`[WEBHOOK] Sending to ${url}:`, options.body);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Mock response
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => ({ received: true })
  };
}

/**
 * Get all webhooks for an event
 * @param {String} event - Event type
 * @returns {Array} Matching webhooks
 */
function getWebhooksForEvent(event) {
  return WebhooksModel.getByEvent(event);
}

/**
 * Broadcast event to all matching webhooks
 * @param {String} event - Event type
 * @param {Object} data - Event data
 */
async function broadcastToWebhooks(event, data) {
  const webhooks = getWebhooksForEvent(event);
  
  if (webhooks.length === 0) {
    return {
      sent: 0,
      webhooks: []
    };
  }
  
  const results = await Promise.allSettled(
    webhooks.map(webhook => sendToWebhook(webhook.id, event, data))
  );
  
  return {
    sent: results.filter(r => r.status === 'fulfilled' && r.value?.success).length,
    failed: results.filter(r => r.status === 'rejected' || !r.value?.success).length,
    webhooks: webhooks.map(w => w.id)
  };
}

module.exports = {
  verifySignature,
  generateSignature,
  handleIncomingWebhook,
  sendWebhook,
  sendToWebhook,
  getWebhooksForEvent,
  broadcastToWebhooks
};
