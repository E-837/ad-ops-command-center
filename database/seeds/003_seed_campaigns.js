/**
 * Seed: LOB-specific sample campaigns
 */

exports.seed = async function(knex) {
  await knex('campaigns').del();

  const now = new Date().toISOString();

  const daysAgo = (days) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  };

  const daysFromNow = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  await knex('campaigns').insert([
    { id: 'camp-auto-dv360-001', projectId: 'proj-seed-001', platform: 'dv360', lob: 'auto', externalId: 'dv-auto-001', name: 'Auto SUV Launch - Programmatic Display', status: 'active', budget: 85000, startDate: daysAgo(35), endDate: daysFromNow(55), metadata: JSON.stringify({ type: 'display', objective: 'consideration', avgDealSize: 42000, conversionWindowDays: 45, complianceRequirements: ['disclaimer_required', 'financing_terms_required'], benchmarkCpcRange: [3.2, 4.8] }), syncedAt: now, createdAt: now, updatedAt: now },
    { id: 'camp-auto-meta-001', projectId: 'proj-seed-001', platform: 'meta-ads', lob: 'auto', externalId: 'fb-auto-001', name: 'Auto Model Awareness - Video', status: 'active', budget: 60000, startDate: daysAgo(28), endDate: daysFromNow(42), metadata: JSON.stringify({ type: 'video', objective: 'brand_awareness', avgDealSize: 39000, conversionWindowDays: 30, complianceRequirements: ['regional_offer_disclaimer'], benchmarkCpcRange: [3.0, 4.5] }), syncedAt: now, createdAt: now, updatedAt: now },
    { id: 'camp-auto-google-001', projectId: 'proj-seed-001', platform: 'google-ads', lob: 'auto', externalId: 'ggl-auto-001', name: 'Auto Dealer Search - High Intent', status: 'active', budget: 40000, startDate: daysAgo(22), endDate: daysFromNow(38), metadata: JSON.stringify({ type: 'search', objective: 'lead_generation', avgDealSize: 35000, conversionWindowDays: 28, complianceRequirements: ['apr_disclosure'], benchmarkCpcRange: [3.5, 5.0] }), syncedAt: now, createdAt: now, updatedAt: now },

    { id: 'camp-ins-google-001', projectId: 'proj-seed-002', platform: 'google-ads', lob: 'insurance', externalId: 'ggl-ins-001', name: 'Insurance Quotes - Search Acquisition', status: 'active', budget: 95000, startDate: daysAgo(40), endDate: daysFromNow(50), metadata: JSON.stringify({ type: 'search', objective: 'lead_generation', avgDealSize: 2400, conversionWindowDays: 60, complianceRequirements: ['state_filing_language', 'legal_disclaimer'], benchmarkCpcRange: [8.0, 12.0] }), syncedAt: now, createdAt: now, updatedAt: now },
    { id: 'camp-ins-meta-001', projectId: 'proj-seed-002', platform: 'meta-ads', lob: 'insurance', externalId: 'fb-ins-001', name: 'Life Insurance Lead Forms - Facebook', status: 'active', budget: 55000, startDate: daysAgo(25), endDate: daysFromNow(35), metadata: JSON.stringify({ type: 'social', objective: 'lead_generation', avgDealSize: 1800, conversionWindowDays: 45, complianceRequirements: ['regulated_ad_copy', 'privacy_disclosure'], benchmarkCpcRange: [8.5, 11.5] }), syncedAt: now, createdAt: now, updatedAt: now },
    { id: 'camp-ins-microsoft-001', projectId: 'proj-seed-002', platform: 'microsoft-ads', lob: 'insurance', externalId: 'ms-ins-001', name: 'Insurance Brand Defense - Bing', status: 'active', budget: 30000, startDate: daysAgo(18), endDate: daysFromNow(42), metadata: JSON.stringify({ type: 'search', objective: 'conversion', avgDealSize: 2200, conversionWindowDays: 50, complianceRequirements: ['state_compliance_review'], benchmarkCpcRange: [7.8, 10.8] }), syncedAt: now, createdAt: now, updatedAt: now },

    { id: 'camp-travel-dv360-001', projectId: 'proj-seed-003', platform: 'dv360', lob: 'travel', externalId: 'dv-travel-001', name: 'Summer Destinations - Display Prospecting', status: 'active', budget: 70000, startDate: daysAgo(30), endDate: daysFromNow(60), metadata: JSON.stringify({ type: 'display', objective: 'bookings', avgDealSize: 1400, conversionWindowDays: 21, complianceRequirements: ['fare_terms_disclosure'], benchmarkCpcRange: [1.8, 2.8], seasonalPeak: 'summer' }), syncedAt: now, createdAt: now, updatedAt: now },
    { id: 'camp-travel-meta-001', projectId: 'proj-seed-003', platform: 'meta-ads', lob: 'travel', externalId: 'ig-travel-001', name: 'Weekend Getaways - Instagram Reels', status: 'active', budget: 45000, startDate: daysAgo(20), endDate: daysFromNow(50), metadata: JSON.stringify({ type: 'video', objective: 'traffic', avgDealSize: 900, conversionWindowDays: 14, complianceRequirements: ['dynamic_pricing_disclaimer'], benchmarkCpcRange: [1.6, 2.6], seasonalPeak: 'spring_summer' }), syncedAt: now, createdAt: now, updatedAt: now },
    { id: 'camp-travel-tiktok-001', projectId: 'proj-seed-003', platform: 'tiktok-ads', lob: 'travel', externalId: 'tt-travel-001', name: 'Adventure Travel - TikTok Video', status: 'active', budget: 38000, startDate: daysAgo(15), endDate: daysFromNow(45), metadata: JSON.stringify({ type: 'social_video', objective: 'awareness', avgDealSize: 1100, conversionWindowDays: 18, complianceRequirements: ['travel_offer_disclaimer'], benchmarkCpcRange: [1.4, 2.4], seasonalPeak: 'summer_holiday' }), syncedAt: now, createdAt: now, updatedAt: now },

    { id: 'camp-fin-google-001', projectId: 'proj-seed-004', platform: 'google-ads', lob: 'finance', externalId: 'ggl-fin-001', name: 'Commercial Lending - Search', status: 'active', budget: 65000, startDate: daysAgo(32), endDate: daysFromNow(48), metadata: JSON.stringify({ type: 'search', objective: 'qualified_leads', avgDealSize: 75000, conversionWindowDays: 35, complianceRequirements: ['finra_review', 'apr_disclosure', 'risk_disclaimer'], benchmarkCpcRange: [6.5, 9.5] }), syncedAt: now, createdAt: now, updatedAt: now },
    { id: 'camp-fin-linkedin-001', projectId: 'proj-seed-004', platform: 'linkedin-ads', lob: 'finance', externalId: 'li-fin-001', name: 'Treasury Platform - LinkedIn Lead Gen', status: 'active', budget: 52000, startDate: daysAgo(21), endDate: daysFromNow(39), metadata: JSON.stringify({ type: 'b2b_social', objective: 'mql_generation', avgDealSize: 120000, conversionWindowDays: 42, complianceRequirements: ['compliance_approved_creatives', 'regulated_claim_review'], benchmarkCpcRange: [7.0, 10.5] }), syncedAt: now, createdAt: now, updatedAt: now },

    { id: 'camp-retail-google-001', projectId: 'proj-seed-005', platform: 'google-ads', lob: 'retail', externalId: 'ggl-ret-001', name: 'Retail Catalog - Google Shopping', status: 'active', budget: 80000, startDate: daysAgo(27), endDate: daysFromNow(63), metadata: JSON.stringify({ type: 'shopping', objective: 'online_sales', avgDealSize: 95, conversionWindowDays: 7, complianceRequirements: ['promo_terms_disclosure'], benchmarkCpcRange: [0.6, 1.3] }), syncedAt: now, createdAt: now, updatedAt: now },
    { id: 'camp-retail-meta-001', projectId: 'proj-seed-005', platform: 'meta-ads', lob: 'retail', externalId: 'fb-ret-001', name: 'Always-On Dynamic Product Ads', status: 'active', budget: 50000, startDate: daysAgo(14), endDate: daysFromNow(46), metadata: JSON.stringify({ type: 'social', objective: 'catalog_sales', avgDealSize: 82, conversionWindowDays: 5, complianceRequirements: ['promo_terms_disclosure'], benchmarkCpcRange: [0.5, 1.2] }), syncedAt: now, createdAt: now, updatedAt: now },
    { id: 'camp-retail-pinterest-001', projectId: 'proj-seed-005', platform: 'pinterest', lob: 'retail', externalId: 'pin-ret-001', name: 'Seasonal Retail Collections - Pinterest', status: 'active', budget: 26000, startDate: daysAgo(11), endDate: daysFromNow(34), metadata: JSON.stringify({ type: 'shopping', objective: 'ecommerce', avgDealSize: 88, conversionWindowDays: 10, complianceRequirements: ['promo_terms_disclosure'], benchmarkCpcRange: [0.7, 1.5] }), syncedAt: now, createdAt: now, updatedAt: now }
  ]);

  console.log('✅ Seeded 14 LOB-specific campaigns across 5 verticals');
};
