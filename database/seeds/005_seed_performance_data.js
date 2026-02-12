/**
 * Seed: LOB-aware performance data (Locke AI Co. AI product lines)
 */

exports.seed = async function(knex) {
  console.log('🌱 Starting AI LOB performance data seeding...');

  const daysAgo = (days) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  };

  const between = (min, max) => min + Math.random() * (max - min);

  await knex('metrics').where('date', '>=', daysAgo(90)).del();

  const lobBenchmarks = {
    ai_audio: {
      cpcRange: [1.5, 2.5],
      ctrRange: [2.1, 2.9],
      convRateRange: [0.024, 0.036],
      avgOrderValueRange: [150, 300],
      baseImpressions: 62000
    },
    ai_wearables: {
      cpcRange: [2.0, 3.5],
      ctrRange: [1.7, 2.3],
      convRateRange: [0.020, 0.030],
      avgOrderValueRange: [200, 500],
      baseImpressions: 52000
    },
    ai_home: {
      cpcRange: [1.8, 3.0],
      ctrRange: [1.9, 2.5],
      convRateRange: [0.023, 0.033],
      avgOrderValueRange: [100, 400],
      baseImpressions: 56000
    },
    ai_vision: {
      cpcRange: [3.0, 5.0],
      ctrRange: [1.4, 2.1],
      convRateRange: [0.011, 0.019],
      avgOrderValueRange: [300, 800],
      baseImpressions: 34000
    },
    ai_productivity: {
      cpcRange: [2.5, 4.0],
      ctrRange: [2.0, 2.6],
      convRateRange: [0.018, 0.026],
      avgOrderValueRange: [100, 350],
      baseImpressions: 43000
    }
  };

  const platformTemplates = {
    ai_audio: [
      { id: 'camp-aiaudio-meta-001', platform: 'meta-ads', impressionMultiplier: 1.08 },
      { id: 'camp-aiaudio-google-001', platform: 'google-ads', impressionMultiplier: 0.9 },
      { id: 'camp-aiaudio-tiktok-001', platform: 'tiktok-ads', impressionMultiplier: 1.18 }
    ],
    ai_wearables: [
      { id: 'camp-aiwear-meta-001', platform: 'meta-ads', impressionMultiplier: 1.05 },
      { id: 'camp-aiwear-google-001', platform: 'google-ads', impressionMultiplier: 0.92 },
      { id: 'camp-aiwear-pinterest-001', platform: 'pinterest', impressionMultiplier: 0.88 }
    ],
    ai_home: [
      { id: 'camp-aihome-google-001', platform: 'google-ads', impressionMultiplier: 0.95 },
      { id: 'camp-aihome-meta-001', platform: 'meta-ads', impressionMultiplier: 1.02 },
      { id: 'camp-aihome-microsoft-001', platform: 'microsoft-ads', impressionMultiplier: 0.84 }
    ],
    ai_vision: [
      { id: 'camp-aivision-google-001', platform: 'google-ads', impressionMultiplier: 0.82 },
      { id: 'camp-aivision-tiktok-001', platform: 'tiktok-ads', impressionMultiplier: 1.1 },
      { id: 'camp-aivision-linkedin-001', platform: 'linkedin-ads', impressionMultiplier: 0.68 }
    ],
    ai_productivity: [
      { id: 'camp-aiproduct-linkedin-001', platform: 'linkedin-ads', impressionMultiplier: 0.74 },
      { id: 'camp-aiproduct-google-001', platform: 'google-ads', impressionMultiplier: 0.96 },
      { id: 'camp-aiproduct-microsoft-001', platform: 'microsoft-ads', impressionMultiplier: 0.8 }
    ]
  };

  const campaignTemplates = Object.entries(platformTemplates).flatMap(([lob, campaigns]) => {
    const benchmark = lobBenchmarks[lob];
    return campaigns.map((campaign) => ({
      id: campaign.id,
      platform: campaign.platform,
      lob,
      cpcRange: benchmark.cpcRange,
      ctrRange: benchmark.ctrRange,
      convRateRange: benchmark.convRateRange,
      avgOrderValueRange: benchmark.avgOrderValueRange,
      baseImpressions: Math.round(benchmark.baseImpressions * campaign.impressionMultiplier)
    }));
  });

  const rows = [];
  for (const c of campaignTemplates) {
    for (let day = 0; day < 90; day++) {
      const date = daysAgo(day);
      const dow = new Date(date).getDay();
      const weekend = dow === 0 || dow === 6;
      let mult = 1;

      if (c.platform === 'linkedin-ads') mult *= weekend ? 0.55 : 1.05;
      if (c.platform === 'tiktok-ads') mult *= weekend ? 1.12 : 0.98;
      if (c.platform === 'pinterest') mult *= weekend ? 1.1 : 0.95;
      if (c.lob === 'ai_home') mult *= weekend ? 1.06 : 1;
      if (c.lob === 'ai_vision') mult *= weekend ? 0.92 : 1.04;

      const impressions = Math.round(c.baseImpressions * mult * between(0.8, 1.2));
      const ctr = between(c.ctrRange[0], c.ctrRange[1]);
      const clicks = Math.round((impressions * ctr) / 100);
      const cpc = between(c.cpcRange[0], c.cpcRange[1]);
      const spend = clicks * cpc;
      const cr = between(c.convRateRange[0], c.convRateRange[1]);
      const conversions = Math.round(clicks * cr);
      const aov = between(c.avgOrderValueRange[0], c.avgOrderValueRange[1]);
      const revenue = conversions * aov * between(0.85, 1.15);

      rows.push({
        campaignId: c.id,
        date,
        impressions,
        clicks,
        conversions,
        spend: Number(spend.toFixed(2)),
        revenue: Number(revenue.toFixed(2)),
        ctr: Number(ctr.toFixed(4)),
        cpc: Number(cpc.toFixed(2)),
        cpa: Number((conversions ? spend / conversions : 0).toFixed(2)),
        roas: Number((spend ? revenue / spend : 0).toFixed(2)),
        metadata: JSON.stringify({
          lob: c.lob,
          platform: c.platform,
          cpcBenchmarkRange: c.cpcRange,
          ctrBenchmarkRange: c.ctrRange,
          conversionRateBenchmarkRange: c.convRateRange,
          aovRange: c.avgOrderValueRange
        }),
        syncedAt: new Date().toISOString()
      });
    }
  }

  for (let i = 0; i < rows.length; i += 500) {
    await knex('metrics').insert(rows.slice(i, i + 500));
  }

  console.log(`✅ Seeded ${rows.length} AI LOB metrics records`);
};