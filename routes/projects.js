/**
 * Project Routes
 * Project management and execution tracking
 */

const express = require('express');
const router = express.Router();
const projects = require('../database/projects');
const executions = require('../database/executions');

// List all projects with filters
router.get('/', (req, res) => {
  try {
    const filter = {
      type: req.query.type,
      status: req.query.status,
      owner: req.query.owner,
      platform: req.query.platform,
      health: req.query.health,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined
    };
    
    const projectList = projects.list(filter);
    const stats = projects.getStats();
    
    res.json({
      projects: projectList,
      stats: stats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new project
router.post('/', (req, res) => {
  try {
    const project = projects.create(req.body);
    res.json(project);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get project by ID
router.get('/:id', (req, res) => {
  try {
    const project = projects.get(req.params.id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Include execution details
    const projectExecutions = executions.list({ projectId: req.params.id });
    
    res.json({
      ...project,
      executionDetails: projectExecutions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update project
router.patch('/:id', (req, res) => {
  try {
    const project = projects.update(req.params.id, req.body);
    res.json(project);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// Delete project
router.delete('/:id', (req, res) => {
  try {
    const result = projects.delete(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get project executions
router.get('/:id/executions', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const projectExecutions = executions.getRecentByProject(req.params.id, limit);
    res.json(projectExecutions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
