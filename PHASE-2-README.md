# Phase 2: UI Redesign + New Workflows

## Overview

Phase 2 expands the Ad Ops Command Center with a redesigned UI featuring sidebar navigation, project management, workflow library, and adds new workflows for campaign ops, reporting, and orchestration.

## What's New

### UI Components (Week 4)

#### 1. **Redesigned Navigation**
- **Sidebar layout** replacing top navbar
- Consistent across all pages
- Active page highlighting
- Mobile-responsive collapse

**Pages:**
- 📊 Dashboard (redesigned)
- 📁 Projects (NEW)
- ⚡ Workflows (NEW)
- 📈 Campaigns
- 🤖 Agents
- 🔌 Connectors
- 📊 Reports (renamed from Insights)
- 🏗️ Architecture
- 💬 Query

#### 2. **Projects Dashboard** (`/projects`)
- Project list with filtering (type, status, search)
- Project cards with:
  - Status badges (planning/active/completed/on-hold)
  - Type badges (campaign/dsp-onboarding/jbp/migration)
  - Progress tracking (% completion)
  - Owner, dates, budget
- Create project modal
- Stats header:
  - Total projects
  - Active projects
  - Completion rate
  - Budget allocated

#### 3. **Workflow Library** (`/workflows`)
- **Category tabs:**
  - Campaign Ops
  - Projects
  - Reporting
  - Orchestration
- Workflow cards showing:
  - Name, description
  - Duration estimate
  - Required connectors
  - Trigger types (manual/scheduled/event)
  - Stages
- Run workflow modal with dynamic parameter forms
- View details modal

#### 4. **Workflow Execution Detail** (`/workflow-detail.html`)
- Real-time execution progress
- Stage visualization with status
- Results display with artifacts
- Event timeline
- Retry/export actions

#### 5. **Unified Dashboard** (redesigned)
- **Active Projects** section (top 5)
- **Recent Executions** (last 10)
- **Alerts** (failed workflows, pacing issues, blockers)
- **Quick Actions** (Run Workflow, Create Project)
- **Stats:**
  - Total projects
  - Workflows run today/week
  - Success rate
  - Active campaigns
- Campaign metrics (existing)

#### 6. **Reports** (`/reports`)
- Renamed from Insights
- Additional report workflows (Monthly, Cross-Channel)

### New Workflows (Week 5)

#### 1. **Creative Test** (`creative-test`)
**Category:** Campaign Ops  
**Purpose:** A/B testing for creative variants

**Inputs:**
- `campaignId` - Campaign to test
- `platform` - Advertising platform
- `creativeVariants` - Array of creative variants
- `testDuration` - Duration in days (default: 7)
- `testBudget` - Total test budget

**Stages:**
1. Validate Variants
2. Create Ad Variants
3. Launch Test Flights (equal budget split)
4. Monitor Performance
5. Analyze Results (statistical significance)
6. Generate Recommendations

**Outputs:**
- Winner variant
- Performance metrics
- Lift calculations
- Recommendation (scale-winner or continue-testing)

#### 2. **Monthly Report** (`monthly-report`)
**Category:** Reporting  
**Purpose:** Comprehensive monthly rollup report

**Inputs:**
- `month` - Month in YYYY-MM format
- `platforms` - Array of platforms to include
- `includeYoY` - Year-over-year comparison (default: true)
- `createDocument` - Generate Google Docs report (default: true)

**Stages:**
1. Gather Platform Data
2. Aggregate Metrics
3. Generate Insights
4. Create Report Document
5. Distribute Report

**Outputs:**
- Report URL
- Summary
- Highlights
- Aggregated metrics
- Insights

**Scheduled:** First day of month at 9am

#### 3. **Cross-Channel Report** (`cross-channel-report`)
**Category:** Reporting  
**Purpose:** Compare performance across multiple platforms

**Inputs:**
- `startDate` - Start date (YYYY-MM-DD)
- `endDate` - End date (YYYY-MM-DD)
- `platforms` - Array of platforms
- `includeCharts` - Generate visualization data (default: true)

**Stages:**
1. Fetch Platform Data
2. Normalize Metrics (CPM, CPC, CTR, CPA, ROAS)
3. Compare Performance
4. Generate Visualizations
5. Generate Recommendations

**Outputs:**
- Normalized metrics
- Platform rankings
- Benchmarks
- Budget reallocation recommendations
- Chart data

**Scheduled:** Weekly on Friday at 10am

### Orchestration Workflows (Week 6)

#### 1. **Media Plan Execute** (`media-plan-execute`)
**Category:** Orchestration  
**Purpose:** Multi-channel campaign launcher from media plan

**Inputs:**
- `mediaPlanUrl` - URL to media plan document
- `mediaPlanData` - Structured media plan object (alternative to URL)
- `projectId` - Associated project ID
- `autoLaunch` - Auto-launch campaigns (default: false)

**Stages:**
1. Parse Media Plan
2. Route to Channel Workflows
3. Execute Workflows in Parallel
4. Track Executions
5. Generate Activation Report

**Orchestrates:**
- Search tactics → `search-campaign-workflow`
- Social tactics → `campaign-launch`
- Programmatic tactics → `campaign-launch`

**Outputs:**
- Execution IDs for all launched workflows
- Activation report
- Success/failure summary

**Event Triggers:** `plan.created`, `plan.approved`

#### 2. **Cross-Channel Launch** (`cross-channel-launch`)
**Category:** Orchestration  
**Purpose:** Launch same campaign across multiple platforms

**Inputs:**
- `campaignName` - Campaign name
- `budget` - Total budget (distributed across platforms)
- `platforms` - Array of platforms
- `creative` - Creative assets
- `targeting` - Targeting parameters
- `startDate` / `endDate` - Campaign dates
- `budgetStrategy` - Distribution strategy (equal/weighted/performance-based)

**Stages:**
1. Distribute Budget
2. Adapt Creative (platform-specific)
3. Launch Campaigns (parallel)
4. Verify Launches
5. Initial Monitoring Setup

**Outputs:**
- Campaign IDs per platform
- Budget distribution
- Verification status
- Launch results

**Event Trigger:** `campaign.approved`

### Event-Driven Triggers

**Registered Triggers:**
- `metric.threshold` → `anomaly-detection`
- `plan.created` → `media-plan-execute` (drafts)
- `plan.approved` → `media-plan-execute` (auto-launch)
- `budget.depleted` → `optimization`
- `campaign.approved` → `cross-channel-launch` (if multi-platform)
- `workflow.completed` → project status update
- `workflow.failed` → alert notification
- `project.created` → `prd-to-asana` (if PRD attached)

### Scheduled Triggers (Cron Jobs)

**Active Schedules:**
- **Daily 9am:** `pacing-check`
- **Daily 2pm:** `optimization` (recommendations only)
- **Daily 5pm:** Project status updates
- **Weekly Monday 8am:** `wow-report`
- **Weekly Friday 10am:** `cross-channel-report`
- **Monthly 1st 9am:** `monthly-report`
- **Every 4 hours:** Anomaly detection scan

## Architecture Changes

### New Files

**UI:**
- `ui/components/sidebar.html` - Reusable sidebar component
- `ui/projects.html` - Project dashboard
- `ui/workflows.html` - Workflow library
- `ui/workflow-detail.html` - Execution progress view
- `ui/reports.html` - Reports page (renamed from insights)
- Updated: `ui/dashboard.html` - Redesigned unified view

**Workflows:**
- `workflows/campaign-ops/creative-test.js`
- `workflows/reporting/monthly-report.js`
- `workflows/reporting/cross-channel-report.js`
- `workflows/orchestration/media-plan-execute.js`
- `workflows/orchestration/cross-channel-launch.js`

**Backend:**
- `events/triggers.js` - Event → workflow automation
- `cron-jobs.js` - Scheduled workflow execution
- Updated: `workflows/index.js` - Register new workflows
- Updated: `server.js` - New routes + initialize automation

### Design System

**Theme:**
- Dark background (#0a0a0a)
- Glass morphism cards (backdrop-blur, rgba borders)
- Purple/blue accent colors (#8B5CF6, #3B82F6)
- Inter font family
- Smooth transitions
- Fully responsive

**Components:**
- Sidebar navigation (fixed, collapsible)
- Glass cards (consistent styling)
- Status badges (color-coded)
- Progress bars (gradient fills)
- Modal forms (overlay + glass)
- Action buttons (primary/secondary)

## Usage

### Running the Platform

```bash
# Start server (includes automation)
npm start

# Or with PM2
pm2 start ecosystem.config.js
```

**Access:**
- Dashboard: http://localhost:3002/dashboard
- Projects: http://localhost:3002/projects
- Workflows: http://localhost:3002/workflows

### Creating a Project

1. Go to `/projects`
2. Click "+ Create Project"
3. Fill in:
   - Name
   - Type (campaign/dsp-onboarding/jbp/migration)
   - Owner
   - Budget (optional)
   - Description
4. Submit

### Running a Workflow

**From Workflow Library:**
1. Go to `/workflows`
2. Browse by category or view all
3. Click "View Details" to see workflow info
4. Click "▶️ Run" to open parameter form
5. Fill in required parameters
6. Click "Execute"
7. Redirects to `/workflow-detail.html?executionId=XXX`

**From Dashboard:**
- Use Quick Actions for common workflows
- Recent Executions show latest runs

**From API:**
```javascript
POST /api/execute
{
  "workflowId": "creative-test",
  "params": {
    "campaignId": "campaign-123",
    "platform": "google-ads",
    "creativeVariants": [...]
  }
}
```

### Monitoring Execution

1. Navigate to workflow execution detail page
2. View real-time stage progress
3. Check event timeline for detailed logs
4. Download results when completed
5. Retry if failed

### Triggering Workflows Automatically

**Via Events:**
```javascript
const eventBus = require('./events/bus');

// Emit event to trigger workflow
eventBus.emit('metric.threshold', {
  campaignId: 'campaign-123',
  metric: 'cpa',
  threshold: 50,
  currentValue: 75
});
```

**Via Cron (already configured):**
- Workflows with `scheduled` trigger in metadata auto-register
- See `cron-jobs.js` for manual schedules

## Testing

Run the Phase 2 test suite:

```bash
node test-phase2.js
```

Tests cover:
- UI page rendering
- Workflow registry loading
- Project dashboard data fetching
- New workflow execution (sandbox mode)
- Orchestration workflows
- Event triggers
- Cron job registration

## API Endpoints

### Projects
- `GET /api/projects` - List all projects (with filters)
- `GET /api/projects/:id` - Get project details
- `POST /api/projects` - Create project
- `PATCH /api/projects/:id` - Update project

### Workflows
- `GET /api/workflows` - List all workflows (from registry)
- `GET /api/workflows/:id` - Get workflow metadata
- `POST /api/execute` - Execute workflow
- `GET /api/executions/:id` - Get execution details

### Executions
- `GET /api/executions` - List recent executions
- `GET /api/executions/:id` - Get execution details
- `POST /api/executions/:id/retry` - Retry failed execution

## What's Next (Phase 3)

- Microsoft Ads connector (real, not mock)
- DSP onboarding workflow
- JBP workflow
- RFP response workflow
- Budget reallocation orchestrator
- Project intelligence features
- Risk detection
- Timeline health scoring

## Troubleshooting

**Workflows not showing up:**
- Check `workflows/index.js` for registration
- Verify workflow file exports `meta` and `run()`
- Restart server to reload registry

**Event triggers not firing:**
- Check `events/triggers.js` for registration
- Verify event name matches exactly
- Check server logs for errors

**Cron jobs not running:**
- Verify cron expression syntax
- Check timezone settings (default: America/New_York)
- Use `triggerCronJob(jobName)` to test manually

**UI not loading:**
- Check browser console for errors
- Verify API endpoints are responding
- Check server logs for backend errors

## Support

For issues or questions:
1. Check architecture docs: `docs/ARCHITECTURE-V2.md`
2. Review implementation roadmap: `docs/IMPLEMENTATION-ROADMAP.md`
3. Run test suite: `node test-phase2.js`
4. Check server logs for errors
