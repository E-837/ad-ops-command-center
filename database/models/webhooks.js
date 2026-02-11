/**
 * Webhooks Model
 * Database operations for webhook registry
 */

const knex = require('../db');
const { v4: uuidv4 } = require('uuid');

class WebhooksModel {
  /**
   * Create a new webhook
   */
  static create(webhookData) {
    const webhook = {
      id: uuidv4(),
      name: webhookData.name,
      url: webhookData.url,
      secret: webhookData.secret || this.generateSecret(),
      direction: webhookData.direction || 'outbound',
      events: JSON.stringify(webhookData.events || []),
      enabled: webhookData.enabled !== false,
      metadata: JSON.stringify(webhookData.metadata || {}),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    knex('webhooks').insert(webhook).run();
    return this.get(webhook.id);
  }
  
  /**
   * Get webhook by ID
   */
  static get(id) {
    const row = knex('webhooks')
      .where({ id })
      .first();
    
    return row ? this.parseWebhook(row) : null;
  }
  
  /**
   * List all webhooks
   */
  static list(filters = {}) {
    let query = knex('webhooks');
    
    if (filters.direction) {
      query = query.where('direction', filters.direction);
    }
    
    if (filters.enabled !== undefined) {
      query = query.where('enabled', filters.enabled ? 1 : 0);
    }
    
    const rows = query
      .orderBy('createdAt', 'desc')
      .all();
    
    return rows.map(row => this.parseWebhook(row));
  }
  
  /**
   * Get webhooks by event type
   */
  static getByEvent(eventType) {
    const rows = knex('webhooks')
      .where('enabled', 1)
      .all();
    
    return rows
      .map(row => this.parseWebhook(row))
      .filter(webhook => {
        return webhook.events.includes(eventType) || 
               webhook.events.includes('*');
      });
  }
  
  /**
   * Update webhook
   */
  static update(id, updates) {
    const existing = this.get(id);
    
    if (!existing) {
      throw new Error('Webhook not found');
    }
    
    const updateData = {
      updatedAt: new Date().toISOString()
    };
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.url !== undefined) updateData.url = updates.url;
    if (updates.secret !== undefined) updateData.secret = updates.secret;
    if (updates.direction !== undefined) updateData.direction = updates.direction;
    if (updates.enabled !== undefined) updateData.enabled = updates.enabled ? 1 : 0;
    if (updates.events !== undefined) updateData.events = JSON.stringify(updates.events);
    if (updates.metadata !== undefined) updateData.metadata = JSON.stringify(updates.metadata);
    
    knex('webhooks')
      .where({ id })
      .update(updateData)
      .run();
    
    return this.get(id);
  }
  
  /**
   * Delete webhook
   */
  static delete(id) {
    const webhook = this.get(id);
    
    if (!webhook) {
      throw new Error('Webhook not found');
    }
    
    knex('webhooks')
      .where({ id })
      .delete()
      .run();
    
    return { success: true, deleted: webhook };
  }
  
  /**
   * Log webhook delivery
   */
  static logDelivery(webhookId, eventType, status, responseData = null) {
    const log = {
      id: uuidv4(),
      webhookId,
      eventType,
      status, // 'success', 'failure', 'retry'
      responseData: responseData ? JSON.stringify(responseData) : null,
      createdAt: new Date().toISOString()
    };
    
    knex('webhook_deliveries').insert(log).run();
    return log;
  }
  
  /**
   * Get delivery logs for a webhook
   */
  static getDeliveries(webhookId, limit = 100) {
    const rows = knex('webhook_deliveries')
      .where({ webhookId })
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .all();
    
    return rows.map(row => ({
      ...row,
      responseData: row.responseData ? JSON.parse(row.responseData) : null
    }));
  }
  
  /**
   * Parse webhook row from database
   */
  static parseWebhook(row) {
    if (!row) return null;
    
    return {
      ...row,
      events: row.events ? JSON.parse(row.events) : [],
      metadata: row.metadata ? JSON.parse(row.metadata) : {},
      enabled: Boolean(row.enabled)
    };
  }
  
  /**
   * Generate a random secret for webhook signatures
   */
  static generateSecret() {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  }
}

module.exports = WebhooksModel;
