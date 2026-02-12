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

  const programmaticBenchmarks = {
    display: {
      ctrRange: [0.08, 0.15],
      cpcRange: [0.5, 1.5],
      convRateRange: [0.009, 0.018],
      viewabilityRange: [0.58, 0.76]
    },
    video: {
      ctrRange: [0.2, 0.5],
      cpmRange: [8, 20],
      convRateRange: [0.004, 0.012],
      completionRateRange: [0.58, 0.88],
      viewabilityRange: [0.7, 0.88]
    },
    native: {
      ctrRange: [0.15, 0.3],
      cpcRange: [1.0, 2.5],
      convRateRange: [0.01, 0.02],
      viewabilityRange: [0.52, 0.7]
    }
  };

  const platformTemplates = {
    ai_audio: [
      { id: 'camp-aiaudio-meta-001', platform: 'meta-ads', impressionMultiplier: 1.08 },
      { id: 'camp-aiaudio-google-001', platform: 'google-ads', impressionMultiplier: 0.9 },
      { id: 'camp-aiaudio-tiktok-001', platform: 'tiktok-ads', impressionMultiplier: 1.18 },
      {
        id: 'camp-ttd-aiaudio-001',
        platform: 'ttd',
        impressionMultiplier: 1.24,
        channelType: 'programmatic',
        mediaType: 'display',
        objective: 'consideration',
        inventoryType: 'open exchange',
        inventorySources: ['OpenX', 'Magnite', 'Xandr']
      },
      {
        id: 'camp-dv360-aiaudio-001',
        platform: 'dv360',
        impressionMultiplier: 1.36,
        channelType: 'programmatic',
        mediaType: 'video',
        objective: 'awareness',
        inventoryType: 'guaranteed',
        inventorySources: ['YouTube Select', 'Google Video Partners']
      },
      {
        id: 'camp-amazon-aiaudio-001',
        platform: 'amazon-dsp',
        impressionMultiplier: 1.18,
        channelType: 'programmatic',
        mediaType: 'native',
        objective: 'retargeting',
        inventoryType: 'PMP',
        inventorySources: ['Amazon DSP Native Placements', 'Twitch Display']
      }
    ],
    ai_wearables: [
      { id: 'camp-aiwear-meta-001', platform: 'meta-ads', impressionMultiplier: 1.05 },
      { id: 'camp-aiwear-google-001', platform: 'google-ads', impressionMultiplier: 0.92 },
      { id: 'camp-aiwear-pinterest-001', platform: 'pinterest', impressionMultiplier: 0.88 },
      {
        id: 'camp-ttd-aiwear-001',
        platform: 'ttd',
        impressionMultiplier: 1.26,
        channelType: 'programmatic',
        mediaType: 'video',
        objective: 'awareness',
        inventoryType: 'PMP',
        inventorySources: ['Hulu PMP', 'Roku Exchange', 'Premium CTV Networks']
      },
      {
        id: 'camp-dv360-aiwear-001',
        platform: 'dv360',
        impressionMultiplier: 1.12,
        channelType: 'programmatic',
        mediaType: 'display',
        objective: 'consideration',
        inventoryType: 'open exchange',
        inventorySources: ['Google Display Network', 'AdX']
      }
    ],
    ai_home: [
      { id: 'camp-aihome-google-001', platform: 'google-ads', impressionMultiplier: 0.95 },
      { id: 'camp-aihome-meta-001', platform: 'meta-ads', impressionMultiplier: 1.02 },
      { id: 'camp-aihome-microsoft-001', platform: 'microsoft-ads', impressionMultiplier: 0.84 },
      {
        id: 'camp-dv360-aihome-001',
        platform: 'dv360',
        impressionMultiplier: 1.3,
        channelType: 'programmatic',
        mediaType: 'video',
        objective: 'awareness',
        inventoryType: 'guaranteed',
        inventorySources: ['YouTube In-Stream', 'Connected TV Reserve']
      },
      {
        id: 'camp-amazon-aihome-001',
        platform: 'amazon-dsp',
        impressionMultiplier: 1.16,
        channelType: 'programmatic',
        mediaType: 'display',
        objective: 'retargeting',
        inventoryType: 'PMP',
        inventorySources: ['Amazon Publisher Services', 'Fire TV Display']
      }
    ],
    ai_vision: [
      { id: 'camp-aivision-google-001', platform: 'google-ads', impressionMultiplier: 0.82 },
      { id: 'camp-aivision-tiktok-001', platform: 'tiktok-ads', impressionMultiplier: 1.1 },
      { id: 'camp-aivision-linkedin-001', platform: 'linkedin-ads', impressionMultiplier: 0.68 },
      {
        id: 'camp-ttd-aivision-001',
        platform: 'ttd',
        impressionMultiplier: 1.08,
        channelType: 'programmatic',
        mediaType: 'display',
        objective: 'consideration',
        inventoryType: 'PMP',
        inventorySources: ['Wired PMP', 'The Verge PMP', 'Condé Nast Programmatic']
      },
      {
        id: 'camp-dv360-aivision-001',
        platform: 'dv360',
        impressionMultiplier: 1.2,
        channelType: 'programmatic',
        mediaType: 'video',
        objective: 'awareness',
        inventoryType: 'guaranteed',
        inventorySources: ['YouTube Tech Channels', 'Google Video Partners']
      }
    ],
    ai_productivity: [
      { id: 'camp-aiproduct-linkedin-001', platform: 'linkedin-ads', impressionMultiplier: 0.74 },
      { id: 'camp-aiproduct-google-001', platform: 'google-ads', impressionMultiplier: 0.96 },
      { id: 'camp-aiproduct-microsoft-001', platform: 'microsoft-ads', impressionMultiplier: 0.8 },
      {
        id: 'camp-ttd-aiproduct-001',
        platform: 'ttd',
        impressionMultiplier: 1.04,
        channelType: 'programmatic',
        mediaType: 'video',
        objective: 'consideration',
        inventoryType: 'PMP',
        inventorySources: ['Bloomberg Video PMP', 'Forbes B2B Video', 'Programmatic CTV B2B Segments']
      },
      {
        id: 'camp-amazon-aiproduct-001',
        platform: 'amazon-dsp',
        impressionMultiplier: 0.98,
        channelType: 'programmatic',
        mediaType: 'display',
        objective: 'retargeting',
        inventoryType: 'open exchange',
        inventorySources: ['IMDb Display', 'Amazon DSP Display']
      }
    ]
  };

  const campaignTemplates = Object.entries(platformTemplates).flatMap(([lob, campaigns]) => {
    const benchmark = lobBenchmarks[lob];

    return campaigns.map((campaign) => {
      const isProgrammatic = campaign.channelType === 'programmatic';
      const mediaBenchmark = isProgrammatic ? programmaticBenchmarks[campaign.mediaType] : null;

      return {
        id: campaign.id,
        platform: campaign.platform,
        lob,
        channelType: campaign.channelType || 'paid',
        mediaType: campaign.mediaType || 'standard',
        objective: campaign.objective || 'conversion',
        inventoryType: campaign.inventoryType || null,
        inventorySources: campaign.inventorySources || [],
        cpcRange: mediaBenchmark?.cpcRange || benchmark.cpcRange,
        cpmRange: mediaBenchmark?.cpmRange || null,
        ctrRange: mediaBenchmark?.ctrRange || benchmark.ctrRange,
        convRateRange: mediaBenchmark?.convRateRange || benchmark.convRateRange,
        viewabilityRange: mediaBenchmark?.viewabilityRange || null,
        completionRateRange: mediaBenchmark?.completionRateRange || null,
        avgOrderValueRange: benchmark.avgOrderValueRange,
        baseImpressions: Math.round(benchmark.baseImpressions * campaign.impressionMultiplier)
      };
    });
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
      if (c.platform === 'amazon-dsp') mult *= weekend ? 1.05 : 1.01;
      if (c.platform === 'dv360') mult *= weekend ? 1.02 : 1;
      if (c.platform === 'ttd') mult *= weekend ? 0.97 : 1.03;
      if (c.lob === 'ai_home') mult *= weekend ? 1.06 : 1;
      if (c.lob === 'ai_vision') mult *= weekend ? 0.92 : 1.04;

      const impressions = Math.round(c.baseImpressions * mult * between(0.8, 1.2));
      const ctr = between(c.ctrRange[0], c.ctrRange[1]);
      const clicks = Math.max(1, Math.round((impressions * ctr) / 100));

      const cpm = c.cpmRange ? between(c.cpmRange[0], c.cpmRange[1]) : null;
      const cpc = c.cpcRange ? between(c.cpcRange[0], c.cpcRange[1]) : null;
      const spend = cpm ? (impressions / 1000) * cpm : clicks * cpc;

      const cr = between(c.convRateRange[0], c.convRateRange[1]);
      const conversions = Math.round(clicks * cr);
      const aov = between(c.avgOrderValueRange[0], c.avgOrderValueRange[1]);
      const revenue = conversions * aov * between(0.85, 1.15);

      const viewabilityScore = c.viewabilityRange
        ? Number(between(c.viewabilityRange[0], c.viewabilityRange[1]).toFixed(4))
        : null;
      const completionRate = c.completionRateRange
        ? Number(between(c.completionRateRange[0], c.completionRateRange[1]).toFixed(4))
        : null;
      const brandLift = c.objective === 'awareness'
        ? Number(between(0.015, 0.065).toFixed(4))
        : null;

      rows.push({
        campaignId: c.id,
        date,
        impressions,
        clicks,
        conversions,
        spend: Number(spend.toFixed(2)),
        revenue: Number(revenue.toFixed(2)),
        ctr: Number(ctr.toFixed(4)),
        cpc: Number((spend / clicks).toFixed(2)),
        cpa: Number((conversions ? spend / conversions : 0).toFixed(2)),
        roas: Number((spend ? revenue / spend : 0).toFixed(2)),
        metadata: JSON.stringify({
          lob: c.lob,
          platform: c.platform,
          channelType: c.channelType,
          mediaType: c.mediaType,
          objective: c.objective,
          inventoryType: c.inventoryType,
          inventorySources: c.inventorySources,
          cpcBenchmarkRange: c.cpcRange,
          cpmBenchmarkRange: c.cpmRange,
          ctrBenchmarkRange: c.ctrRange,
          conversionRateBenchmarkRange: c.convRateRange,
          aovRange: c.avgOrderValueRange,
          viewabilityScore,
          completionRate,
          brandLift
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