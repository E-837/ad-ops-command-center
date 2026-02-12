/**
 * Seed: LOB-aware performance data
 */

exports.seed = async function(knex) {
  console.log('🌱 Starting LOB-aware performance data seeding...');

  const daysAgo = (days) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  };

  const between = (min, max) => min + Math.random() * (max - min);

  await knex('metrics').where('date', '>=', daysAgo(90)).del();

  const campaignTemplates = [
    { id: 'camp-auto-dv360-001', platform: 'dv360', lob: 'auto', cpcRange: [3.2, 4.8], ctrRange: [0.8, 1.3], convRateRange: [0.010, 0.018], avgDealSize: 42000, baseImpressions: 42000 },
    { id: 'camp-auto-meta-001', platform: 'meta-ads', lob: 'auto', cpcRange: [3.0, 4.5], ctrRange: [0.9, 1.5], convRateRange: [0.012, 0.020], avgDealSize: 39000, baseImpressions: 52000 },
    { id: 'camp-auto-google-001', platform: 'google-ads', lob: 'auto', cpcRange: [3.5, 5.0], ctrRange: [2.5, 4.2], convRateRange: [0.020, 0.035], avgDealSize: 35000, baseImpressions: 18000 },

    { id: 'camp-ins-google-001', platform: 'google-ads', lob: 'insurance', cpcRange: [8.0, 12.0], ctrRange: [3.0, 5.0], convRateRange: [0.018, 0.030], avgDealSize: 2400, baseImpressions: 15000 },
    { id: 'camp-ins-meta-001', platform: 'meta-ads', lob: 'insurance', cpcRange: [8.5, 11.5], ctrRange: [1.0, 1.8], convRateRange: [0.010, 0.018], avgDealSize: 1800, baseImpressions: 32000 },
    { id: 'camp-ins-microsoft-001', platform: 'microsoft-ads', lob: 'insurance', cpcRange: [7.8, 10.8], ctrRange: [2.8, 4.6], convRateRange: [0.016, 0.028], avgDealSize: 2200, baseImpressions: 12000 },

    { id: 'camp-travel-dv360-001', platform: 'dv360', lob: 'travel', cpcRange: [1.8, 2.8], ctrRange: [0.9, 1.5], convRateRange: [0.016, 0.028], avgDealSize: 1400, baseImpressions: 46000 },
    { id: 'camp-travel-meta-001', platform: 'meta-ads', lob: 'travel', cpcRange: [1.6, 2.6], ctrRange: [1.1, 2.1], convRateRange: [0.018, 0.030], avgDealSize: 900, baseImpressions: 50000 },
    { id: 'camp-travel-tiktok-001', platform: 'tiktok-ads', lob: 'travel', cpcRange: [1.4, 2.4], ctrRange: [1.3, 2.3], convRateRange: [0.012, 0.020], avgDealSize: 1100, baseImpressions: 62000 },

    { id: 'camp-fin-google-001', platform: 'google-ads', lob: 'finance', cpcRange: [6.5, 9.5], ctrRange: [2.5, 4.2], convRateRange: [0.016, 0.026], avgDealSize: 75000, baseImpressions: 14000 },
    { id: 'camp-fin-linkedin-001', platform: 'linkedin-ads', lob: 'finance', cpcRange: [7.0, 10.5], ctrRange: [0.7, 1.2], convRateRange: [0.020, 0.032], avgDealSize: 120000, baseImpressions: 11000 },

    { id: 'camp-retail-google-001', platform: 'google-ads', lob: 'retail', cpcRange: [0.6, 1.3], ctrRange: [3.5, 5.5], convRateRange: [0.030, 0.055], avgDealSize: 95, baseImpressions: 65000 },
    { id: 'camp-retail-meta-001', platform: 'meta-ads', lob: 'retail', cpcRange: [0.5, 1.2], ctrRange: [1.4, 2.4], convRateRange: [0.020, 0.038], avgDealSize: 82, baseImpressions: 70000 },
    { id: 'camp-retail-pinterest-001', platform: 'pinterest', lob: 'retail', cpcRange: [0.7, 1.5], ctrRange: [1.0, 1.8], convRateRange: [0.022, 0.040], avgDealSize: 88, baseImpressions: 48000 }
  ];

  const rows = [];
  for (const c of campaignTemplates) {
    for (let day = 0; day < 90; day++) {
      const date = daysAgo(day);
      const dow = new Date(date).getDay();
      const weekend = dow === 0 || dow === 6;
      let mult = 1;
      if (c.platform === 'linkedin-ads') mult = weekend ? 0.45 : 1;
      if (c.lob === 'retail') mult *= weekend ? 1.2 : 1;
      if (c.lob === 'travel') mult *= weekend ? 1.15 : 1;

      const impressions = Math.round(c.baseImpressions * mult * between(0.78, 1.22));
      const ctr = between(c.ctrRange[0], c.ctrRange[1]);
      const clicks = Math.round(impressions * ctr / 100);
      const cpc = between(c.cpcRange[0], c.cpcRange[1]);
      const spend = clicks * cpc;
      const cr = between(c.convRateRange[0], c.convRateRange[1]);
      const conversions = Math.round(clicks * cr);
      const revenue = conversions * c.avgDealSize * between(0.7, 1.3);

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
        metadata: JSON.stringify({ lob: c.lob, platform: c.platform, cpcBenchmarkRange: c.cpcRange }),
        syncedAt: new Date().toISOString()
      });
    }
  }

  for (let i = 0; i < rows.length; i += 500) {
    await knex('metrics').insert(rows.slice(i, i + 500));
  }

  console.log(`✅ Seeded ${rows.length} LOB-aware metrics records`);
};
