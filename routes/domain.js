/**
 * Domain Routes
 * Domain knowledge, taxonomy, glossary, and benchmarks
 */

const express = require('express');
const router = express.Router();
const domain = require('../domain');

// Get full taxonomy
router.get('/taxonomy', (req, res) => {
  res.json(domain.getFullTaxonomy());
});

// Get glossary and definitions
router.get('/glossary', (req, res) => {
  const { term, category } = req.query;
  
  if (term) {
    const definition = domain.define(term);
    if (!definition) {
      return res.status(404).json({ error: 'Term not found' });
    }
    return res.json(definition);
  }
  
  if (category) {
    return res.json(domain.getTermsByCategory(category));
  }
  
  res.json({
    categories: domain.CATEGORIES,
    termCount: domain.getTermCount ? domain.getTermCount() : Object.keys(domain.glossary).length
  });
});

// Get industry benchmarks
router.get('/benchmarks', (req, res) => {
  const { lob, channel, funnel } = req.query;
  
  if (lob && channel && funnel) {
    return res.json(domain.getCampaignBenchmarks(lob, channel, funnel));
  }
  
  res.json({
    cpm: domain.CPM_BENCHMARKS,
    ctr: domain.CTR_BENCHMARKS,
    cpa: domain.CPA_BENCHMARKS,
    roas: domain.ROAS_BENCHMARKS
  });
});

// Get optimization rules
router.get('/rules', (req, res) => {
  res.json(domain.getAllRules());
});

// Get domain statistics
router.get('/stats', (req, res) => {
  res.json(domain.getStats());
});

module.exports = router;
