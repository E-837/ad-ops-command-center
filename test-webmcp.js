/**
 * WebMCP Bridge Test Script
 * 
 * Tests the WebMCP connector by:
 * 1. Connecting to Chrome Canary
 * 2. Scanning DSP platforms for WebMCP tools
 * 3. Attempting tool invocation (if tools found)
 * 4. Generating status report
 * 
 * Prerequisites:
 * - Chrome Canary installed
 * - WebMCP flag enabled (chrome://flags)
 * - Model Context Tool Inspector extension installed
 * 
 * Usage:
 *   node test-webmcp.js [--scan-all] [--platform=ttd]
 */

const webmcp = require('./connectors/webmcp-bridge');

async function main() {
  const args = process.argv.slice(2);
  const scanAll = args.includes('--scan-all');
  const platformArg = args.find(a => a.startsWith('--platform='));
  const targetPlatform = platformArg ? platformArg.split('=')[1] : null;

  console.log('\n🔧 WebMCP Bridge Test\n');
  console.log('Prerequisites:');
  console.log('  ✓ Chrome Canary installed');
  console.log('  ✓ chrome://flags → "WebMCP for testing" enabled');
  console.log('  ✓ Model Context Tool Inspector extension installed');
  console.log('  ✓ Travel demo visited: https://travel-demo.bandarra.me/\n');

  // Step 1: Connect
  console.log('Step 1: Connecting to Chrome Canary...\n');
  const connected = await webmcp.connect();
  
  if (!connected) {
    console.error('\n❌ Failed to connect. Aborting test.\n');
    process.exit(1);
  }

  // Step 2: Scan platforms
  console.log('\nStep 2: Scanning for WebMCP support...\n');
  
  let scanResults;
  if (scanAll) {
    console.log('🔍 Scanning ALL platforms (this may take a few minutes)...\n');
    scanResults = await webmcp.scanAllPlatforms();
  } else if (targetPlatform) {
    console.log(`🔍 Scanning ${targetPlatform}...\n`);
    scanResults = {
      [targetPlatform]: await webmcp.detectTools(targetPlatform)
    };
  } else {
    console.log('🔍 Testing with travel demo...\n');
    
    // Add travel demo to platforms temporarily
    webmcp.bridge.platforms.travelDemo = 'https://travel-demo.bandarra.me/';
    scanResults = {
      travelDemo: await webmcp.detectTools('travelDemo')
    };
  }

  // Step 3: Report findings
  console.log('\n' + '='.repeat(60));
  console.log('SCAN RESULTS');
  console.log('='.repeat(60) + '\n');

  let totalToolsFound = 0;
  const supportedPlatforms = [];

  for (const [platform, result] of Object.entries(scanResults)) {
    console.log(`📊 ${platform.toUpperCase()}`);
    console.log(`   URL: ${webmcp.bridge.platforms[platform]}`);
    console.log(`   Supported: ${result.supported ? '✅ YES' : '❌ NO'}`);
    
    if (result.supported) {
      console.log(`   Tools found: ${result.tools.length}`);
      totalToolsFound += result.tools.length;
      
      if (result.tools.length > 0) {
        supportedPlatforms.push(platform);
        console.log(`   Available tools:`);
        result.tools.forEach(tool => {
          console.log(`     - ${tool.name}`);
          console.log(`       ${tool.description}`);
        });
      } else if (result.error) {
        console.log(`   Error: ${result.error}`);
      } else {
        console.log(`   (No tools registered yet)`);
      }
    }
    
    console.log('');
  }

  // Step 4: Test tool invocation (if available)
  if (supportedPlatforms.length > 0) {
    console.log('='.repeat(60));
    console.log('TOOL INVOCATION TEST');
    console.log('='.repeat(60) + '\n');

    const testPlatform = supportedPlatforms[0];
    const platformInfo = scanResults[testPlatform];
    
    if (platformInfo.tools.length > 0) {
      const testTool = platformInfo.tools[0];
      console.log(`Testing tool: ${testPlatform}.${testTool.name}\n`);
      
      try {
        // Build sample params based on schema
        const sampleParams = buildSampleParams(testTool.inputSchema);
        
        console.log('Sample params:', JSON.stringify(sampleParams, null, 2));
        console.log('\nAttempting invocation...\n');
        
        const result = await webmcp.invokeTool(testPlatform, testTool.name, sampleParams);
        
        console.log('✅ Success!');
        console.log('Result:', JSON.stringify(result, null, 2));
      } catch (err) {
        console.log('⚠️  Invocation failed (expected for demo)');
        console.log('Error:', err.message);
      }
    }
    
    console.log('');
  }

  // Step 5: Status summary
  console.log('='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60) + '\n');

  const status = webmcp.getStatus();
  
  console.log(`Platforms scanned: ${Object.keys(scanResults).length}`);
  console.log(`WebMCP-enabled platforms: ${supportedPlatforms.length}`);
  console.log(`Total tools discovered: ${totalToolsFound}`);
  
  if (supportedPlatforms.length > 0) {
    console.log(`\nReady platforms: ${supportedPlatforms.join(', ')}`);
  }
  
  console.log('\n' + '='.repeat(60) + '\n');

  // Step 6: Next steps
  console.log('NEXT STEPS:\n');
  
  if (totalToolsFound === 0) {
    console.log('❌ No WebMCP tools found.');
    console.log('   This is expected - DSP platforms haven\'t adopted WebMCP yet.');
    console.log('   WebMCP is in early preview (Feb 2026).\n');
    console.log('To test with working tools:');
    console.log('  1. Visit https://travel-demo.bandarra.me/ in Chrome Canary');
    console.log('  2. Open Model Context Tool Inspector extension');
    console.log('  3. Verify tools are visible in the inspector');
    console.log('  4. Re-run: node test-webmcp.js\n');
  } else {
    console.log('✅ WebMCP tools discovered!');
    console.log(`   Found ${totalToolsFound} tool(s) across ${supportedPlatforms.length} platform(s)\n`);
    console.log('Integration options:');
    console.log('  1. Update workflow executors to check for WebMCP tools');
    console.log('  2. Create platform-specific connectors (connectors/webmcp/*.js)');
    console.log('  3. Add WebMCP status to /api/connectors endpoint');
    console.log('  4. Build UI for tool discovery and testing\n');
  }

  // Cleanup
  await webmcp.disconnect();
  
  console.log('Test complete.\n');
}

/**
 * Build sample params from JSON schema
 */
function buildSampleParams(schema) {
  if (!schema || !schema.properties) return {};
  
  const params = {};
  
  for (const [key, prop] of Object.entries(schema.properties)) {
    switch (prop.type) {
      case 'string':
        params[key] = prop.format === 'date' ? '2026-03-01' : `sample_${key}`;
        break;
      case 'number':
      case 'integer':
        params[key] = 100;
        break;
      case 'boolean':
        params[key] = true;
        break;
      case 'array':
        params[key] = [];
        break;
      case 'object':
        params[key] = {};
        break;
      default:
        params[key] = null;
    }
  }
  
  return params;
}

// Run
main().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
