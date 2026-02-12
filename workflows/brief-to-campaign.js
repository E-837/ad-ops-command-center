/**
 * Brief to Campaign Workflow
 * Parses free-form campaign briefs into structured params, then launches campaigns.
 */

const fs = require('fs');
const path = require('path');
const mediaPlanner = require('../agents/media-planner');
const campaignLaunch = require('./campaign-launch');
const campaignsDb = require('../database/campaigns');

const name = 'Brief to Campaign';
const description = 'Parse natural language briefs and launch real campaigns in selected ad platforms';

const STAGES = [
  { id: 'parse', name: 'Brief Parsing', agent: 'media-planner' },
  { id: 'launch', name: 'Campaign Launch', agent: 'trader' }
];

const VALID = {
  lobs: ['ai_audio', 'ai_wearables', 'ai_home', 'ai_vision', 'ai_productivity'],
  channels: ['display', 'video', 'search', 'social'],
  funnels: ['awareness', 'consideration', 'conversion'],
  dsps: ['google-ads', 'meta-ads', 'pinterest', 'microsoft-ads', 'linkedin-ads', 'tiktok-ads', 'ttd', 'dv360', 'amazon-dsp']
};

function getInfo() {
  return {
    name,
    description,
    stages: STAGES,
    estimatedDuration: '2-5 minutes'
  };
}

function loadEnv() {
  try {
    const envPath = path.join(__dirname, '..', 'config', '.env');
    if (!fs.existsSync(envPath)) return {};
    const env = {};
    fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const idx = trimmed.indexOf('=');
      if (idx > 0) env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
    });
    return env;
  } catch {
    return {};
  }
}

function toISODate(v) {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function uniqueList(values = []) {
  return [...new Set(values.filter(Boolean).map(v => String(v).trim()).filter(Boolean))];
}

function inferAndNormalize(parsed = {}, brief = '') {
  const warnings = [];
  const lower = brief.toLowerCase();

  const inferredLob =
    parsed.lob ||
    (lower.includes('audio') || lower.includes('airpod') ? 'ai_audio' : null) ||
    (lower.includes('wearable') || lower.includes('watch') ? 'ai_wearables' : null) ||
    (lower.includes('home') ? 'ai_home' : null) ||
    (lower.includes('vision') ? 'ai_vision' : null) ||
    'ai_productivity';

  let channels = Array.isArray(parsed.channel) ? parsed.channel : String(parsed.channel || '').split(',');
  channels = uniqueList(channels.map(c => c.toLowerCase())).filter(c => VALID.channels.includes(c));
  if (channels.length === 0) {
    if (lower.includes('youtube') || lower.includes('video')) channels.push('video');
    if (lower.includes('meta') || lower.includes('facebook') || lower.includes('instagram') || lower.includes('social')) channels.push('social');
    if (channels.length === 0) channels.push('display');
    warnings.push('Channel was missing/ambiguous; inferred based on brief context.');
  }

  let funnel = Array.isArray(parsed.funnel) ? parsed.funnel : String(parsed.funnel || '').split(',');
  funnel = uniqueList(funnel.map(f => f.toLowerCase())).filter(f => VALID.funnels.includes(f));
  if (funnel.length === 0) {
    funnel = lower.includes('consideration') ? ['consideration'] : (lower.includes('conversion') ? ['conversion'] : ['awareness']);
    warnings.push('Funnel stage was missing/ambiguous; inferred default stage.');
  }

  let dsp = Array.isArray(parsed.dsp) ? parsed.dsp : String(parsed.dsp || '').split(',');
  dsp = uniqueList(dsp.map(d => d.toLowerCase())).filter(d => VALID.dsps.includes(d));
  if (dsp.length === 0) {
    if (lower.includes('google') || lower.includes('youtube') || channels.includes('search') || channels.includes('video')) dsp.push('google-ads');
    if (lower.includes('meta') || lower.includes('facebook') || lower.includes('instagram') || channels.includes('social')) dsp.push('meta-ads');
    if (dsp.length === 0) dsp.push('google-ads');
    warnings.push('DSP platforms were missing/ambiguous; inferred from channel and platform hints.');
  }

  const parsedBudget = Number(parsed.budget);
  let budget = Number.isFinite(parsedBudget) && parsedBudget > 0 ? parsedBudget : 0;
  if (!budget) {
    const m = brief.match(/\$?([\d,]+)\s*(k|m)?/i);
    if (m) {
      budget = Number(m[1].replace(/,/g, ''));
      if (m[2]?.toLowerCase() === 'k') budget *= 1000;
      if (m[2]?.toLowerCase() === 'm') budget *= 1000000;
    }
  }
  if (!budget) {
    const benchmarkByChannel = { display: 20000, video: 35000, search: 25000, social: 30000 };
    budget = channels.reduce((s, c) => s + (benchmarkByChannel[c] || 15000), 0);
    warnings.push('Budget missing; estimated using baseline channel benchmarks.');
  }

  const now = new Date();
  const startDate = toISODate(parsed.startDate) || toISODate(parsed.start_date) || now.toISOString().slice(0, 10);
  const endDate = toISODate(parsed.endDate) || toISODate(parsed.end_date) || new Date(now.getTime() + 90 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  if (!parsed.startDate || !parsed.endDate) warnings.push('Dates were partially missing; defaulted to a 90-day flight.');

  const nameOut = parsed.name || `${inferredLob.replace('ai_', 'AI ').replace('_', ' ')} Campaign ${startDate}`;

  return {
    parsed: {
      name: nameOut,
      budget: Math.round(budget),
      lob: inferredLob,
      channel: channels,
      funnel,
      dsp,
      startDate,
      endDate,
      targetAudience: parsed.targetAudience || parsed.target_audience || [],
      creativeRequirements: parsed.creativeRequirements || parsed.creative_requirements || [],
      objective: parsed.objective || (funnel.includes('conversion') ? 'performance' : 'brand awareness'),
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.78
    },
    warnings
  };
}

async function parseBriefWithMediaPlanner(brief) {
  const env = loadEnv();
  const apiKey = env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    const fallback = await mediaPlanner.processQuery(`Plan budget for: ${brief}`);
    return {
      ...inferAndNormalize({
        budget: fallback?.totalBudget,
        channel: Object.keys(fallback?.channelMix || {}),
        funnel: fallback?.funnelStage,
        lob: fallback?.lob,
        objective: fallback?.objective,
        confidence: 0.72
      }, brief),
      parser: 'media-planner-fallback'
    };
  }

  const prompt = `Extract campaign parameters from this brief and return ONLY JSON.\n\nAvailable enums:\n- lob: ${VALID.lobs.join(', ')}\n- channel: ${VALID.channels.join(', ')} (array)\n- funnel: ${VALID.funnels.join(', ')} (array)\n- dsp: ${VALID.dsps.join(', ')} (array)\n\nValidation rules:\n- budget must be dollars (number)\n- startDate/endDate must be YYYY-MM-DD\n- If missing info, infer smart defaults and include assumptions in \"assumptions\"\n- Include confidence (0-1) and warnings array\n\nBenchmark guidance:\n- awareness video/social usually >= $30k/quarter\n- search conversion programs commonly >= $20k/quarter\n- multi-channel plans scale proportionally\n\nReturn schema:\n{\n  \"name\": string,\n  \"budget\": number,\n  \"lob\": string,\n  \"channel\": string[],\n  \"funnel\": string[],\n  \"dsp\": string[],\n  \"startDate\": \"YYYY-MM-DD\",\n  \"endDate\": \"YYYY-MM-DD\",\n  \"targetAudience\": string[],\n  \"creativeRequirements\": string[],\n  \"objective\": string,\n  \"assumptions\": string[],\n  \"warnings\": string[],\n  \"confidence\": number\n}\n\nBrief:\n${brief}`;

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: mediaPlanner.systemPrompt },
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!res.ok) throw new Error(`Brief parsing failed: ${res.status}`);
    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content || '{}';

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = {};
    }

    const normalized = inferAndNormalize(parsed, brief);
    normalized.parser = 'media-planner-openrouter';
    normalized.assumptions = parsed.assumptions || [];
    normalized.warnings = uniqueList([...(parsed.warnings || []), ...normalized.warnings]);
    return normalized;
  } catch (error) {
    const fallback = await mediaPlanner.processQuery(`Plan budget for: ${brief}`);
    const normalized = inferAndNormalize({
      budget: fallback?.totalBudget,
      channel: Object.keys(fallback?.channelMix || {}),
      funnel: fallback?.funnelStage,
      lob: fallback?.lob,
      objective: fallback?.objective,
      confidence: 0.7
    }, brief);
    normalized.parser = 'media-planner-openrouter-fallback';
    normalized.warnings = uniqueList([...(normalized.warnings || []), `LLM parse fallback used: ${error.message}`]);
    return normalized;
  }
}

async function launchAcrossDsps(parsedParams) {
  const launches = [];

  for (const dsp of parsedParams.dsp) {
    const launchInput = {
      name: parsedParams.name,
      budget: Math.round(parsedParams.budget / parsedParams.dsp.length),
      lob: parsedParams.lob,
      channel: parsedParams.channel[0],
      funnel: parsedParams.funnel[0],
      dsp,
      startDate: parsedParams.startDate,
      endDate: parsedParams.endDate,
      creatives: []
    };

    const launchResult = await campaignLaunch.run(launchInput);
    const createStage = launchResult.stages?.find(s => s.id === 'create');

    let localCampaign = null;
    if (launchResult.status === 'completed' || createStage?.status === 'completed') {
      localCampaign = campaignsDb.create({
        name: parsedParams.name,
        budget: launchInput.budget,
        lob: parsedParams.lob,
        channel: launchInput.channel,
        funnel: launchInput.funnel,
        dsp,
        startDate: parsedParams.startDate,
        endDate: parsedParams.endDate,
        status: 'draft',
        externalCampaignId: createStage?.campaignId || createStage?.output?.id || null,
        source: 'brief-to-campaign'
      });
    }

    launches.push({
      dsp,
      launchInput,
      result: launchResult,
      localCampaign,
      platformCampaignLink: createStage?.output?.url || null
    });
  }

  return launches;
}

async function run(params = {}) {
  const brief = String(params.brief || '').trim();
  if (!brief) throw new Error('brief is required');

  const results = {
    workflowId: `wf-brief-${Date.now()}`,
    status: 'in_progress',
    stages: [],
    startedAt: new Date().toISOString(),
    progress: []
  };

  try {
    results.progress.push('Parsing brief with Media Planner...');
    const parseStart = new Date().toISOString();
    const parsed = await parseBriefWithMediaPlanner(brief);
    results.stages.push({
      id: 'parse',
      name: 'Brief Parsing',
      status: 'completed',
      startedAt: parseStart,
      completedAt: new Date().toISOString(),
      output: parsed
    });

    results.progress.push(`Launching campaigns on: ${parsed.parsed.dsp.join(', ')}`);
    const launchStart = new Date().toISOString();
    const launches = await launchAcrossDsps(parsed.parsed);
    const failed = launches.filter(l => l.result.status === 'failed');

    results.stages.push({
      id: 'launch',
      name: 'Campaign Launch',
      status: failed.length ? (failed.length === launches.length ? 'failed' : 'warning') : 'completed',
      startedAt: launchStart,
      completedAt: new Date().toISOString(),
      output: launches
    });

    results.parsed = parsed;
    results.launches = launches;
    results.status = failed.length === launches.length ? 'failed' : 'completed';
    results.completedAt = new Date().toISOString();
    results.progress.push('Workflow complete.');

    return results;
  } catch (error) {
    results.status = 'failed';
    results.error = error.message;
    results.completedAt = new Date().toISOString();
    results.progress.push(`Failed: ${error.message}`);
    return results;
  }
}

const meta = {
  id: 'brief-to-campaign',
  name,
  category: 'orchestration',
  description,
  version: '1.0.0',
  triggers: { manual: true, scheduled: null, events: [] },
  requiredConnectors: ['google-ads', 'meta-ads'],
  optionalConnectors: ['pinterest', 'microsoft-ads', 'linkedin-ads', 'tiktok-ads', 'ttd', 'dv360', 'amazon-dsp'],
  inputs: {
    brief: { type: 'string', required: true, description: 'Free-form natural language campaign brief' }
  },
  outputs: ['workflowId', 'parsed', 'launches', 'status', 'stages', 'progress'],
  stages: STAGES,
  estimatedDuration: '2-5 minutes',
  isOrchestrator: true,
  subWorkflows: ['campaign-launch']
};

module.exports = { name, description, STAGES, getInfo, run, meta };
