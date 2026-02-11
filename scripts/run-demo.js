#!/usr/bin/env node

/**
 * Campaign Lifecycle Demo Runner
 * Runs the full end-to-end workflow with real API calls and pretty output
 */

const workflow = require('../workflows/campaign-lifecycle-demo');

const C = {
  reset: '\x1b[0m', green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m',
  cyan: '\x1b[36m', blue: '\x1b[34m', magenta: '\x1b[35m', dim: '\x1b[2m', bold: '\x1b[1m'
};

function log(text, color = '') { console.log(`${color}${text}${C.reset}`); }

async function main() {
  const startTime = Date.now();
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const campaignArg = args.find(arg => arg.startsWith('--campaign='));
  const campaignName = campaignArg ? campaignArg.split('=')[1] : 'locke-airpod-ai';
  
  log('\n🎬 AD OPS COMMAND CENTER', C.bold + C.magenta);
  log('   Campaign Lifecycle Demo', C.magenta);
  log('═══════════════════════════════════════════', C.magenta);
  
  const data = workflow.loadCampaign(campaignName);
  log(`\n📋 Brand: ${data.brand}`, C.cyan);
  log(`🎧 Product: ${data.product}`, C.cyan);
  log(`💡 Tagline: "${data.tagline}"`, C.cyan);
  log(`💰 Budget: $${data.budget.toLocaleString()}`, C.cyan);
  log(`📅 Flight: ${data.flightStart} → ${data.flightEnd}`, C.cyan);
  log(`🎯 Launch: ${data.launchEvent}`, C.cyan);
  log(`📺 Channels: ${data.channels.join(', ')}`, C.cyan);
  log(`🖥️  DSPs: TTD, DV360, Amazon DSP`, C.cyan);
  
  log(`\n▶ Running workflow for campaign: ${campaignName}`, C.blue);
  log('─────────────────────────────────────────', C.dim);

  const results = await workflow.run({ campaign: campaignName });
  
  // Display results per stage
  for (let i = 0; i < results.stages.length; i++) {
    const stage = results.stages[i];
    const icon = stage.status === 'completed' ? '✅' : stage.status === 'failed' ? '⚠️' : '❓';
    const color = stage.status === 'completed' ? C.green : C.yellow;
    
    log(`\n${icon} Stage ${i + 1}: ${stage.name}`, color);
    
    if (stage.output) {
      const out = stage.output;
      
      switch (stage.id) {
        case 'brief':
          log(`   📄 Doc: ${out.documentUrl || 'N/A'}`, C.cyan);
          log(`   📝 Sections: ${(out.sections || []).join(', ')}`, C.dim);
          break;
        case 'plan':
          log(`   📊 Sheet: ${out.spreadsheetUrl || 'N/A'}`, C.cyan);
          log(`   📝 ${out.tactics || 0} tactics, ${out.rows || 0} rows`, C.dim);
          break;
        case 'project':
          log(`   📋 Project: ${out.projectUrl || 'N/A'}`, C.cyan);
          log(`   ✅ ${out.tasksCreated || 0} tasks created`, C.dim);
          if (out.tasks) {
            out.tasks.forEach(t => {
              const liveTag = t.live ? ' [LIVE]' : '';
              log(`      • ${t.name} (due ${t.due})${liveTag}`, C.dim);
            });
          }
          break;
        case 'landing':
          log(`   🌐 Landing Page: ${out.filePath || 'N/A'}`, C.cyan);
          if (out.replacements) {
            log(`   ✨ Customized: ${out.replacements.join(', ')}`, C.dim);
          }
          break;
        case 'creative':
          log(`   🎨 ${out.designsCreated || 0} creatives — ${out.aiGenerated || 0} AI-generated, ${out.canvaDesigns || 0} Canva designs`, C.cyan);
          if (out.imageModel) log(`   🤖 Image model: ${out.imageModel}`, C.dim);
          if (out.designs) {
            out.designs.forEach(d => {
              const aiTag = d.aiGenerated ? '🖼️ AI' : '⬜';
              const uploadTag = d.assetUploaded ? '📤 Uploaded' : '';
              const canvaTag = d.canvaLive ? '🎨 Canva' : '';
              const tags = [aiTag, uploadTag, canvaTag].filter(Boolean).join(' + ');
              const url = d.editUrl ? `\n         Canva: ${d.editUrl.substring(0, 80)}...` : '';
              log(`      • ${d.name} (${d.size}) [${tags}]${url}`, C.dim);
              if (d.aiError) log(`        ⚠️ AI: ${d.aiError}`, C.yellow);
              if (d.assetUploadError) log(`        ⚠️ Upload: ${d.assetUploadError}`, C.yellow);
            });
          }
          break;
        case 'activate':
          log(`   🚀 ${out.campaignsActivated || 0} campaigns activated`, C.cyan);
          log(`   💰 $${(out.totalBudget || 0).toLocaleString()} total budget across ${[...new Set((out.campaigns||[]).map(c=>c.dsp))].length} DSPs`, C.dim);
          if (out.campaigns) {
            out.campaigns.forEach(c => {
              log(`      ┌─ ${c.dsp}: ${c.name}`, C.dim);
              log(`      │  Campaign: ${c.CampaignId || c.campaignId || c.orderId || c.id}  ·  $${c.budget.toLocaleString()}  ·  ${c.status}`, C.dim);
              // TTD-specific
              if (c.BidStrategy) {
                log(`      │  Bid: ${c.BidStrategy.BidStrategyType} $${c.BidStrategy.MaxBidCPM} CPM  ·  Goal: ${c.BidStrategy.OptimizationGoal}`, C.dim);
                log(`      │  Targeting: ${c.Targeting?.AudienceSegments?.join(', ')}`, C.dim);
                log(`      │  Safety: ${c.Targeting?.BrandSafety?.Provider} (${c.Targeting?.BrandSafety?.Level})  ·  Freq: ${c.FrequencyCap?.MaxImpressions}x/${c.FrequencyCap?.TimeUnitType}`, C.dim);
              }
              // DV360-specific
              if (c.insertionOrder) {
                log(`      │  IO: ${c.insertionOrder.insertionOrderId}  ·  Pacing: ${c.insertionOrder.pacingType}`, C.dim);
                if (c.lineItems?.[0]?.targeting) {
                  const t = c.lineItems[0].targeting;
                  log(`      │  Inventory: ${t.inventorySource?.inventorySourceIds?.join(', ')}`, C.dim);
                  log(`      │  Device: ${t.deviceType?.targetingOptionId}  ·  Audiences: ${t.audienceGroup?.includedFirstAndThirdPartyAudiences?.join(', ')}`, C.dim);
                }
              }
              // Amazon-specific
              if (c.amazonAttribution) {
                const li = c.lineItems?.[0];
                if (li?.targeting?.audiences) {
                  log(`      │  Amazon: ${li.targeting.audiences.amazonAudiences?.join(', ')}`, C.dim);
                  log(`      │  Pixel: ${li.targeting.audiences.pixelAudiences?.join(', ')}`, C.dim);
                }
                log(`      │  Attribution: ${c.amazonAttribution.attributionModel} (${c.amazonAttribution.conversionWindow})`, C.dim);
              }
              log(`      └──────`, C.dim);
            });
          }
          break;
        case 'report':
          log(`   📋 Report: ${out.reportDocUrl || 'N/A'}`, C.cyan);
          break;
      }
    }
    
    if (stage.mockData) {
      log(`   ⚠️  Fallback: ${stage.mockData.message || 'Used mock data'}`, C.yellow);
    }
    if (stage.error) {
      log(`   ❌ Error: ${stage.error}`, C.red);
    }
  }
  
  // Summary
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const successCount = results.stages.filter(s => s.status === 'completed').length;
  
  log('\n═══════════════════════════════════════════', C.magenta);
  log(`${results.status === 'completed' ? '🎉' : '⚠️'} DEMO ${results.status.toUpperCase()}`, C.bold + (results.status === 'completed' ? C.green : C.yellow));
  log(`   ${successCount}/${results.stages.length} stages completed`, C.cyan);
  log(`   ⏱️  ${elapsed}s total`, C.dim);
  
  // Artifacts summary
  const arts = results.artifacts;
  log('\n🔗 Artifacts:', C.cyan);
  if (arts.briefDocUrl) log(`   📄 Brief: ${arts.briefDocUrl}`, C.dim);
  if (arts.mediaPlanSheetUrl) log(`   📊 Media Plan: ${arts.mediaPlanSheetUrl}`, C.dim);
  if (arts.asanaProjectUrl) log(`   📋 Asana: ${arts.asanaProjectUrl}`, C.dim);
  if (arts.landingPagePath) log(`   🌐 Landing Page: ${arts.landingPagePath}`, C.dim);
  if (arts.creativeDesigns) log(`   🎨 Creatives: ${arts.creativeDesigns.length} designs`, C.dim);
  if (arts.reportDocUrl) log(`   📋 Report: ${arts.reportDocUrl}`, C.dim);
  
  log(`\n🚀 Campaign ready for launch on ${data.flightStart}!\n`, C.green);
}

main().catch(err => {
  console.error('Demo failed:', err);
  process.exit(1);
});
