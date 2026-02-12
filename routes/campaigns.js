/**
 * Campaign Routes
 * CRUD operations for campaigns
 */

const express = require('express');
const router = express.Router();
const campaigns = require('../database/campaigns');
const connectors = require('../connectors');

// Get all campaigns
router.get('/', async (req, res) => {
  try {
    // First sync from connectors
    const allCampaigns = await connectors.fetchAllCampaigns();
    if (allCampaigns.campaigns.length > 0) {
      campaigns.syncFromConnectors(allCampaigns.campaigns);
    }
    
    // Then return with filters
    const result = campaigns.getAll(req.query);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get campaign by ID
router.get('/:id', (req, res) => {
  const campaign = campaigns.getById(req.params.id);
  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }
  res.json(campaign);
});

// Create campaign
router.post('/', (req, res) => {
  try {
    const campaign = campaigns.create(req.body);
    res.json(campaign);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update campaign
router.patch('/:id', (req, res) => {
  try {
    const campaign = campaigns.update(req.params.id, req.body);
    res.json(campaign);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

module.exports = router;
