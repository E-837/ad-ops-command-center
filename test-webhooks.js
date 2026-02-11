/**
 * Test Suite: Webhooks System
 * Tests for webhook registry, delivery, and signature verification
 */

const WebhooksModel = require('./database/models/webhooks');
const webhooks = require('./integrations/webhooks');
const knex = require('./database/db');

console.log('\n🧪 Testing Webhooks System\n');

async function runTests() {
  let passed = 0;
  let failed = 0;

  // Run webhook migration
  try {
    const migration = require('./database/migrations/008_create_webhooks');
    migration.up(knex);
    console.log('✅ Webhook tables created\n');
  } catch (err) {
    console.warn('⚠️  Webhook tables may already exist\n');
  }

  // Test 1: Create Webhook
  let webhookId = null;
  try {
    console.log('Test 1: Create Webhook...');
    const webhook = WebhooksModel.create({
      name: 'Test Webhook',
      url: 'https://example.com/webhook',
      direction: 'outbound',
      events: ['workflow.completed', 'campaign.alert']
    });
    
    if (webhook && webhook.id && webhook.secret) {
      webhookId = webhook.id;
      console.log('✅ PASSED: Webhook created successfully');
      console.log(`   - ID: ${webhook.id}`);
      console.log(`   - URL: ${webhook.url}`);
      console.log(`   - Secret: ${webhook.secret.substring(0, 16)}...`);
      console.log(`   - Events: ${webhook.events.join(', ')}`);
      passed++;
    } else {
      throw new Error('Invalid webhook structure');
    }
  } catch (err) {
    console.log('❌ FAILED: Create webhook test');
    console.log(`   Error: ${err.message}`);
    failed++;
  }

  // Test 2: Get Webhook
  try {
    console.log('\nTest 2: Get Webhook...');
    const webhook = WebhooksModel.get(webhookId);
    
    if (webhook && webhook.id === webhookId) {
      console.log('✅ PASSED: Webhook retrieved successfully');
      passed++;
    } else {
      throw new Error('Webhook not found');
    }
  } catch (err) {
    console.log('❌ FAILED: Get webhook test');
    console.log(`   Error: ${err.message}`);
    failed++;
  }

  // Test 3: List Webhooks
  try {
    console.log('\nTest 3: List Webhooks...');
    const webhookList = WebhooksModel.list();
    
    if (Array.isArray(webhookList) && webhookList.length > 0) {
      console.log('✅ PASSED: Webhooks listed successfully');
      console.log(`   - Total webhooks: ${webhookList.length}`);
      passed++;
    } else {
      throw new Error('No webhooks found');
    }
  } catch (err) {
    console.log('❌ FAILED: List webhooks test');
    console.log(`   Error: ${err.message}`);
    failed++;
  }

  // Test 4: Get Webhooks by Event
  try {
    console.log('\nTest 4: Get Webhooks by Event...');
    const eventWebhooks = WebhooksModel.getByEvent('workflow.completed');
    
    if (Array.isArray(eventWebhooks) && eventWebhooks.length > 0) {
      console.log('✅ PASSED: Event webhooks retrieved successfully');
      console.log(`   - Webhooks for 'workflow.completed': ${eventWebhooks.length}`);
      passed++;
    } else {
      throw new Error('No webhooks found for event');
    }
  } catch (err) {
    console.log('❌ FAILED: Get webhooks by event test');
    console.log(`   Error: ${err.message}`);
    failed++;
  }

  // Test 5: Update Webhook
  try {
    console.log('\nTest 5: Update Webhook...');
    const updated = WebhooksModel.update(webhookId, {
      name: 'Updated Test Webhook',
      enabled: false
    });
    
    if (updated.name === 'Updated Test Webhook' && updated.enabled === false) {
      console.log('✅ PASSED: Webhook updated successfully');
      passed++;
    } else {
      throw new Error('Webhook not updated correctly');
    }
  } catch (err) {
    console.log('❌ FAILED: Update webhook test');
    console.log(`   Error: ${err.message}`);
    failed++;
  }

  // Test 6: Signature Generation
  try {
    console.log('\nTest 6: Signature Generation...');
    const payload = JSON.stringify({ event: 'test', data: { foo: 'bar' } });
    const secret = 'test-secret';
    const signature = webhooks.generateSignature(payload, secret);
    
    if (signature && signature.length === 64) {
      console.log('✅ PASSED: Signature generated successfully');
      console.log(`   - Signature: ${signature.substring(0, 32)}...`);
      passed++;
    } else {
      throw new Error('Invalid signature');
    }
  } catch (err) {
    console.log('❌ FAILED: Signature generation test');
    console.log(`   Error: ${err.message}`);
    failed++;
  }

  // Test 7: Signature Verification
  try {
    console.log('\nTest 7: Signature Verification...');
    const payload = JSON.stringify({ event: 'test', data: { foo: 'bar' } });
    const secret = 'test-secret';
    const signature = webhooks.generateSignature(payload, secret);
    const isValid = webhooks.verifySignature(payload, signature, secret);
    
    if (isValid) {
      console.log('✅ PASSED: Signature verification successful');
      passed++;
    } else {
      throw new Error('Signature verification failed');
    }
  } catch (err) {
    console.log('❌ FAILED: Signature verification test');
    console.log(`   Error: ${err.message}`);
    failed++;
  }

  // Test 8: Invalid Signature Rejection
  try {
    console.log('\nTest 8: Invalid Signature Rejection...');
    const payload = JSON.stringify({ event: 'test', data: { foo: 'bar' } });
    const secret = 'test-secret';
    const invalidSignature = 'invalid-signature';
    const isValid = webhooks.verifySignature(payload, invalidSignature, secret);
    
    if (!isValid) {
      console.log('✅ PASSED: Invalid signature rejected correctly');
      passed++;
    } else {
      throw new Error('Invalid signature was accepted');
    }
  } catch (err) {
    console.log('❌ FAILED: Invalid signature rejection test');
    console.log(`   Error: ${err.message}`);
    failed++;
  }

  // Test 9: Send Webhook
  try {
    console.log('\nTest 9: Send Webhook...');
    const result = await webhooks.sendWebhook(
      'https://example.com/webhook',
      'test.event',
      { message: 'Test webhook' },
      'test-secret'
    );
    
    if (result.success) {
      console.log('✅ PASSED: Webhook sent successfully');
      console.log(`   - Attempts: ${result.attempt}`);
      console.log(`   - Status: ${result.status}`);
      passed++;
    } else {
      throw new Error('Webhook delivery failed');
    }
  } catch (err) {
    console.log('❌ FAILED: Send webhook test');
    console.log(`   Error: ${err.message}`);
    failed++;
  }

  // Test 10: Broadcast to Webhooks
  try {
    console.log('\nTest 10: Broadcast to Webhooks...');
    
    // Re-enable webhook for broadcast test
    WebhooksModel.update(webhookId, { enabled: true });
    
    const result = await webhooks.broadcastToWebhooks('workflow.completed', {
      workflowName: 'Test Workflow',
      status: 'success'
    });
    
    if (result.sent >= 0) {
      console.log('✅ PASSED: Broadcast completed');
      console.log(`   - Sent: ${result.sent}`);
      console.log(`   - Failed: ${result.failed || 0}`);
      passed++;
    } else {
      throw new Error('Broadcast failed');
    }
  } catch (err) {
    console.log('❌ FAILED: Broadcast test');
    console.log(`   Error: ${err.message}`);
    failed++;
  }

  // Test 11: Log Delivery
  try {
    console.log('\nTest 11: Log Delivery...');
    const log = WebhooksModel.logDelivery(webhookId, 'test.event', 'success', {
      statusCode: 200
    });
    
    if (log && log.id) {
      console.log('✅ PASSED: Delivery logged successfully');
      console.log(`   - Log ID: ${log.id}`);
      passed++;
    } else {
      throw new Error('Failed to log delivery');
    }
  } catch (err) {
    console.log('❌ FAILED: Log delivery test');
    console.log(`   Error: ${err.message}`);
    failed++;
  }

  // Test 12: Get Deliveries
  try {
    console.log('\nTest 12: Get Deliveries...');
    const deliveries = WebhooksModel.getDeliveries(webhookId);
    
    if (Array.isArray(deliveries) && deliveries.length > 0) {
      console.log('✅ PASSED: Deliveries retrieved successfully');
      console.log(`   - Total deliveries: ${deliveries.length}`);
      passed++;
    } else {
      throw new Error('No deliveries found');
    }
  } catch (err) {
    console.log('❌ FAILED: Get deliveries test');
    console.log(`   Error: ${err.message}`);
    failed++;
  }

  // Test 13: Delete Webhook
  try {
    console.log('\nTest 13: Delete Webhook...');
    const result = WebhooksModel.delete(webhookId);
    
    if (result.success) {
      console.log('✅ PASSED: Webhook deleted successfully');
      passed++;
    } else {
      throw new Error('Webhook deletion failed');
    }
  } catch (err) {
    console.log('❌ FAILED: Delete webhook test');
    console.log(`   Error: ${err.message}`);
    failed++;
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  console.log('='.repeat(60) + '\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
