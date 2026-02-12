/**
 * Campaign Routes
 * CRUD operations for campaigns
 */

const express = require('express');
const router = express.Router();
const campaigns = require('../database/campaigns');
const connectors = require('../connectors');
const { success, created, updated } = require('../utils/response');
const { NotFoundError, ValidationError } = require('../utils/errors');

// Get all campaigns
router.get('/', async (req, res, next) => {
  try {
    // First sync from connectors
    const allCampaigns = await connectors.fetchAllCampaigns();
    if (allCampaigns.campaigns.length > 0) {
      campaigns.syncFromConnectors(allCampaigns.campaigns);
    }
    
    // Then return with filters
    const result = campaigns.getAll(req.query);
    res.json(success(result));
  } catch (err) {
    next(err); // Pass to error handler
  }
});

// Get campaign by ID
router.get('/:id', (req, res, next) => {
  try {
    const campaign = campaigns.getById(req.params.id);
    if (!campaign) {
      throw new NotFoundError('Campaign', req.params.id);
    }
    res.json(success(campaign));
  } catch (err) {
    next(err);
  }
});

// Create campaign
router.post('/', (req, res, next) => {
  try {
    const campaign = campaigns.create(req.body);
    res.status(201).json(created(campaign, campaign.id));
  } catch (err) {
    next(new ValidationError(err.message));
  }
});

// Update campaign
router.patch('/:id', (req, res, next) => {
  try {
    const campaign = campaigns.update(req.params.id, req.body);
    if (!campaign) {
      throw new NotFoundError('Campaign', req.params.id);
    }
    res.json(updated(campaign, req.params.id));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
