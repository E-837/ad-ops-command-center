/**
 * Template Routes
 * Workflow template management
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const workflows = require('../workflows');

const templatesDir = path.join(__dirname, '..', 'workflows', 'templates');

// Get all templates
router.get('/', (req, res) => {
  try {
    const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.json'));
    
    const templates = files.map(file => {
      const content = fs.readFileSync(path.join(templatesDir, file), 'utf8');
      return JSON.parse(content);
    });
    
    // Filter by category if provided
    if (req.query.category) {
      const filtered = templates.filter(t => t.category === req.query.category);
      return res.json(filtered);
    }
    
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get template by ID
router.get('/:id', (req, res) => {
  try {
    const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.json'));
    
    for (const file of files) {
      const content = fs.readFileSync(path.join(templatesDir, file), 'utf8');
      const template = JSON.parse(content);
      if (template.id === req.params.id) {
        return res.json(template);
      }
    }
    
    res.status(404).json({ error: 'Template not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Run template with parameters
router.post('/:id/run', async (req, res) => {
  try {
    const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.json'));
    
    let template = null;
    for (const file of files) {
      const content = fs.readFileSync(path.join(templatesDir, file), 'utf8');
      const t = JSON.parse(content);
      if (t.id === req.params.id) {
        template = t;
        break;
      }
    }
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    const { values } = req.body;
    
    // Merge with defaults
    const input = { ...template.defaults, ...values };
    
    // Execute workflow
    const execution = await workflows.execute(template.workflow, input, {
      projectId: req.body.projectId,
      metadata: {
        templateId: template.id,
        templateName: template.name
      }
    });
    
    res.json({
      executionId: execution.id,
      status: execution.status,
      workflowId: template.workflow
    });
  } catch (err) {
    console.error('Template execution error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Create custom template
router.post('/', (req, res) => {
  try {
    const template = req.body;
    
    // Validate template
    if (!template.id || !template.name || !template.workflow) {
      return res.status(400).json({ error: 'Missing required fields: id, name, workflow' });
    }
    
    // Save to custom templates directory
    const customDir = path.join(templatesDir, 'custom');
    if (!fs.existsSync(customDir)) {
      fs.mkdirSync(customDir, { recursive: true });
    }
    
    const filePath = path.join(customDir, `${template.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(template, null, 2));
    
    res.json(template);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete custom template
router.delete('/:id', (req, res) => {
  try {
    // Only allow deleting custom templates
    const customDir = path.join(templatesDir, 'custom');
    const filePath = path.join(customDir, `${req.params.id}.json`);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ message: 'Template deleted' });
    } else {
      res.status(404).json({ error: 'Template not found or cannot be deleted' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
