# Campaign Lifecycle Demo

## Overview

This demo showcases the complete end-to-end campaign lifecycle workflow in the Ad Ops Command Center, from initial brief creation through DSP activation and final reporting.

## What It Demonstrates

**Campaign**: Velocity Motors - Velocity Spark EV SUV Launch
**Budget**: $500,000  
**Flight**: March 1 - May 31, 2026

### Complete Workflow Stages:

1. **📄 Generate Campaign Brief** - Creates comprehensive campaign brief in Google Docs
2. **📊 Create Media Plan** - Builds detailed media plan spreadsheet with budget allocation
3. **📋 Setup Project Management** - Creates Asana project with tasks and timeline
4. **🎨 Generate Creatives** - Produces creative assets for all required sizes
5. **🚀 Activate on DSPs** - Sets up campaigns across TTD, DV360, and Amazon DSP
6. **📋 Generate Summary Report** - Creates final activation report with links to all assets

## How to Run

### Option 1: Full Interactive Demo (Recommended)
```bash
node scripts/run-demo.js
```
This runs the beautiful colored console demo with progress indicators and simulated timing.

### Option 2: API Connectivity Test + Mock Demo
```bash
node scripts/demo-with-fallback.js
```
This tests API connectivity first, then runs either real API calls or mock data depending on availability.

### Option 3: Simple Test
```bash
node scripts/test-demo.js
```
Quick workflow test without fancy formatting.

### Option 4: Programmatic Access
```javascript
const workflows = require('./workflows');
const demo = workflows.getWorkflow('campaign-lifecycle-demo');

// Get workflow info
console.log(demo.getInfo());

// Run the workflow
const results = await demo.run();
console.log(results);
```

## What Gets Created

### 📋 Documents & Sheets
- **Campaign Brief** (Google Doc): Comprehensive brief with objectives, audience, budget, KPIs
- **Media Plan** (Google Sheet): Detailed plan with DSP allocation and tactics
- **Summary Report** (Google Doc): Final activation report with all campaign details

### 🎯 Project Management
- **Asana Project**: "Velocity Spark - Q1 2026 Launch"
- **8 Tasks Created**:
  - Brief Review & Approval
  - Creative Production  
  - Campaign Setup (TTD, DV360, Amazon)
  - QA & Trafficking Review
  - Launch Go/No-Go
  - Week 1 Pacing Check

### 🎨 Creative Assets
- **Display Banner** (300x250)
- **Leaderboard** (728x90) 
- **Wide Skyscraper** (160x600)
- **CTV Video** (1920x1080)

### 🚀 Campaign Activation
- **TTD Display**: $150K budget
- **TTD Video**: $100K budget  
- **DV360 CTV**: $150K budget
- **Amazon DSP Display**: $100K budget

## Features

✅ **Real API Integration**: Uses mcporter for Google Docs, Sheets, and Asana  
✅ **Graceful Fallback**: Works with mock data if APIs are unavailable  
✅ **Progress Tracking**: Beautiful console output with progress indicators  
✅ **Error Handling**: Continues demo even if individual steps fail  
✅ **Realistic Data**: Professional campaign data and timing  
✅ **Comprehensive Output**: Links to all created assets and campaign IDs

## Technical Details

- **Workflow**: `workflows/campaign-lifecycle-demo.js`
- **Runner**: `scripts/run-demo.js` 
- **APIs Used**: Google Docs, Google Sheets, Asana, DSP connectors
- **Fallback**: Mock connectors when APIs unavailable
- **Duration**: ~6-8 minutes (or 30 seconds in mock mode)

## Sample Output

```
🚀 AD OPS COMMAND CENTER
Campaign Lifecycle Demo

Campaign: Velocity Motors Velocity Spark EV SUV
Budget: $500,000
Estimated Duration: 6-8 minutes

▶ Stage 1: Generate Campaign Brief
  ✓ Complete
  📄 Brief: https://docs.google.com/document/d/ABC123/edit

▶ Stage 2: Create Media Plan  
  ✓ Complete
  📊 Media Plan: https://docs.google.com/spreadsheets/d/XYZ456/edit

... (continues through all 6 stages)

🎉 DEMO COMPLETED SUCCESSFULLY
📊 4 campaigns activated across 3 DSPs
🔗 5 artifacts created
🚀 Ready for campaign launch!
```

This demo showcases the power of the Ad Ops Command Center to orchestrate complex, multi-platform campaign workflows with full automation and integration.