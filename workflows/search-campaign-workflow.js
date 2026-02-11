/**
 * Search Campaign Workflow
 * End-to-end search campaign creation: AI Keyword Research → Ad Copy → Campaign Build → Report
 */

const path = require('path');
const fs = require('fs');
const { generateSearchAdCopy, loadBrandGuide } = require(path.join(__dirname, '..', 'scripts', 'search-copy-gen'));
const { generateKeywords, extractFromCampaignConfig } = require(path.join(__dirname, '..', 'scripts', 'search-keyword-gen'));
const googleAds = require(path.join(__dirname, '..', 'connectors', 'google-ads'));

const name = 'Search Campaign Workflow';
const description = 'End-to-end search campaign creation with AI keyword research and AI-generated RSA copy';

const STAGES = [
  { id: 'keywords', name: 'AI Keyword Research' },
  { id: 'copy', name: 'AI Ad Copy Generation' },
  { id: 'build', name: 'Campaign Creation (Google Ads)' },
  { id: 'report', name: 'Review Report' }
];

/** Default campaign config for the Locke AirPod AI demo */
const DEFAULT_CONFIG = {
  campaignName: 'Locke AirPod AI — Search',
  budget: 5000,
  biddingStrategy: 'MANUAL_CPC',
  targetCpa: 50,
  startDate: '2026-03-15',
  endDate: '2026-05-31',
  finalUrl: 'https://lockeai.co/airpod-ai',
  path1: 'AirPod-AI',
  path2: 'Shop'
};

/**
 * Load campaign config from a JSON file
 * @param {string} [configName] - Config file name (without extension) in config/campaigns/
 * @returns {Object} Campaign config
 */
function loadCampaignConfig(configName) {
  const tryPaths = configName
    ? [`${configName}.json`, `${configName}-search.json`]
    : ['locke-airpod-ai.json'];

  for (const filename of tryPaths) {
    try {
      const configPath = path.join(__dirname, '..', 'config', 'campaigns', filename);
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (_) {}
  }
  return null;
}

/**
 * Load search campaign config — merges campaign JSON with defaults
 * @param {string} [configName] - Config file name
 * @returns {Object} Campaign config with search fields
 */
function loadConfig(configName) {
  const campaignJson = loadCampaignConfig(configName);
  if (!campaignJson) return { ...DEFAULT_CONFIG, adGroups: [] };

  const search = campaignJson.search || {};
  return {
    campaignName: `${campaignJson.product} — Search`,
    budget: search.dailyBudget || DEFAULT_CONFIG.budget,
    biddingStrategy: search.biddingStrategy || DEFAULT_CONFIG.biddingStrategy,
    targetCpa: search.targetCpa || DEFAULT_CONFIG.targetCpa,
    startDate: campaignJson.flightStart || DEFAULT_CONFIG.startDate,
    endDate: campaignJson.flightEnd || DEFAULT_CONFIG.endDate,
    finalUrl: DEFAULT_CONFIG.finalUrl,
    path1: DEFAULT_CONFIG.path1,
    path2: DEFAULT_CONFIG.path2,
    // Campaign data for AI keyword gen
    _campaignJson: campaignJson,
    // Will be populated by Stage 1
    adGroups: []
  };
}

/**
 * Stage 1: AI Keyword Research
 * Generates keywords from the campaign brief using AI, or uses provided keywords
 */
async function stageKeywords(config, log, dryRun, keywordOverrides) {
  log('\n⏳ Search Stage 1/4: AI Keyword Research...');
  const stage = { id: 'keywords', name: 'AI Keyword Research', status: 'running', startedAt: new Date().toISOString() };

  try {
    let keywordResult;

    if (keywordOverrides && keywordOverrides.length) {
      // Manual override mode — wrap provided keywords in a single ad group
      log('   📝 Using provided keyword overrides...');
      keywordResult = {
        adGroups: [{
          theme: 'Custom Keywords',
          intent: 'mixed',
          keywords: keywordOverrides.map(kw => ({ text: kw.trim(), matchType: 'PHRASE' }))
        }],
        negativeKeywords: [],
        totalKeywords: keywordOverrides.length,
        model: 'manual-override',
        dryRun: false
      };
    } else if (config._campaignJson) {
      // AI generation from campaign config
      log('   🤖 Generating keywords from campaign brief...');
      const kwOpts = extractFromCampaignConfig(config._campaignJson);
      kwOpts.dryRun = dryRun;
      keywordResult = await generateKeywords(kwOpts);
      log(`   ✅ Generated ${keywordResult.totalKeywords} keywords in ${keywordResult.adGroups.length} ad groups`);
    } else {
      throw new Error('No campaign config or keyword overrides provided');
    }

    // Populate config.adGroups from the result
    config.adGroups = keywordResult.adGroups.map(ag => ({
      name: ag.theme,
      theme: `${ag.theme} — ${ag.intent} intent`,
      keywords: ag.keywords
    }));

    stage.status = 'completed';
    stage.output = {
      adGroupCount: keywordResult.adGroups.length,
      totalKeywords: keywordResult.totalKeywords,
      negativeKeywords: keywordResult.negativeKeywords || [],
      model: keywordResult.model,
      adGroups: keywordResult.adGroups.map(ag => ({
        name: ag.theme,
        intent: ag.intent,
        keywordCount: (ag.keywords || []).length,
        keywords: (ag.keywords || []).map(k => `[${k.matchType}] ${k.text}`)
      }))
    };
  } catch (err) {
    log(`   ❌ Keyword research failed: ${err.message}`);
    stage.status = 'failed';
    stage.error = err.message;
  }

  stage.completedAt = new Date().toISOString();
  return stage;
}

/**
 * Stage 2: AI Ad Copy Generation
 * Generates RSA headlines + descriptions for each ad group
 */
async function stageCopyGen(config, brandGuide, log, dryRun) {
  log('\n⏳ Search Stage 2/4: AI Ad Copy Generation...');
  const stage = { id: 'copy', name: 'AI Ad Copy Generation', status: 'running', startedAt: new Date().toISOString() };

  const adCopySets = [];
  for (let i = 0; i < config.adGroups.length; i++) {
    const ag = config.adGroups[i];
    log(`   ✍️  [${i + 1}/${config.adGroups.length}] Generating copy for "${ag.name}"...`);

    try {
      const result = await generateSearchAdCopy({
        keywords: ag.keywords.map(k => k.text),
        brandGuide,
        adGroupTheme: ag.theme,
        dryRun
      });
      adCopySets.push({ adGroup: ag.name, ...result });
    } catch (err) {
      log(`   ⚠️  Copy gen failed for "${ag.name}": ${err.message}`);
      adCopySets.push({ adGroup: ag.name, error: err.message });
    }

    if (!dryRun && i < config.adGroups.length - 1) {
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  const successCount = adCopySets.filter(s => !s.error).length;
  stage.status = successCount > 0 ? 'completed' : 'failed';
  stage.output = { setsGenerated: successCount, totalSets: config.adGroups.length, adCopySets };
  stage.completedAt = new Date().toISOString();
  return stage;
}

/**
 * Stage 3: Campaign Creation in Google Ads
 * Creates campaign → ad groups → keywords → RSAs
 */
async function stageBuild(config, adCopySets, log, dryRun) {
  log('\n⏳ Search Stage 3/4: Campaign Creation (Google Ads)...');
  const stage = { id: 'build', name: 'Campaign Creation', status: 'running', startedAt: new Date().toISOString() };

  const budgetMicros = config.budget * 1000000;

  // Create campaign (budget is created internally by the connector)
  log(`   📦 Creating campaign: "${config.campaignName}"...`);
  let campaignResult;
  try {
    campaignResult = dryRun
      ? { sandbox: true, campaign: { resourceName: 'customers/demo/campaigns/dry-run-001', id: 'dry-run-001', name: config.campaignName } }
      : await googleAds.handleToolCall('google_ads_create_campaign', {
          name: `${config.campaignName} ${new Date().toISOString().slice(0, 16)}`,
          budget_micros: budgetMicros,
          campaign_type: 'SEARCH',
          bidding_strategy: config.biddingStrategy,
          target_value: config.targetCpa || config.targetRoas || null,
          start_date: config.startDate,
          end_date: config.endDate
        });
    log(`   ✅ Campaign created: ${campaignResult.campaign?.resourceName || 'unknown'}`);
  } catch (err) {
    log(`   ❌ Campaign creation failed: ${err.message}`);
    stage.status = 'failed';
    stage.error = err.message;
    stage.completedAt = new Date().toISOString();
    return stage;
  }

  const campaignId = campaignResult.campaign?.resourceName || 'unknown';
  const createdAdGroups = [];

  for (let i = 0; i < config.adGroups.length; i++) {
    const ag = config.adGroups[i];
    const copySet = adCopySets.find(s => s.adGroup === ag.name && !s.error);

    log(`   📁 Creating ad group: "${ag.name}"...`);

    let agResult;
    try {
      agResult = dryRun
        ? { sandbox: true, adGroup: { resourceName: `customers/demo/adGroups/dry-run-ag-${i}`, id: `dry-run-ag-${i}`, name: ag.name } }
        : await googleAds.handleToolCall('google_ads_create_ad_group', {
            campaign_id: campaignId,
            name: ag.name,
            ad_group_type: 'SEARCH_STANDARD'
          });
    } catch (err) {
      log(`   ⚠️  Ad group "${ag.name}" failed: ${err.message}`);
      createdAdGroups.push({ name: ag.name, id: 'failed', error: err.message, keywords: [], rsa: { created: false, reason: err.message } });
      continue;
    }

    const agId = agResult.adGroup?.resourceName || 'unknown';
    const createdKeywords = [];

    for (const kw of ag.keywords) {
      try {
        const kwResult = dryRun
          ? { sandbox: true, keyword: { criterion: { keyword: { text: kw.text, matchType: kw.matchType } } } }
          : await googleAds.handleToolCall('google_ads_create_keyword', {
              ad_group_id: agId,
              keyword_text: kw.text,
              match_type: kw.matchType
            });
        createdKeywords.push({ text: kw.text, matchType: kw.matchType, created: true });
      } catch (err) {
        log(`   ⚠️  Keyword "${kw.text}" failed: ${err.message}`);
        createdKeywords.push({ text: kw.text, matchType: kw.matchType, created: false, error: err.message });
      }
    }

    let rsaResult = null;
    if (copySet && copySet.headlines && copySet.descriptions) {
      const validHeadlines = copySet.headlines.filter(h => h.valid).map(h => h.text).slice(0, 15);
      const validDescriptions = copySet.descriptions.filter(d => d.valid).map(d => d.text).slice(0, 4);

      if (validHeadlines.length >= 3 && validDescriptions.length >= 2) {
        try {
          rsaResult = dryRun
            ? { sandbox: true, ad: { id: `dry-run-rsa-${i}`, type: 'RESPONSIVE_SEARCH_AD', responsiveSearchAd: { headlines: validHeadlines.map(t => ({ text: t })), descriptions: validDescriptions.map(t => ({ text: t })) } } }
            : await googleAds.handleToolCall('google_ads_create_responsive_search_ad', {
                ad_group_id: agId,
                headlines: validHeadlines,
                descriptions: validDescriptions,
                final_urls: [config.finalUrl || 'https://lockeai.co/airpod-ai'],
                path1: config.path1 || 'AI',
                path2: config.path2 || 'Shop'
              });
        } catch (err) {
          log(`   ⚠️  RSA for "${ag.name}" failed: ${err.message}`);
        }
      }
    }

    createdAdGroups.push({
      name: ag.name,
      id: agId,
      keywords: createdKeywords,
      rsa: rsaResult ? { created: true, headlines: rsaResult.ad?.responsiveSearchAd?.headlines?.length || 0, descriptions: rsaResult.ad?.responsiveSearchAd?.descriptions?.length || 0 } : { created: false, reason: 'No valid copy available' }
    });
  }

  stage.status = 'completed';
  stage.output = {
    campaignId,
    campaignName: config.campaignName,
    budget: `$${config.budget.toLocaleString()}/day`,
    bidding: config.biddingStrategy,
    adGroupsCreated: createdAdGroups.length,
    adGroups: createdAdGroups,
    sandbox: campaignResult.sandbox || false
  };
  stage.completedAt = new Date().toISOString();
  return stage;
}

/**
 * Stage 4: Generate Review Report
 */
async function stageReport(config, stages, log) {
  log('\n⏳ Search Stage 4/4: Generating Review Report...');
  const stage = { id: 'report', name: 'Review Report', status: 'running', startedAt: new Date().toISOString() };

  const copyStage = stages.find(s => s.id === 'copy');
  const buildStage = stages.find(s => s.id === 'build');
  const kwStage = stages.find(s => s.id === 'keywords');

  const lines = [
    `═══ SEARCH CAMPAIGN REPORT ═══`,
    `Campaign: ${config.campaignName}`,
    `Budget: $${config.budget.toLocaleString()}/day | Bidding: ${config.biddingStrategy}${config.targetCpa ? ` ($${config.targetCpa} target)` : ''}`,
    `Flight: ${config.startDate} → ${config.endDate}`,
    `Final URL: ${config.finalUrl || 'N/A'}`,
    `Keyword Model: ${kwStage?.output?.model || 'N/A'}`,
    ``
  ];

  if (kwStage?.output?.negativeKeywords?.length) {
    lines.push(`Negative Keywords: ${kwStage.output.negativeKeywords.join(', ')}`);
    lines.push('');
  }

  if (buildStage?.output?.adGroups) {
    for (const ag of buildStage.output.adGroups) {
      lines.push(`── Ad Group: ${ag.name} ──`);
      lines.push(`   Keywords (${ag.keywords.length}): ${ag.keywords.map(k => `[${k.matchType}] ${k.text}`).join(', ')}`);
      lines.push(`   RSA: ${ag.rsa.created ? `✅ ${ag.rsa.headlines} headlines, ${ag.rsa.descriptions} descriptions` : `❌ ${ag.rsa.reason}`}`);

      const copySet = copyStage?.output?.adCopySets?.find(s => s.adGroup === ag.name && !s.error);
      if (copySet) {
        lines.push(`   Headlines:`);
        copySet.headlines.slice(0, 5).forEach(h => lines.push(`     • "${h.text}" (${h.chars} chars, ${h.pin})`));
        if (copySet.headlines.length > 5) lines.push(`     ... +${copySet.headlines.length - 5} more`);
        lines.push(`   Descriptions:`);
        copySet.descriptions.forEach(d => lines.push(`     • "${d.text}" (${d.chars} chars)`));
        if (copySet.validation?.warnings?.length) {
          lines.push(`   ⚠️  Warnings: ${copySet.validation.warnings.join('; ')}`);
        }
      }
      lines.push('');
    }
  }

  const report = lines.join('\n');

  const outputDir = path.join(__dirname, '..', 'output');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  const reportPath = path.join(outputDir, `search-campaign-report-${Date.now()}.txt`);
  fs.writeFileSync(reportPath, report, 'utf8');

  stage.status = 'completed';
  stage.output = { reportPath, reportLength: report.length, report };
  stage.completedAt = new Date().toISOString();
  return stage;
}

/**
 * Run the full search campaign workflow
 * @param {Object} [options]
 * @param {string} [options.campaignName] - Campaign name override
 * @param {number} [options.budget] - Daily budget override
 * @param {string} [options.startDate] - Start date override
 * @param {string} [options.endDate] - End date override
 * @param {Object} [options.brandGuide] - Brand guide override
 * @param {string} [options.configName] - Load config from file
 * @param {string[]} [options.keywords] - Manual keyword overrides (skip AI generation)
 * @param {boolean} [options.dryRun=false] - Dry run mode
 * @param {Function} [options.log] - Logger function
 * @returns {Promise<Object>} Workflow results
 */
async function runSearchWorkflow(options = {}) {
  const log = options.log || console.log;
  const dryRun = options.dryRun || false;

  // Load config
  let config = loadConfig(options.configName);
  if (options.campaignName) config.campaignName = options.campaignName;
  if (options.budget) config.budget = options.budget;
  if (options.startDate) config.startDate = options.startDate;
  if (options.endDate) config.endDate = options.endDate;

  const brandGuide = options.brandGuide || loadBrandGuide();

  const results = {
    workflowId: `search-${Date.now()}`,
    config,
    stages: [],
    status: 'in_progress',
    startedAt: new Date().toISOString(),
    dryRun
  };

  // Stage 1: AI Keyword Research
  const kwStage = await stageKeywords(config, log, dryRun, options.keywords);
  results.stages.push(kwStage);

  if (kwStage.status === 'failed') {
    results.status = 'failed';
    results.completedAt = new Date().toISOString();
    return results;
  }

  // Stage 2: Copy Generation
  const copyStage = await stageCopyGen(config, brandGuide, log, dryRun);
  results.stages.push(copyStage);
  const adCopySets = copyStage.output?.adCopySets || [];

  // Stage 3: Campaign Build
  const buildStage = await stageBuild(config, adCopySets, log, dryRun);
  results.stages.push(buildStage);

  // Stage 4: Report
  const reportStage = await stageReport(config, results.stages, log);
  results.stages.push(reportStage);

  results.status = results.stages.every(s => s.status === 'completed') ? 'completed' : 'partial';
  results.completedAt = new Date().toISOString();
  return results;
}

/**
 * Get workflow info (backward compatibility)
 */
function getInfo() {
  return {
    name,
    description,
    stages: STAGES,
    estimatedDuration: '5-10 minutes'
  };
}

/**
 * Run function (backward compatibility wrapper)
 */
async function run(params) {
  return runSearchWorkflow(params);
}

// Metadata for new registry system
const meta = {
  id: 'search-campaign-workflow',
  name: 'Search Campaign Workflow',
  category: 'campaign-ops',
  description: 'End-to-end search campaign creation with AI keyword research and AI-generated RSA copy',
  version: '1.0.0',
  
  triggers: {
    manual: true,
    scheduled: null,
    events: []
  },
  
  requiredConnectors: ['google-ads'],
  optionalConnectors: [],
  
  inputs: {
    campaignConfig: { type: 'string', required: false, description: 'Campaign config file name (without .json)', default: 'locke-airpod-ai' },
    brandGuide: { type: 'string', required: false, description: 'Brand guide file name (without .json)', default: 'locke' },
    keywords: { type: 'array', required: false, description: 'Manual keyword overrides (skips AI generation)', default: [] },
    dryRun: { type: 'boolean', required: false, description: 'Preview mode - no actual campaign creation', default: false }
  },
  
  outputs: ['workflowId', 'status', 'stages', 'campaignData'],
  
  stages: STAGES,
  estimatedDuration: '5-10 minutes',
  
  isOrchestrator: false,
  subWorkflows: []
};

module.exports = { 
  name, 
  description, 
  STAGES, 
  DEFAULT_CONFIG, 
  loadConfig, 
  runSearchWorkflow,
  getInfo,  // For backward compatibility
  run,      // For backward compatibility
  meta      // New metadata export
};
