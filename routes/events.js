/**
 * Event Routes
 * Event querying and statistics
 */

const express = require('express');
const router = express.Router();
const events = require('../database/events');

// Query events with filters
router.get('/', (req, res) => {
  try {
    const filter = {
      type: req.query.type,
      source: req.query.source,
      projectId: req.query.projectId,
      workflowId: req.query.workflowId,
      limit: req.query.limit ? parseInt(req.query.limit) : 100
    };
    
    const eventList = events.query(filter);
    const stats = events.getStats();
    
    res.json({
      events: eventList,
      stats: stats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
