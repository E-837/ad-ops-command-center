/**
 * Campaign History Store
 * Historical campaign performance for learning
 */

const fs = require('fs');
const path = require('path');

const MEMORY_DIR = path.join(__dirname, '..', 'database', 'memory');
const HISTORY_FILE = path.join(MEMORY_DIR, 'campaign-history.json');

// Ensure directory exists
if (!fs.existsSync(MEMORY_DIR)) {
  fs.mkdirSync(MEMORY_DIR, { recursive: true });
}

function loadHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('[campaign-history] Load error:', err.message);
  }
  return { campaigns: {}, learnings: [] };
}

function saveHistory(data) {
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('[campaign-history] Save error:', err.message);
  }
}

/**
 * Record campaign snapshot
 */
function recordSnapshot(campaign, metrics) {
  const history = loadHistory();
  const campaignId = campaign.id;
  
  if (!history.campaigns[campaignId]) {
    history.campaigns[campaignId] = {
      info: {
        name: campaign.name,
        dsp: campaign.dsp,
        lob: campaign.lob,
        channel: campaign.channel,
        funnel: campaign.funnel,
        budget: campaign.budget,
        startDate: campaign.startDate,
        endDate: campaign.endDate
      },
      snapshots: []
    };
  }
  
  history.campaigns[campaignId].snapshots.push({
    date: new Date().toISOString().split('T')[0],
    spent: campaign.spent,
    metrics,
    timestamp: new Date().toISOString()
  });
  
  // Keep last 90 days of snapshots per campaign
  if (history.campaigns[campaignId].snapshots.length > 90) {
    history.campaigns[campaignId].snapshots = 
      history.campaigns[campaignId].snapshots.slice(-90);
  }
  
  saveHistory(history);
  return true;
}

/**
 * Get campaign history
 */
function getCampaignHistory(campaignId) {
  const history = loadHistory();
  return history.campaigns[campaignId] || null;
}

/**
 * Record a learning from campaign
 */
function recordLearning(learning) {
  const history = loadHistory();
  
  history.learnings.push({
    id: `learn-${Date.now()}`,
    ...learning,
    timestamp: new Date().toISOString()
  });
  
  // Keep last 500 learnings
  if (history.learnings.length > 500) {
    history.learnings = history.learnings.slice(-500);
  }
  
  saveHistory(history);
  return true;
}

/**
 * Get learnings by category
 */
function getLearnings(category = null) {
  const history = loadHistory();
  
  if (category) {
    return history.learnings.filter(l => l.category === category);
  }
  
  return history.learnings;
}

/**
 * Find similar campaigns for benchmarking
 */
function findSimilarCampaigns(criteria) {
  const history = loadHistory();
  const matches = [];
  
  for (const [id, campaign] of Object.entries(history.campaigns)) {
    let score = 0;
    
    if (criteria.lob && campaign.info.lob === criteria.lob) score++;
    if (criteria.channel && campaign.info.channel === criteria.channel) score++;
    if (criteria.funnel && campaign.info.funnel === criteria.funnel) score++;
    if (criteria.dsp && campaign.info.dsp === criteria.dsp) score++;
    
    if (score > 0) {
      matches.push({
        id,
        ...campaign.info,
        matchScore: score,
        snapshotCount: campaign.snapshots.length
      });
    }
  }
  
  return matches.sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Get historical averages for benchmarking
 */
function getHistoricalAverages(criteria) {
  const similar = findSimilarCampaigns(criteria);
  const history = loadHistory();
  
  if (similar.length === 0) return null;
  
  const allMetrics = [];
  
  for (const match of similar.slice(0, 10)) { // Top 10 matches
    const campaign = history.campaigns[match.id];
    if (campaign && campaign.snapshots.length > 0) {
      // Get final snapshot metrics
      const lastSnapshot = campaign.snapshots[campaign.snapshots.length - 1];
      if (lastSnapshot.metrics) {
        allMetrics.push(lastSnapshot.metrics);
      }
    }
  }
  
  if (allMetrics.length === 0) return null;
  
  // Calculate averages
  const averages = {};
  const metricKeys = Object.keys(allMetrics[0]);
  
  for (const key of metricKeys) {
    const values = allMetrics.map(m => m[key]).filter(v => typeof v === 'number');
    if (values.length > 0) {
      averages[key] = values.reduce((a, b) => a + b, 0) / values.length;
    }
  }
  
  return {
    sampleSize: allMetrics.length,
    averages
  };
}

/**
 * Get all campaign IDs
 */
function getAllCampaignIds() {
  const history = loadHistory();
  return Object.keys(history.campaigns);
}

/**
 * Get campaign count by dimension
 */
function getCampaignCounts() {
  const history = loadHistory();
  const counts = {
    total: Object.keys(history.campaigns).length,
    byLOB: {},
    byChannel: {},
    byDSP: {},
    byFunnel: {}
  };
  
  for (const campaign of Object.values(history.campaigns)) {
    const { lob, channel, dsp, funnel } = campaign.info;
    
    counts.byLOB[lob] = (counts.byLOB[lob] || 0) + 1;
    counts.byChannel[channel] = (counts.byChannel[channel] || 0) + 1;
    counts.byDSP[dsp] = (counts.byDSP[dsp] || 0) + 1;
    counts.byFunnel[funnel] = (counts.byFunnel[funnel] || 0) + 1;
  }
  
  return counts;
}

module.exports = {
  recordSnapshot,
  getCampaignHistory,
  recordLearning,
  getLearnings,
  findSimilarCampaigns,
  getHistoricalAverages,
  getAllCampaignIds,
  getCampaignCounts
};
