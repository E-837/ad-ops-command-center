// Test getPacing() on all DSP connectors
const { DSP_CONNECTORS, fetchAllPacing } = require('./connectors/index');

async function testPacing() {
  console.log('Testing getPacing() on all DSP connectors...\n');
  
  for (const [dsp, connector] of Object.entries(DSP_CONNECTORS)) {
    console.log(`\n--- ${dsp.toUpperCase()} ---`);
    try {
      if (!connector) {
        console.log(`❌ Connector not found`);
        continue;
      }
      
      if (typeof connector.getPacing !== 'function') {
        console.log(`❌ getPacing() method not found`);
        console.log(`Available methods:`, Object.keys(connector).filter(k => typeof connector[k] === 'function'));
        continue;
      }
      
      const result = await connector.getPacing();
      console.log(`✓ getPacing() returned:`, typeof result);
      console.log(`✓ Is array:`, Array.isArray(result));
      console.log(`✓ Length:`, result?.length || 0);
      if (result?.length > 0) {
        console.log(`✓ Sample:`, JSON.stringify(result[0], null, 2));
      }
    } catch (err) {
      console.log(`❌ Error:`, err.message);
      console.log(err.stack);
    }
  }
  
  console.log('\n\n=== Testing fetchAllPacing() ===');
  try {
    const result = await fetchAllPacing();
    console.log('✓ Success!');
    console.log('✓ Pacing entries:', result.pacing.length);
    console.log('✓ Errors:', result.errors.length);
    if (result.errors.length > 0) {
      console.log('Errors:', JSON.stringify(result.errors, null, 2));
    }
  } catch (err) {
    console.log('❌ fetchAllPacing() failed:', err.message);
  }
}

testPacing().then(() => {
  console.log('\n✅ Test complete');
  process.exit(0);
}).catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
