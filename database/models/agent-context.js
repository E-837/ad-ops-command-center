/**
 * Agent Context Model
 * Manages short-term session context for agents
 */

const knex = require('../db');

const AgentContext = {
  /**
   * Store session context for an agent
   * @param {string} agentName - Name of the agent
   * @param {string} sessionId - Session identifier
   * @param {object} context - Context data (JSON)
   * @param {number} ttl - Time to live in seconds (default: 1 hour)
   * @returns {Promise<object>} Created/updated context
   */
  async setContext(agentName, sessionId, context, ttl = 3600) {
    try {
      const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();

      // Check if context already exists
      const existing = await knex('agent_context')
        .where({ agentName, sessionId })
        .first();

      if (existing) {
        // Update existing context
        await knex('agent_context')
          .where({ id: existing.id })
          .update({
            context: JSON.stringify(context),
            expiresAt
          });

        return await knex('agent_context').where({ id: existing.id }).first();
      } else {
        // Create new context
        const [id] = await knex('agent_context').insert({
          agentName,
          sessionId,
          context: JSON.stringify(context),
          expiresAt
        });

        return await knex('agent_context').where({ id }).first();
      }
    } catch (error) {
      console.error(`❌ Error setting context for ${agentName}:`, error);
      throw error;
    }
  },

  /**
   * Retrieve session context for an agent
   * @param {string} agentName - Name of the agent
   * @param {string} sessionId - Session identifier
   * @returns {Promise<object|null>} Context object or null if expired/not found
   */
  async getContext(agentName, sessionId) {
    try {
      const now = new Date().toISOString();
      const context = await knex('agent_context')
        .where({ agentName, sessionId })
        .where('expiresAt', '>', now)
        .first();

      if (context && context.context) {
        context.context = JSON.parse(context.context);
      }

      return context || null;
    } catch (error) {
      console.error(`❌ Error getting context for ${agentName}:`, error);
      throw error;
    }
  },

  /**
   * Update existing context (merge new data)
   * @param {string} agentName - Name of the agent
   * @param {string} sessionId - Session identifier
   * @param {object} updates - Data to merge into context
   * @param {number} ttl - Optional new TTL in seconds
   * @returns {Promise<object|null>} Updated context
   */
  async updateContext(agentName, sessionId, updates, ttl = null) {
    try {
      const existing = await this.getContext(agentName, sessionId);

      if (!existing) {
        console.warn(`⚠️ No active context found for ${agentName}/${sessionId}`);
        return null;
      }

      const mergedContext = {
        ...existing.context,
        ...updates
      };

      const updateData = {
        context: JSON.stringify(mergedContext)
      };

      if (ttl) {
        updateData.expiresAt = new Date(Date.now() + ttl * 1000);
      }

      await knex('agent_context')
        .where({ id: existing.id })
        .update(updateData);

      return await knex('agent_context').where({ id: existing.id }).first();
    } catch (error) {
      console.error(`❌ Error updating context for ${agentName}:`, error);
      throw error;
    }
  },

  /**
   * Delete a specific session context
   * @param {string} agentName - Name of the agent
   * @param {string} sessionId - Session identifier
   * @returns {Promise<boolean>} Success status
   */
  async deleteContext(agentName, sessionId) {
    try {
      await knex('agent_context')
        .where({ agentName, sessionId })
        .del();

      console.log(`🗑️ Deleted context for ${agentName}/${sessionId}`);
      return true;
    } catch (error) {
      console.error(`❌ Error deleting context for ${agentName}:`, error);
      throw error;
    }
  },

  /**
   * Clean up expired contexts (for cron job)
   * @returns {Promise<number>} Number of contexts removed
   */
  async clearExpired() {
    try {
      const now = new Date().toISOString();
      const deleted = await knex('agent_context')
        .where('expiresAt', '<', now)
        .del();

      if (deleted > 0) {
        console.log(`🧹 Cleared ${deleted} expired agent contexts`);
      }

      return deleted;
    } catch (error) {
      console.error('❌ Error clearing expired contexts:', error);
      throw error;
    }
  },

  /**
   * Get all active contexts for an agent
   * @param {string} agentName - Name of the agent
   * @returns {Promise<Array>} Array of active contexts
   */
  async getAgentContexts(agentName) {
    try {
      const now = new Date().toISOString();
      const contexts = await knex('agent_context')
        .where({ agentName })
        .where('expiresAt', '>', now)
        .orderBy('createdAt', 'desc');

      return contexts.map(c => ({
        ...c,
        context: JSON.parse(c.context)
      }));
    } catch (error) {
      console.error(`❌ Error getting contexts for ${agentName}:`, error);
      throw error;
    }
  },

  /**
   * Extend TTL for an existing context
   * @param {string} agentName - Name of the agent
   * @param {string} sessionId - Session identifier
   * @param {number} additionalSeconds - Seconds to add to expiration
   * @returns {Promise<object|null>} Updated context
   */
  async extendTTL(agentName, sessionId, additionalSeconds = 3600) {
    try {
      const existing = await this.getContext(agentName, sessionId);

      if (!existing) {
        return null;
      }

      const newExpiresAt = new Date(new Date(existing.expiresAt).getTime() + additionalSeconds * 1000);

      await knex('agent_context')
        .where({ id: existing.id })
        .update({ expiresAt: newExpiresAt });

      return await knex('agent_context').where({ id: existing.id }).first();
    } catch (error) {
      console.error(`❌ Error extending TTL for ${agentName}:`, error);
      throw error;
    }
  }
};

module.exports = AgentContext;
