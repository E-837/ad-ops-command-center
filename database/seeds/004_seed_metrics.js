/**
 * Seed: Sample metrics (100 records)
 */

exports.seed = async function(knex) {
  // Clear existing data
  await knex('metrics').del();
  
  // Helper to generate dates
  const daysAgo = (days) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  };
  
  // Campaign IDs to generate metrics for
  const campaignIds = [
    'camp-meta-001',
    'camp-meta-002',
    'camp-meta-003',
    'camp-google-001',
    'camp-google-002',
    'camp-google-003',
    'camp-pinterest-001',
    'camp-pinterest-002',
    'camp-ttd-001',
    'camp-ttd-002'
  ];
  
  // Generate metrics for last 30 days for each campaign
  const metrics = [];
  
  for (const campaignId of campaignIds) {
    // Determine platform from campaign ID
    let platform, baseImpressions, baseCtr, baseCpc;
    
    if (campaignId.includes('meta')) {
      platform = 'meta-ads';
      baseImpressions = 50000;
      baseCtr = 1.2;
      baseCpc = 0.85;
    } else if (campaignId.includes('google')) {
      platform = 'google-ads';
      baseImpressions = 100000;
      baseCtr = 2.5;
      baseCpc = 1.20;
    } else if (campaignId.includes('pinterest')) {
      platform = 'pinterest';
      baseImpressions = 30000;
      baseCtr = 0.8;
      baseCpc = 0.65;
    } else if (campaignId.includes('ttd')) {
      platform = 'ttd';
      baseImpressions = 200000;
      baseCtr = 0.15;
      baseCpc = 2.50;
    } else {
      platform = 'dv360';
      baseImpressions = 150000;
      baseCtr = 0.20;
      baseCpc = 3.00;
    }
    
    // Generate 10 days of metrics per campaign (10 campaigns x 10 days = 100 records)
    for (let day = 0; day < 10; day++) {
      const date = daysAgo(day);
      
      // Add some randomness to make it realistic
      const variance = 0.8 + (Math.random() * 0.4); // 0.8 to 1.2
      const impressions = Math.round(baseImpressions * variance);
      const ctr = baseCtr * (0.9 + Math.random() * 0.2); // ±10%
      const clicks = Math.round(impressions * (ctr / 100));
      const cpc = baseCpc * (0.85 + Math.random() * 0.3); // ±15%
      const spend = clicks * cpc;
      
      // Conversions (not all clicks convert)
      const conversionRate = 0.02 + Math.random() * 0.03; // 2-5%
      const conversions = Math.round(clicks * conversionRate);
      const cpa = conversions > 0 ? spend / conversions : 0;
      
      // Revenue (varies by platform and day)
      const revenuePerConversion = 50 + Math.random() * 100; // $50-$150
      const revenue = conversions * revenuePerConversion;
      const roas = spend > 0 ? revenue / spend : 0;
      
      metrics.push({
        campaignId,
        date,
        impressions,
        clicks,
        conversions,
        spend: parseFloat(spend.toFixed(2)),
        revenue: parseFloat(revenue.toFixed(2)),
        ctr: parseFloat(ctr.toFixed(4)),
        cpc: parseFloat(cpc.toFixed(2)),
        cpa: parseFloat(cpa.toFixed(2)),
        roas: parseFloat(roas.toFixed(2)),
        metadata: JSON.stringify({
          platform,
          dayOfWeek: new Date(date).getDay(),
          isWeekend: [0, 6].includes(new Date(date).getDay())
        }),
        syncedAt: new Date().toISOString()
      });
    }
  }
  
  // Insert all metrics
  await knex('metrics').insert(metrics);
  
  console.log(`✅ Seeded ${metrics.length} sample metrics records (10 campaigns x 10 days)`);
};
