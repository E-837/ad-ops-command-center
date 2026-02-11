/**
 * Test Suite: Notifications System
 * Tests for multi-channel notification delivery and templates
 */

const notifications = require('./integrations/notifications');

console.log('\n🧪 Testing Notifications System\n');

async function runTests() {
  let passed = 0;
  let failed = 0;

  // Test 1: Send Email Notification
  try {
    console.log('Test 1: Send Email Notification...');
    const result = await notifications.sendEmail(
      'test@example.com',
      'Test Email',
      '<h1>Hello World</h1><p>This is a test email.</p>'
    );
    
    if (result.success && result.channel === 'email') {
      console.log('✅ PASSED: Email sent successfully');
      console.log(`   - To: ${result.recipient}`);
      console.log(`   - Timestamp: ${result.timestamp}`);
      passed++;
    } else {
      throw new Error('Email sending failed');
    }
  } catch (err) {
    console.log('❌ FAILED: Email notification test');
    console.log(`   Error: ${err.message}`);
    failed++;
  }

  // Test 2: Send Slack Notification
  try {
    console.log('\nTest 2: Send Slack Notification...');
    const result = await notifications.sendSlack('#campaigns', {
      text: 'Test Slack message',
      attachments: [{
        color: 'good',
        fields: [
          { title: 'Status', value: 'Success', short: true }
        ]
      }]
    });
    
    if (result.success && result.channel === 'slack') {
      console.log('✅ PASSED: Slack notification sent successfully');
      console.log(`   - Channel: ${result.recipient}`);
      passed++;
    } else {
      throw new Error('Slack notification failed');
    }
  } catch (err) {
    console.log('❌ FAILED: Slack notification test');
    console.log(`   Error: ${err.message}`);
    failed++;
  }

  // Test 3: Send Discord Notification
  try {
    console.log('\nTest 3: Send Discord Notification...');
    const result = await notifications.sendDiscord('https://discord.com/webhook/test', {
      embeds: [{
        title: 'Test Discord Message',
        description: 'This is a test',
        color: 0x4CAF50
      }]
    });
    
    if (result.success && result.channel === 'discord') {
      console.log('✅ PASSED: Discord notification sent successfully');
      passed++;
    } else {
      throw new Error('Discord notification failed');
    }
  } catch (err) {
    console.log('❌ FAILED: Discord notification test');
    console.log(`   Error: ${err.message}`);
    failed++;
  }

  // Test 4: Send SMS Notification
  try {
    console.log('\nTest 4: Send SMS Notification...');
    const result = await notifications.sendSMS('+1234567890', 'Test SMS message');
    
    if (result.success && result.channel === 'sms') {
      console.log('✅ PASSED: SMS sent successfully');
      console.log(`   - To: ${result.recipient}`);
      passed++;
    } else {
      throw new Error('SMS sending failed');
    }
  } catch (err) {
    console.log('❌ FAILED: SMS notification test');
    console.log(`   Error: ${err.message}`);
    failed++;
  }

  // Test 5: Render Template
  try {
    console.log('\nTest 5: Render Template...');
    const rendered = notifications.renderTemplate('workflow-completed', {
      workflowName: 'Test Workflow',
      executionTime: '45',
      projectName: 'Test Project',
      completedAt: new Date().toISOString()
    });
    
    if (rendered && rendered.length > 0) {
      console.log('✅ PASSED: Template rendered successfully');
      console.log(`   - Template length: ${rendered.length} characters`);
      passed++;
    } else {
      throw new Error('Template rendering failed');
    }
  } catch (err) {
    console.log('❌ FAILED: Template rendering test');
    console.log(`   Error: ${err.message}`);
    failed++;
  }

  // Test 6: Send Notification with Event Type (workflow.completed)
  try {
    console.log('\nTest 6: Send Notification for workflow.completed...');
    const results = await notifications.sendNotification(
      'workflow.completed',
      {
        workflowName: 'Weekly Report',
        executionTime: '32',
        projectName: 'Google Ads Campaign',
        completedAt: new Date().toISOString(),
        output: 'Report generated successfully'
      },
      {
        email: ['user@example.com'],
        slack: ['#campaigns']
      }
    );
    
    if (results.length === 2 && results.every(r => r.success)) {
      console.log('✅ PASSED: Multi-channel notification sent');
      console.log(`   - Channels: ${results.map(r => r.channel).join(', ')}`);
      passed++;
    } else {
      throw new Error('Multi-channel notification failed');
    }
  } catch (err) {
    console.log('❌ FAILED: Multi-channel notification test');
    console.log(`   Error: ${err.message}`);
    failed++;
  }

  // Test 7: Send Notification for workflow.failed
  try {
    console.log('\nTest 7: Send Notification for workflow.failed...');
    const results = await notifications.sendNotification(
      'workflow.failed',
      {
        workflowName: 'Daily Sync',
        error: 'API connection timeout',
        projectName: 'Meta Campaigns',
        failedAt: new Date().toISOString()
      },
      {
        email: ['admin@example.com'],
        discord: ['https://discord.com/webhook/alerts']
      }
    );
    
    if (results.length === 2) {
      console.log('✅ PASSED: Failure notification sent');
      passed++;
    } else {
      throw new Error('Failure notification failed');
    }
  } catch (err) {
    console.log('❌ FAILED: Failure notification test');
    console.log(`   Error: ${err.message}`);
    failed++;
  }

  // Test 8: Send Campaign Pacing Alert
  try {
    console.log('\nTest 8: Send Campaign Pacing Alert...');
    const results = await notifications.sendNotification(
      'campaign.pacing',
      {
        campaignName: 'Q1 Brand Awareness',
        platform: 'Google Ads',
        budgetUtilization: '95',
        budget: '50000',
        spent: '47500',
        remaining: '2500',
        recommendation: 'Consider pausing non-essential keywords to preserve budget'
      },
      {
        email: ['manager@example.com'],
        slack: ['#budget-alerts']
      }
    );
    
    if (results.length === 2) {
      console.log('✅ PASSED: Pacing alert sent');
      passed++;
    } else {
      throw new Error('Pacing alert failed');
    }
  } catch (err) {
    console.log('❌ FAILED: Pacing alert test');
    console.log(`   Error: ${err.message}`);
    failed++;
  }

  // Test 9: Send Performance Anomaly Alert
  try {
    console.log('\nTest 9: Send Performance Anomaly Alert...');
    const results = await notifications.sendNotification(
      'performance.anomaly',
      {
        campaignName: 'Retargeting Campaign',
        anomalyType: 'CTR Drop',
        detectedAt: new Date().toISOString(),
        description: 'Click-through rate has dropped 45% below expected levels',
        metricName: 'CTR',
        currentValue: '0.8%',
        expectedValue: '1.5%',
        deviation: '-45',
        action: 'Review ad creative and targeting settings'
      },
      {
        email: ['analyst@example.com'],
        slack: ['#performance-alerts'],
        sms: ['+1234567890']
      }
    );
    
    if (results.length === 3) {
      console.log('✅ PASSED: Anomaly alert sent');
      console.log(`   - Channels: Email, Slack, SMS`);
      passed++;
    } else {
      throw new Error('Anomaly alert failed');
    }
  } catch (err) {
    console.log('❌ FAILED: Anomaly alert test');
    console.log(`   Error: ${err.message}`);
    failed++;
  }

  // Test 10: Empty Recipients
  try {
    console.log('\nTest 10: Handle Empty Recipients...');
    const results = await notifications.sendNotification(
      'workflow.completed',
      { workflowName: 'Test' },
      {}
    );
    
    if (results.length === 0) {
      console.log('✅ PASSED: Empty recipients handled correctly');
      passed++;
    } else {
      throw new Error('Should not send to empty recipients');
    }
  } catch (err) {
    console.log('❌ FAILED: Empty recipients test');
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
