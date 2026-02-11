/**
 * Campaigns Model - NEW
 * Track campaigns across platforms
 */

const db = require('../db');

/**
 * Create a new campaign
 */
async function create(campaignData) {
  const id = campaignData.id || `camp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const now = new Date().toISOString();
  
  const campaign = {
    id,
    projectId: campaignData.projectId || null,
    platform: campaignData.platform,
    externalId: campaignData.externalId || null,
    name: campaignData.name,
    status: campaignData.status || 'active',
    budget: campaignData.budget || null,
    startDate: campaignData.startDate || null,
    endDate: campaignData.endDate || null,
    metadata: JSON.stringify(campaignData.metadata || {}),
    syncedAt: now,
    createdAt: now,
    updatedAt: now
  };
  
  await db('campaigns').insert(campaign);
  
  return deserializeCampaign(campaign);
}

/**
 * Create campaign from execution data
 */
async function createFromExecution(executionData) {
  // Extract campaign data from execution result
  const campaignData = {
    projectId: executionData.projectId,
    platform: executionData.platform || executionData.params?.platform,
    externalId: executionData.result?.campaignId || executionData.result?.id,
    name: executionData.result?.name || executionData.params?.name,
    status: executionData.result?.status || 'active',
    budget: executionData.result?.budget || executionData.params?.budget,
    startDate: executionData.result?.startDate || executionData.params?.startDate,
    endDate: executionData.result?.endDate || executionData.params?.endDate,
    metadata: {
      executionId: executionData.id,
      workflowId: executionData.workflowId,
      ...executionData.result
    }
  };
  
  return create(campaignData);
}

/**
 * Update an existing campaign
 */
async function update(campaignId, updates) {
  const existing = await get(campaignId);
  
  if (!existing) {
    throw new Error(`Campaign ${campaignId} not found`);
  }
  
  const updateData = {
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  // Serialize JSON fields if present
  if (updates.metadata !== undefined) {
    updateData.metadata = JSON.stringify(updates.metadata);
  }
  
  // Don't allow changing id or createdAt
  delete updateData.id;
  delete updateData.createdAt;
  
  await db('campaigns').where({ id: campaignId }).update(updateData);
  
  return get(campaignId);
}

/**
 * Get a campaign by ID
 */
async function get(campaignId) {
  const campaign = await db('campaigns')
    .where({ id: campaignId })
    .first();
  
  return campaign ? deserializeCampaign(campaign) : null;
}

/**
 * Get campaign by external ID and platform
 */
async function getByExternalId(platform, externalId) {
  const campaign = await db('campaigns')
    .where({ platform, externalId })
    .first();
  
  return campaign ? deserializeCampaign(campaign) : null;
}

/**
 * List all campaigns with optional filtering
 */
async function list(filter = {}) {
  let query = db('campaigns');
  
  // Filter by projectId
  if (filter.projectId) {
    query = query.where('projectId', filter.projectId);
  }
  
  // Filter by platform
  if (filter.platform) {
    query = query.where('platform', filter.platform);
  }
  
  // Filter by status
  if (filter.status) {
    query = query.where('status', filter.status);
  }
  
  // Sort by most recent first
  query = query.orderBy('updatedAt', 'desc');
  
  // Limit results
  if (filter.limit) {
    query = query.limit(filter.limit);
  }
  
  const campaigns = await query;
  return campaigns.map(deserializeCampaign);
}

/**
 * Get campaigns by project
 */
async function getByProject(projectId) {
  return list({ projectId });
}

/**
 * Get campaigns by platform
 */
async function getByPlatform(platform) {
  return list({ platform });
}

/**
 * Delete a campaign
 */
async function deleteCampaign(campaignId) {
  const existing = await get(campaignId);
  
  if (!existing) {
    return { success: false, error: 'Campaign not found' };
  }
  
  await db('campaigns').where({ id: campaignId }).del();
  
  return { success: true };
}

/**
 * Update campaign sync timestamp
 */
async function markSynced(campaignId) {
  const existing = await get(campaignId);
  
  if (!existing) {
    throw new Error(`Campaign ${campaignId} not found`);
  }
  
  await db('campaigns')
    .where({ id: campaignId })
    .update({ syncedAt: new Date().toISOString() });
  
  return get(campaignId);
}

/**
 * Get campaign statistics
 */
async function getStats() {
  const campaigns = await list();
  
  return {
    total: campaigns.length,
    byPlatform: campaigns.reduce((acc, c) => {
      acc[c.platform] = (acc[c.platform] || 0) + 1;
      return acc;
    }, {}),
    byStatus: campaigns.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {}),
    active: campaigns.filter(c => c.status === 'active').length,
    totalBudget: campaigns.reduce((sum, c) => sum + (parseFloat(c.budget) || 0), 0)
  };
}

/**
 * Helper: Deserialize JSON fields
 */
function deserializeCampaign(campaign) {
  return {
    ...campaign,
    metadata: typeof campaign.metadata === 'string' ? JSON.parse(campaign.metadata) : campaign.metadata
  };
}

module.exports = {
  create,
  createFromExecution,
  update,
  get,
  getByExternalId,
  list,
  getByProject,
  getByPlatform,
  delete: deleteCampaign,
  markSynced,
  getStats
};
