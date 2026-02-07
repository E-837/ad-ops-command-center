const api = require('../connectors/api-client');

async function createKnowledgeBase() {
  console.log('📚 Creating Ad Ops Command Center Knowledge Base in Notion...\n');
  
  const search = await api.notion.search('');
  console.log('Existing pages:', search.results?.length || 0);
  
  if (search.results?.length === 0) {
    console.log('\n⚠️  No pages shared with the Notion integration yet.');
    return;
  }
  
  const parentPage = search.results[0];
  console.log('Found parent:', parentPage.id);
  
  // Create the main documentation page with simpler formatting
  const mainDoc = await api.notion.createPage({
    parent: { page_id: parentPage.id },
    properties: {
      title: {
        title: [{ text: { content: '🤖 Ad Ops Command Center - Documentation' } }]
      }
    },
    children: [
      {
        type: 'heading_1',
        heading_1: { rich_text: [{ text: { content: 'Ad Ops Command Center' } }] }
      },
      {
        type: 'paragraph',
        paragraph: { rich_text: [{ text: { content: 'Multi-agent system for digital advertising operations. Built for programmatic media buying, campaign management, and ad tech workflows.' } }] }
      },
      { type: 'divider', divider: {} },
      
      // Architecture
      {
        type: 'heading_2',
        heading_2: { rich_text: [{ text: { content: '🏗️ Architecture Overview' } }] }
      },
      {
        type: 'code',
        code: {
          language: 'plain text',
          rich_text: [{ text: { content: `┌─────────────────────────────────────────────────────┐
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
└─────────────────────────────────────────────────────┘` } }]
        }
      },
      { type: 'divider', divider: {} },
      
      // Agents
      {
        type: 'heading_2',
        heading_2: { rich_text: [{ text: { content: '🤖 Agents' } }] }
      },
      {
        type: 'heading_3',
        heading_3: { rich_text: [{ text: { content: '1. MediaPlanner (Sonnet)' } }] }
      },
      {
        type: 'paragraph',
        paragraph: { rich_text: [{ text: { content: 'Strategic media planning and budget allocation. Creates media plans based on campaign objectives, allocates budget across channels (CTV, OLV, Display, Native), and recommends DSP mix based on inventory needs.' } }] }
      },
      {
        type: 'heading_3',
        heading_3: { rich_text: [{ text: { content: '2. Trader (Haiku)' } }] }
      },
      {
        type: 'paragraph',
        paragraph: { rich_text: [{ text: { content: 'Campaign execution and optimization. Sets up campaigns in DSPs (TTD, DV360, Amazon), manages bids, budgets, and pacing, handles bid lists (domain/app allow/block).' } }] }
      },
      {
        type: 'heading_3',
        heading_3: { rich_text: [{ text: { content: '3. Analyst (Sonnet)' } }] }
      },
      {
        type: 'paragraph',
        paragraph: { rich_text: [{ text: { content: 'Performance analysis and reporting. Generates WoW (Week-over-Week) reports, identifies optimization opportunities, monitors pacing and anomalies.' } }] }
      },
      {
        type: 'heading_3',
        heading_3: { rich_text: [{ text: { content: '4. CreativeOps (Haiku)' } }] }
      },
      {
        type: 'paragraph',
        paragraph: { rich_text: [{ text: { content: 'Creative asset management. Validates creative specs against DSP requirements, manages creative library and versioning.' } }] }
      },
      {
        type: 'heading_3',
        heading_3: { rich_text: [{ text: { content: '5. Compliance (Haiku)' } }] }
      },
      {
        type: 'paragraph',
        paragraph: { rich_text: [{ text: { content: 'Brand safety and regulatory compliance. Reviews targeting for brand safety, ensures GDPR/CCPA compliance.' } }] }
      },
      {
        type: 'heading_3',
        heading_3: { rich_text: [{ text: { content: '6. ProjectManager (Sonnet)' } }] }
      },
      {
        type: 'paragraph',
        paragraph: { rich_text: [{ text: { content: 'Workflow coordination via Asana + Notion. Creates and tracks campaign briefs in Asana, manages approvals and handoffs, maintains documentation in Notion.' } }] }
      },
      {
        type: 'heading_3',
        heading_3: { rich_text: [{ text: { content: '7. CreativeCoordinator (Haiku)' } }] }
      },
      {
        type: 'paragraph',
        paragraph: { rich_text: [{ text: { content: 'Design specs and asset extraction via Figma. Pulls dimensions and specs from Figma designs, validates against DSP creative requirements, exports assets for trafficking.' } }] }
      },
      { type: 'divider', divider: {} },
      
      // Connectors
      {
        type: 'heading_2',
        heading_2: { rich_text: [{ text: { content: '🔌 Connectors' } }] }
      },
      {
        type: 'heading_3',
        heading_3: { rich_text: [{ text: { content: 'DSP Connectors (Mock)' } }] }
      },
      {
        type: 'bulleted_list_item',
        bulleted_list_item: { rich_text: [{ text: { content: 'The Trade Desk (TTD) — 8 tools: Campaigns, Ad Groups, Reporting, Bid Lists (domain/app/IP/deal)' } }] }
      },
      {
        type: 'bulleted_list_item',
        bulleted_list_item: { rich_text: [{ text: { content: 'DV360 (Google) — 9 tools: Insertion Orders, Line Items, Creatives, Audiences, Targeting, Exchanges' } }] }
      },
      {
        type: 'bulleted_list_item',
        bulleted_list_item: { rich_text: [{ text: { content: 'Amazon DSP — 9 tools: Orders, Line Items, Reports, Audiences, Supply Sources, ASIN Targeting' } }] }
      },
      {
        type: 'heading_3',
        heading_3: { rich_text: [{ text: { content: 'Productivity Connectors (LIVE)' } }] }
      },
      {
        type: 'bulleted_list_item',
        bulleted_list_item: { rich_text: [{ text: { content: '✅ Asana — 7 tools: Tasks, Projects, Comments (via Personal Access Token)' } }] }
      },
      {
        type: 'bulleted_list_item',
        bulleted_list_item: { rich_text: [{ text: { content: '✅ Notion — 6 tools: Pages, Databases, Blocks, Search (via Integration Token)' } }] }
      },
      {
        type: 'bulleted_list_item',
        bulleted_list_item: { rich_text: [{ text: { content: '✅ Figma — 6 tools: Files, Nodes, Images, Comments, Styles (via Personal Access Token)' } }] }
      },
      { type: 'divider', divider: {} },
      
      // Workflows
      {
        type: 'heading_2',
        heading_2: { rich_text: [{ text: { content: '⚡ Workflows' } }] }
      },
      {
        type: 'numbered_list_item',
        numbered_list_item: { rich_text: [{ text: { content: 'Campaign Launch — Brief → Media Plan → DSP Setup → QA → Launch' } }] }
      },
      {
        type: 'numbered_list_item',
        numbered_list_item: { rich_text: [{ text: { content: 'Pacing Check — Monitor spend vs. budget, alert on deviations >10%' } }] }
      },
      {
        type: 'numbered_list_item',
        numbered_list_item: { rich_text: [{ text: { content: 'WoW Report — Weekly performance analysis with automated insights' } }] }
      },
      {
        type: 'numbered_list_item',
        numbered_list_item: { rich_text: [{ text: { content: 'Optimization — Identify underperformers, recommend bid/budget changes' } }] }
      },
      {
        type: 'numbered_list_item',
        numbered_list_item: { rich_text: [{ text: { content: 'Anomaly Detection — Flag unusual metrics, potential fraud indicators' } }] }
      },
      { type: 'divider', divider: {} },
      
      // Quick Reference
      {
        type: 'heading_2',
        heading_2: { rich_text: [{ text: { content: '📊 Quick Reference' } }] }
      },
      {
        type: 'heading_3',
        heading_3: { rich_text: [{ text: { content: 'Key Metrics' } }] }
      },
      {
        type: 'bulleted_list_item',
        bulleted_list_item: { rich_text: [{ text: { content: 'CPM — Cost per 1,000 impressions' } }] }
      },
      {
        type: 'bulleted_list_item',
        bulleted_list_item: { rich_text: [{ text: { content: 'CTR — Click-through rate (clicks ÷ impressions)' } }] }
      },
      {
        type: 'bulleted_list_item',
        bulleted_list_item: { rich_text: [{ text: { content: 'VCR — Video completion rate (completes ÷ starts)' } }] }
      },
      {
        type: 'bulleted_list_item',
        bulleted_list_item: { rich_text: [{ text: { content: 'CPA — Cost per acquisition/action' } }] }
      },
      {
        type: 'bulleted_list_item',
        bulleted_list_item: { rich_text: [{ text: { content: 'ROAS — Return on ad spend (revenue ÷ spend)' } }] }
      },
      {
        type: 'heading_3',
        heading_3: { rich_text: [{ text: { content: 'Standard Ad Sizes' } }] }
      },
      {
        type: 'code',
        code: {
          language: 'plain text',
          rich_text: [{ text: { content: `DISPLAY
• 300x250  — Medium Rectangle (most common)
• 728x90   — Leaderboard
• 160x600  — Wide Skyscraper
• 320x50   — Mobile Banner
• 300x600  — Half Page
• 970x250  — Billboard

VIDEO
• 1920x1080 — Full HD (16:9)
• 1280x720  — HD
• 640x360   — SD

NATIVE
• 1200x628  — Facebook/LinkedIn landscape
• 1200x1200 — Square
• 1080x1920 — Stories/Vertical` } }]
        }
      },
      {
        type: 'heading_3',
        heading_3: { rich_text: [{ text: { content: 'Industry Benchmarks' } }] }
      },
      {
        type: 'code',
        code: {
          language: 'plain text',
          rich_text: [{ text: { content: `Channel      | CPM      | CTR    | VCR
-------------|----------|--------|-------
CTV          | $25-45   | N/A    | 95%+
OLV (Pre)    | $15-25   | 0.5%   | 70%+
Display      | $3-8     | 0.1%   | N/A
Native       | $5-12    | 0.3%   | N/A
Audio        | $8-15    | N/A    | 90%+` } }]
        }
      },
      { type: 'divider', divider: {} },
      
      // Footer
      {
        type: 'callout',
        callout: {
          icon: { emoji: '🤖' },
          rich_text: [{ text: { content: 'Documentation auto-generated by Ad Ops Command Center | Last updated: ' + new Date().toISOString().split('T')[0] } }]
        }
      }
    ]
  });
  
  console.log('\n✅ Created knowledge base!');
  console.log('   Page ID:', mainDoc.id);
  console.log('\n🔗 Open Notion to see your documentation!');
}

createKnowledgeBase().catch(e => console.error('Error:', e));
