const api = require('../connectors/api-client');

const DB_ID = '300bb6f7-73c2-8093-9f21-fe43e70231fd';

const ARCH_DIAGRAM = `┌─────────────────────────────────────────────────────┐
│                 AD OPS COMMAND CENTER                │
├─────────────────────────────────────────────────────┤
│  AGENTS (7)           │  CONNECTORS (6)             │
│  ├─ MediaPlanner      │  ├─ TTD (The Trade Desk)    │
│  ├─ Trader            │  ├─ DV360 (Google)          │
│  ├─ Analyst           │  ├─ Amazon DSP              │
│  ├─ CreativeOps       │  ├─ Asana ✓ LIVE            │
│  ├─ Compliance        │  ├─ Notion ✓ LIVE           │
│  ├─ ProjectManager    │  └─ Figma ✓ LIVE            │
│  └─ CreativeCoord     │                             │
├─────────────────────────────────────────────────────┤
│  DOMAIN LAYER                                       │
│  ├─ Taxonomy (channels, tactics, metrics)           │
│  ├─ Benchmarks (CPM, CTR, VCR by vertical)         │
│  ├─ Glossary (100+ ad tech terms)                  │
│  └─ Business Rules (pacing, compliance)            │
└─────────────────────────────────────────────────────┘`;

const AD_SIZES = `DISPLAY
• 300x250  — Medium Rectangle
• 728x90   — Leaderboard  
• 160x600  — Wide Skyscraper
• 320x50   — Mobile Banner
• 300x600  — Half Page

VIDEO
• 1920x1080 — Full HD (16:9)
• 1280x720  — HD
• 640x360   — SD

NATIVE
• 1200x628  — Landscape
• 1200x1200 — Square`;

const BENCHMARKS = `Channel   | CPM     | CTR   | VCR
----------|---------|-------|------
CTV       | $25-45  | N/A   | 95%+
OLV       | $15-25  | 0.5%  | 70%+
Display   | $3-8    | 0.1%  | N/A
Native    | $5-12   | 0.3%  | N/A`;

async function createDocs() {
  console.log('📚 Adding documentation to your Notion database...\n');
  
  // 1. Architecture Overview
  const overview = await api.notion.createPage({
    parent: { database_id: DB_ID },
    properties: {
      'Document Name': { title: [{ text: { content: '🏗️ Architecture Overview' } }] }
    },
    children: [
      { type: 'paragraph', paragraph: { rich_text: [{ text: { content: 'Multi-agent system for digital advertising operations. Built for programmatic media buying, campaign management, and ad tech workflows.' } }] } },
      { type: 'code', code: { language: 'plain text', rich_text: [{ text: { content: ARCH_DIAGRAM } }] } }
    ]
  });
  console.log('✅ Created: Architecture Overview');
  
  // 2. Agents Reference
  const agents = await api.notion.createPage({
    parent: { database_id: DB_ID },
    properties: {
      'Document Name': { title: [{ text: { content: '🤖 Agents Reference' } }] }
    },
    children: [
      { type: 'heading_2', heading_2: { rich_text: [{ text: { content: '1. MediaPlanner (Sonnet)' } }] } },
      { type: 'paragraph', paragraph: { rich_text: [{ text: { content: 'Strategic media planning and budget allocation. Creates media plans, allocates budget across channels (CTV, OLV, Display, Native), recommends DSP mix based on inventory needs.' } }] } },
      { type: 'heading_2', heading_2: { rich_text: [{ text: { content: '2. Trader (Haiku)' } }] } },
      { type: 'paragraph', paragraph: { rich_text: [{ text: { content: 'Campaign execution and optimization. Sets up campaigns in DSPs (TTD, DV360, Amazon), manages bids/budgets/pacing, handles bid lists (domain/app allow/block).' } }] } },
      { type: 'heading_2', heading_2: { rich_text: [{ text: { content: '3. Analyst (Sonnet)' } }] } },
      { type: 'paragraph', paragraph: { rich_text: [{ text: { content: 'Performance analysis and reporting. Generates WoW (Week-over-Week) reports, identifies optimization opportunities, monitors pacing and anomalies.' } }] } },
      { type: 'heading_2', heading_2: { rich_text: [{ text: { content: '4. CreativeOps (Haiku)' } }] } },
      { type: 'paragraph', paragraph: { rich_text: [{ text: { content: 'Creative asset management. Validates creative specs against DSP requirements, manages creative library and versioning.' } }] } },
      { type: 'heading_2', heading_2: { rich_text: [{ text: { content: '5. Compliance (Haiku)' } }] } },
      { type: 'paragraph', paragraph: { rich_text: [{ text: { content: 'Brand safety and regulatory compliance. Reviews targeting for brand safety, ensures GDPR/CCPA compliance.' } }] } },
      { type: 'heading_2', heading_2: { rich_text: [{ text: { content: '6. ProjectManager (Sonnet)' } }] } },
      { type: 'paragraph', paragraph: { rich_text: [{ text: { content: 'Workflow coordination via Asana + Notion. Creates and tracks campaign briefs in Asana, manages approvals and handoffs.' } }] } },
      { type: 'heading_2', heading_2: { rich_text: [{ text: { content: '7. CreativeCoordinator (Haiku)' } }] } },
      { type: 'paragraph', paragraph: { rich_text: [{ text: { content: 'Design specs and asset extraction via Figma. Pulls dimensions/specs from designs, validates against DSP requirements, exports assets for trafficking.' } }] } }
    ]
  });
  console.log('✅ Created: Agents Reference');
  
  // 3. Connectors
  const connectors = await api.notion.createPage({
    parent: { database_id: DB_ID },
    properties: {
      'Document Name': { title: [{ text: { content: '🔌 Connectors' } }] }
    },
    children: [
      { type: 'heading_2', heading_2: { rich_text: [{ text: { content: 'DSP Connectors (Mock Data)' } }] } },
      { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'The Trade Desk (TTD) — 8 tools: Campaigns, Ad Groups, Reporting, Bid Lists (domain/app/IP/deal)' } }] } },
      { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'DV360 (Google) — 9 tools: Insertion Orders, Line Items, Creatives, Audiences, Targeting, Exchanges' } }] } },
      { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'Amazon DSP — 9 tools: Orders, Line Items, Reports, Audiences, Supply Sources, ASIN Targeting' } }] } },
      { type: 'heading_2', heading_2: { rich_text: [{ text: { content: 'Productivity Connectors (LIVE)' } }] } },
      { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: '✅ Asana — 7 tools: Tasks, Projects, Sections, Comments (via Personal Access Token)' } }] } },
      { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: '✅ Notion — 6 tools: Pages, Databases, Blocks, Search (via Integration Token)' } }] } },
      { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: '✅ Figma — 6 tools: Files, Nodes, Images, Comments, Styles (via Personal Access Token)' } }] } }
    ]
  });
  console.log('✅ Created: Connectors');
  
  // 4. Workflows
  const workflows = await api.notion.createPage({
    parent: { database_id: DB_ID },
    properties: {
      'Document Name': { title: [{ text: { content: '⚡ Workflows' } }] }
    },
    children: [
      { type: 'numbered_list_item', numbered_list_item: { rich_text: [{ text: { content: 'Campaign Launch — Brief → Media Plan → DSP Setup → QA → Launch' } }] } },
      { type: 'numbered_list_item', numbered_list_item: { rich_text: [{ text: { content: 'Pacing Check — Monitor spend vs. budget, alert on deviations >10%' } }] } },
      { type: 'numbered_list_item', numbered_list_item: { rich_text: [{ text: { content: 'WoW Report — Weekly performance analysis with automated insights' } }] } },
      { type: 'numbered_list_item', numbered_list_item: { rich_text: [{ text: { content: 'Optimization — Identify underperformers, recommend bid/budget changes' } }] } },
      { type: 'numbered_list_item', numbered_list_item: { rich_text: [{ text: { content: 'Anomaly Detection — Flag unusual metrics, potential fraud indicators' } }] } },
      { type: 'divider', divider: {} },
      { type: 'heading_2', heading_2: { rich_text: [{ text: { content: 'Example: Campaign Launch Flow' } }] } },
      { type: 'paragraph', paragraph: { rich_text: [{ text: { content: '1. ProjectManager creates brief in Asana\n2. MediaPlanner allocates budget by channel\n3. CreativeCoordinator pulls specs from Figma\n4. Trader sets up campaigns in DSPs\n5. Compliance reviews targeting\n6. Trader activates campaigns\n7. Analyst monitors pacing' } }] } }
    ]
  });
  console.log('✅ Created: Workflows');
  
  // 5. Ad Specs & Benchmarks
  const specs = await api.notion.createPage({
    parent: { database_id: DB_ID },
    properties: {
      'Document Name': { title: [{ text: { content: '📐 Ad Specs & Benchmarks' } }] }
    },
    children: [
      { type: 'heading_2', heading_2: { rich_text: [{ text: { content: 'Standard Ad Sizes' } }] } },
      { type: 'code', code: { language: 'plain text', rich_text: [{ text: { content: AD_SIZES } }] } },
      { type: 'heading_2', heading_2: { rich_text: [{ text: { content: 'Industry Benchmarks' } }] } },
      { type: 'code', code: { language: 'plain text', rich_text: [{ text: { content: BENCHMARKS } }] } }
    ]
  });
  console.log('✅ Created: Ad Specs & Benchmarks');
  
  // 6. Glossary
  const glossary = await api.notion.createPage({
    parent: { database_id: DB_ID },
    properties: {
      'Document Name': { title: [{ text: { content: '📖 Ad Tech Glossary' } }] }
    },
    children: [
      { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'CPM — Cost per 1,000 impressions' } }] } },
      { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'CTR — Click-through rate (clicks ÷ impressions)' } }] } },
      { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'VCR — Video completion rate (completes ÷ starts)' } }] } },
      { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'CPA — Cost per acquisition/action' } }] } },
      { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'ROAS — Return on ad spend (revenue ÷ spend)' } }] } },
      { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'DSP — Demand-side platform (buying ads)' } }] } },
      { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'SSP — Supply-side platform (selling inventory)' } }] } },
      { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'DMP — Data management platform' } }] } },
      { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'CTV — Connected TV (streaming devices)' } }] } },
      { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'OLV — Online video (pre-roll, mid-roll)' } }] } },
      { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'PMP — Private marketplace (invite-only deals)' } }] } },
      { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'RTB — Real-time bidding' } }] } }
    ]
  });
  console.log('✅ Created: Ad Tech Glossary');
  
  console.log('\n🎉 Knowledge base complete! Check your Notion database.');
}

createDocs().catch(e => console.error('Error:', e));
