/**
 * Ad Ops Business Rules
 * Constraints, policies, and validation rules for advertising operations
 */

const { isChannelAvailable } = require('./taxonomy');
const { PACING_THRESHOLDS } = require('./benchmarks');

// Budget Rules
const BUDGET_RULES = {
  // Minimum daily budgets by DSP
  minDailyBudget: {
    ttd: 50,
    dv360: 25,
    'amazon-dsp': 100
  },
  
  // Minimum campaign budgets
  minCampaignBudget: {
    ttd: 10000,
    dv360: 5000,
    'amazon-dsp': 15000
  },
  
  // Maximum single-day spend cap (% of total budget)
  maxDailySpendPercent: 15,
  
  // Budget allocation limits
  maxChannelAllocation: 70, // No single channel can exceed 70% of budget
  minChannelAllocation: 5   // Minimum 5% if channel is activated
};

// Pacing Rules
const PACING_RULES = {
  // Alert thresholds
  behind: {
    warning: -10,   // 10% behind target
    critical: -20,  // 20% behind - requires action
    severe: -30     // 30% behind - escalate immediately
  },
  
  ahead: {
    warning: 15,    // 15% ahead
    critical: 30,   // 30% ahead - risk of early exhaustion
    severe: 50      // 50% ahead - pause recommended
  },
  
  // Minimum days to evaluate pacing (ignore first few days)
  minDaysForPacing: 3,
  
  // Pacing strategies
  strategies: {
    even: 'Spend evenly across campaign duration',
    asap: 'Spend as quickly as possible',
    frontloaded: 'Spend more in first half of campaign',
    backloaded: 'Spend more in second half'
  }
};

// Viewability Rules
const VIEWABILITY_RULES = {
  // Minimum acceptable viewability by channel
  minimums: {
    display: 50,
    olv: 60,
    ctv: 90,
    audio: 80,
    'demand-gen': 70
  },
  
  // Target viewability (for optimization)
  targets: {
    display: 70,
    olv: 75,
    ctv: 95,
    audio: 90,
    'demand-gen': 85
  }
};

// Brand Safety Rules
const BRAND_SAFETY_RULES = {
  // Required pre-bid filtering
  requiredFilters: [
    'fraud',
    'brand_safety',
    'viewability'
  ],
  
  // Default blocked categories
  defaultBlockedCategories: [
    'adult',
    'gambling',
    'weapons',
    'drugs',
    'tobacco',
    'hate_speech',
    'violence',
    'terrorism'
  ],
  
  // IVT (Invalid Traffic) thresholds
  ivt: {
    maxAcceptable: 5,      // Max 5% IVT
    alertThreshold: 3,     // Alert at 3%
    blockThreshold: 10     // Block source at 10%
  }
};

// Frequency Cap Rules
const FREQUENCY_RULES = {
  // Recommended frequency caps by funnel stage
  recommended: {
    awareness: { daily: 3, weekly: 10, monthly: 30 },
    consideration: { daily: 4, weekly: 15, monthly: 45 },
    conversion: { daily: 5, weekly: 20, monthly: 60 }
  },
  
  // Maximum allowed
  maximums: {
    daily: 10,
    weekly: 35,
    monthly: 100
  }
};

// Channel-Specific Rules
const CHANNEL_RULES = {
  // Demand Gen only on DV360
  'demand-gen': {
    allowedDSPs: ['dv360'],
    rule: 'Demand Gen channel is exclusively available on DV360 (Google Ads inventory)'
  },
  
  // CTV requirements
  ctv: {
    minVideoDuration: 15,
    recommendedDuration: 30,
    requiredFormat: 'mp4',
    maxFileSize: 500 // MB
  },
  
  // OLV requirements
  olv: {
    minDuration: 6,
    maxDuration: 120,
    recommendedDuration: 15,
    requiredFormats: ['mp4', 'webm']
  },
  
  // Audio requirements
  audio: {
    minDuration: 15,
    maxDuration: 60,
    recommendedDuration: 30,
    requiredFormat: 'mp3'
  }
};

// Approval Rules
const APPROVAL_RULES = {
  // Thresholds requiring additional approval
  budgetApprovalThresholds: [
    { limit: 50000, approver: 'manager' },
    { limit: 250000, approver: 'director' },
    { limit: 1000000, approver: 'vp' }
  ],
  
  // Campaigns requiring legal review
  legalReviewRequired: [
    'comparative_claims',
    'price_claims',
    'health_claims',
    'financial_claims',
    'sweepstakes'
  ]
};

/**
 * Validate campaign configuration
 */
function validateCampaign(campaign) {
  const issues = [];
  const warnings = [];
  
  // Check budget minimums
  const minBudget = BUDGET_RULES.minCampaignBudget[campaign.dsp] || 5000;
  if (campaign.budget < minBudget) {
    issues.push(`Budget $${campaign.budget} is below minimum $${minBudget} for ${campaign.dsp}`);
  }
  
  // Check channel availability
  if (!isChannelAvailable(campaign.channel, campaign.dsp)) {
    issues.push(`${campaign.channel} is not available on ${campaign.dsp}`);
  }
  
  // Special rule: Demand Gen only on DV360
  if (campaign.channel === 'demand-gen' && campaign.dsp !== 'dv360') {
    issues.push('Demand Gen channel is only available on DV360');
  }
  
  // Check frequency caps
  const maxDaily = FREQUENCY_RULES.maximums.daily;
  if (campaign.frequencyCap?.daily > maxDaily) {
    warnings.push(`Daily frequency cap ${campaign.frequencyCap.daily} exceeds recommended maximum of ${maxDaily}`);
  }
  
  // Check budget approval requirements
  const approvalNeeded = APPROVAL_RULES.budgetApprovalThresholds
    .filter(t => campaign.budget >= t.limit)
    .pop();
  if (approvalNeeded) {
    warnings.push(`Budget requires approval from ${approvalNeeded.approver}`);
  }
  
  return {
    valid: issues.length === 0,
    issues,
    warnings
  };
}

/**
 * Validate flight configuration
 */
function validateFlight(flight) {
  const issues = [];
  const warnings = [];
  
  // Check dates
  const startDate = new Date(flight.startDate);
  const endDate = new Date(flight.endDate);
  const today = new Date();
  
  if (startDate < today && !flight.isExisting) {
    issues.push('Start date cannot be in the past');
  }
  
  if (endDate <= startDate) {
    issues.push('End date must be after start date');
  }
  
  // Check minimum flight duration
  const duration = (endDate - startDate) / (1000 * 60 * 60 * 24);
  if (duration < 7) {
    warnings.push('Flights shorter than 7 days may not have sufficient data for optimization');
  }
  
  // Check daily budget
  const minDaily = BUDGET_RULES.minDailyBudget[flight.dsp] || 25;
  const dailyBudget = flight.budget / duration;
  if (dailyBudget < minDaily) {
    issues.push(`Daily budget $${dailyBudget.toFixed(2)} is below minimum $${minDaily}`);
  }
  
  return {
    valid: issues.length === 0,
    issues,
    warnings
  };
}

/**
 * Validate creative
 */
function validateCreative(creative, channel) {
  const issues = [];
  const warnings = [];
  
  const rules = CHANNEL_RULES[channel];
  if (!rules) {
    return { valid: true, issues, warnings };
  }
  
  // Video duration checks
  if (creative.duration) {
    if (rules.minDuration && creative.duration < rules.minDuration) {
      issues.push(`Duration ${creative.duration}s is below minimum ${rules.minDuration}s`);
    }
    if (rules.maxDuration && creative.duration > rules.maxDuration) {
      issues.push(`Duration ${creative.duration}s exceeds maximum ${rules.maxDuration}s`);
    }
    if (rules.recommendedDuration && creative.duration !== rules.recommendedDuration) {
      warnings.push(`Recommended duration is ${rules.recommendedDuration}s`);
    }
  }
  
  // File size checks
  if (rules.maxFileSize && creative.fileSize > rules.maxFileSize * 1024 * 1024) {
    issues.push(`File size exceeds ${rules.maxFileSize}MB limit`);
  }
  
  // Format checks
  if (rules.requiredFormat && creative.format !== rules.requiredFormat) {
    issues.push(`Format must be ${rules.requiredFormat}, got ${creative.format}`);
  }
  if (rules.requiredFormats && !rules.requiredFormats.includes(creative.format)) {
    issues.push(`Format must be one of: ${rules.requiredFormats.join(', ')}`);
  }
  
  return {
    valid: issues.length === 0,
    issues,
    warnings
  };
}

/**
 * Check pacing status and get recommendations
 */
function checkPacing(actualSpend, expectedSpend, daysElapsed, totalDays) {
  const result = {
    status: 'on_pace',
    variance: 0,
    action: null,
    severity: 'info'
  };
  
  if (daysElapsed < PACING_RULES.minDaysForPacing) {
    result.status = 'too_early';
    result.action = 'Wait for more data before adjusting';
    return result;
  }
  
  if (expectedSpend === 0) {
    result.status = 'not_started';
    return result;
  }
  
  const variance = ((actualSpend - expectedSpend) / expectedSpend) * 100;
  result.variance = variance;
  
  // Behind pacing
  if (variance < PACING_RULES.behind.severe) {
    result.status = 'severe_behind';
    result.severity = 'critical';
    result.action = 'Immediate escalation required. Consider: increase bids 30-50%, expand targeting, add inventory sources.';
  } else if (variance < PACING_RULES.behind.critical) {
    result.status = 'critical_behind';
    result.severity = 'warning';
    result.action = 'Increase bids 15-20%, broaden targeting, review frequency caps.';
  } else if (variance < PACING_RULES.behind.warning) {
    result.status = 'behind';
    result.severity = 'info';
    result.action = 'Monitor closely. Consider modest bid increases.';
  }
  // Ahead pacing
  else if (variance > PACING_RULES.ahead.severe) {
    result.status = 'severe_ahead';
    result.severity = 'critical';
    result.action = 'Pause or reduce bids immediately to prevent early budget exhaustion.';
  } else if (variance > PACING_RULES.ahead.critical) {
    result.status = 'critical_ahead';
    result.severity = 'warning';
    result.action = 'Reduce bids 15-20%, tighten frequency caps.';
  } else if (variance > PACING_RULES.ahead.warning) {
    result.status = 'ahead';
    result.severity = 'info';
    result.action = 'On track but monitor for early exhaustion.';
  }
  
  return result;
}

/**
 * Check viewability against rules
 */
function checkViewability(viewabilityRate, channel) {
  const minimum = VIEWABILITY_RULES.minimums[channel] || 50;
  const target = VIEWABILITY_RULES.targets[channel] || 70;
  
  if (viewabilityRate < minimum) {
    return {
      status: 'failing',
      action: `Viewability ${viewabilityRate}% is below minimum ${minimum}%. Review inventory sources and add pre-bid viewability filters.`,
      severity: 'critical'
    };
  } else if (viewabilityRate < target) {
    return {
      status: 'below_target',
      action: `Viewability ${viewabilityRate}% is below target ${target}%. Consider premium inventory or stricter filtering.`,
      severity: 'warning'
    };
  }
  
  return {
    status: 'passing',
    severity: 'info'
  };
}

/**
 * Check IVT (Invalid Traffic) against rules
 */
function checkIVT(ivtRate) {
  if (ivtRate >= BRAND_SAFETY_RULES.ivt.blockThreshold) {
    return {
      status: 'critical',
      action: `IVT rate ${ivtRate}% exceeds block threshold. Block this inventory source.`,
      severity: 'critical'
    };
  } else if (ivtRate >= BRAND_SAFETY_RULES.ivt.maxAcceptable) {
    return {
      status: 'failing',
      action: `IVT rate ${ivtRate}% exceeds acceptable limit. Review and consider blocking.`,
      severity: 'warning'
    };
  } else if (ivtRate >= BRAND_SAFETY_RULES.ivt.alertThreshold) {
    return {
      status: 'elevated',
      action: `IVT rate ${ivtRate}% is elevated. Monitor closely.`,
      severity: 'info'
    };
  }
  
  return {
    status: 'normal',
    severity: 'info'
  };
}

/**
 * Get recommended frequency cap
 */
function getRecommendedFrequencyCap(funnel) {
  return FREQUENCY_RULES.recommended[funnel] || FREQUENCY_RULES.recommended.awareness;
}

/**
 * Get all rules for reference
 */
function getAllRules() {
  return {
    budget: BUDGET_RULES,
    pacing: PACING_RULES,
    viewability: VIEWABILITY_RULES,
    brandSafety: BRAND_SAFETY_RULES,
    frequency: FREQUENCY_RULES,
    channels: CHANNEL_RULES,
    approval: APPROVAL_RULES
  };
}

module.exports = {
  BUDGET_RULES,
  PACING_RULES,
  VIEWABILITY_RULES,
  BRAND_SAFETY_RULES,
  FREQUENCY_RULES,
  CHANNEL_RULES,
  APPROVAL_RULES,
  validateCampaign,
  validateFlight,
  validateCreative,
  checkPacing,
  checkViewability,
  checkIVT,
  getRecommendedFrequencyCap,
  getAllRules
};
