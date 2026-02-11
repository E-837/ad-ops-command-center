/**
 * Agent Memory Model
 * Manages long-term agent learnings and knowledge
 */

const knex = require('../db');

const AgentMemory = {
  /**
   * Store a new learning or update existing one
   * @param {string} agentName - Name of the agent
   * @param {string} category - Memory category
   * @param {string} key - Memory key/identifier
   * @param {object} value - Memory value (JSON)
   * @param {number} confidence - Confidence score (0.0 to 1.0)
   * @param {string} source - Source of the learning
   * @returns {Promise<object>} Created/updated memory
   */
  async remember(agentName, category, key, value, confidence = 0.5, source = null) {
    try {
      // Check if memory already exists
      const existing = await knex('agent_memory')
        .where({ agentName, category, key })
        .first();

      if (existing) {
        // Update existing memory
        const updated = await knex('agent_memory')
          .where({ id: existing.id })
          .update({
            value: JSON.stringify(value),
            confidence,
            source,
            updatedAt: knex.fn.now()
          })
          .returning('*');
        
        return updated[0] || (await knex('agent_memory').where({ id: existing.id }).first());
      } else {
        // Create new memory
        const [id] = await knex('agent_memory').insert({
          agentName,
          category,
          key,
          value: JSON.stringify(value),
          confidence,
          source
        });

        return await knex('agent_memory').where({ id }).first();
      }
    } catch (error) {
      console.error(`❌ Error storing memory for ${agentName}:`, error);
      throw error;
    }
  },

  /**
   * Retrieve a specific memory
   * @param {string} agentName - Name of the agent
   * @param {string} category - Memory category
   * @param {string} key - Memory key
   * @returns {Promise<object|null>} Memory object or null
   */
  async recall(agentName, category, key) {
    try {
      const memory = await knex('agent_memory')
        .where({ agentName, category, key })
        .first();

      if (memory && memory.value) {
        memory.value = JSON.parse(memory.value);
      }

      return memory || null;
    } catch (error) {
      console.error(`❌ Error recalling memory for ${agentName}:`, error);
      throw error;
    }
  },

  /**
   * Search memories with filters
   * @param {string} agentName - Name of the agent
   * @param {string} category - Memory category
   * @param {object} filters - Additional filters (minConfidence, source, etc.)
   * @returns {Promise<Array>} Array of matching memories
   */
  async search(agentName, category, filters = {}) {
    try {
      let query = knex('agent_memory')
        .where({ agentName, category });

      // Apply optional filters
      if (filters.minConfidence !== undefined) {
        query = query.where('confidence', '>=', filters.minConfidence);
      }

      if (filters.source) {
        query = query.where('source', 'like', `%${filters.source}%`);
      }

      if (filters.keyPattern) {
        query = query.where('key', 'like', `%${filters.keyPattern}%`);
      }

      // Order by confidence (highest first)
      query = query.orderBy('confidence', 'desc');

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const memories = await query;

      // Parse JSON values
      return memories.map(m => ({
        ...m,
        value: JSON.parse(m.value)
      }));
    } catch (error) {
      console.error(`❌ Error searching memories for ${agentName}:`, error);
      throw error;
    }
  },

  /**
   * Update confidence score for a memory
   * @param {number} id - Memory ID
   * @param {number} newConfidence - New confidence score
   * @returns {Promise<object>} Updated memory
   */
  async updateConfidence(id, newConfidence) {
    try {
      // Clamp confidence between 0 and 1
      const confidence = Math.max(0, Math.min(1, newConfidence));

      await knex('agent_memory')
        .where({ id })
        .update({
          confidence,
          updatedAt: knex.fn.now()
        });

      // If confidence drops below threshold, auto-forget
      if (confidence < 0.3) {
        console.log(`⚠️ Memory ${id} confidence dropped below 0.3, removing...`);
        await this.forget(id);
        return null;
      }

      return await knex('agent_memory').where({ id }).first();
    } catch (error) {
      console.error(`❌ Error updating confidence for memory ${id}:`, error);
      throw error;
    }
  },

  /**
   * Remove a memory (low confidence or outdated)
   * @param {number} id - Memory ID
   * @returns {Promise<boolean>} Success status
   */
  async forget(id) {
    try {
      await knex('agent_memory').where({ id }).del();
      console.log(`🗑️ Forgot memory ${id}`);
      return true;
    } catch (error) {
      console.error(`❌ Error forgetting memory ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get top memories by confidence
   * @param {string} agentName - Name of the agent
   * @param {string} category - Memory category
   * @param {number} limit - Number of memories to retrieve
   * @returns {Promise<Array>} Top memories
   */
  async getTopMemories(agentName, category, limit = 10) {
    try {
      const memories = await knex('agent_memory')
        .where({ agentName, category })
        .orderBy('confidence', 'desc')
        .limit(limit);

      return memories.map(m => ({
        ...m,
        value: JSON.parse(m.value)
      }));
    } catch (error) {
      console.error(`❌ Error getting top memories for ${agentName}:`, error);
      throw error;
    }
  },

  /**
   * Get all memories for an agent
   * @param {string} agentName - Name of the agent
   * @returns {Promise<Array>} All memories
   */
  async getAllMemories(agentName) {
    try {
      const memories = await knex('agent_memory')
        .where({ agentName })
        .orderBy('confidence', 'desc');

      return memories.map(m => ({
        ...m,
        value: JSON.parse(m.value)
      }));
    } catch (error) {
      console.error(`❌ Error getting all memories for ${agentName}:`, error);
      throw error;
    }
  },

  /**
   * Clean up old or low-confidence memories
   * @param {object} options - Cleanup options
   * @returns {Promise<number>} Number of memories removed
   */
  async cleanup(options = {}) {
    try {
      const {
        minConfidence = 0.3,
        olderThanDays = 90
      } = options;

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const deleted = await knex('agent_memory')
        .where('confidence', '<', minConfidence)
        .orWhere('updatedAt', '<', cutoffDate)
        .del();

      console.log(`🧹 Cleaned up ${deleted} old/low-confidence memories`);
      return deleted;
    } catch (error) {
      console.error('❌ Error during memory cleanup:', error);
      throw error;
    }
  }
};

module.exports = AgentMemory;
