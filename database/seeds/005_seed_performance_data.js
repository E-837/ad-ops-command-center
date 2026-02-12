/**
 * Seed: Comprehensive performance data for Paid Search & Social campaigns
 * Generates 90 days of realistic metrics for all ad platforms
 */

exports.seed = async function(knex) {
  console.log('🌱 Starting comprehensive performance data seeding...');
  
  // Helper to generate dates
  const daysAgo = (days) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  };
  
  // Helper for random variance
  const variance = (base, range = 0.3) => base * (1 - range + Math.random() * range * 2);
  
  // Clear existing performance data (keep campaigns)
  await knex('metrics').where('date', '>=', daysAgo(90)).del();
  console.log('  Cleared existing metrics for last 90 days');
  
  // Define campaign templates by platform
  const platformTemplates = {
    'google-ads': {
      campaigns: [
        { id: 'camp-google-search-001', name: 'Brand Search - High Intent', type: 'search' },
        { id: 'camp-google-search-002', name: 'Competitor Keywords', type: 'search' },
        { id: 'camp-google-search-003', name: 'Generic Product Terms', type: 'search' },
        { id: 'camp-google-shopping-001', name: 'Shopping - All Products', type: 'shopping' }
      ],
      baseMetrics: {
        impressions: 25000,
        ctr: 3.5,
        cpc: 1.80,
        conversionRate: 0.045,
        qualityScore: 7.5
      }
    },
    'microsoft-ads': {
      campaigns: [
        { id: 'camp-msads-search-001', name: 'Bing Brand Search', type: 'search' },
        { id: 'camp-msads-search-002', name: 'Bing Product Keywords', type: 'search' }
      ],
      baseMetrics: {
        impressions: 8000,
        ctr: 3.0,
        cpc: 1.50,
        conversionRate: 0.040,
        qualityScore: 7.0
      }
    },
    'meta-ads': {
      campaigns: [
        { id: 'camp-meta-fb-001', name: 'Facebook - Prospecting', type: 'prospecting' },
        { id: 'camp-meta-fb-002', name: 'Facebook - Retargeting', type: 'retargeting' },
        { id: 'camp-meta-ig-001', name: 'Instagram - Stories', type: 'prospecting' },
        { id: 'camp-meta-ig-002', name: 'Instagram - Feed', type: 'prospecting' }
      ],
      baseMetrics: {
        impressions: 50000,
        ctr: 1.2,
        cpc: 0.85,
        conversionRate: 0.020,
        engagementRate: 0.035
      }
    },
    'linkedin-ads': {
      campaigns: [
        { id: 'camp-linkedin-001', name: 'B2B Lead Gen - IT Decision Makers', type: 'leadgen' },
        { id: 'camp-linkedin-002', name: 'B2B Content - Thought Leadership', type: 'awareness' }
      ],
      baseMetrics: {
        impressions: 15000,
        ctr: 0.8,
        cpc: 5.50,
        conversionRate: 0.025,
        engagementRate: 0.015
      }
    },
    'tiktok-ads': {
      campaigns: [
        { id: 'camp-tiktok-001', name: 'TikTok - Gen Z Awareness', type: 'awareness' },
        { id: 'camp-tiktok-002', name: 'TikTok - Video Views', type: 'video' }
      ],
      baseMetrics: {
        impressions: 80000,
        ctr: 1.5,
        cpc: 0.45,
        conversionRate: 0.015,
        videoCompletionRate: 0.35,
        engagementRate: 0.055
      }
    },
    'pinterest': {
      campaigns: [
        { id: 'camp-pinterest-001', name: 'Pinterest - Home Decor', type: 'shopping' },
        { id: 'camp-pinterest-002', name: 'Pinterest - Fashion', type: 'shopping' }
      ],
      baseMetrics: {
        impressions: 30000,
        ctr: 0.9,
        cpc: 0.65,
        conversionRate: 0.018,
        saveRate: 0.025
      }
    }
  };
  
  // Ensure campaigns exist
  const campaignsToCreate = [];
  for (const [platform, config] of Object.entries(platformTemplates)) {
    for (const camp of config.campaigns) {
      campaignsToCreate.push({
        id: camp.id,
        projectId: 'proj-seed-001', // Use existing project from seed
        platform: platform,
        externalId: `ext-${camp.id}`,
        name: camp.name,
        status: 'active',
        budget: 5000.00,
        startDate: daysAgo(120),
        endDate: daysAgo(-30),
        metadata: JSON.stringify({
          type: camp.type,
          objective: camp.type === 'search' ? 'conversions' : 
                     camp.type === 'shopping' ? 'sales' :
                     camp.type === 'leadgen' ? 'lead_generation' :
                     camp.type === 'video' ? 'video_views' : 'awareness'
        }),
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  }
  
  // Insert campaigns (ignore duplicates)
  for (const campaign of campaignsToCreate) {
    await knex('campaigns')
      .insert(campaign)
      .onConflict('id')
      .ignore();
  }
  console.log(`  Ensured ${campaignsToCreate.length} campaigns exist`);
  
  // Generate 90 days of metrics for each campaign
  const allMetrics = [];
  let totalDays = 0;
  
  for (const [platform, config] of Object.entries(platformTemplates)) {
    for (const camp of config.campaigns) {
      for (let day = 0; day < 90; day++) {
        const date = daysAgo(day);
        const dayOfWeek = new Date(date).getDay();
        const isWeekend = [0, 6].includes(dayOfWeek);
        
        // Day-of-week variance (weekdays higher for B2B, weekends higher for B2C)
        let dayMultiplier = 1.0;
        if (platform === 'linkedin-ads') {
          dayMultiplier = isWeekend ? 0.4 : 1.0; // Much lower on weekends for B2B
        } else if (['meta-ads', 'tiktok-ads', 'pinterest'].includes(platform)) {
          dayMultiplier = isWeekend ? 1.2 : 1.0; // Higher on weekends for consumer
        }
        
        // Weekly trend (slight growth over time)
        const weekNumber = Math.floor(day / 7);
        const trendMultiplier = 1 + (weekNumber * 0.02); // 2% growth per week
        
        // Calculate base metrics with variance
        const baseImpressions = config.baseMetrics.impressions * dayMultiplier * trendMultiplier;
        const impressions = Math.round(variance(baseImpressions, 0.25));
        
        const baseCtr = config.baseMetrics.ctr;
        const ctr = variance(baseCtr, 0.20);
        const clicks = Math.round(impressions * (ctr / 100));
        
        const baseCpc = config.baseMetrics.cpc;
        const cpc = variance(baseCpc, 0.15);
        const spend = clicks * cpc;
        
        const baseConversionRate = config.baseMetrics.conversionRate;
        const conversionRate = variance(baseConversionRate, 0.30);
        const conversions = Math.round(clicks * conversionRate);
        
        const cpa = conversions > 0 ? spend / conversions : 0;
        
        // Revenue (AOV varies by campaign type)
        const aov = camp.type === 'shopping' ? variance(120, 0.3) :
                    camp.type === 'leadgen' ? variance(250, 0.4) :
                    camp.type === 'search' ? variance(150, 0.3) :
                    variance(80, 0.4);
        const revenue = conversions * aov;
        const roas = spend > 0 ? revenue / spend : 0;
        
        // Platform-specific metadata
        let metadata = {
          platform,
          campaignType: camp.type,
          dayOfWeek,
          isWeekend,
          weekNumber
        };
        
        // Add search-specific metrics
        if (['google-ads', 'microsoft-ads'].includes(platform)) {
          const qualityScore = Math.round(variance(config.baseMetrics.qualityScore, 0.15));
          const avgPosition = variance(2.5, 0.4);
          const searchImpressionShare = variance(0.65, 0.20);
          
          metadata = {
            ...metadata,
            qualityScore,
            avgPosition: parseFloat(avgPosition.toFixed(2)),
            searchImpressionShare: parseFloat(searchImpressionShare.toFixed(3)),
            adGroups: [
              {
                name: 'Ad Group 1',
                impressions: Math.round(impressions * 0.6),
                clicks: Math.round(clicks * 0.6),
                conversions: Math.round(conversions * 0.65)
              },
              {
                name: 'Ad Group 2',
                impressions: Math.round(impressions * 0.4),
                clicks: Math.round(clicks * 0.4),
                conversions: Math.round(conversions * 0.35)
              }
            ],
            topKeywords: [
              {
                keyword: 'brand product',
                impressions: Math.round(impressions * 0.25),
                clicks: Math.round(clicks * 0.30),
                cpc: parseFloat((cpc * 0.8).toFixed(2)),
                qualityScore: Math.min(10, qualityScore + 2)
              },
              {
                keyword: 'buy product online',
                impressions: Math.round(impressions * 0.20),
                clicks: Math.round(clicks * 0.25),
                cpc: parseFloat((cpc * 1.1).toFixed(2)),
                qualityScore
              },
              {
                keyword: 'product reviews',
                impressions: Math.round(impressions * 0.15),
                clicks: Math.round(clicks * 0.15),
                cpc: parseFloat((cpc * 0.9).toFixed(2)),
                qualityScore: Math.max(1, qualityScore - 1)
              }
            ],
            searchQueries: Math.round(clicks * 0.7) // ~70% of clicks have query data
          };
        }
        
        // Add social-specific metrics
        if (['meta-ads', 'linkedin-ads', 'tiktok-ads', 'pinterest'].includes(platform)) {
          const engagementRate = config.baseMetrics.engagementRate || 0.025;
          const engagements = Math.round(impressions * engagementRate);
          const likes = Math.round(engagements * 0.50);
          const shares = Math.round(engagements * 0.15);
          const comments = Math.round(engagements * 0.10);
          const saves = Math.round(engagements * 0.25);
          
          metadata = {
            ...metadata,
            engagements,
            engagementRate: parseFloat((engagementRate * 100).toFixed(3)),
            likes,
            shares,
            comments,
            saves,
            reach: Math.round(impressions * variance(0.85, 0.10)),
            frequency: parseFloat(variance(1.5, 0.25).toFixed(2)),
            adSets: [
              {
                name: 'Ad Set 1 - Core Audience',
                impressions: Math.round(impressions * 0.55),
                clicks: Math.round(clicks * 0.60),
                spend: parseFloat((spend * 0.58).toFixed(2)),
                conversions: Math.round(conversions * 0.62)
              },
              {
                name: 'Ad Set 2 - Lookalike',
                impressions: Math.round(impressions * 0.45),
                clicks: Math.round(clicks * 0.40),
                spend: parseFloat((spend * 0.42).toFixed(2)),
                conversions: Math.round(conversions * 0.38)
              }
            ],
            audienceInsights: {
              age_25_34: variance(0.35, 0.20),
              age_35_44: variance(0.30, 0.20),
              age_45_54: variance(0.20, 0.20),
              male: variance(0.48, 0.15),
              female: variance(0.52, 0.15)
            }
          };
          
          // Add video metrics for video-capable platforms
          if (['meta-ads', 'tiktok-ads'].includes(platform)) {
            const videoViews = Math.round(impressions * variance(0.40, 0.25));
            const videoCompletionRate = config.baseMetrics.videoCompletionRate || 0.30;
            const videoCompletions = Math.round(videoViews * videoCompletionRate);
            
            metadata.video = {
              views: videoViews,
              completions: videoCompletions,
              completionRate: parseFloat((videoCompletionRate * 100).toFixed(2)),
              '3sViews': Math.round(videoViews * 0.85),
              '10sViews': Math.round(videoViews * 0.55),
              avgWatchTime: parseFloat(variance(12, 0.40).toFixed(1))
            };
          }
          
          // Pinterest-specific save rate
          if (platform === 'pinterest') {
            metadata.saveRate = parseFloat((config.baseMetrics.saveRate * 100).toFixed(3));
            metadata.closeups = Math.round(impressions * variance(0.08, 0.30));
          }
          
          // LinkedIn-specific lead metrics
          if (platform === 'linkedin-ads') {
            metadata.leads = conversions;
            metadata.leadFormOpens = Math.round(clicks * variance(0.40, 0.25));
            metadata.leadFormCompletions = conversions;
            metadata.costPerLead = parseFloat(cpa.toFixed(2));
          }
        }
        
        // Add metric record
        allMetrics.push({
          campaignId: camp.id,
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
          metadata: JSON.stringify(metadata),
          syncedAt: new Date().toISOString()
        });
        
        totalDays++;
      }
    }
  }
  
  // Insert all metrics in batches
  const batchSize = 500;
  for (let i = 0; i < allMetrics.length; i += batchSize) {
    const batch = allMetrics.slice(i, i + batchSize);
    await knex('metrics').insert(batch);
  }
  
  console.log(`✅ Seeded ${allMetrics.length} performance metrics records`);
  console.log(`   - ${Object.keys(platformTemplates).length} platforms`);
  console.log(`   - ${campaignsToCreate.length} campaigns`);
  console.log(`   - 90 days of data per campaign`);
  console.log(`   - Realistic metrics with variance and trends`);
  console.log(`   - Platform-specific metadata included`);
  console.log('');
  
  // Summary by platform
  for (const [platform, config] of Object.entries(platformTemplates)) {
    const campaignCount = config.campaigns.length;
    const recordCount = campaignCount * 90;
    console.log(`   ${platform}: ${campaignCount} campaigns × 90 days = ${recordCount} records`);
  }
};
