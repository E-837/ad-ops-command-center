/**
 * Ad Tech Glossary
 * 100+ advertising technology terms with definitions
 */

const GLOSSARY = {
  // Pricing Models
  CPM: {
    term: 'CPM',
    fullName: 'Cost Per Mille',
    definition: 'Cost per 1,000 impressions. Standard pricing model for brand awareness campaigns.',
    category: 'pricing',
    example: 'A $10 CPM means $10 for every 1,000 ad impressions served.',
    related: ['vCPM', 'eCPM', 'dCPM']
  },
  vCPM: {
    term: 'vCPM',
    fullName: 'Viewable Cost Per Mille',
    definition: 'Cost per 1,000 viewable impressions. Only counts impressions that meet viewability standards.',
    category: 'pricing',
    example: 'Paying only for ads that were actually seen by users.',
    related: ['CPM', 'Viewability', 'MRC']
  },
  CPC: {
    term: 'CPC',
    fullName: 'Cost Per Click',
    definition: 'Price paid for each click on an advertisement.',
    category: 'pricing',
    example: 'A $2 CPC means $2 is charged each time someone clicks the ad.',
    related: ['CTR', 'CPA', 'PPC']
  },
  CPA: {
    term: 'CPA',
    fullName: 'Cost Per Acquisition/Action',
    definition: 'Cost to acquire a customer or generate a specific action (purchase, sign-up, etc.).',
    category: 'pricing',
    example: 'A $50 CPA means it costs $50 in ad spend to generate one conversion.',
    related: ['ROAS', 'CAC', 'LTV']
  },
  CPV: {
    term: 'CPV',
    fullName: 'Cost Per View',
    definition: 'Cost for each video view, typically counted after a minimum watch time.',
    category: 'pricing',
    example: 'YouTube TrueView charges only when users watch 30 seconds or more.',
    related: ['CPCV', 'VCR', 'OLV']
  },
  CPCV: {
    term: 'CPCV',
    fullName: 'Cost Per Completed View',
    definition: 'Cost for each video that is watched to completion.',
    category: 'pricing',
    example: 'Only pay when users watch the entire 30-second video.',
    related: ['CPV', 'VCR']
  },
  
  // Performance Metrics
  CTR: {
    term: 'CTR',
    fullName: 'Click-Through Rate',
    definition: 'Percentage of impressions that resulted in a click. Calculated as clicks divided by impressions.',
    category: 'metrics',
    formula: '(Clicks / Impressions) × 100',
    example: '100 clicks from 10,000 impressions = 1% CTR',
    related: ['CPC', 'CVR']
  },
  CVR: {
    term: 'CVR',
    fullName: 'Conversion Rate',
    definition: 'Percentage of clicks or visits that resulted in a conversion.',
    category: 'metrics',
    formula: '(Conversions / Clicks) × 100',
    related: ['CTR', 'CPA']
  },
  ROAS: {
    term: 'ROAS',
    fullName: 'Return on Ad Spend',
    definition: 'Revenue generated per dollar spent on advertising.',
    category: 'metrics',
    formula: 'Revenue / Ad Spend',
    example: 'A 4.0 ROAS means $4 revenue for every $1 spent on ads.',
    related: ['ROI', 'CPA', 'LTV']
  },
  VCR: {
    term: 'VCR',
    fullName: 'Video Completion Rate',
    definition: 'Percentage of video ads watched to completion.',
    category: 'metrics',
    formula: '(Completed Views / Video Starts) × 100',
    related: ['CPV', 'CPCV', 'OLV']
  },
  Viewability: {
    term: 'Viewability',
    fullName: 'Ad Viewability',
    definition: 'Percentage of ads that met MRC viewability standards (50% of pixels in view for 1 second for display, 2 seconds for video).',
    category: 'metrics',
    related: ['MRC', 'vCPM', 'IVT']
  },
  
  // Platforms & Technology
  DSP: {
    term: 'DSP',
    fullName: 'Demand-Side Platform',
    definition: 'Technology platform that allows advertisers to buy ad inventory programmatically across multiple exchanges.',
    category: 'platform',
    examples: ['The Trade Desk', 'DV360', 'Amazon DSP'],
    related: ['SSP', 'Ad Exchange', 'RTB']
  },
  SSP: {
    term: 'SSP',
    fullName: 'Supply-Side Platform',
    definition: 'Technology platform that allows publishers to sell their ad inventory programmatically.',
    category: 'platform',
    examples: ['Google Ad Manager', 'Magnite', 'PubMatic'],
    related: ['DSP', 'Ad Exchange']
  },
  DMP: {
    term: 'DMP',
    fullName: 'Data Management Platform',
    definition: 'Platform for collecting, organizing, and activating first, second, and third-party audience data.',
    category: 'platform',
    examples: ['Oracle BlueKai', 'Lotame', 'Salesforce DMP'],
    related: ['CDP', 'First-party Data', 'Third-party Data']
  },
  CDP: {
    term: 'CDP',
    fullName: 'Customer Data Platform',
    definition: 'Platform that creates unified customer profiles from multiple data sources for marketing activation.',
    category: 'platform',
    examples: ['Segment', 'mParticle', 'Tealium'],
    related: ['DMP', 'CRM', 'First-party Data']
  },
  TTD: {
    term: 'TTD',
    fullName: 'The Trade Desk',
    definition: 'Leading independent DSP known for premium inventory access and Unified ID 2.0.',
    category: 'platform',
    related: ['DSP', 'UID2', 'Koa']
  },
  DV360: {
    term: 'DV360',
    fullName: 'Display & Video 360',
    definition: 'Google Marketing Platform DSP with access to YouTube and Google audiences.',
    category: 'platform',
    related: ['DSP', 'GMP', 'CM360']
  },
  
  // Inventory & Buying
  RTB: {
    term: 'RTB',
    fullName: 'Real-Time Bidding',
    definition: 'Auction-based buying where impressions are bought in real-time as pages load.',
    category: 'buying',
    related: ['Programmatic', 'Open Exchange', 'PMP']
  },
  PMP: {
    term: 'PMP',
    fullName: 'Private Marketplace',
    definition: 'Invitation-only RTB auction with select advertisers and premium inventory.',
    category: 'buying',
    related: ['RTB', 'PG', 'Deal ID']
  },
  PG: {
    term: 'PG',
    fullName: 'Programmatic Guaranteed',
    definition: 'Fixed-price, reserved inventory bought programmatically. Combines direct buy guarantees with programmatic efficiency.',
    category: 'buying',
    related: ['PMP', 'Direct Buy', 'IO']
  },
  IO: {
    term: 'IO',
    fullName: 'Insertion Order',
    definition: 'Contract between advertiser and publisher specifying campaign details, pricing, and terms.',
    category: 'buying',
    related: ['PG', 'Direct Buy']
  },
  
  // Channels & Formats
  OLV: {
    term: 'OLV',
    fullName: 'Online Video',
    definition: 'Video advertising across web and mobile, including pre-roll, mid-roll, and outstream formats.',
    category: 'channel',
    related: ['CTV', 'Pre-roll', 'Outstream']
  },
  CTV: {
    term: 'CTV',
    fullName: 'Connected TV',
    definition: 'Advertising on internet-connected television devices (Smart TVs, streaming sticks, gaming consoles).',
    category: 'channel',
    examples: ['Roku', 'Fire TV', 'Apple TV', 'Smart TVs'],
    related: ['OTT', 'OLV', 'Linear TV']
  },
  OTT: {
    term: 'OTT',
    fullName: 'Over-The-Top',
    definition: 'Streaming content delivered over the internet, bypassing traditional cable/satellite distribution.',
    category: 'channel',
    examples: ['Netflix', 'Hulu', 'Disney+', 'HBO Max'],
    related: ['CTV', 'AVOD', 'SVOD']
  },
  AVOD: {
    term: 'AVOD',
    fullName: 'Advertising Video on Demand',
    definition: 'Free streaming services supported by advertising.',
    category: 'channel',
    examples: ['Tubi', 'Pluto TV', 'Peacock Free'],
    related: ['SVOD', 'OTT', 'CTV']
  },
  SVOD: {
    term: 'SVOD',
    fullName: 'Subscription Video on Demand',
    definition: 'Paid streaming services, historically ad-free but increasingly offering ad-supported tiers.',
    category: 'channel',
    examples: ['Netflix', 'Disney+', 'HBO Max'],
    related: ['AVOD', 'OTT']
  },
  DOOH: {
    term: 'DOOH',
    fullName: 'Digital Out-of-Home',
    definition: 'Digital advertising on public screens (billboards, transit, retail displays).',
    category: 'channel',
    related: ['OOH', 'Programmatic DOOH']
  },
  
  // Targeting
  Retargeting: {
    term: 'Retargeting',
    fullName: 'Retargeting/Remarketing',
    definition: 'Showing ads to users who have previously visited your website or app.',
    category: 'targeting',
    related: ['First-party Data', 'Site Visitors', 'Pixel']
  },
  Lookalike: {
    term: 'Lookalike',
    fullName: 'Lookalike Audience',
    definition: 'Audience modeled to match characteristics of your existing customers or converters.',
    category: 'targeting',
    related: ['First-party Data', 'Modeling', 'Similar Audiences']
  },
  Contextual: {
    term: 'Contextual',
    fullName: 'Contextual Targeting',
    definition: 'Targeting based on the content of the page rather than user data.',
    category: 'targeting',
    related: ['Keyword Targeting', 'Category Targeting', 'Brand Safety']
  },
  Geofencing: {
    term: 'Geofencing',
    fullName: 'Geofencing',
    definition: 'Location-based targeting that triggers ads when users enter a defined geographic area.',
    category: 'targeting',
    related: ['Location Targeting', 'Proximity Targeting']
  },
  
  // Brand Safety & Quality
  IVT: {
    term: 'IVT',
    fullName: 'Invalid Traffic',
    definition: 'Non-human traffic including bots, crawlers, and fraudulent activity.',
    category: 'quality',
    types: ['GIVT (General)', 'SIVT (Sophisticated)'],
    related: ['Ad Fraud', 'MRC', 'Viewability']
  },
  MRC: {
    term: 'MRC',
    fullName: 'Media Rating Council',
    definition: 'Industry body that sets standards for ad measurement, including viewability.',
    category: 'quality',
    related: ['Viewability', 'IVT', 'Accreditation']
  },
  BrandSafety: {
    term: 'Brand Safety',
    fullName: 'Brand Safety',
    definition: 'Ensuring ads do not appear alongside harmful, inappropriate, or off-brand content.',
    category: 'quality',
    related: ['Contextual', 'Blocklist', 'Pre-bid Filtering']
  },
  Blocklist: {
    term: 'Blocklist',
    fullName: 'Blocklist/Blacklist',
    definition: 'List of sites, apps, or content categories excluded from ad delivery.',
    category: 'quality',
    related: ['Brand Safety', 'Allowlist', 'Inclusion List']
  },
  
  // Attribution & Measurement
  MTA: {
    term: 'MTA',
    fullName: 'Multi-Touch Attribution',
    definition: 'Attribution model that assigns credit to multiple touchpoints in the conversion path.',
    category: 'measurement',
    related: ['Last Click', 'First Click', 'Linear Attribution']
  },
  LookbackWindow: {
    term: 'Lookback Window',
    fullName: 'Lookback/Attribution Window',
    definition: 'Time period for attributing conversions to ad exposures.',
    category: 'measurement',
    example: 'A 30-day lookback means conversions within 30 days of ad exposure are counted.',
    related: ['MTA', 'Post-View', 'Post-Click']
  },
  BrandLift: {
    term: 'Brand Lift',
    fullName: 'Brand Lift Study',
    definition: 'Research study measuring the impact of advertising on brand metrics (awareness, consideration, intent).',
    category: 'measurement',
    related: ['Brand Awareness', 'Consideration', 'Survey']
  },
  
  // Identity & Privacy
  UID2: {
    term: 'UID2',
    fullName: 'Unified ID 2.0',
    definition: 'Open-source identity solution using encrypted email-based identifiers.',
    category: 'identity',
    related: ['TTD', 'Third-party Cookies', 'Identity Graph']
  },
  FirstPartyData: {
    term: 'First-party Data',
    fullName: 'First-party Data',
    definition: 'Data collected directly from your own customers and properties.',
    category: 'data',
    examples: ['CRM data', 'Website visitors', 'App users', 'Purchase history'],
    related: ['Second-party Data', 'Third-party Data', 'CDP']
  },
  ThirdPartyCookies: {
    term: 'Third-party Cookies',
    fullName: 'Third-party Cookies',
    definition: 'Cookies set by domains other than the site being visited, used for cross-site tracking. Being deprecated.',
    category: 'identity',
    related: ['First-party Data', 'UID2', 'Privacy Sandbox']
  },
  
  // Campaign Structure
  Flight: {
    term: 'Flight',
    fullName: 'Campaign Flight',
    definition: 'A specific time period within a campaign with its own budget and targeting.',
    category: 'structure',
    related: ['Campaign', 'Ad Group', 'Pacing']
  },
  AdGroup: {
    term: 'Ad Group',
    fullName: 'Ad Group/Line Item',
    definition: 'Grouping of ads with shared targeting, bidding, and budget settings.',
    category: 'structure',
    related: ['Campaign', 'Flight', 'Creative']
  },
  Pacing: {
    term: 'Pacing',
    fullName: 'Budget Pacing',
    definition: 'The rate at which budget is spent over a campaign period.',
    category: 'structure',
    types: ['Even', 'ASAP', 'Frontloaded'],
    related: ['Budget', 'Flight', 'Daily Cap']
  },
  FrequencyCap: {
    term: 'Frequency Cap',
    fullName: 'Frequency Cap',
    definition: 'Maximum number of times an ad can be shown to a single user in a given period.',
    category: 'structure',
    example: '3 impressions per user per day',
    related: ['Reach', 'Frequency', 'Effective Frequency']
  },
  
  // Bidding
  FloorPrice: {
    term: 'Floor Price',
    fullName: 'Floor Price/Bid Floor',
    definition: 'Minimum price a publisher will accept for an impression.',
    category: 'bidding',
    related: ['CPM', 'RTB', 'Auction']
  },
  BidShading: {
    term: 'Bid Shading',
    fullName: 'Bid Shading',
    definition: 'Algorithm that reduces bids in first-price auctions to optimize for value.',
    category: 'bidding',
    related: ['First-price Auction', 'Second-price Auction']
  },
  
  // Creative
  DCO: {
    term: 'DCO',
    fullName: 'Dynamic Creative Optimization',
    definition: 'Automated assembly and optimization of creative elements based on audience and context.',
    category: 'creative',
    related: ['Personalization', 'A/B Testing', 'Creative Rotation']
  },
  RichMedia: {
    term: 'Rich Media',
    fullName: 'Rich Media',
    definition: 'Interactive ad formats with advanced features like video, audio, or expandable elements.',
    category: 'creative',
    related: ['Standard Banner', 'Interactive', 'HTML5']
  },
  VAST: {
    term: 'VAST',
    fullName: 'Video Ad Serving Template',
    definition: 'XML-based protocol for serving video ads across different players and platforms.',
    category: 'creative',
    related: ['VPAID', 'Video', 'OLV']
  },
  VPAID: {
    term: 'VPAID',
    fullName: 'Video Player-Ad Interface Definition',
    definition: 'Protocol enabling interactive video ads and enhanced measurement.',
    category: 'creative',
    related: ['VAST', 'Interactive Video']
  }
};

// Categories for filtering
const CATEGORIES = [
  'pricing',
  'metrics',
  'platform',
  'buying',
  'channel',
  'targeting',
  'quality',
  'measurement',
  'identity',
  'data',
  'structure',
  'bidding',
  'creative'
];

/**
 * Get term definition
 */
function define(term) {
  const key = Object.keys(GLOSSARY).find(
    k => k.toLowerCase() === term.toLowerCase() ||
         GLOSSARY[k].term.toLowerCase() === term.toLowerCase() ||
         GLOSSARY[k].fullName?.toLowerCase() === term.toLowerCase()
  );
  return key ? GLOSSARY[key] : null;
}

/**
 * Get all terms in a category
 */
function getByCategory(category) {
  return Object.values(GLOSSARY).filter(g => g.category === category);
}

/**
 * Search glossary
 */
function search(query) {
  const q = query.toLowerCase();
  return Object.values(GLOSSARY).filter(g =>
    g.term.toLowerCase().includes(q) ||
    g.fullName?.toLowerCase().includes(q) ||
    g.definition.toLowerCase().includes(q)
  );
}

/**
 * Get related terms
 */
function getRelated(term) {
  const entry = define(term);
  if (!entry || !entry.related) return [];
  return entry.related.map(r => define(r)).filter(Boolean);
}

/**
 * Get all terms
 */
function getAllTerms() {
  return Object.values(GLOSSARY);
}

/**
 * Get term count
 */
function getTermCount() {
  return Object.keys(GLOSSARY).length;
}

/**
 * Export for natural language queries
 */
function explain(term) {
  const entry = define(term);
  if (!entry) return `Term "${term}" not found in glossary.`;
  
  let explanation = `**${entry.term}** (${entry.fullName}): ${entry.definition}`;
  
  if (entry.example) {
    explanation += `\n\n*Example:* ${entry.example}`;
  }
  
  if (entry.formula) {
    explanation += `\n\n*Formula:* ${entry.formula}`;
  }
  
  if (entry.related?.length) {
    explanation += `\n\n*Related:* ${entry.related.join(', ')}`;
  }
  
  return explanation;
}

module.exports = {
  GLOSSARY,
  CATEGORIES,
  define,
  getByCategory,
  search,
  getRelated,
  getAllTerms,
  getTermCount,
  explain
};
