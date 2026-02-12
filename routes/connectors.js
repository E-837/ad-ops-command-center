/**
 * Connector Routes
 * Integration status and testing
 */

const express = require('express');
const router = express.Router();
const connectors = require('../connectors');

// Get all connectors
router.get('/', (req, res) => {
  res.json(connectors.getAllConnectors());
});

// Get connector status summary
router.get('/status', (req, res) => {
  res.json(connectors.getConnectorStatus());
});

// Test specific connector connection
router.get('/test/:name', async (req, res) => {
  const connectorName = req.params.name;
  
  try {
    const connector = connectors.getConnector(connectorName);
    
    if (!connector) {
      return res.json({ connected: false, error: 'Connector not found' });
    }
    
    // Check if connector has testConnection method
    if (typeof connector.testConnection === 'function') {
      const result = await connector.testConnection();
      return res.json(result);
    }
    
    // For connectors without testConnection, check if they have connected flag
    const info = connector.getInfo ? connector.getInfo() : {};
    
    if (info.connected !== undefined) {
      return res.json({ 
        connected: info.connected, 
        lastSync: connector.lastSync || null,
        name: info.name
      });
    }
    
    // Default: assume ready means connected for mock connectors
    return res.json({ 
      connected: false, 
      mock: true,
      message: 'Connector is in mock mode'
    });
    
  } catch (err) {
    res.json({ connected: false, error: err.message });
  }
});

module.exports = router;
