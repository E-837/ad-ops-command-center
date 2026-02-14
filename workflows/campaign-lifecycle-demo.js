/**
 * Campaign Lifecycle Demo Workflow
 * End-to-end demonstration: Brief → Media Plan → Asana → Creatives → DSP Activation → Report
 */

const path = require('path');
const fs = require('fs');
const { callToolAsync } = require(path.join(__dirname, '..', 'scripts', 'mcp-helper'));
const logger = require('../utils/logger');
const eventBus = require('../events/bus');
const eventTypes = require('../events/types');
const { saveCheckpoint, loadCheckpoint, clearCheckpoint } = require('../utils/checkpoint');

const name = 'Campaign Lifecycle Demo';
const description = 'Full end-to-end campaign lifecycle demonstration';

const STAGES = [
  { id: 'brief', name: 'Generate Campaign Brief' },
  { id: 'plan', name: 'Create Media Plan' },
  { id: 'project', name: 'Setup Project Management' },
  { id: 'landing', name: 'Generate Landing Page' },
  { id: 'creative', name: 'Generate Creatives' },
  { id: 'activate', name: 'Activate on DSPs' },
  { id: 'search', name: 'Search Campaign (optional)' },
  { id: 'report', name: 'Generate Summary Report' }
];

// Default fallback campaign data
const DEFAULT_CAMPAIGN_DATA = {
  brand: 'Locke AI Co.',
  product: 'Locke AirPod AI',
  tagline: 'Intelligence You Can Wear',
  price: '$199',
  year: '2026',
  budget: 750000,
  flightStart: '2026-03-15',
  flightEnd: '2026-05-31',
  launchEvent: 'OpenAI Device Day — April 1, 2026',
  targetAudience: '22-45 tech-forward professionals & early adopters',
  objectives: ['awareness', 'consideration', 'pre-order'],
  kpis: { reach: '8M impressions', VCR: '70%', CTR: '1.2%', preOrders: '10,000' },
  channels: ['CTV', 'Display', 'Video', 'Audio', 'Social'],
  creativeSizes: [
    { name: 'Medium Rectangle', size: '300x250', w: 300, h: 250, format: 'static' },
    { name: 'Leaderboard', size: '728x90', w: 728, h: 90, format: 'static' },
    { name: 'Wide Skyscraper', size: '160x600', w: 160, h: 600, format: 'static' },
    { name: 'CTV/OLV Video', size: '1920x1080', w: 1920, h: 1080, format: 'video' }
  ],
  mediaPlan: [
    { channel: 'Display', dsp: 'TTD', tactic: 'Programmatic Display — Awareness & Pre-order', budget: 200000, kpiTarget: '3M Impressions', size: '300x250, 728x90, 160x600' },
    { channel: 'Video', dsp: 'TTD', tactic: 'Online Video — Pre-roll + Mid-roll', budget: 150000, kpiTarget: '70% VCR', size: '1920x1080 :15/:30' },
    { channel: 'CTV', dsp: 'DV360', tactic: 'Connected TV — Streaming (Hulu, Peacock, YouTube TV)', budget: 200000, kpiTarget: '95% Completion', size: '1920x1080 :30' },
    { channel: 'Display', dsp: 'Amazon DSP', tactic: 'Retargeting + In-market Audiences', budget: 100000, kpiTarget: '1.2% CTR', size: '300x250, 728x90' },
    { channel: 'Audio', dsp: 'TTD', tactic: 'Programmatic Audio — Spotify/Podcasts', budget: 100000, kpiTarget: '90% Listen-through', size: ':30 audio spot' }
  ],
  // Brief template sections (from campaign intake workbook)
  brief: {
    executiveSummary: 'Locke AI Co. is launching the Locke AirPod AI — a wearable AI companion in an AirPod form factor — at OpenAI Device Day on April 1, 2026. This campaign drives pre-launch awareness and day-one pre-orders through a coordinated multi-channel digital media blitz across CTV, Display, Video, Audio, and Social.',
    whyNow: 'OpenAI Device Day creates a massive cultural moment for AI hardware. Launching alongside the event captures earned media amplification, positions Locke as a first-mover in wearable AI, and rides the news cycle for maximum reach.',
    primaryOutcome: '10,000 pre-orders within first 30 days of campaign launch',
    messagePillars: [
      'AI that goes where you go — no screen required',
      'Privacy-first: on-device processing, your data stays yours',
      'Seamless integration with the tools you already use',
      'Designed for real life — meetings, commutes, workouts, everything'
    ],
    valueProposition: 'The first truly personal AI assistant that lives in your ear — always listening when you want, completely private when you don\'t.',
    reasonToBelieve: 'On-device neural engine, 18-hour battery, works with 200+ apps, military-grade encryption, designed by ex-Apple audio engineers',
    audience: {
      primary: 'Tech-forward professionals 25-45, HHI $100K+, early adopters of AI tools (ChatGPT, Copilot, etc.)',
      secondary: 'Productivity enthusiasts, podcast listeners, remote workers',
      targeting: '1P email lists, AI tool user lookalikes, tech publication readers, CTV cord-cutters',
      exclusions: 'Existing customers, employees, minors'
    },
    compliance: {
      privacyStance: 'On-device processing emphasized. No cloud storage of conversations unless user opts in.',
      disclosures: '"AI-generated responses may not always be accurate. See lockeai.co/safety for details."',
      wordsToAvoid: '"Always right", "replaces your phone", "listens to everything", health/medical claims'
    }
  }
};

// Load campaign from JSON file
function loadCampaign(name = 'locke-airpod-ai') {
  try {
    const campaignPath = path.join(__dirname, '..', 'config', 'campaigns', `${name}.json`);
    const campaignData = JSON.parse(fs.readFileSync(campaignPath, 'utf8'));
    return campaignData;
  } catch (err) {
    logger.warn('Could not load campaign, using default data', { 
      campaignName: name, 
      error: err.message 
    });
    return DEFAULT_CAMPAIGN_DATA;
  }
}

function getInfo(campaignName = 'locke-airpod-ai') {
  return { name, description, stages: STAGES, campaign: loadCampaign(campaignName) };
}

async function pMapSimple(items, fn, { concurrency = 3 } = {}) {
  const results = new Array(items.length);
  let i = 0;

  async function worker() {
    while (true) {
      const idx = i++;
      if (idx >= items.length) return;
      results[idx] = await fn(items[idx], idx);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length || 1) }, worker));
  return results;
}

function emitStageEvent(emit, type, payload) {
  emit({ type, ...payload });
  eventBus.emit(type, payload);
}

// ─── MAIN RUN ─────────────────────────────────────────────
async function run(opts = {}) {
  if (opts.queue === true && !opts.executionId) {
    const executor = require(path.join(__dirname, '..', 'executor'));
    const executionId = executor.queueWorkflow('campaign-lifecycle-demo', { ...opts, queue: false });
    return { executionId, status: 'queued' };
  }

  const log = opts.log || console.log;
  const emit = opts.emit || (() => {});
  const executionId = opts.executionId || `demo-${Date.now()}`;
  const CAMPAIGN_DATA = loadCampaign(opts.campaign || 'locke-airpod-ai');

  const checkpoint = loadCheckpoint(executionId);
  const completedStageIds = new Set((checkpoint?.completedStages || []).map(s => s.id));
  const resumeEnabled = !!checkpoint;

  if (resumeEnabled) {
    log(`\n♻️ Resuming from stage ${checkpoint.nextStage || checkpoint.lastStage || 'start'}...`);
  }

  const results = {
    workflowId: executionId,
    campaign: CAMPAIGN_DATA,
    campaignName: opts.campaign || 'locke-airpod-ai',
    stages: [],
    artifacts: checkpoint?.artifacts ? { ...checkpoint.artifacts } : {},
    status: 'in_progress',
    startedAt: new Date().toISOString(),
    resumedFromCheckpoint: resumeEnabled
  };

  const runStage = async (stageIndex, runner) => {
    const stageDef = STAGES[stageIndex];

    if (completedStageIds.has(stageDef.id)) {
      const completed = (checkpoint.completedStages || []).find(s => s.id === stageDef.id);
      const skippedStage = {
        id: stageDef.id,
        name: stageDef.name,
        status: 'skipped',
        skipped: true,
        resumedFromCheckpoint: true,
        completedAt: completed?.completedAt || new Date().toISOString(),
        output: completed?.artifacts || null
      };
      results.stages.push(skippedStage);
      return;
    }

    emitStageEvent(emit, eventTypes.WORKFLOW_STAGE_STARTED, {
      source: results.workflowId,
      workflowId: 'campaign-lifecycle-demo',
      executionId,
      stageId: stageDef.id,
      stageName: stageDef.name,
      stageIndex,
      totalStages: STAGES.length,
      timestamp: new Date().toISOString()
    });

    const stage = await runner(results, log, CAMPAIGN_DATA, emit, stageDef, stageIndex, opts);
    results.stages.push(stage);

    if (stage.status === 'completed' || stage.status === 'partial') {
      saveCheckpoint(executionId, stage.id, {
        workflowId: 'campaign-lifecycle-demo',
        stageName: stage.name,
        completedAt: stage.completedAt || new Date().toISOString(),
        artifacts: stage.output || {},
        allArtifacts: results.artifacts,
        nextStage: STAGES[stageIndex + 1]?.id || null
      });
    }

    emitStageEvent(emit, eventTypes.WORKFLOW_STAGE_COMPLETED, {
      source: results.workflowId,
      workflowId: 'campaign-lifecycle-demo',
      executionId,
      stageId: stage.id,
      stageName: stage.name,
      stageIndex,
      totalStages: STAGES.length,
      status: stage.status,
      output: stage.output,
      error: stage.error,
      timestamp: new Date().toISOString()
    });
  };

  const orderedStages = [
    [0, generateCampaignBrief],
    [1, createMediaPlan],
    [2, setupProjectManagement],
    [3, generateLandingPage],
    [4, generateCreatives],
    [5, activateOnDSPs]
  ];

  if (opts.includeSearch) orderedStages.push([6, runSearchCampaignStage]);
  orderedStages.push([7, generateSummaryReport]);

  try {
    // ✅ Per-stage error boundaries
    for (const [index, fn] of orderedStages) {
      try {
        await runStage(index, fn);
      } catch (stageError) {
        logger.error('❌ Stage execution failed', {
          stageIndex: index,
          stageName: STAGES[index].name,
          error: stageError.message,
          stack: stageError.stack
        });
        
        // Add failed stage to results (prevents crash, allows continuation)
        results.stages.push({
          id: STAGES[index].id,
          name: STAGES[index].name,
          status: 'failed',
          error: stageError.message,
          errorStack: stageError.stack,
          completedAt: new Date().toISOString()
        });
        
        // Continue to next stage instead of crashing workflow
      }
    }

    const hasFailures = results.stages.some(s => s.status === 'failed');
    results.status = hasFailures ? 'partial' : 'completed';
    results.completedAt = new Date().toISOString();

    if (!hasFailures) {
      clearCheckpoint(executionId);
    }

    return results;
    
  } catch (error) {
    // ✅ GLOBAL ERROR BOUNDARY — catches orchestration failures
    logger.error('❌ Workflow execution failed with unhandled error', {
      workflowId: executionId,
      error: error.message,
      stack: error.stack,
      completedStages: results.stages.filter(s => s.status === 'completed').length,
      totalStages: STAGES.length
    });
    
    results.status = 'failed';
    results.error = error.message;
    results.errorStack = error.stack;
    results.completedAt = new Date().toISOString();
    
    // Save checkpoint for resume capability
    const lastCompletedStage = results.stages.filter(s => s.status === 'completed').pop();
    if (lastCompletedStage) {
      saveCheckpoint(executionId, lastCompletedStage.id, {
        workflowId: 'campaign-lifecycle-demo',
        stageName: lastCompletedStage.name,
        completedAt: lastCompletedStage.completedAt || new Date().toISOString(),
        artifacts: results.artifacts,
        allArtifacts: results.artifacts,
        nextStage: STAGES[results.stages.length]?.id || null,
        error: error.message
      });
    }
    
    return results;
  }
}

// ─── HELPERS ──────────────────────────────────────────────
function extractId(output) {
  const m = output.match(/\(ID:\s*([a-zA-Z0-9_-]+)\)/) || output.match(/ID:\s*([a-zA-Z0-9_-]+)/);
  if (!m) {
    logger.warn('Could not extract ID from output', { 
      outputPreview: output.slice(0, 200) 
    });
  }
  return m ? m[1] : null;
}

function extractLink(output, type = 'document') {
  const m = output.match(new RegExp(`https://docs\\.google\\.com/${type === 'sheet' ? 'spreadsheets' : 'document'}/d/[^\\s)]+`));
  return m ? m[0] : null;
}

// ─── STAGE 1: CAMPAIGN BRIEF ─────────────────────────────
async function generateCampaignBrief(results, log, CAMPAIGN_DATA) {
  log('\n⏳ Stage 1/7: Generating campaign brief in Google Docs...');
  const stage = { id: 'brief', name: 'Generate Campaign Brief', status: 'running', startedAt: new Date().toISOString() };

  const b = CAMPAIGN_DATA.brief;
  const briefContent = `${CAMPAIGN_DATA.brand} — ${CAMPAIGN_DATA.product} Digital Campaign Brief

═══════════════════════════════════════════════════════
1) BRIEF METADATA
═══════════════════════════════════════════════════════

  Campaign Name: ${CAMPAIGN_DATA.product} Launch — ${CAMPAIGN_DATA.launchEvent}
  Campaign Type: Product Launch
  Business Unit: Consumer Hardware
  Region/Market(s): United States — Top 25 DMAs + National CTV
  Start Date: ${CAMPAIGN_DATA.flightStart}
  End Date: ${CAMPAIGN_DATA.flightEnd}
  Status: In Planning
  Total Budget: $${CAMPAIGN_DATA.budget.toLocaleString()}

═══════════════════════════════════════════════════════
2) EXECUTIVE SUMMARY
═══════════════════════════════════════════════════════

  What are we doing?
  ${b.executiveSummary}

  Why now?
  ${b.whyNow}

  Primary outcome: ${b.primaryOutcome}

  Top 3 messages:
${b.messagePillars.map(p => `    • ${p}`).join('\n')}

  Primary channels: ${CAMPAIGN_DATA.channels.join(', ')}

═══════════════════════════════════════════════════════
3) BUSINESS CONTEXT
═══════════════════════════════════════════════════════

  Background: Locke AI Co. is entering the wearable AI market with its first hardware product. The AI wearable category is nascent — no dominant player exists. OpenAI Device Day provides a once-a-year cultural moment to establish category leadership.

  Problem / Opportunity: The wearable AI space has seen failed launches (Humane Pin, Rabbit R1) due to poor UX. Locke's AirPod form factor solves the "extra device" problem by integrating into hardware people already wear.

  What success changes: Establishes Locke AI Co. as a credible hardware company, generates $2M+ in pre-order revenue, builds a 50K+ waitlist for post-launch fulfillment.

  Dependencies: Product readiness (firmware v1.0), lockeai.co/airpod-ai landing page live, App Store approval, influencer seeding kits shipped.

═══════════════════════════════════════════════════════
4) OBJECTIVES & KPIs
═══════════════════════════════════════════════════════

  Primary objective: Drive awareness → pre-orders
  Primary KPI: ${CAMPAIGN_DATA.kpis.preOrders} pre-orders in first 30 days
  Secondary KPIs:
    • Reach: ${CAMPAIGN_DATA.kpis.reach}
    • Video Completion Rate: ${CAMPAIGN_DATA.kpis.VCR}
    • Click-Through Rate: ${CAMPAIGN_DATA.kpis.CTR}
    • Cost per pre-order: < $75
  Guardrails: Frequency cap 3x/week/user, CPA ceiling $100, brand safety: standard + custom AI blocklist
  Attribution: Platform attribution + incrementality lift study (geo holdout)

═══════════════════════════════════════════════════════
5) AUDIENCE & TARGETING
═══════════════════════════════════════════════════════

  Primary: ${b.audience.primary}
  Secondary: ${b.audience.secondary}
  Targeting inputs: ${b.audience.targeting}
  Exclusions: ${b.audience.exclusions}
  Key insights: Users frustrated with phone dependence; privacy is top concern for AI adoption; audio-first UX preferred during commutes/workouts.

═══════════════════════════════════════════════════════
6) OFFER, PROPOSITION & PROOF
═══════════════════════════════════════════════════════

  Value proposition: ${b.valueProposition}
  Reason to believe: ${b.reasonToBelieve}
  Offer: Pre-order at $199 (30% off launch price of $279). Free shipping. 30-day returns.
  Objection handling: Privacy → on-device processing. Accuracy → "AI assistant, not replacement." Battery → 18hr life. Compatibility → 200+ apps, iOS & Android.

═══════════════════════════════════════════════════════
7) MESSAGING FRAMEWORK
═══════════════════════════════════════════════════════

  Message pillars:
${b.messagePillars.map(p => `    • ${p}`).join('\n')}
  Single-minded takeaway: "Your AI, in your ear, on your terms."
  Tone & voice: Premium yet approachable. Confident, not arrogant. Human-first technology.
  Mandatory disclosures: ${b.compliance.disclosures}
  Words to avoid: ${b.compliance.wordsToAvoid}

═══════════════════════════════════════════════════════
8) CREATIVE REQUIREMENTS
═══════════════════════════════════════════════════════

  Formats needed: Static display, video (:15 and :30), CTV (:30), audio (:30), social (stories + feed)
  Specs & sizes:
${CAMPAIGN_DATA.creativeSizes.map(s => `    • ${s.name} (${s.size}) — ${s.format}`).join('\n')}
  Key visuals: Product hero shot (AirPod in ear), lifestyle scenes (commute, workout, meeting), UI overlay showing AI responses
  Must show: Product in-ear, "Pre-order now" CTA, $199 price point
  Must avoid: Competitor mentions, health/medical claims, "always listening" language
  Accessibility: Closed captions on all video, 4.5:1 contrast ratio, readable at mobile scale

═══════════════════════════════════════════════════════
9) CHANNEL & MEDIA PLAN
═══════════════════════════════════════════════════════

  Budget: $${CAMPAIGN_DATA.budget.toLocaleString()} total media spend

${CAMPAIGN_DATA.mediaPlan.map(l => `  ${l.dsp} — ${l.channel} (${l.tactic}): $${l.budget.toLocaleString()} → ${l.kpiTarget}`).join('\n')}

  Flighting: Pre-launch tease (Mar 15-31) → Launch burst (Apr 1-14) → Sustain (Apr 15 - May 31)
  Brand safety: IAS verification, custom AI/tech blocklist, news adjacency controls

═══════════════════════════════════════════════════════
10) EXPERIENCE & FUNNEL JOURNEY
═══════════════════════════════════════════════════════

  Primary entry point: lockeai.co/airpod-ai (product landing page)
  Primary conversion: Pre-order ($199)
  Secondary actions: Email waitlist signup, "Notify me" for launch updates
  Friction mitigation: One-click pre-order, Apple Pay/Google Pay, trust badges, 30-day guarantee

═══════════════════════════════════════════════════════
NEXT STEPS
═══════════════════════════════════════════════════════

  1. Brief review & stakeholder sign-off (Feb 15)
  2. Creative production — display + video + audio (Feb 22)
  3. Campaign setup across DSPs: TTD, DV360, Amazon DSP (Feb 26)
  4. QA & trafficking review (Feb 28)
  5. Pre-launch tease begins March 15
  6. Full launch at OpenAI Device Day — April 1, 2026`;

  let r;
  try {
    r = await callToolAsync('google-docs', 'createDocument', {
      title: `${CAMPAIGN_DATA.brand} — ${CAMPAIGN_DATA.product} Campaign Brief`,
      initialContent: briefContent
    });
  } catch (err) {
    r = { success: false, error: err.message };
  }

  if (r.success) {
    const docId = extractId(r.output);
    if (!docId) {
      stage.status = 'failed';
      stage.error = 'Created document but could not extract ID from MCP output';
    } else {
      const docUrl = extractLink(r.output) || `https://docs.google.com/document/d/${docId}/edit`;
      stage.status = 'completed';
      stage.output = { documentId: docId, documentUrl: docUrl };
      results.artifacts.briefDocId = docId;
      results.artifacts.briefDocUrl = docUrl;
    }
  } else {
    stage.status = 'failed';
    stage.error = r.error;
  }

  stage.completedAt = new Date().toISOString();
  return stage;
}

// ─── STAGE 2: MEDIA PLAN ─────────────────────────────────
async function createMediaPlan(results, log, CAMPAIGN_DATA) {
  log('\n⏳ Stage 2/7: Creating media plan in Google Sheets...');
  const stage = { id: 'plan', name: 'Create Media Plan', status: 'running', startedAt: new Date().toISOString() };

  // Create the spreadsheet
  let createR;
  try {
    createR = await callToolAsync('google-docs', 'createSpreadsheet', {
      title: `${CAMPAIGN_DATA.brand} ${CAMPAIGN_DATA.product} — Media Plan Q1-Q2 2026`
    });
  } catch (err) {
    createR = { success: false, error: err.message };
  }

  if (!createR.success) {
    stage.status = 'failed';
    stage.error = createR.error;
    stage.completedAt = new Date().toISOString();
    return stage;
  }

  const sheetId = extractId(createR.output);
  const sheetUrl = extractLink(createR.output, 'sheet') || `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;

  // Write data
  const rows = [
    ['Channel', 'DSP', 'Tactic', 'Budget', 'Flight Start', 'Flight End', 'KPI Target', 'Creative Sizes'],
    ...CAMPAIGN_DATA.mediaPlan.map(r => [
      r.channel, r.dsp, r.tactic, `$${r.budget.toLocaleString()}`,
      CAMPAIGN_DATA.flightStart, CAMPAIGN_DATA.flightEnd, r.kpiTarget, r.size
    ]),
    ['', '', '', '', '', '', '', ''],
    ['TOTAL', '', '', `$${CAMPAIGN_DATA.budget.toLocaleString()}`, CAMPAIGN_DATA.flightStart, CAMPAIGN_DATA.flightEnd, 'See above', 'All sizes']
  ];

  let writeR;
  try {
    writeR = await callToolAsync('google-docs', 'writeSpreadsheet', {
      spreadsheetId: sheetId,
      range: `A1:H${rows.length}`,
      values: rows,
      valueInputOption: 'USER_ENTERED'
    });
  } catch (err) {
    writeR = { success: false, error: err.message };
  }

  if (writeR.success) {
    stage.status = 'completed';
    stage.output = { spreadsheetId: sheetId, spreadsheetUrl: sheetUrl, rows: rows.length, tactics: CAMPAIGN_DATA.mediaPlan.length };
    results.artifacts.mediaPlanSheetId = sheetId;
    results.artifacts.mediaPlanSheetUrl = sheetUrl;
  } else {
    stage.status = 'completed'; // Sheet was created, just data write failed
    stage.output = { spreadsheetId: sheetId, spreadsheetUrl: sheetUrl, dataWriteError: writeR.error };
    results.artifacts.mediaPlanSheetId = sheetId;
    results.artifacts.mediaPlanSheetUrl = sheetUrl;
  }

  stage.completedAt = new Date().toISOString();
  return stage;
}

// ─── STAGE 3: ASANA PROJECT ──────────────────────────────
async function setupProjectManagement(results, log, CAMPAIGN_DATA, emit, stageDef, stageIndex, opts = {}) {
  log('\n? Stage 3/7: Setting up Asana project (V2 MCP)...');
  const stage = { id: 'project', name: 'Setup Project Management', status: 'running', startedAt: new Date().toISOString() };
  let projectId = null;
  const projectName = `${CAMPAIGN_DATA.brand} ${CAMPAIGN_DATA.product} — Launch Campaign`;
  try {
    const createProjectR = await callToolAsync('asana-v2', 'asana_create_project', {
      name: projectName,
      notes: `Campaign launch project for ${CAMPAIGN_DATA.product}\nLaunch Event: ${CAMPAIGN_DATA.launchEvent}\nBudget: $${CAMPAIGN_DATA.budget.toLocaleString()}\nFlight: ${CAMPAIGN_DATA.flightStart} to ${CAMPAIGN_DATA.flightEnd}\nTarget: ${CAMPAIGN_DATA.targetAudience}\nPrimary Outcome: ${CAMPAIGN_DATA.brief.primaryOutcome}`,
      color: 'light-blue', due_date: CAMPAIGN_DATA.flightEnd, start_date: '2026-02-10', default_view: 'board'
    }, { timeoutMs: 30000, maxRetries: 2 });
    if (createProjectR.success) {
      const m = createProjectR.output.match(/"gid":\s*"(\d+)"/);
      if (m) projectId = m[1];
    }
  } catch (err) { logger.warn('Asana project create failed', { error: err.message }); }

  const tasks = [
    { name: 'Campaign Kickoff + Brief Alignment', due_on: '2026-02-12', notes: 'Align all stakeholders on brief, budget, timeline, and KPIs. Distribute campaign intake workbook.' },
    { name: 'Finalize Audience + KPIs + Measurement Plan', due_on: '2026-02-15', notes: 'Lock targeting strategy, attribution approach (geo holdout lift study), and reporting cadence.' },
    { name: 'Creative Production � Display + Video + Audio', due_on: '2026-02-22', notes: 'Produce all ad creatives: display (300x250, 728x90, 160x600), video (:15/:30 for CTV+OLV), audio (:30). AI image gen via Nano Banana + Canva for design.' },
    { name: 'Landing Page Build + QA', due_on: '2026-02-25', notes: 'Build lockeai.co/airpod-ai LP: hero, benefits, proof, comparison, FAQ, pricing, pre-order CTA. Apple Pay/Google Pay integration.' },
    { name: 'Legal + Privacy Review', due_on: '2026-02-20', notes: 'Review all claims, disclosures, AI language compliance. Ensure "AI-generated responses may not always be accurate" disclaimer is present.' },
    { name: 'Campaign Setup � TTD (Display  + Video  + Audio )', due_on: '2026-02-26', notes: 'Setup awareness display, pre-roll video, and programmatic audio campaigns in The Trade Desk.' },
    { name: 'Campaign Setup � DV360 (CTV )', due_on: '2026-02-26', notes: 'Setup Connected TV campaign across Hulu, Peacock, YouTube TV in Display & Video 360.' },
    { name: 'Campaign Setup � Amazon DSP (Retargeting )', due_on: '2026-02-26', notes: 'Setup display retargeting + in-market audience campaigns in Amazon DSP.' },
    { name: 'Trafficking + Tags + QA + Launch Checklist', due_on: '2026-02-28', notes: 'Full QA: ad server tags, pixels, placements, frequency caps (3x/week), brand safety (IAS), consent. Final go/no-go.' },
    { name: '?? Pre-launch Tease Begins', due_on: '2026-03-15', notes: 'Activate teaser creatives across all channels. Awareness phase begins.' },
    { name: '?? LAUNCH � OpenAI Device Day', due_on: '2026-04-01', notes: 'Full campaign goes live. Monitor real-time pacing, social sentiment, pre-order volume. War room active.' },
    { name: 'Week 1 Performance Review + Optimization', due_on: '2026-04-08', notes: 'Review delivery, pacing, and performance across all DSPs. First optimization pass: bid adjustments, audience refinement, creative rotation.' },
    { name: 'Post-Mortem + Learnings', due_on: '2026-06-07', notes: 'Campaign wrap: final performance vs KPIs, incrementality results, learnings doc, next steps.' }
  ];

  const createdTasks = [];
  const failedTasks = [];
  if (projectId) {
    await pMapSimple(tasks, async (task, idx) => {
      try {
        const r = await callToolAsync('asana-v2', 'asana_create_task', { project_id: projectId, name: task.name, notes: task.notes, due_on: task.due_on }, { timeoutMs: 20000, maxRetries: 2 });
        const gid = r.success ? (r.output.match(/"gid":\s*"(\d+)"/) || [])[1] : null;
        createdTasks.push({ name: task.name, id: gid || 'failed', due: task.due_on, live: !!r.success, error: r.success ? null : r.error });
        if (!r.success) failedTasks.push({ task: task.name, error: r.error || 'Unknown error' });
      } catch (err) {
        createdTasks.push({ name: task.name, id: 'failed', due: task.due_on, live: false, error: err.message });
        failedTasks.push({ task: task.name, error: err.message });
      }
      emitStageEvent(emit || (() => {}), eventTypes.WORKFLOW_STAGE_PROGRESS, { source: results.workflowId, workflowId: 'campaign-lifecycle-demo', executionId: (opts && opts.executionId) || results.workflowId, stageId: (stageDef && stageDef.id) || 'project', stageName: (stageDef && stageDef.name) || 'Setup Project Management', stageIndex: stageIndex ?? 2, totalStages: STAGES.length, current: idx + 1, total: tasks.length, detail: `${idx + 1}/${tasks.length} tasks created` });
    }, { concurrency: 1 });
  }

  const successCount = createdTasks.filter(t => t.live).length;
  stage.status = successCount > 0 ? 'completed' : 'failed';
  stage.output = { projectId, projectUrl: projectId ? `https://app.asana.com/0/${projectId}` : null, tasksCreated: successCount, tasksFailed: failedTasks.length, failedItems: failedTasks, tasks: createdTasks };
  results.artifacts.asanaProjectId = projectId;
  results.artifacts.asanaProjectUrl = projectId ? `https://app.asana.com/0/${projectId}` : null;
  stage.completedAt = new Date().toISOString();
  return stage;
}
async function generateLandingPage(results, log, CAMPAIGN_DATA) {
  log('\n⏳ Stage 4/7: Generating campaign landing page...');
  const stage = { id: 'landing', name: 'Generate Landing Page', status: 'running', startedAt: new Date().toISOString() };

  try {
    // Read the existing landing page template, write to campaign-specific output
    const templatePath = path.join(__dirname, '..', 'output', 'landing-page.html');
    const campaignSlug = (CAMPAIGN_DATA.product || 'campaign').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const outputPath = path.join(__dirname, '..', 'output', `landing-${campaignSlug}.html`);
    
    let htmlContent = fs.readFileSync(templatePath, 'utf8');
    
    // Replace hardcoded content with campaign data
    htmlContent = htmlContent.replace(/Locke AirPod AI/g, CAMPAIGN_DATA.product);
    htmlContent = htmlContent.replace(/Locke AI Co\./g, CAMPAIGN_DATA.brand);
    htmlContent = htmlContent.replace(/Intelligence You Can Wear/g, CAMPAIGN_DATA.tagline);
    htmlContent = htmlContent.replace(/\$199/g, CAMPAIGN_DATA.price);
    
    // Replace the countdown date in the JavaScript section
    // Extract date from launchEvent like "SaaStr Annual 2026 — April 15, 2026"
    const dateMatch = CAMPAIGN_DATA.launchEvent.match(/(\w+ \d+,?\s*\d{4})\s*$/);
    let isoDate = '2026-04-01';
    if (dateMatch) {
      try {
        const parsed = new Date(dateMatch[1]);
        if (!isNaN(parsed)) isoDate = parsed.toISOString().slice(0, 10);
      } catch (_) {}
    } else if (CAMPAIGN_DATA.flightStart) {
      isoDate = CAMPAIGN_DATA.flightStart;
    }
    htmlContent = htmlContent.replace(
      /const launchDate = new Date\('[^']+'\);/,
      `const launchDate = new Date('${isoDate}T00:00:00-07:00');`
    );
    
    // Replace the launch event text
    htmlContent = htmlContent.replace(
      /LAUNCHING AT OPENAI DEVICE DAY/g,
      `LAUNCHING AT ${CAMPAIGN_DATA.launchEvent.split(' — ')[0].toUpperCase()}`
    );
    htmlContent = htmlContent.replace(
      /APRIL 1, 2026 — SAN FRANCISCO/g,
      CAMPAIGN_DATA.launchEvent.toUpperCase()
    );
    
    // Write the customized landing page
    fs.writeFileSync(outputPath, htmlContent, 'utf8');
    
    stage.status = 'completed';
    stage.output = {
      filePath: outputPath,
      templateUsed: templatePath,
      replacements: [
        `Product: ${CAMPAIGN_DATA.product}`,
        `Brand: ${CAMPAIGN_DATA.brand}`,
        `Tagline: ${CAMPAIGN_DATA.tagline}`,
        `Price: ${CAMPAIGN_DATA.price}`,
        `Launch Event: ${CAMPAIGN_DATA.launchEvent}`
      ]
    };
    results.artifacts.landingPagePath = outputPath;
    
  } catch (err) {
    stage.status = 'failed';
    stage.error = err.message;
  }
  
  stage.completedAt = new Date().toISOString();
  return stage;
}

// ─── STAGE 5: AI IMAGE GEN + CANVA ───────────────────────
async function generateCreatives(results, log, CAMPAIGN_DATA, emit, stageDef, stageIndex, opts = {}) {
  log('\n? Stage 5/7: Generating AI creatives (Nano Banana Pro ? Canva)...');
  const stage = { id: 'creative', name: 'Generate Creatives (Nano Banana Pro ? Canva)', status: 'running', startedAt: new Date().toISOString() };

  const canva = require(path.join(__dirname, '..', 'connectors', 'canva'));
  const imageGen = require(path.join(__dirname, '..', 'connectors', 'image-gen'));
  const designs = [];
  const sizes = (opts.skipCreatives ? [] : CAMPAIGN_DATA.creativeSizes);

  await pMapSimple(sizes, async (size, i) => {
    log(`   ?? [${i + 1}/${sizes.length}] ${size.name} (${size.size})...`);
    const entry = { name: `${CAMPAIGN_DATA.product} � ${size.name}`, size: size.size, format: size.format };

    try {
      const type = size.format === 'video' ? 'video-thumbnail' : 'display-banner';
      const genResult = await imageGen.generateImage({
        brand: CAMPAIGN_DATA.brand,
        product: CAMPAIGN_DATA.product,
        size: size.size,
        tagline: CAMPAIGN_DATA.tagline || 'Intelligence You Can Wear',
        type
      });

      if (genResult.success) {
        entry.aiGenerated = true;
        entry.imagePath = genResult.imagePath;
        entry.imageModel = genResult.model;
      } else {
        entry.aiGenerated = false;
        entry.aiError = genResult.error;
      }
    } catch (err) {
      entry.aiGenerated = false;
      entry.aiError = err.message;
    }

    let assetId = null;
    if (entry.aiGenerated && entry.imagePath) {
      try {
        const uploadResult = await canva.uploadAssetFromFile({
          filePath: entry.imagePath,
          name: `${CAMPAIGN_DATA.product} � ${size.name} (${size.size})`
        });
        if (uploadResult.status === 'success' && uploadResult.asset?.id) {
          assetId = uploadResult.asset.id;
          entry.canvaAssetId = assetId;
          entry.assetUploaded = true;
        }
      } catch (err) {
        entry.assetUploadError = err.message;
      }
    }

    try {
      const designParams = {
        title: `${CAMPAIGN_DATA.product} � ${size.name} (${size.size})`,
        design_type: 'custom',
        width: size.w,
        height: size.h
      };
      if (assetId) designParams.asset_id = assetId;

      const canvaResult = await canva.createDesign(designParams);
      entry.canvaId = canvaResult.design?.id || 'unknown';
      entry.editUrl = canvaResult.design?.urls?.edit_url || canvaResult.editUrl;
      entry.viewUrl = canvaResult.design?.urls?.view_url;
      entry.canvaLive = true;
    } catch (err) {
      entry.canvaId = `fallback-${size.size}`;
      entry.canvaLive = false;
      entry.canvaError = err.message;
    }

    designs.push(entry);
    emitStageEvent(emit || (() => {}), eventTypes.WORKFLOW_STAGE_PROGRESS, {
      source: results.workflowId,
      workflowId: 'campaign-lifecycle-demo',
      executionId: (opts && opts.executionId) || results.workflowId,
      stageId: (stageDef && stageDef.id) || 'creative',
      stageName: (stageDef && stageDef.name) || 'Generate Creatives',
      stageIndex: stageIndex ?? 4,
      totalStages: STAGES.length,
      current: i + 1,
      total: sizes.length,
      detail: `${i + 1}/${sizes.length} creatives processed`
    });
  }, { concurrency: 1 });

  const aiCount = designs.filter(d => d.aiGenerated).length;
  const canvaCount = designs.filter(d => d.canvaLive).length;
  const failedItems = designs.filter(d => !d.canvaLive).map(d => ({
    name: d.name,
    error: d.canvaError || d.aiError || 'Unknown'
  }));

  stage.status = designs.length === 0 ? 'completed' : (canvaCount > 0 ? 'completed' : 'failed');
  stage.output = {
    designsCreated: designs.length,
    aiGenerated: aiCount,
    canvaDesigns: canvaCount,
    failedItems,
    imageModel: imageGen.MODEL,
    designs
  };
  results.artifacts.creativeDesigns = designs;

  stage.completedAt = new Date().toISOString();
  return stage;
}
async function activateOnDSPs(results, log, CAMPAIGN_DATA) {
  log('\n⏳ Stage 6/7: Activating campaigns on DSPs...');
  const stage = { id: 'activate', name: 'Activate on DSPs', status: 'running', startedAt: new Date().toISOString() };

  const connectors = require(path.join(__dirname, '..', 'connectors'));
  const campaigns = [];

  for (const line of CAMPAIGN_DATA.mediaPlan) {
    const dspKey = line.dsp.toLowerCase().replace(' ', '-');
    const connector = connectors.getConnector(dspKey);

    if (connector && connector.createCampaign) {
      const camp = await connector.createCampaign({
        name: `${CAMPAIGN_DATA.product} — ${line.channel} — ${line.tactic}`,
        budget: line.budget,
        startDate: CAMPAIGN_DATA.flightStart,
        endDate: CAMPAIGN_DATA.flightEnd,
        channel: line.channel.toLowerCase(),
        funnel: 'awareness',
        lob: 'automotive'
      });
      campaigns.push({ dsp: line.dsp, id: camp.id, name: camp.name, budget: line.budget, channel: line.channel, status: 'activated' });
    } else {
      campaigns.push({ dsp: line.dsp, id: `mock-${dspKey}-${Date.now()}`, name: `${CAMPAIGN_DATA.product} — ${line.tactic}`, budget: line.budget, channel: line.channel, status: 'mock' });
    }
  }

  stage.status = 'completed';
  stage.output = { campaignsActivated: campaigns.length, campaigns, totalBudget: CAMPAIGN_DATA.budget };
  results.artifacts.activatedCampaigns = campaigns;

  stage.completedAt = new Date().toISOString();
  return stage;
}

// ─── STAGE 6: SUMMARY REPORT ─────────────────────────────
async function generateSummaryReport(results, log, CAMPAIGN_DATA) {
  log('\n⏳ Stage 7/7: Compiling activation report...');
  const stage = { id: 'report', name: 'Generate Summary Report', status: 'running', startedAt: new Date().toISOString() };

  const a = results.artifacts;
  const camps = a.activatedCampaigns || [];

  const creativeDesigns = a.creativeDesigns || [];
  const aiGenCount = creativeDesigns.filter(d => d.aiGenerated).length;
  const canvaCount = creativeDesigns.filter(d => d.canvaLive).length;

  const reportContent = `${CAMPAIGN_DATA.brand} — ${CAMPAIGN_DATA.product} Campaign Activation Report

═══════════════════════════════════════════════════════
EXECUTIVE SUMMARY
═══════════════════════════════════════════════════════

Campaign activation workflow completed for the ${CAMPAIGN_DATA.product} launch at ${CAMPAIGN_DATA.launchEvent}.

  Brand: ${CAMPAIGN_DATA.brand}
  Product: ${CAMPAIGN_DATA.product}
  Tagline: "${CAMPAIGN_DATA.tagline}"
  Total Budget: $${CAMPAIGN_DATA.budget.toLocaleString()}
  Flight: ${CAMPAIGN_DATA.flightStart} to ${CAMPAIGN_DATA.flightEnd}
  Target: ${CAMPAIGN_DATA.targetAudience}
  Primary Goal: ${CAMPAIGN_DATA.brief.primaryOutcome}

═══════════════════════════════════════════════════════
ARTIFACTS CREATED
═══════════════════════════════════════════════════════

  📄 Campaign Brief: ${a.briefDocUrl || 'N/A'}
  📊 Media Plan: ${a.mediaPlanSheetUrl || 'N/A'}
  📋 Asana Project: ${a.asanaProjectUrl || 'N/A'}
  🎨 Creative Designs: ${creativeDesigns.length} assets (${aiGenCount} AI-generated, ${canvaCount} Canva designs)
${creativeDesigns.map(d => `    • ${d.name} (${d.size}) ${d.aiGenerated ? '🖼️ AI' : ''} ${d.canvaLive ? '🎨 Canva' : ''} ${d.editUrl ? '→ ' + d.editUrl : ''}`).join('\n')}

═══════════════════════════════════════════════════════
DSP ACTIVATION STATUS
═══════════════════════════════════════════════════════

${camps.map(c => {
    let detail = `  ${c.dsp} — ${c.name}\n    Campaign ID: ${c.CampaignId || c.campaignId || c.orderId || c.id}\n    Budget: $${c.budget.toLocaleString()}\n    Channel: ${c.channel}\n    Status: ${c.status}`;
    if (c.BidStrategy) detail += `\n    Bid Strategy: ${c.BidStrategy.BidStrategyType} ($${c.BidStrategy.MaxBidCPM} CPM)\n    Targeting: ${c.Targeting?.AudienceSegments?.join(', ')}\n    Brand Safety: ${c.Targeting?.BrandSafety?.Provider} (${c.Targeting?.BrandSafety?.Level})\n    Frequency Cap: ${c.FrequencyCap?.MaxImpressions}x per ${c.FrequencyCap?.TimeUnitType}`;
    if (c.insertionOrder) detail += `\n    Insertion Order: ${c.insertionOrder.insertionOrderId}\n    Line Item: ${c.lineItems?.[0]?.lineItemId}\n    Inventory: ${c.lineItems?.[0]?.targeting?.inventorySource?.inventorySourceIds?.join(', ')}`;
    if (c.amazonAttribution) detail += `\n    Order: ${c.orderId}\n    Amazon Audiences: ${c.lineItems?.[0]?.targeting?.audiences?.amazonAudiences?.join(', ')}\n    Attribution: ${c.amazonAttribution.attributionModel} (${c.amazonAttribution.conversionWindow})`;
    return detail;
  }).join('\n\n')}

  TOTAL: $${camps.reduce((s, c) => s + c.budget, 0).toLocaleString()} across ${camps.length} campaigns on ${[...new Set(camps.map(c => c.dsp))].length} DSPs

═══════════════════════════════════════════════════════
TIMELINE
═══════════════════════════════════════════════════════

  Feb 12 — Campaign kickoff & brief alignment
  Feb 15 — Audience + KPI + measurement plan finalized
  Feb 22 — Creative production complete
  Feb 26 — All DSP campaigns set up
  Feb 28 — Trafficking QA + launch checklist
  Mar 15 — 🚀 Pre-launch tease begins
  Apr 1  — 🎉 FULL LAUNCH at OpenAI Device Day
  Apr 8  — Week 1 performance review
  Jun 7  — Post-mortem & learnings

═══════════════════════════════════════════════════════
NEXT STEPS
═══════════════════════════════════════════════════════

  1. Complete creative production & QA (by Feb 28)
  2. Activate pre-launch tease on ${CAMPAIGN_DATA.flightStart}
  3. Full campaign launch April 1 — OpenAI Device Day
  4. Daily pacing + real-time pre-order monitoring
  5. Weekly optimization cadence through May 31
  6. Post-mortem & incrementality results by June 7

Report generated: ${new Date().toISOString()}
Workflow ID: ${results.workflowId}`;

  let r;
  try {
    r = await callToolAsync('google-docs', 'createDocument', {
      title: `${CAMPAIGN_DATA.brand} — ${CAMPAIGN_DATA.product} Activation Report`,
      initialContent: reportContent
    });
  } catch (err) {
    r = { success: false, error: err.message };
  }

  if (r.success) {
    const docId = extractId(r.output);
    if (!docId) {
      stage.status = 'failed';
      stage.error = 'Created report but could not extract ID from MCP output';
    } else {
      const docUrl = extractLink(r.output) || `https://docs.google.com/document/d/${docId}/edit`;
      stage.status = 'completed';
      stage.output = { reportDocId: docId, reportDocUrl: docUrl };
      results.artifacts.reportDocId = docId;
      results.artifacts.reportDocUrl = docUrl;
    }
  } else {
    stage.status = 'failed';
    stage.error = r.error;
  }

  stage.completedAt = new Date().toISOString();
  return stage;
}

// ─── OPTIONAL: SEARCH CAMPAIGN STAGE ─────────────────────
async function runSearchCampaignStage(results, log, CAMPAIGN_DATA) {
  log('\n⏳ Search Campaign: Creating search ads pipeline...');
  const stage = { id: 'search', name: 'Search Campaign', status: 'running', startedAt: new Date().toISOString() };

  try {
    const { runSearchWorkflow } = require(path.join(__dirname, 'search-campaign-workflow'));
    const searchResults = await runSearchWorkflow({
      campaignName: `${CAMPAIGN_DATA.product} — Search`,
      budget: 5000,
      startDate: CAMPAIGN_DATA.flightStart,
      endDate: CAMPAIGN_DATA.flightEnd,
      log
    });

    stage.status = searchResults.status === 'completed' ? 'completed' : 'partial';
    stage.output = {
      searchWorkflowId: searchResults.workflowId,
      stagesCompleted: searchResults.stages.filter(s => s.status === 'completed').length,
      totalStages: searchResults.stages.length
    };
    results.artifacts.searchWorkflow = searchResults;
  } catch (err) {
    stage.status = 'failed';
    stage.error = err.message;
  }

  stage.completedAt = new Date().toISOString();
  return stage;
}

const meta = {
  id: 'campaign-lifecycle-demo',
  name,
  category: 'orchestration',
  description,
  version: '1.0.0',
  triggers: { manual: true, scheduled: null, events: [] },
  requiredConnectors: [],
  optionalConnectors: ['google-docs', 'asana-v2', 'canva', 'image-gen', 'ttd', 'dv360', 'amazon-dsp'],
  inputs: {
    campaign: { type: 'string', required: false, description: 'Campaign slug from config/campaigns/*.json (default: locke-airpod-ai)' },
    includeSearch: { type: 'boolean', required: false, description: 'Run optional search-campaign stage' }
  },
  outputs: ['workflowId', 'campaignName', 'artifacts', 'status', 'stages', 'startedAt', 'completedAt'],
  stages: STAGES,
  estimatedDuration: '5-15 minutes',
  isOrchestrator: true,
  subWorkflows: ['search-campaign-workflow']
};

module.exports = { name, description, STAGES, getInfo, run, loadCampaign, DEFAULT_CAMPAIGN_DATA, meta };



