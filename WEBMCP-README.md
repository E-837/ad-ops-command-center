# WebMCP Integration - Ad Ops Command Center

## Overview

WebMCP (Web Model Context Protocol) allows websites to expose structured tools to in-browser AI agents. This integration enables the Ad Ops Command Center to interact with DSP platforms using validated schemas instead of brittle DOM scraping.

**Status:** Prototype implementation (Feb 2026)  
**Chrome Support:** Chrome 146+ Canary with flag enabled  
**Spec:** https://github.com/webmachinelearning/webmcp/

---

## Architecture

### Intelligent Fallback Strategy

```
┌────────────────────┐
│  Workflow Request  │  "Create campaign on TTD"
└─────────┬──────────┘
          │
          v
    ┌──────────┐
    │ Check #1 │ → WebMCP available? → YES → Use structured tools ✅
    └──────────┘                              (Best: validated schemas)
          │
          NO
          │
          v
    ┌──────────┐
    │ Check #2 │ → API available? → YES → Use native API ⚠️
    └──────────┘                           (Good: official, rate-limited)
          │
          NO
          │
          v
    ┌──────────┐
    │ Check #3 │ → Mock available? → YES → Use mock MCP ⚠️
    └──────────┘                            (Testing only, fake data)
          │
          NO
          │
          v
        FAIL ❌
```

### Components

1. **`connectors/webmcp-bridge.js`** - Core WebMCP connector
   - Browser connection via Puppeteer
   - Tool detection across platforms
   - Tool invocation with schema validation

2. **`test-webmcp.js`** - Standalone test script
   - Scans platforms for WebMCP support
   - Tests tool invocation
   - Generates status reports

3. **`workflows/campaign-ops/webmcp-campaign-demo.js`** - Demo workflow
   - Multi-platform campaign creation
   - Automatic method selection (WebMCP → API → Mock)
   - Performance tracking

4. **`docs/ARCHITECTURE-V2.md`** - Full documentation
   - Section 8: WebMCP Integration Strategy
   - Implementation phases
   - Benefits analysis

---

## Setup

### Prerequisites

1. **Install Chrome Canary**
   - Download: https://www.google.com/chrome/canary/
   - Install to default location

2. **Enable WebMCP Flag**
   - Open `chrome://flags` in Canary
   - Search: "WebMCP for testing"
   - Set to: Enabled
   - Restart browser

3. **Install Extension**
   - Open Chrome Web Store in Canary
   - Install: [Model Context Tool Inspector](https://chromewebstore.google.com/detail/model-context-tool-inspec/gbpdfapgefenggkahomfgkhfehlcenpd)

4. **Install Dependencies**
   ```bash
   npm install puppeteer
   ```

### Verify Setup

Visit the travel demo in Canary:
```
https://travel-demo.bandarra.me/
```

Open the Model Context Tool Inspector extension. You should see tools like:
- `searchFlights`
- `bookFlight`
- etc.

---

## Usage

### Test Script

**Scan all DSP platforms:**
```bash
node test-webmcp.js --scan-all
```

**Scan specific platform:**
```bash
node test-webmcp.js --platform=ttd
node test-webmcp.js --platform=googleAds
```

**Test with travel demo:**
```bash
node test-webmcp.js
```

### Demo Workflow

**Run campaign creation demo:**
```bash
node -e "
const demo = require('./workflows/campaign-ops/webmcp-campaign-demo');
demo.run({
  campaignName: 'WebMCP Test Campaign',
  budget: 50000,
  startDate: '2026-03-01',
  endDate: '2026-03-31',
  platforms: ['googleAds', 'metaAds', 'ttd', 'dv360']
}, {});
"
```

**Expected output:**
```
=============================================================================
WebMCP CAMPAIGN CREATION DEMO
=============================================================================

Campaign: WebMCP Test Campaign
Budget: $50,000
Flight: 2026-03-01 → 2026-03-31
Platforms: googleAds, metaAds, ttd, dv360

=============================================================================
STAGE 1: Setup & Detection
=============================================================================

✅ WebMCP bridge connected

googleAds       → WEBMCP     ✅  (if supported)
metaAds         → API        ✅  (if configured)
ttd             → MOCK       ✅  (fallback)
dv360           → MOCK       ✅  (fallback)

=============================================================================
STAGE 2: Create Campaigns
...
```

### Programmatic Usage

```javascript
const webmcp = require('./connectors/webmcp-bridge');

// Connect
await webmcp.connect();

// Detect tools
const tools = await webmcp.detectTools('googleAds');
console.log(tools);

// Invoke tool
const result = await webmcp.invokeTool('googleAds', 'create_campaign', {
  name: 'Test Campaign',
  budget: 10000,
  start_date: '2026-03-01',
  end_date: '2026-03-31'
});

// Disconnect
await webmcp.disconnect();
```

---

## Current Status (Feb 2026)

### Platform Support

| Platform | WebMCP Status | Native API | Mock MCP |
|----------|---------------|------------|----------|
| Google Ads | ❓ Unknown | ✅ Live | ✅ Available |
| Meta Ads | ❓ Unknown | ✅ Live | ✅ Available |
| TTD | ❓ Unknown | ❌ Mock only | ✅ Available |
| DV360 | ❓ Unknown | ❌ Mock only | ✅ Available |
| Amazon DSP | ❓ Unknown | ❌ Mock only | ✅ Available |

**Note:** WebMCP is in early preview. DSP platforms have not yet adopted it. The travel demo is the only confirmed working example.

### What Works Today

✅ **WebMCP bridge connector** - Fully implemented  
✅ **Platform detection** - Scans any URL for tools  
✅ **Tool invocation** - Executes tools with params  
✅ **Fallback strategy** - Auto-selects best method  
✅ **Demo workflow** - Multi-platform campaign creation  
✅ **Documentation** - Architecture + usage guides  

### What's Missing

⚠️ **DSP platform adoption** - No platforms support WebMCP yet  
⚠️ **Headless mode** - WebMCP requires visible browser  
⚠️ **Error handling** - Needs more robust retry logic  
⚠️ **Rate limiting** - Not implemented yet  
⚠️ **Session management** - Manual login required  

---

## Integration Roadmap

### Phase 1: Foundation (Complete ✅)
- [x] WebMCP bridge connector
- [x] Test script with platform scanning
- [x] Demo workflow with fallback strategy
- [x] Architecture documentation

### Phase 2: Detection Layer (Next)
- [ ] Add `/api/webmcp/status` endpoint
- [ ] Build UI for platform status
- [ ] Implement periodic scanning
- [ ] Cache tool schemas locally

### Phase 3: Workflow Integration (Future)
- [ ] Update existing workflows to check WebMCP first
- [ ] Add WebMCP preference setting
- [ ] Build connector registry UI
- [ ] Add performance metrics

### Phase 4: Production Ready (Long-term)
- [ ] Implement session persistence
- [ ] Add retry logic with backoff
- [ ] Build headless wrapper (if possible)
- [ ] Monitor DSP platform adoption

---

## Benefits Over Current Approach

| Capability | Mock MCP | WebMCP | Native API |
|------------|----------|---------|------------|
| **Creative Upload** | ❌ Fake | ✅ Real UI flow | ⚠️ Limited |
| **Auth** | ❌ N/A | ✅ Browser session | ⚠️ OAuth |
| **UI-Only Features** | ❌ Can't access | ✅ Full access | ❌ Not available |
| **Maintenance** | ✅ Zero | ✅ Low | ⚠️ High |
| **Reliability** | ❌ Not real | ✅ Schemas | ⚠️ Rate limits |
| **Setup** | ✅ Instant | ⚠️ Browser | ⚠️ API keys |

---

## Troubleshooting

### "Failed to connect to Chrome Canary"

**Solution:**
1. Verify Canary is installed at:
   `C:\Users\RossS\AppData\Local\Google\Chrome SxS\Application\chrome.exe`
2. Update path in `test-webmcp.js` if different
3. Close all Chrome Canary instances before running

### "WebMCP not supported"

**Expected behavior** - DSP platforms haven't adopted WebMCP yet.

**To verify WebMCP works:**
1. Visit https://travel-demo.bandarra.me/ in Canary
2. Open Model Context Tool Inspector extension
3. Verify tools are visible
4. Run `node test-webmcp.js` (default tests travel demo)

### "navigator.modelContext is undefined"

**Causes:**
1. WebMCP flag not enabled → check `chrome://flags`
2. Not using Chrome Canary → must use Canary (not stable Chrome)
3. Old Canary version → update to Chrome 146+

---

## Resources

- **WebMCP Spec:** https://github.com/webmachinelearning/webmcp/
- **Chrome Blog:** https://developer.chrome.com/blog/webmcp-epp
- **Travel Demo:** https://travel-demo.bandarra.me/
- **Discussion Group:** https://groups.google.com/a/chromium.org/g/chrome-ai-dev-preview-discuss/
- **Extension:** https://chromewebstore.google.com/detail/model-context-tool-inspec/gbpdfapgefenggkahomfgkhfehlcenpd

---

## Questions?

See `docs/ARCHITECTURE-V2.md` Section 8 for full technical details.

For bugs or issues, file in Ad Ops Command Center repo or discuss in #skills-tools Discord channel.
