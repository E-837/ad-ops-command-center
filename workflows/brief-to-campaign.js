/**
 * Brief to Campaign Workflow
 * Parses free-form campaign briefs into structured params, then launches campaigns.
 */

const fs = require('fs');
const path = require('path');
const mediaPlanner = require('../agents/media-planner');
const campaignLaunch = require('./campaign-launch');
const campaignLifecycleDemo = require('./campaign-lifecycle-demo');
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

function normalizeDspName(value = '') {
  const v = String(value || '').trim().toLowerCase();
  if (!v) return null;
  const compact = v.replace(/[_\s]+/g, '-');

  const map = {
    'google': 'google-ads',
    'google-ads': 'google-ads',
    'google-adwords': 'google-ads',
    'adwords': 'google-ads',
    'meta': 'meta-ads',
    'meta-ads': 'meta-ads',
    'facebook': 'meta-ads',
    'facebook-ads': 'meta-ads',
    'instagram': 'meta-ads',
    'instagram-ads': 'meta-ads',
    'pinterest': 'pinterest',
    'microsoft': 'microsoft-ads',
    'microsoft-ads': 'microsoft-ads',
    'bing': 'microsoft-ads',
    'bing-ads': 'microsoft-ads',
    'linkedin': 'linkedin-ads',
    'linkedin-ads': 'linkedin-ads',
    'tiktok': 'tiktok-ads',
    'tiktok-ads': 'tiktok-ads',
    'ttd': 'ttd',
    'the-trade-desk': 'ttd',
    'trade-desk': 'ttd',
    'dv360': 'dv360',
    'display-video-360': 'dv360',
    'amazon-dsp': 'amazon-dsp',
    'amazon': 'amazon-dsp'
  };

  return map[compact] || (VALID.dsps.includes(compact) ? compact : null);
}

function parseNumericBudget(value = '') {
  const m = String(value || '').match(/\$?\s*([\d,.]+)\s*(k|m|thousand|million)?\b/i);
  if (!m) return 0;
  let amount = Number(String(m[1]).replace(/,/g, ''));
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  const unit = String(m[2] || '').toLowerCase();
  if (unit === 'k' || unit === 'thousand') amount *= 1000;
  if (unit === 'm' || unit === 'million') amount *= 1000000;
  return Math.round(amount);
}

function parseTemplateDateRange(value = '') {
  const text = String(value || '').trim();
  if (!text) return { startDate: null, endDate: null };

  const iso = text.match(/(\d{4}-\d{2}-\d{2})\s*(?:-|to|through)\s*(\d{4}-\d{2}-\d{2})/i);
  if (iso) {
    return { startDate: toISODate(iso[1]), endDate: toISODate(iso[2]) };
  }

  const inferred = inferDatesFromBrief(text, new Date());
  if (inferred?.startDate && inferred?.endDate) {
    return { startDate: inferred.startDate, endDate: inferred.endDate };
  }

  const pieces = text.split(/\s*(?:-|to|through)\s*/i);
  if (pieces.length >= 2) {
    const start = toISODate(pieces[0]);
    let end = toISODate(pieces.slice(1).join(' - '));
    if (start && !end) {
      const startYear = Number(start.slice(0, 4));
      end = toISODate(`${pieces[1]}, ${startYear}`) || toISODate(`${startYear}-${pieces[1]}`);
    }
    return { startDate: start, endDate: end };
  }

  return { startDate: null, endDate: null };
}

function isTemplatedBrief(brief = '') {
  const markers = [
    'Campaign Name', 'Product Line', 'Campaign Type', 'Budget', 'Flight Dates', 'Platforms',
    'Target Audience', 'Primary Objective', 'KPI Targets', 'Offer', 'Creative Notes',
    'Channel Strategy', 'Flighting', 'Frequency Cap', 'Brand Safety'
  ];
  const count = markers.filter(marker => new RegExp(`^\\s*${marker}\\s*:{1,2}`, 'im').test(String(brief))).length;
  return count >= 3;
}

function parseTemplateFields(brief = '') {
  const labels = [
    'Campaign Name', 'Product Line', 'Campaign Type', 'Budget', 'Flight Dates', 'Platforms',
    'Target Audience', 'Primary Objective', 'KPI Targets', 'Offer', 'Creative Notes',
    'Channel Strategy', 'Flighting', 'Frequency Cap', 'Brand Safety'
  ];

  const lines = String(brief || '').replace(/\r\n/g, '\n').split('\n');
  const out = {};
  let currentLabel = null;

  for (const line of lines) {
    const matchedLabel = labels.find(label => new RegExp(`^\\s*${label}\\s*:{1,2}`, 'i').test(line));
    if (matchedLabel) {
      const firstValue = line.replace(new RegExp(`^\\s*${matchedLabel}\\s*:{1,2}\\s*`, 'i'), '').trim();
      out[matchedLabel] = firstValue;
      currentLabel = matchedLabel;
      continue;
    }

    if (currentLabel) {
      out[currentLabel] = `${out[currentLabel]}\n${line}`.trim();
    }
  }

  return Object.fromEntries(Object.entries(out).map(([k, v]) => [k, String(v || '').trim()]));
}

function parseTemplatedBrief(brief = '') {
  const fields = parseTemplateFields(brief);

  const rawLob = String(fields['Product Line'] || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  const lob = VALID.lobs.includes(rawLob) ? rawLob : undefined;

  const objective = String(fields['Primary Objective'] || '').trim().toLowerCase();
  const funnel = VALID.funnels.includes(objective) ? [objective] : [];

  const dsp = uniqueList(
    String(fields.Platforms || '')
      .split(/[\n,]+/)
      .map(v => normalizeDspName(v))
      .filter(Boolean)
  );

  const targetAudience = uniqueList(String(fields['Target Audience'] || '').split(/[\n,;]+/));
  const creativeRequirements = uniqueList(String(fields['Creative Notes'] || '').split(/[\n,;]+/));
  const { startDate, endDate } = parseTemplateDateRange(fields['Flight Dates']);
  const budget = parseNumericBudget(fields.Budget);

  const kpiRaw = String(fields['KPI Targets'] || '');
  const primaryKpi = (kpiRaw.match(/(?:^|\n)\s*-?\s*Primary\s*:{1,2}\s*([^\n]+)/i) || [])[1]?.trim();
  const secondaryKpi = (kpiRaw.match(/(?:^|\n)\s*-?\s*Secondary\s*:{1,2}\s*([^\n]+)/i) || [])[1]?.trim();

  const channelStrategyRaw = String(fields['Channel Strategy'] || '');
  const channelStrategy = {};
  const strategyRe = /^\s*-?\s*(Search|Social|Programmatic|Display|Video)\s*:{1,2}\s*(.+)$/gmi;
  let sm;
  while ((sm = strategyRe.exec(channelStrategyRaw))) {
    channelStrategy[sm[1].toLowerCase()] = sm[2].trim();
  }

  const channel = uniqueList(Object.keys(channelStrategy)).filter(c => VALID.channels.includes(c));

  const roasMatch = kpiRaw.match(/\bROAS\s*([\d.]+)/i);
  const cpaMatch = kpiRaw.match(/\bCPA\s*\$?\s*([\d,.]+)/i);
  const revenueMatch = kpiRaw.match(/\bRevenue\s*\$?\s*([\d,.]+)\s*(k|m)?/i);
  let revenue;
  if (revenueMatch) {
    revenue = Number(revenueMatch[1].replace(/,/g, ''));
    const unit = String(revenueMatch[2] || '').toLowerCase();
    if (unit === 'k') revenue *= 1000;
    if (unit === 'm') revenue *= 1000000;
  }

  const metadata = {
    campaignType: String(fields['Campaign Type'] || '').trim() || undefined,
    offer: String(fields.Offer || '').trim() || undefined,
    kpiTargets: {
      primary: primaryKpi || undefined,
      secondary: secondaryKpi || undefined,
      roas: roasMatch ? Number(roasMatch[1]) : undefined,
      cpa: cpaMatch ? Number(cpaMatch[1].replace(/,/g, '')) : undefined,
      revenue: revenue || undefined
    },
    channelStrategy: Object.keys(channelStrategy).length ? channelStrategy : undefined,
    flighting: String(fields.Flighting || '').trim() || undefined,
    frequencyCap: String(fields['Frequency Cap'] || '').trim() || undefined,
    brandSafety: String(fields['Brand Safety'] || '').trim() || undefined
  };

  const cleanMetadata = Object.fromEntries(Object.entries(metadata).filter(([, v]) => v !== undefined));
  if (cleanMetadata.kpiTargets) {
    cleanMetadata.kpiTargets = Object.fromEntries(Object.entries(cleanMetadata.kpiTargets).filter(([, v]) => v !== undefined));
  }

  return {
    parsed: {
      name: String(fields['Campaign Name'] || '').trim(),
      lob,
      budget,
      startDate,
      endDate,
      dsp,
      channel,
      funnel,
      targetAudience,
      objective: VALID.funnels.includes(objective) ? objective : objective || undefined,
      creativeRequirements,
      confidence: 1.0,
      parser: 'template',
      warnings: [],
      metadata: cleanMetadata
    },
    warnings: [],
    parser: 'template',
    confidence: 1.0
  };
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function monthIndexFromText(text = '') {
  const months = {
    jan: 0, january: 0,
    feb: 1, february: 1,
    mar: 2, march: 2,
    apr: 3, april: 3,
    may: 4,
    jun: 5, june: 5,
    jul: 6, july: 6,
    aug: 7, august: 7,
    sep: 8, sept: 8, september: 8,
    oct: 9, october: 9,
    nov: 10, november: 10,
    dec: 11, december: 11
  };
  return months[String(text).toLowerCase()] ?? null;
}

function quarterDates(q, year) {
  const quarter = Number(q);
  const y = Number(year);
  if (!quarter || !y || quarter < 1 || quarter > 4) return null;
  const startMonth = (quarter - 1) * 3;
  return {
    startDate: toISODate(new Date(y, startMonth, 1)),
    endDate: toISODate(new Date(y, startMonth + 3, 0))
  };
}

function nthWeekdayOfMonth(year, monthIndex, weekday, n) {
  const first = new Date(year, monthIndex, 1);
  const offset = (weekday - first.getDay() + 7) % 7;
  return new Date(year, monthIndex, 1 + offset + (n - 1) * 7);
}

function thanksgivingDate(year) {
  return nthWeekdayOfMonth(year, 10, 4, 4); // fourth Thursday of November
}

function parseBudgetFromBrief(brief = '') {
  const contexts = [
    /(?:budget(?:\s+of)?|allocating|total\s+spend|spend\s+of)\s*[:\-]?\s*\$?\s*([\d,.]+)\s*(k|m|thousand|million)?\b/i,
    /\$\s*([\d,.]+)\s*(k|m)?\s*(?:budget|total|spend)?\b/i,
    /\b([\d,.]+)\s*(k|m|thousand|million)\s*(?:budget|dollars|usd|total|spend)?\b/i,
    /\b([\d]{4,9})\s*(?:dollars|usd)\b/i
  ];

  for (const re of contexts) {
    const m = brief.match(re);
    if (!m) continue;
    let amount = Number(String(m[1]).replace(/,/g, ''));
    if (!Number.isFinite(amount) || amount <= 0) continue;
    const unit = String(m[2] || '').toLowerCase();
    if (unit === 'k' || unit === 'thousand') amount *= 1000;
    if (unit === 'm' || unit === 'million') amount *= 1000000;
    return Math.round(amount);
  }

  return 0;
}

function inferDatesFromBrief(brief = '', now = new Date()) {
  const lower = brief.toLowerCase();
  const currentYear = now.getFullYear();

  const explicitRange = /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})\s*(?:-|to|through)\s*(\d{1,2})(?:,?\s*(\d{4}))?/i.exec(brief);
  if (explicitRange) {
    const month = monthIndexFromText(explicitRange[1]);
    const day1 = Number(explicitRange[2]);
    const day2 = Number(explicitRange[3]);
    const year = Number(explicitRange[4] || currentYear);
    if (month != null && day1 > 0 && day2 > 0) {
      return {
        startDate: toISODate(new Date(year, month, day1)),
        endDate: toISODate(new Date(year, month, day2)),
        reason: `Based on explicit date range '${explicitRange[0]}'.`,
        confidence: 'High confidence'
      };
    }
  }

  const monthThroughMonth = /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(?:to|through|-)\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?:\s+(\d{4}))?/i.exec(brief);
  if (monthThroughMonth) {
    const m1 = monthIndexFromText(monthThroughMonth[1]);
    const m2 = monthIndexFromText(monthThroughMonth[2]);
    const year = Number(monthThroughMonth[3] || currentYear);
    if (m1 != null && m2 != null) {
      return {
        startDate: toISODate(new Date(year, m1, 1)),
        endDate: toISODate(new Date(year, m2 + 1, 0)),
        reason: `Based on explicit monthly range '${monthThroughMonth[0]}'.`,
        confidence: 'High confidence'
      };
    }
  }

  const quarter = /\bq([1-4])(?:\s*(\d{4}))?\b/i.exec(brief);
  if (quarter) {
    const qDates = quarterDates(quarter[1], quarter[2] || currentYear);
    if (qDates) return { ...qDates, reason: `Based on explicit quarter '${quarter[0]}'.`, confidence: 'High confidence' };
  }

  const fiscalYear = /\bfy\s*(\d{4})\b/i.exec(brief);
  if (fiscalYear) {
    const y = Number(fiscalYear[1]);
    return {
      startDate: toISODate(new Date(y, 0, 1)),
      endDate: toISODate(new Date(y, 11, 31)),
      reason: `Based on explicit fiscal year '${fiscalYear[0]}'.`,
      confidence: 'Medium confidence'
    };
  }

  if (lower.includes('starting tomorrow') || lower.includes('start tomorrow')) {
    const s = addDays(now, 1);
    return { startDate: toISODate(s), endDate: toISODate(addDays(s, 30)), reason: 'Inferred from relative timing "starting tomorrow".', confidence: 'Medium confidence' };
  }
  if (lower.includes('next week')) {
    const s = addDays(now, 7);
    return { startDate: toISODate(s), endDate: toISODate(addDays(s, 14)), reason: 'Inferred from relative timing "next week".', confidence: 'Medium confidence' };
  }

  const inWeeks = /\bin\s+(\d{1,2})\s+weeks?\b/i.exec(brief);
  if (inWeeks) {
    const offset = Number(inWeeks[1]) * 7;
    const s = addDays(now, offset);
    return { startDate: toISODate(s), endDate: toISODate(addDays(s, 30)), reason: `Inferred from relative timing '${inWeeks[0]}'.`, confidence: 'Medium confidence' };
  }

  if (lower.includes('next month')) {
    const y = now.getFullYear() + (now.getMonth() === 11 ? 1 : 0);
    const m = (now.getMonth() + 1) % 12;
    return {
      startDate: toISODate(new Date(y, m, 1)),
      endDate: toISODate(new Date(y, m + 1, 0)),
      reason: 'Inferred from relative timing "next month".',
      confidence: 'Medium confidence'
    };
  }

  const season = /\b(spring|summer|fall|autumn|winter)\s+(\d{4})\b/i.exec(brief);
  if (season) {
    const y = Number(season[2]);
    const map = {
      spring: [2, 4],
      summer: [5, 7],
      fall: [8, 10],
      autumn: [8, 10],
      winter: [11, 1]
    };
    const [startM, endM] = map[season[1].toLowerCase()];
    const endYear = endM < startM ? y + 1 : y;
    return {
      startDate: toISODate(new Date(y, startM, 1)),
      endDate: toISODate(new Date(endYear, endM + 1, 0)),
      reason: `Inferred from seasonal timing '${season[0]}'.`,
      confidence: 'Medium confidence'
    };
  }

  const yearMention = Number((/\b(20\d{2})\b/.exec(brief) || [])[1] || currentYear);

  if (lower.includes('presidents day')) {
    const pd = nthWeekdayOfMonth(yearMention, 1, 1, 3); // third Monday in Feb
    return {
      startDate: toISODate(addDays(pd, -7)),
      endDate: toISODate(addDays(pd, 7)),
      reason: 'No exact dates provided; inferred around Presidents Day.',
      confidence: 'Medium confidence'
    };
  }

  if (lower.includes('black friday')) {
    const bf = addDays(thanksgivingDate(yearMention), 1);
    return {
      startDate: toISODate(addDays(bf, -7)),
      endDate: toISODate(addDays(bf, 7)),
      reason: 'No exact dates provided; inferred around Black Friday.',
      confidence: 'Medium confidence'
    };
  }

  if (lower.includes('holiday season')) {
    return {
      startDate: toISODate(new Date(yearMention, 10, 15)),
      endDate: toISODate(new Date(yearMention, 11, 31)),
      reason: 'No exact dates provided; inferred holiday season window.',
      confidence: 'Low confidence'
    };
  }

  return null;
}

function inferAndNormalize(parsed = {}, brief = '') {
  const warnings = [];
  const lower = brief.toLowerCase();

  const lobSignals = {
    ai_audio: ['airpod', 'airpods', 'audio', 'earbud', 'earbuds', 'headphone', 'audio products', 'translation earbuds'],
    ai_wearables: ['wearable', 'wearables', 'smartwatch', 'smartwatches', 'smart watch', 'smart watches', 'ar glasses', 'wearable tech'],
    ai_home: ['smart home', 'home device', 'home devices', 'security camera', 'smart home devices'],
    ai_vision: ['vision', 'computer vision', 'camera analytics', 'image recognition'],
    ai_productivity: ['productivity', 'productivity tools', 'assistant', 'workflow automation']
  };

  let inferredLob = parsed.lob;
  if (!VALID.lobs.includes(inferredLob)) {
    let best = { lob: 'ai_productivity', score: 0, firstIdx: Number.POSITIVE_INFINITY };
    for (const [lob, keys] of Object.entries(lobSignals)) {
      let score = 0;
      let firstIdx = Number.POSITIVE_INFINITY;
      keys.forEach(k => {
        const re = new RegExp(`\\b${k.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\b`, 'gi');
        let m;
        while ((m = re.exec(lower))) {
          score += 1;
          firstIdx = Math.min(firstIdx, m.index);
        }
      });
      if (score > best.score || (score === best.score && firstIdx < best.firstIdx)) best = { lob, score, firstIdx };
    }
    inferredLob = best.lob;
    if (best.score > 0) warnings.push(`Medium confidence: LOB inferred as '${inferredLob}' from product/category mentions in brief.`);
    else warnings.push(`Low confidence: No clear LOB found; using default '${inferredLob}'.`);
  }

  let channels = Array.isArray(parsed.channel) ? parsed.channel : String(parsed.channel || '').split(',');
  channels = uniqueList(channels.map(c => c.toLowerCase())).filter(c => VALID.channels.includes(c));

  const dspHints = [];
  const dspReasons = [];
  const addDsp = (id, reason) => {
    if (!VALID.dsps.includes(id)) return;
    if (!dspHints.includes(id)) {
      dspHints.push(id);
      dspReasons.push(reason);
    }
  };

  if (/(\bbing\b|microsoft advertising)/i.test(brief)) addDsp('microsoft-ads', "'Bing/Microsoft Advertising' mention");
  if (/(\blinkedin\b|b2b social|linkedin sponsored content)/i.test(brief)) addDsp('linkedin-ads', "'LinkedIn/B2B social' mention");
  if (/(\btiktok\b|short form video)/i.test(brief)) addDsp('tiktok-ads', "'TikTok/short form video' mention");
  if (/(\bpinterest\b|visual discovery)/i.test(brief)) addDsp('pinterest', "'Pinterest/visual discovery' mention");
  if (/(\bttd\b|trade desk|programmatic display)/i.test(brief)) addDsp('ttd', "'TTD/Trade Desk/programmatic display' mention");
  if (/(\bdv360\b|google display|youtube pre-roll)/i.test(brief)) addDsp('dv360', "'DV360/Google Display/YouTube pre-roll' mention");
  if (/(amazon dsp|amazon advertising)/i.test(brief)) addDsp('amazon-dsp', "'Amazon DSP/Amazon advertising' mention");
  if (/(\byoutube\b|pre-roll|youtube ads)/i.test(brief)) { channels.push('video'); addDsp('google-ads', "'YouTube/pre-roll' tactic mention"); }
  if (/(stories|reels|linkedin|meta|facebook|instagram|tiktok|pinterest|b2b social)/i.test(brief)) channels.push('social');
  if (/(stories|reels)/i.test(brief)) addDsp('meta-ads', "'Stories/Reels' tactic mention");
  if (/(display banners|programmatic)/i.test(brief)) channels.push('display');
  if (/(shopping ads|product listing ads|\bpla\b|\bbing\b|microsoft advertising|search)/i.test(brief)) channels.push('search');
  if (/(shopping ads|product listing ads|\bpla\b)/i.test(brief)) addDsp('google-ads', "'Shopping ads/PLA' tactic mention");

  channels = uniqueList(channels).filter(c => VALID.channels.includes(c));
  if (channels.length === 0) {
    if (/(youtube|video)/i.test(brief)) channels.push('video');
    if (/(meta|facebook|instagram|social|linkedin|tiktok|pinterest)/i.test(brief)) channels.push('social');
    if (/(search|shopping ads|pla|bing|google ads)/i.test(brief)) channels.push('search');
    if (channels.length === 0) channels.push('display');
    warnings.push(`Medium confidence: No channel explicitly provided; inferred '${channels.join(', ')}' from tactics/platform mentions.`);
  }

  let funnel = Array.isArray(parsed.funnel) ? parsed.funnel : String(parsed.funnel || '').split(',');
  funnel = uniqueList(funnel.map(f => f.toLowerCase())).filter(f => VALID.funnels.includes(f));
  if (funnel.length === 0) {
    funnel = lower.includes('consideration') ? ['consideration'] : (lower.includes('conversion') ? ['conversion'] : ['awareness']);
    warnings.push(`Medium confidence: Funnel stage inferred as '${funnel[0]}' from brief language.`);
  }

  let dsp = Array.isArray(parsed.dsp) ? parsed.dsp : String(parsed.dsp || '').split(',');
  dsp = uniqueList(dsp.map(d => d.toLowerCase())).filter(d => VALID.dsps.includes(d));
  if (dsp.length === 0) {
    dsp = uniqueList(dspHints);
    if (dsp.length === 0) {
      if (channels.includes('search') || channels.includes('video')) dsp.push('google-ads');
      if (channels.includes('social')) dsp.push('meta-ads');
      if (channels.includes('display') && !dsp.includes('google-ads')) dsp.push('dv360');
    }
    if (dsp.length === 0) dsp.push('google-ads');

    if (dspReasons.length) {
      warnings.push(`High confidence: No DSP explicitly provided; inferred ${dsp.join(', ')} based on ${dspReasons.join(', ')}.`);
    } else {
      warnings.push(`Low confidence: No DSP specified; using default DSP mix '${dsp.join(', ')}' based on inferred channels.`);
    }
  }

  const parsedBudget = Number(parsed.budget);
  let budget = Number.isFinite(parsedBudget) && parsedBudget > 0 ? parsedBudget : 0;
  if (!budget) budget = parseBudgetFromBrief(brief);
  if (!budget) {
    const benchmarkByLob = {
      ai_audio: 40000,
      ai_wearables: 35000,
      ai_home: 45000,
      ai_vision: 50000,
      ai_productivity: 30000
    };
    budget = benchmarkByLob[inferredLob] || 30000;
    warnings.push(`Low confidence: Budget missing; applied ${inferredLob} benchmark default of $${budget.toLocaleString()}.`);
  }

  const now = new Date();
  const parsedStart = toISODate(parsed.startDate) || toISODate(parsed.start_date);
  const parsedEnd = toISODate(parsed.endDate) || toISODate(parsed.end_date);

  let startDate = parsedStart;
  let endDate = parsedEnd;
  if (!startDate || !endDate) {
    const inferredDates = inferDatesFromBrief(brief, now);
    if (inferredDates) {
      startDate = startDate || inferredDates.startDate;
      endDate = endDate || inferredDates.endDate;
      warnings.push(`${inferredDates.confidence}: ${inferredDates.reason}`);
    }
  }

  if (!startDate) startDate = now.toISOString().slice(0, 10);
  if (!endDate) endDate = addDays(new Date(startDate), 90).toISOString().slice(0, 10);
  if (!parsedStart || !parsedEnd) {
    warnings.push(`Low confidence: Dates incomplete; final schedule set to ${startDate} through ${endDate}.`);
  }

  const firstLine = String(brief || '').split(/\n|\./).map(s => s.trim()).filter(Boolean)[0] || '';
  const event =
    (/presidents day|black friday|holiday season|spring|summer|fall|autumn|winter|q[1-4]\s*\d{4}/i.exec(brief) || [])[0] ||
    '';
  const tactic =
    channels.includes('video') ? 'Video' :
    channels.includes('social') ? 'Social' :
    channels.includes('search') ? 'Search' :
    'Display';

  const lobLabel = inferredLob.replace('ai_', 'AI ').replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
  let nameOut = parsed.name;
  if (!nameOut) {
    if (firstLine && firstLine.length <= 70) {
      nameOut = firstLine;
    } else {
      nameOut = `${lobLabel} - ${tactic}${event ? ` - ${event.replace(/\b\w/g, c => c.toUpperCase())}` : ''}`;
    }
    warnings.push(`Medium confidence: Campaign name inferred as '${nameOut}'.`);
  }

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
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.8
    },
    warnings
  };
}

async function parseBriefWithMediaPlanner(brief) {
  if (isTemplatedBrief(brief)) {
    return parseTemplatedBrief(brief);
  }

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
    const externalCampaignId = createStage?.campaignId || createStage?.output?.id || null;

    console.log('[brief-to-campaign] DSP launch result', {
      dsp,
      workflowStatus: launchResult?.status,
      createStageStatus: createStage?.status,
      externalCampaignId
    });

    let localCampaign = null;
    const shouldPersistCampaign = Boolean(
      externalCampaignId ||
      launchResult.status === 'completed' ||
      createStage?.status === 'completed'
    );

    if (shouldPersistCampaign) {
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
        externalCampaignId,
        source: 'brief-to-campaign'
      });

      console.log('[brief-to-campaign] Saved local campaign record', {
        dsp,
        localCampaignId: localCampaign?.id,
        externalCampaignId
      });
    } else {
      console.warn('[brief-to-campaign] Skipped local campaign save due to unsuccessful launch', {
        dsp,
        workflowStatus: launchResult?.status,
        createStageStatus: createStage?.status
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

    if (params.fullLifecycle === true) {
      results.progress.push('Running full lifecycle demo workflow...');
      const lifecycleStart = new Date().toISOString();
      const lifecycleResult = await campaignLifecycleDemo.run({
        campaign: params.campaign || 'locke-airpod-ai',
        includeSearch: Boolean(params.includeSearch),
        log: params.log
      });
      const stageStatus = lifecycleResult?.status === 'completed' ? 'completed' : (lifecycleResult?.status || 'failed');

      results.stages.push({
        id: 'launch',
        name: 'Campaign Lifecycle Demo',
        status: stageStatus,
        startedAt: lifecycleStart,
        completedAt: new Date().toISOString(),
        output: lifecycleResult
      });

      results.parsed = parsed;
      results.lifecycle = lifecycleResult;
      results.status = stageStatus === 'completed' ? 'completed' : stageStatus;
      results.completedAt = new Date().toISOString();
      results.progress.push('Workflow complete (full lifecycle).');
      return results;
    }

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
    brief: { type: 'string', required: true, description: 'Free-form natural language campaign brief' },
    fullLifecycle: { type: 'boolean', required: false, description: 'Run full lifecycle demo (includes Google Docs, Asana, Creatives)' },
    campaign: { type: 'string', required: false, description: 'Campaign slug for lifecycle demo (default: locke-airpod-ai)' },
    includeSearch: { type: 'boolean', required: false, description: 'When fullLifecycle is enabled, include the optional search campaign stage' }
  },
  outputs: ['workflowId', 'parsed', 'launches', 'lifecycle', 'status', 'stages', 'progress'],
  stages: STAGES,
  estimatedDuration: '2-5 minutes',
  isOrchestrator: true,
  subWorkflows: ['campaign-launch', 'campaign-lifecycle-demo']
};

module.exports = { name, description, STAGES, getInfo, run, meta };
