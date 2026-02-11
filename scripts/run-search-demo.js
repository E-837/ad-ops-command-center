#!/usr/bin/env node

/**
 * Search Campaign Demo Runner
 * Runs the search campaign creation workflow with AI keyword research + AI-generated ad copy
 * 
 * Usage:
 *   node scripts/run-search-demo.js                          # full pipeline (default campaign)
 *   node scripts/run-search-demo.js --dry-run                # mock data, no API calls
 *   node scripts/run-search-demo.js --campaign=locke-airpod-ai
 *   node scripts/run-search-demo.js --keywords="ai earbuds,smart earbuds"  # override keywords
 */

const searchWorkflow = require('../workflows/search-campaign-workflow');

const C = {
  reset: '\x1b[0m', green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m',
  cyan: '\x1b[36m', blue: '\x1b[34m', magenta: '\x1b[35m', dim: '\x1b[2m', bold: '\x1b[1m'
};

function log(text, color = '') { console.log(`${color}${text}${C.reset}`); }

async function main() {
  const startTime = Date.now();

  // Parse CLI args
  const args = process.argv.slice(2);
  const campaignArg = args.find(a => a.startsWith('--campaign='));
  const configName = campaignArg ? campaignArg.split('=')[1] : null;
  const dryRun = args.includes('--dry-run');
  const keywordsArg = args.find(a => a.startsWith('--keywords='));
  const keywords = keywordsArg ? keywordsArg.split('=').slice(1).join('=').replace(/^"|"$/g, '').split(',') : null;

  log('\n🔍 AD OPS COMMAND CENTER', C.bold + C.magenta);
  log('   Search Campaign Pipeline (AI-Powered)', C.magenta);
  log('═══════════════════════════════════════════', C.magenta);

  if (dryRun) {
    log('\n⚡ DRY RUN MODE — no API calls will be made', C.yellow);
  }

  if (keywords) {
    log(`\n🔑 Keyword override: ${keywords.join(', ')}`, C.yellow);
  }

  const config = searchWorkflow.loadConfig(configName);
  log(`\n📋 Campaign: ${config.campaignName}`, C.cyan);
  log(`💰 Budget: $${config.budget.toLocaleString()}/day (${config.biddingStrategy})`, C.cyan);
  log(`📅 Flight: ${config.startDate} → ${config.endDate}`, C.cyan);

  if (!keywords) {
    log(`🤖 Keywords: AI-generated from campaign brief`, C.cyan);
  }

  log(`\n▶ Running search workflow...`, C.blue);
  log('─────────────────────────────────────────', C.dim);

  const results = await searchWorkflow.runSearchWorkflow({ configName, dryRun, keywords });

  // Display results
  for (let i = 0; i < results.stages.length; i++) {
    const stage = results.stages[i];
    const icon = stage.status === 'completed' ? '✅' : stage.status === 'failed' ? '❌' : '⚠️';
    const color = stage.status === 'completed' ? C.green : C.red;

    log(`\n${icon} Stage ${i + 1}: ${stage.name}`, color);

    if (stage.output) {
      const out = stage.output;

      switch (stage.id) {
        case 'keywords':
          log(`   🤖 Model: ${out.model}`, C.dim);
          log(`   📁 ${out.adGroupCount} ad groups, ${out.totalKeywords} keywords`, C.cyan);
          if (out.adGroups) {
            out.adGroups.forEach(ag => {
              log(`\n      ── ${ag.name} (${ag.intent} intent, ${ag.keywordCount} kw) ──`, C.cyan);
              ag.keywords.forEach(kw => {
                log(`         ${kw}`, C.dim);
              });
            });
          }
          if (out.negativeKeywords && out.negativeKeywords.length) {
            log(`\n      ── Negative Keywords ──`, C.yellow);
            log(`         ${out.negativeKeywords.join(', ')}`, C.dim);
          }
          break;

        case 'copy':
          log(`   ✍️  ${out.setsGenerated}/${out.totalSets} ad copy sets generated`, C.cyan);
          if (out.adCopySets) {
            out.adCopySets.forEach(s => {
              if (s.error) {
                log(`      ❌ ${s.adGroup}: ${s.error}`, C.red);
              } else {
                const hValid = s.validation?.headlines_valid || 0;
                const dValid = s.validation?.descriptions_valid || 0;
                log(`      • ${s.adGroup}: ${hValid} headlines, ${dValid} descriptions ${s.model ? `(${s.model})` : ''}`, C.dim);
                if (s.validation?.warnings?.length) {
                  s.validation.warnings.forEach(w => log(`        ⚠️  ${w}`, C.yellow));
                }
              }
            });
          }
          break;

        case 'build':
          log(`   📦 Campaign: ${out.campaignName} (${out.budget}, ${out.bidding})${out.sandbox ? ' [SANDBOX]' : ''}`, C.cyan);
          if (out.adGroups) {
            out.adGroups.forEach(ag => {
              const rsaStatus = ag.rsa.created ? `✅ RSA (${ag.rsa.headlines}h/${ag.rsa.descriptions}d)` : `❌ ${ag.rsa.reason}`;
              log(`      • ${ag.name}: ${ag.keywords.length} kw, ${rsaStatus}`, C.dim);
            });
          }
          break;

        case 'report':
          log(`   📋 Report saved: ${out.reportPath}`, C.cyan);
          break;
      }
    }

    if (stage.error) {
      log(`   ❌ Error: ${stage.error}`, C.red);
    }
  }

  // Summary
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const successCount = results.stages.filter(s => s.status === 'completed').length;

  log('\n═══════════════════════════════════════════', C.magenta);
  log(`${results.status === 'completed' ? '🎉' : '⚠️'} SEARCH PIPELINE ${results.status.toUpperCase()}${dryRun ? ' (DRY RUN)' : ''}`, C.bold + (results.status === 'completed' ? C.green : C.yellow));
  log(`   ${successCount}/${results.stages.length} stages completed`, C.cyan);
  log(`   ⏱️  ${elapsed}s total`, C.dim);

  // Quick stats
  const kwStage = results.stages.find(s => s.id === 'keywords');
  if (kwStage?.output) {
    log(`   🔑 ${kwStage.output.totalKeywords} keywords in ${kwStage.output.adGroupCount} ad groups`, C.dim);
  }

  const copyStage = results.stages.find(s => s.id === 'copy');
  if (copyStage?.output?.adCopySets) {
    const totalHeadlines = copyStage.output.adCopySets.reduce((s, c) => s + (c.headlines?.length || 0), 0);
    const totalDescs = copyStage.output.adCopySets.reduce((s, c) => s + (c.descriptions?.length || 0), 0);
    log(`   ✍️  ${totalHeadlines} headlines + ${totalDescs} descriptions generated`, C.dim);
  }

  log(`\n🚀 Search campaign ready for launch on ${config.startDate}!\n`, C.green);
}

main().catch(err => {
  console.error('Search demo failed:', err);
  process.exit(1);
});
