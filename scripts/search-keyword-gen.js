/**
 * AI Keyword Research Generator
 * Uses OpenRouter AI to generate structured keyword lists from campaign briefs.
 * Organizes keywords into ad groups by intent/theme with appropriate match types.
 */

const fs = require('fs');
const path = require('path');

// Load API key from .env (same pattern as search-copy-gen.js)
let OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
if (!OPENROUTER_API_KEY) {
  try {
    const envFile = fs.readFileSync(path.join(__dirname, '..', 'config', '.env'), 'utf8');
    for (const line of envFile.split('\n')) {
      const idx = line.indexOf('=');
      if (idx > 0 && line.substring(0, idx).trim() === 'OPENROUTER_API_KEY') {
        OPENROUTER_API_KEY = line.substring(idx + 1).trim();
        break;
      }
    }
  } catch (_) {}
}

const DEFAULT_MODEL = 'x-ai/grok-4.1-fast';

/**
 * Build the AI prompt for keyword research
 * @param {Object} opts
 * @param {string} opts.brand - Brand name
 * @param {string} opts.product - Product name
 * @param {string} opts.description - Product/campaign description
 * @param {string[]} [opts.usps] - Unique selling propositions
 * @param {string} [opts.targetAudience] - Target audience description
 * @param {string[]} [opts.competitors] - Competitor names/products
 * @param {string[]} [opts.seedKeywords] - Optional seed keywords to incorporate
 * @param {string} [opts.price] - Product price
 * @returns {string} The prompt
 */
function buildKeywordPrompt(opts) {
  const { brand, product, description, usps, targetAudience, competitors, seedKeywords, price } = opts;

  return `You are an expert Google Ads keyword strategist. Generate a comprehensive keyword list for a search campaign.

BRAND: ${brand}
PRODUCT: ${product}
PRICE: ${price || 'N/A'}
DESCRIPTION: ${description}

${usps && usps.length ? `UNIQUE SELLING PROPOSITIONS:\n${usps.map(u => `- ${u}`).join('\n')}` : ''}

${targetAudience ? `TARGET AUDIENCE: ${targetAudience}` : ''}

${competitors && competitors.length ? `COMPETITORS: ${competitors.join(', ')}` : ''}

${seedKeywords && seedKeywords.length ? `SEED KEYWORDS (incorporate these): ${seedKeywords.join(', ')}` : ''}

INSTRUCTIONS:
Generate 5-7 ad groups organized by search intent and theme. For each ad group provide 5-10 keywords.

AD GROUP TYPES TO INCLUDE:
1. Brand — brand name variations, product name variations (EXACT match)
2. Generic — category terms, feature terms (PHRASE match)
3. Long-tail — specific use cases, questions, comparison queries (BROAD match)
4. Competitor — "alternative to X", "vs X" queries (BROAD match)
5. Feature — specific product features as search terms (PHRASE match)
6-7. Additional theme-based groups relevant to the product

MATCH TYPE GUIDELINES:
- EXACT: Brand terms, high-intent product-specific terms
- PHRASE: Generic category terms, feature terms
- BROAD: Long-tail queries, question queries, broad discovery terms

Also generate 10-15 negative keywords to exclude irrelevant traffic (e.g., "free", "cheap", "repair", "manual", job-related terms).

RESPONSE FORMAT — Return valid JSON only, no markdown:
{
  "adGroups": [
    {
      "theme": "Brand",
      "intent": "navigational",
      "keywords": [
        { "text": "keyword here", "matchType": "EXACT" }
      ]
    }
  ],
  "negativeKeywords": ["free", "cheap", ...]
}

Generate commercially relevant keywords with real search volume potential. Focus on high-intent terms that indicate purchase or research intent.`;
}

/**
 * Call OpenRouter API to generate keywords
 * @param {string} prompt - The prompt
 * @param {string} [model] - Model to use
 * @returns {Object} Parsed JSON response
 */
async function callOpenRouter(prompt, model) {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY not set — check config/.env');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model || DEFAULT_MODEL,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    }),
    signal: controller.signal
  });
  clearTimeout(timer);

  const data = await res.json();
  if (data.error) {
    throw new Error(data.error.message || JSON.stringify(data.error));
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('No content in OpenRouter response');
  }

  return { parsed: JSON.parse(content), model: data.model || model || DEFAULT_MODEL };
}

/**
 * Generate mock keywords for dry-run mode (no API calls)
 * @param {Object} opts - Same options as generateKeywords
 * @returns {Object} Mock keyword research result
 */
function generateDryRunKeywords(opts) {
  const { brand, product, competitors } = opts;
  const brandLower = brand.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
  const productLower = product.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();

  // Derive short brand name (first word)
  const brandShort = brandLower.split(' ')[0];

  const adGroups = [
    {
      theme: 'Brand',
      intent: 'navigational',
      keywords: [
        { text: productLower, matchType: 'EXACT' },
        { text: brandLower, matchType: 'EXACT' },
        { text: `${brandShort} earbuds`, matchType: 'PHRASE' },
        { text: `buy ${productLower}`, matchType: 'EXACT' },
        { text: `${brandShort} wearable`, matchType: 'PHRASE' },
        { text: `${productLower} review`, matchType: 'PHRASE' },
        { text: `${productLower} price`, matchType: 'EXACT' },
        { text: `${brandShort} ai device`, matchType: 'PHRASE' }
      ]
    },
    {
      theme: 'Generic — AI Earbuds',
      intent: 'commercial',
      keywords: [
        { text: 'ai earbuds', matchType: 'PHRASE' },
        { text: 'smart earbuds', matchType: 'PHRASE' },
        { text: 'ai powered earbuds', matchType: 'PHRASE' },
        { text: 'intelligent earbuds', matchType: 'BROAD' },
        { text: 'earbuds with ai', matchType: 'PHRASE' },
        { text: 'best ai earbuds 2026', matchType: 'PHRASE' },
        { text: 'wireless ai earbuds', matchType: 'BROAD' }
      ]
    },
    {
      theme: 'Generic — Wearable AI',
      intent: 'commercial',
      keywords: [
        { text: 'wearable ai device', matchType: 'PHRASE' },
        { text: 'ai wearable', matchType: 'BROAD' },
        { text: 'wearable ai assistant', matchType: 'PHRASE' },
        { text: 'wearable technology ai', matchType: 'BROAD' },
        { text: 'ai companion device', matchType: 'PHRASE' },
        { text: 'personal ai device', matchType: 'PHRASE' }
      ]
    },
    {
      theme: 'Feature — Translation',
      intent: 'commercial',
      keywords: [
        { text: 'translation earbuds', matchType: 'EXACT' },
        { text: 'real time translation earbuds', matchType: 'PHRASE' },
        { text: 'language translation earbuds', matchType: 'PHRASE' },
        { text: 'earbuds that translate', matchType: 'BROAD' },
        { text: 'live translation device', matchType: 'PHRASE' },
        { text: 'translator earbuds 2026', matchType: 'PHRASE' }
      ]
    },
    {
      theme: 'Feature — Privacy & On-Device AI',
      intent: 'informational',
      keywords: [
        { text: 'private ai earbuds', matchType: 'PHRASE' },
        { text: 'on device ai processing', matchType: 'BROAD' },
        { text: 'earbuds with offline ai', matchType: 'BROAD' },
        { text: 'privacy first wearable', matchType: 'PHRASE' },
        { text: 'secure ai assistant', matchType: 'BROAD' }
      ]
    },
    {
      theme: 'Competitor',
      intent: 'commercial',
      keywords: [
        { text: 'airpods alternative with ai', matchType: 'BROAD' },
        ...(competitors || []).slice(0, 4).map(c => ({
          text: `${c.toLowerCase()} alternative`, matchType: 'BROAD'
        })),
        { text: 'best earbuds with assistant', matchType: 'BROAD' },
        { text: 'earbuds better than airpods', matchType: 'BROAD' }
      ]
    },
    {
      theme: 'Long-Tail — Use Cases',
      intent: 'informational',
      keywords: [
        { text: 'earbuds for language learning', matchType: 'BROAD' },
        { text: 'ai assistant for commute', matchType: 'BROAD' },
        { text: 'hands free ai for meetings', matchType: 'BROAD' },
        { text: 'earbuds that summarize meetings', matchType: 'BROAD' },
        { text: 'best earbuds for remote work 2026', matchType: 'BROAD' },
        { text: 'ai earbuds for productivity', matchType: 'BROAD' }
      ]
    }
  ];

  const negativeKeywords = [
    'free', 'cheap', 'used', 'repair', 'manual', 'troubleshoot',
    'hack', 'jailbreak', 'refurbished', 'broken', 'fix',
    'job', 'hiring', 'salary', 'careers'
  ];

  const totalKeywords = adGroups.reduce((sum, ag) => sum + ag.keywords.length, 0);

  return {
    adGroups,
    negativeKeywords,
    totalKeywords,
    model: 'dry-run (no API call)',
    dryRun: true
  };
}

/**
 * Generate keywords from a campaign brief using AI
 * @param {Object} options
 * @param {string} options.brand - Brand name
 * @param {string} options.product - Product name
 * @param {string} options.description - Product/campaign description
 * @param {string[]} [options.usps] - Unique selling propositions
 * @param {string} [options.targetAudience] - Target audience
 * @param {string[]} [options.competitors] - Competitor products
 * @param {string[]} [options.seedKeywords] - Seed keywords to incorporate
 * @param {string} [options.price] - Product price
 * @param {string} [options.model] - OpenRouter model override
 * @param {boolean} [options.dryRun=false] - If true, return mock data without API call
 * @returns {Promise<Object>} Structured keyword research output
 */
async function generateKeywords(options) {
  const { model, dryRun = false } = options;

  if (dryRun) {
    return generateDryRunKeywords(options);
  }

  const prompt = buildKeywordPrompt(options);
  const { parsed, model: usedModel } = await callOpenRouter(prompt, model);

  const totalKeywords = (parsed.adGroups || []).reduce((sum, ag) => sum + (ag.keywords || []).length, 0);

  return {
    adGroups: parsed.adGroups || [],
    negativeKeywords: parsed.negativeKeywords || [],
    totalKeywords,
    model: usedModel
  };
}

/**
 * Extract keyword generation options from a campaign config JSON
 * @param {Object} campaignConfig - Parsed campaign config
 * @returns {Object} Options suitable for generateKeywords
 */
function extractFromCampaignConfig(campaignConfig) {
  const brief = campaignConfig.brief || {};
  const search = campaignConfig.search || {};

  return {
    brand: campaignConfig.brand,
    product: campaignConfig.product,
    description: brief.executiveSummary || brief.valueProposition || campaignConfig.tagline || '',
    usps: brief.messagePillars || [],
    targetAudience: campaignConfig.targetAudience || brief.audience?.primary || '',
    competitors: search.competitors || [],
    seedKeywords: search.seedKeywords || [],
    price: campaignConfig.price || ''
  };
}

module.exports = {
  generateKeywords,
  extractFromCampaignConfig,
  buildKeywordPrompt,
  DEFAULT_MODEL
};
