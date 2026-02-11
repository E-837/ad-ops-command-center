/**
 * Search Ad Copy Generator
 * Uses OpenRouter AI to generate Responsive Search Ad headlines and descriptions
 * following brand guidelines and character limits.
 */

const fs = require('fs');
const path = require('path');

// Load API key from .env (same pattern as image-gen.js)
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
 * Load the search brand guide from disk
 * @param {string} [guidePath] - Optional path override
 * @returns {Object} Parsed brand guide
 */
function loadBrandGuide(guidePath) {
  const p = guidePath || path.join(__dirname, '..', 'config', 'search-brand-guide.json');
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

/**
 * Build the AI prompt for generating RSA copy
 * @param {Object} opts
 * @param {string[]} opts.keywords - Target keywords
 * @param {Object} opts.brandGuide - Brand guide object
 * @param {string} opts.adGroupTheme - Ad group theme/intent
 * @returns {string} The prompt
 */
function buildPrompt(opts) {
  const { keywords, brandGuide, adGroupTheme } = opts;
  const g = brandGuide.guidelines;
  const hr = g.headline_rules;
  const dr = g.description_rules;

  return `You are an expert Google Ads copywriter. Generate Responsive Search Ad (RSA) copy for the following campaign.

BRAND: ${brandGuide.brand}
PRODUCT: ${brandGuide.product}
AD GROUP THEME: ${adGroupTheme}
TARGET KEYWORDS: ${keywords.join(', ')}

TONE & VOICE:
- Tone: ${g.tone}
- Voice: ${g.voice}

HEADLINE RULES (STRICT):
- Generate EXACTLY 15 headlines
- Each headline must be ${hr.max_chars} characters or fewer (this is critical — count carefully)
- Must include: ${hr.must_include.join('; ')}
- Use these power words where natural: ${hr.power_words.join(', ')}
- CTAs to use: ${hr.cta_options.join(', ')}
- AVOID: ${hr.avoid.join('; ')}
- Pinning hints:
  - Position 1 (first 2-3 headlines): ${hr.pinning_strategy.position_1}
  - Position 2 (next 3-4 headlines): ${hr.pinning_strategy.position_2}
  - Position 3 (next 2-3 headlines): ${hr.pinning_strategy.position_3}
  - Remaining headlines: Mix of features, benefits, and keyword-rich variations

DESCRIPTION RULES (STRICT):
- Generate EXACTLY 4 descriptions
- Each description must be ${dr.max_chars} characters or fewer (count carefully)
- Must include: ${dr.must_include.join('; ')}
- AVOID: ${dr.avoid.join('; ')}

USPs TO INCORPORATE:
${g.usps.map(u => `- ${u}`).join('\n')}

KEYWORDS TO ECHO IN COPY:
${g.keywords_to_echo.map(k => `- ${k}`).join('\n')}

COMPETITOR CONTEXT: ${g.competitor_context}

COMPLIANCE — DO NOT USE THESE CLAIMS:
${g.compliance.restricted_claims.map(c => `- "${c}"`).join('\n')}

RESPONSE FORMAT — Return valid JSON only, no markdown:
{
  "headlines": [
    {"text": "headline text here", "pin": "position_1|position_2|position_3|none"}
  ],
  "descriptions": [
    {"text": "description text here"}
  ]
}

Double-check every headline is ≤${hr.max_chars} chars and every description is ≤${dr.max_chars} chars before responding.`;
}

/**
 * Call OpenRouter API to generate ad copy
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
 * Validate generated ad copy against brand guidelines
 * @param {Object} raw - Raw AI output { headlines, descriptions }
 * @param {Object} brandGuide - Brand guide
 * @returns {Object} Validated output with per-item validity flags
 */
function validateCopy(raw, brandGuide) {
  const hr = brandGuide.guidelines.headline_rules;
  const dr = brandGuide.guidelines.description_rules;
  const warnings = [];

  const headlines = (raw.headlines || []).map(h => {
    const text = h.text || h;
    const chars = text.length;
    const valid = chars <= hr.max_chars;
    if (!valid) warnings.push(`Headline over limit (${chars}/${hr.max_chars}): "${text}"`);
    return { text, chars, pin: h.pin || 'none', valid };
  });

  const descriptions = (raw.descriptions || []).map(d => {
    const text = d.text || d;
    const chars = text.length;
    const valid = chars <= dr.max_chars;
    if (!valid) warnings.push(`Description over limit (${chars}/${dr.max_chars}): "${text}"`);
    return { text, chars, valid };
  });

  if (headlines.length < hr.min_headlines) {
    warnings.push(`Only ${headlines.length} headlines (need ${hr.min_headlines})`);
  }
  if (descriptions.length < dr.min_descriptions) {
    warnings.push(`Only ${descriptions.length} descriptions (need ${dr.min_descriptions})`);
  }

  return {
    headlines,
    descriptions,
    validation: {
      headlines_valid: headlines.filter(h => h.valid).length,
      descriptions_valid: descriptions.filter(d => d.valid).length,
      warnings
    }
  };
}

/**
 * Generate search ad copy for an ad group using AI
 * @param {Object} options
 * @param {string[]} options.keywords - Target keywords for this ad group
 * @param {Object} [options.brandGuide] - Brand guide object (loaded from file if omitted)
 * @param {string} options.adGroupTheme - Theme/intent of the ad group
 * @param {number} [options.count=1] - Number of sets to generate
 * @param {string} [options.model] - OpenRouter model override
 * @param {boolean} [options.dryRun=false] - If true, return mock data without API call
 * @returns {Promise<Object>} Structured ad copy with validation
 */
async function generateSearchAdCopy(options) {
  const { keywords, adGroupTheme, count = 1, model, dryRun = false } = options;
  const brandGuide = options.brandGuide || loadBrandGuide();

  if (dryRun) {
    return generateDryRunCopy(keywords, adGroupTheme, brandGuide);
  }

  const prompt = buildPrompt({ keywords, brandGuide, adGroupTheme });
  const results = [];

  for (let i = 0; i < count; i++) {
    const { parsed, model: usedModel } = await callOpenRouter(prompt, model);
    const validated = validateCopy(parsed, brandGuide);

    results.push({
      adGroupTheme,
      keywords,
      ...validated,
      model: usedModel
    });

    if (i < count - 1) await new Promise(r => setTimeout(r, 1000));
  }

  return count === 1 ? results[0] : results;
}

/**
 * Generate mock ad copy for dry-run mode (no API calls)
 * @param {string[]} keywords
 * @param {string} adGroupTheme
 * @param {Object} brandGuide
 * @returns {Object} Mock ad copy result
 */
function generateDryRunCopy(keywords, adGroupTheme, brandGuide) {
  const hr = brandGuide.guidelines.headline_rules;
  const product = brandGuide.product;

  const mockHeadlines = [
    { text: `${product} — Pre-Order`, pin: 'position_1' },
    { text: `Locke AI Co. Earbuds`, pin: 'position_1' },
    { text: `AI-Powered Sound`, pin: 'position_2' },
    { text: `Translate 40+ Languages`, pin: 'position_2' },
    { text: `18-Hour AI Battery Life`, pin: 'position_2' },
    { text: `Your Data Stays Private`, pin: 'position_2' },
    { text: `Pre-Order Now — $199`, pin: 'position_3' },
    { text: `Get Yours Today`, pin: 'position_3' },
    { text: `Learn More About Locke`, pin: 'position_3' },
    { text: `Intelligent Earbuds`, pin: 'none' },
    { text: `Seamless AI Assistant`, pin: 'none' },
    { text: `Hands-Free AI in Your Ear`, pin: 'none' },
    { text: `Works With 200+ Apps`, pin: 'none' },
    { text: `Wearable AI — $199`, pin: 'none' },
    { text: `Smart Earbuds, Smarter You`, pin: 'none' }
  ].map(h => ({ ...h, chars: h.text.length, valid: h.text.length <= hr.max_chars }));

  const mockDescriptions = [
    { text: `The first AI-native earbud. Real-time translation in 40+ languages. Pre-order $199.` },
    { text: `On-device AI keeps your data private. 18-hour battery life. Order yours today.` },
    { text: `AI assistant in your ear. Works with 200+ apps. Get 30% off — pre-order now.` },
    { text: `Intelligent earbuds that translate, assist, and adapt. Hands-free AI. Shop now.` }
  ].map(d => ({ ...d, chars: d.text.length, valid: d.text.length <= 90 }));

  return {
    adGroupTheme,
    keywords,
    headlines: mockHeadlines,
    descriptions: mockDescriptions,
    validation: {
      headlines_valid: mockHeadlines.filter(h => h.valid).length,
      descriptions_valid: mockDescriptions.filter(d => d.valid).length,
      warnings: []
    },
    model: 'dry-run (no API call)',
    dryRun: true
  };
}

module.exports = {
  generateSearchAdCopy,
  loadBrandGuide,
  buildPrompt,
  validateCopy,
  DEFAULT_MODEL
};
