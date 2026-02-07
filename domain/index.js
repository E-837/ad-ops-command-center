/**
 * Domain Layer - Ad Tech Semantic Model
 * Unified exports for taxonomy, benchmarks, glossary, and rules
 */

const taxonomy = require('./taxonomy');
const benchmarks = require('./benchmarks');
const glossary = require('./glossary');
const rules = require('./rules');

module.exports = {
  // Taxonomy
  ...taxonomy,
  
  // Benchmarks  
  ...benchmarks,
  
  // Glossary
  glossary: glossary.GLOSSARY,
  define: glossary.define,
  explain: glossary.explain,
  searchGlossary: glossary.search,
  getTermsByCategory: glossary.getByCategory,
  
  // Rules
  ...rules,
  
  // Convenience methods
  
  /**
   * Get full context for a campaign configuration
   */
  getCampaignContext(lob, channel, funnel, dsp) {
    return {
      taxonomy: {
        lob: taxonomy.LOB[lob.toUpperCase()],
        channel: taxonomy.CHANNEL[channel.toUpperCase().replace('-', '_')],
        funnel: taxonomy.FUNNEL[funnel.toUpperCase()],
        dsp: taxonomy.DSP[dsp.toUpperCase().replace('-', '_')]
      },
      validation: taxonomy.validateCombination(lob, channel, funnel, dsp),
      benchmarks: benchmarks.getCampaignBenchmarks(lob, channel, funnel),
      rules: {
        budget: rules.BUDGET_RULES,
        pacing: rules.PACING_RULES,
        viewability: rules.VIEWABILITY_RULES.minimums[channel],
        frequency: rules.getRecommendedFrequencyCap(funnel)
      }
    };
  },
  
  /**
   * Quick explanation of any ad tech term
   */
  whatIs(term) {
    const definition = glossary.define(term);
    if (definition) {
      return glossary.explain(term);
    }
    
    // Check taxonomy
    const taxNode = taxonomy.getNode(term);
    if (taxNode) {
      return `${taxNode.name}: ${taxNode.description}`;
    }
    
    return `Unknown term: ${term}. Try searching the glossary.`;
  },
  
  /**
   * Get domain statistics
   */
  getStats() {
    return {
      lobs: Object.keys(taxonomy.LOB).length,
      channels: Object.keys(taxonomy.CHANNEL).length,
      funnelStages: Object.keys(taxonomy.FUNNEL).length,
      markets: Object.keys(taxonomy.MARKET).length,
      dsps: Object.keys(taxonomy.DSP).length,
      glossaryTerms: glossary.getTermCount(),
      ruleCategories: Object.keys(rules.getAllRules()).length
    };
  }
};
