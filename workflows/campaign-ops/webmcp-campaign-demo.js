/**
 * WebMCP Campaign Creation Demo Workflow
 * 
 * Demonstrates intelligent fallback strategy:
 * 1. Try WebMCP (if platform supports it)
 * 2. Fall back to native API
 * 3. Fall back to mock MCP
 * 
 * This workflow creates a display campaign across multiple DSPs,
 * automatically selecting the best available method for each platform.
 */

const webmcp = require('../../connectors/webmcp-bridge');
const connectors = require('../../connectors');
const mockConnectors = require('../../connectors/mock');

const meta = {
  id: 'webmcp-campaign-demo',
  name: 'WebMCP Campaign Creation Demo',
  category: 'campaign-ops',
  description: 'Create campaigns using WebMCP with intelligent fallback to API/mock',
  version: '1.0.0',
  
  triggers: {
    manual: true,
    scheduled: null,
    events: []
  },
  
  requiredConnectors: [],
  optionalConnectors: ['webmcp', 'google-ads', 'meta-ads', 'ttd', 'dv360'],
  
  inputs: {
    campaignName: { type: 'string', required: true },
    budget: { type: 'number', required: true },
    startDate: { type: 'string', required: true },
    endDate: { type: 'string', required: true },
    platforms: { type: 'array', required: true, items: { type: 'string' } }
  },
  
  outputs: ['campaigns-created', 'methods-used', 'execution-summary'],
  
  stages: [
    { id: 'setup', name: 'Setup & Detection', agent: 'analyst' },
    { id: 'create', name: 'Create Campaigns', agent: 'trader' },
    { id: 'verify', name: 'Verify Creation', agent: 'analyst' },
    { id: 'report', name: 'Generate Report', agent: 'analyst' }
  ],
  
  estimatedDuration: '5-10 min'
};

/**
 * Determine best method for platform
 */
async function getBestMethod(platform) {
  // 1. Check WebMCP
  try {
    const tools = await webmcp.detectTools(platform);
    if (tools.supported && tools.tools.some(t => t.name === 'create_campaign')) {
      return { method: 'webmcp', available: true, tools };
    }
  } catch (err) {
    console.log(`⚠️  WebMCP check failed for ${platform}:`, err.message);
  }
  
  // 2. Check native API
  if (connectors[platform]?.createCampaign) {
    return { method: 'api', available: true };
  }
  
  // 3. Fall back to mock
  if (mockConnectors[platform]?.createCampaign) {
    return { method: 'mock', available: true };
  }
  
  return { method: 'none', available: false };
}

/**
 * Create campaign using selected method
 */
async function createCampaignWithMethod(platform, method, params) {
  console.log(`\n📊 Creating campaign on ${platform.toUpperCase()} using ${method.toUpperCase()}...`);
  
  const startTime = Date.now();
  let result;
  
  try {
    switch (method) {
      case 'webmcp':
        result = await webmcp.invokeTool(platform, 'create_campaign', {
          name: params.campaignName,
          budget: params.budget,
          start_date: params.startDate,
          end_date: params.endDate
        });
        break;
        
      case 'api':
        result = await connectors[platform].createCampaign({
          name: params.campaignName,
          budget: params.budget,
          startDate: params.startDate,
          endDate: params.endDate
        });
        break;
        
      case 'mock':
        result = await mockConnectors[platform].createCampaign({
          name: params.campaignName,
          budget: params.budget,
          startDate: params.startDate,
          endDate: params.endDate
        });
        break;
        
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
    
    const duration = Date.now() - startTime;
    
    console.log(`✅ Success! (${duration}ms)`);
    console.log(`   Campaign ID: ${result.campaignId || result.id}`);
    
    return {
      success: true,
      platform,
      method,
      duration,
      campaignId: result.campaignId || result.id,
      result
    };
    
  } catch (err) {
    const duration = Date.now() - startTime;
    
    console.log(`❌ Failed (${duration}ms)`);
    console.log(`   Error: ${err.message}`);
    
    return {
      success: false,
      platform,
      method,
      duration,
      error: err.message
    };
  }
}

/**
 * Main workflow execution
 */
async function run(params, context) {
  const { campaignName, budget, startDate, endDate, platforms } = params;
  
  console.log('\n' + '='.repeat(70));
  console.log('WebMCP CAMPAIGN CREATION DEMO');
  console.log('='.repeat(70));
  console.log(`\nCampaign: ${campaignName}`);
  console.log(`Budget: $${budget.toLocaleString()}`);
  console.log(`Flight: ${startDate} → ${endDate}`);
  console.log(`Platforms: ${platforms.join(', ')}\n`);
  
  // Stage 1: Setup & Detection
  console.log('='.repeat(70));
  console.log('STAGE 1: Setup & Detection');
  console.log('='.repeat(70) + '\n');
  
  // Connect to WebMCP if available
  let webmcpConnected = false;
  try {
    webmcpConnected = await webmcp.connect();
    console.log(webmcpConnected ? '✅ WebMCP bridge connected\n' : '⚠️  WebMCP not available\n');
  } catch (err) {
    console.log('⚠️  WebMCP connection failed:', err.message, '\n');
  }
  
  // Detect best method for each platform
  const methodMap = {};
  
  for (const platform of platforms) {
    const bestMethod = await getBestMethod(platform);
    methodMap[platform] = bestMethod;
    
    console.log(`${platform.padEnd(15)} → ${bestMethod.method.toUpperCase().padEnd(10)} ${bestMethod.available ? '✅' : '❌'}`);
  }
  
  // Stage 2: Create Campaigns
  console.log('\n' + '='.repeat(70));
  console.log('STAGE 2: Create Campaigns');
  console.log('='.repeat(70));
  
  const results = [];
  
  for (const platform of platforms) {
    const { method, available } = methodMap[platform];
    
    if (!available) {
      console.log(`\n⚠️  Skipping ${platform}: No method available`);
      results.push({
        success: false,
        platform,
        method: 'none',
        error: 'No creation method available'
      });
      continue;
    }
    
    const result = await createCampaignWithMethod(platform, method, {
      campaignName,
      budget,
      startDate,
      endDate
    });
    
    results.push(result);
  }
  
  // Stage 3: Verify
  console.log('\n' + '='.repeat(70));
  console.log('STAGE 3: Verify Creation');
  console.log('='.repeat(70) + '\n');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful: ${successful.length}/${results.length}`);
  console.log(`❌ Failed: ${failed.length}/${results.length}\n`);
  
  if (successful.length > 0) {
    console.log('Created campaigns:');
    successful.forEach(r => {
      console.log(`  • ${r.platform}: ${r.campaignId} (via ${r.method}, ${r.duration}ms)`);
    });
    console.log('');
  }
  
  if (failed.length > 0) {
    console.log('Failed attempts:');
    failed.forEach(r => {
      console.log(`  • ${r.platform}: ${r.error} (tried ${r.method})`);
    });
    console.log('');
  }
  
  // Stage 4: Report
  console.log('='.repeat(70));
  console.log('STAGE 4: Execution Summary');
  console.log('='.repeat(70) + '\n');
  
  const methodCounts = {};
  results.forEach(r => {
    methodCounts[r.method] = (methodCounts[r.method] || 0) + 1;
  });
  
  console.log('Methods used:');
  Object.entries(methodCounts).forEach(([method, count]) => {
    console.log(`  ${method.toUpperCase()}: ${count}x`);
  });
  
  const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0);
  console.log(`\nTotal execution time: ${totalDuration}ms`);
  console.log(`Average per platform: ${Math.round(totalDuration / results.length)}ms`);
  
  console.log('\n' + '='.repeat(70) + '\n');
  
  // Cleanup
  if (webmcpConnected) {
    await webmcp.disconnect();
  }
  
  // Return summary
  return {
    campaignsCreated: successful.length,
    campaignsFailed: failed.length,
    totalPlatforms: platforms.length,
    methodsUsed: methodCounts,
    executionTimeMs: totalDuration,
    results,
    campaigns: successful.map(r => ({
      platform: r.platform,
      campaignId: r.campaignId,
      method: r.method
    }))
  };
}

function getInfo() {
  return meta;
}

module.exports = {
  meta,
  run,
  getInfo
};
