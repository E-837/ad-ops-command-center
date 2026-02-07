/**
 * Ad Tech Benchmarks
 * Industry standard performance metrics by channel, funnel, and LOB
 */

// CPM Benchmarks (Cost Per Mille) in USD
const CPM_BENCHMARKS = {
  // By Channel
  display: {
    awareness: { min: 2.00, target: 4.50, max: 8.00 },
    consideration: { min: 3.00, target: 6.00, max: 10.00 },
    conversion: { min: 5.00, target: 10.00, max: 18.00 }
  },
  olv: {
    awareness: { min: 8.00, target: 15.00, max: 25.00 },
    consideration: { min: 12.00, target: 20.00, max: 35.00 },
    conversion: { min: 15.00, target: 28.00, max: 45.00 }
  },
  ctv: {
    awareness: { min: 20.00, target: 35.00, max: 55.00 },
    consideration: { min: 25.00, target: 42.00, max: 65.00 },
    conversion: { min: 30.00, target: 50.00, max: 80.00 }
  },
  audio: {
    awareness: { min: 6.00, target: 12.00, max: 20.00 },
    consideration: { min: 8.00, target: 15.00, max: 25.00 },
    conversion: { min: 10.00, target: 18.00, max: 30.00 }
  },
  'demand-gen': {
    awareness: { min: 10.00, target: 18.00, max: 30.00 },
    consideration: { min: 15.00, target: 25.00, max: 40.00 },
    conversion: { min: 20.00, target: 35.00, max: 55.00 }
  }
};

// CTR Benchmarks (Click-Through Rate) as percentages
const CTR_BENCHMARKS = {
  display: {
    awareness: { min: 0.05, target: 0.10, max: 0.20 },
    consideration: { min: 0.08, target: 0.15, max: 0.30 },
    conversion: { min: 0.12, target: 0.25, max: 0.50 }
  },
  olv: {
    awareness: { min: 0.10, target: 0.20, max: 0.35 },
    consideration: { min: 0.15, target: 0.30, max: 0.50 },
    conversion: { min: 0.25, target: 0.45, max: 0.75 }
  },
  ctv: {
    awareness: { min: 0.02, target: 0.05, max: 0.10 },
    consideration: { min: 0.03, target: 0.08, max: 0.15 },
    conversion: { min: 0.05, target: 0.12, max: 0.25 }
  },
  audio: {
    awareness: { min: 0.15, target: 0.25, max: 0.40 },
    consideration: { min: 0.20, target: 0.35, max: 0.55 },
    conversion: { min: 0.30, target: 0.50, max: 0.80 }
  },
  'demand-gen': {
    awareness: { min: 0.50, target: 1.00, max: 2.00 },
    consideration: { min: 0.80, target: 1.50, max: 3.00 },
    conversion: { min: 1.20, target: 2.50, max: 5.00 }
  }
};

// CPA Benchmarks (Cost Per Acquisition) in USD
const CPA_BENCHMARKS = {
  // By LOB (product category)
  mobile: {
    awareness: { min: 50, target: 100, max: 200 },
    consideration: { min: 30, target: 60, max: 120 },
    conversion: { min: 15, target: 35, max: 80 }
  },
  wearables: {
    awareness: { min: 25, target: 50, max: 100 },
    consideration: { min: 15, target: 35, max: 70 },
    conversion: { min: 8, target: 20, max: 45 }
  },
  home: {
    awareness: { min: 75, target: 150, max: 300 },
    consideration: { min: 50, target: 100, max: 200 },
    conversion: { min: 25, target: 60, max: 130 }
  },
  education: {
    awareness: { min: 35, target: 70, max: 140 },
    consideration: { min: 20, target: 45, max: 90 },
    conversion: { min: 10, target: 25, max: 55 }
  },
  business: {
    awareness: { min: 100, target: 200, max: 400 },
    consideration: { min: 75, target: 150, max: 300 },
    conversion: { min: 50, target: 100, max: 200 }
  }
};

// ROAS Benchmarks (Return on Ad Spend)
const ROAS_BENCHMARKS = {
  mobile: { min: 2.0, target: 4.0, excellent: 6.0 },
  wearables: { min: 2.5, target: 4.5, excellent: 7.0 },
  home: { min: 1.5, target: 3.0, excellent: 5.0 },
  education: { min: 2.0, target: 3.5, excellent: 5.5 },
  business: { min: 1.2, target: 2.5, excellent: 4.0 }
};

// Viewability Benchmarks
const VIEWABILITY_BENCHMARKS = {
  display: { min: 50, target: 70, excellent: 85 },
  olv: { min: 60, target: 75, excellent: 90 },
  ctv: { min: 90, target: 95, excellent: 98 },
  audio: { min: 80, target: 90, excellent: 95 }
};

// VCR Benchmarks (Video Completion Rate) as percentages
const VCR_BENCHMARKS = {
  olv: {
    '6s': { min: 85, target: 92, excellent: 97 },
    '15s': { min: 70, target: 82, excellent: 90 },
    '30s': { min: 55, target: 70, excellent: 80 }
  },
  ctv: {
    '15s': { min: 90, target: 95, excellent: 98 },
    '30s': { min: 85, target: 92, excellent: 96 }
  }
};

// Pacing Thresholds
const PACING_THRESHOLDS = {
  behind: {
    warning: -10, // 10% behind
    critical: -20 // 20% behind
  },
  ahead: {
    warning: 15, // 15% ahead
    critical: 30 // 30% ahead
  }
};

/**
 * Get CPM benchmark for channel/funnel
 */
function getCPMBenchmark(channel, funnel) {
  const channelData = CPM_BENCHMARKS[channel];
  if (!channelData) return null;
  return channelData[funnel] || channelData.awareness;
}

/**
 * Get CTR benchmark for channel/funnel
 */
function getCTRBenchmark(channel, funnel) {
  const channelData = CTR_BENCHMARKS[channel];
  if (!channelData) return null;
  return channelData[funnel] || channelData.awareness;
}

/**
 * Get CPA benchmark for LOB/funnel
 */
function getCPABenchmark(lob, funnel) {
  const lobData = CPA_BENCHMARKS[lob];
  if (!lobData) return null;
  return lobData[funnel] || lobData.conversion;
}

/**
 * Get ROAS benchmark for LOB
 */
function getROASBenchmark(lob) {
  return ROAS_BENCHMARKS[lob] || ROAS_BENCHMARKS.mobile;
}

/**
 * Get viewability benchmark for channel
 */
function getViewabilityBenchmark(channel) {
  return VIEWABILITY_BENCHMARKS[channel] || VIEWABILITY_BENCHMARKS.display;
}

/**
 * Get VCR benchmark for channel/duration
 */
function getVCRBenchmark(channel, duration) {
  const channelData = VCR_BENCHMARKS[channel];
  if (!channelData) return null;
  return channelData[duration] || Object.values(channelData)[0];
}

/**
 * Evaluate metric against benchmark
 */
function evaluateMetric(value, benchmark) {
  if (!benchmark) return { status: 'unknown', percentile: 0 };
  
  if (value >= benchmark.excellent || value >= benchmark.max) {
    return { status: 'excellent', percentile: 95 };
  } else if (value >= benchmark.target) {
    return { status: 'good', percentile: 75 };
  } else if (value >= benchmark.min) {
    return { status: 'acceptable', percentile: 50 };
  } else {
    return { status: 'below', percentile: 25 };
  }
}

/**
 * Evaluate CPM (lower is better for cost metrics)
 */
function evaluateCPM(value, channel, funnel) {
  const benchmark = getCPMBenchmark(channel, funnel);
  if (!benchmark) return { status: 'unknown', percentile: 0 };
  
  if (value <= benchmark.min) {
    return { status: 'excellent', percentile: 95 };
  } else if (value <= benchmark.target) {
    return { status: 'good', percentile: 75 };
  } else if (value <= benchmark.max) {
    return { status: 'acceptable', percentile: 50 };
  } else {
    return { status: 'above_benchmark', percentile: 25 };
  }
}

/**
 * Evaluate pacing status
 */
function evaluatePacing(actualSpend, expectedSpend) {
  if (expectedSpend === 0) return { status: 'not_started', variance: 0 };
  
  const variance = ((actualSpend - expectedSpend) / expectedSpend) * 100;
  
  if (variance < PACING_THRESHOLDS.behind.critical) {
    return { status: 'critical_behind', variance };
  } else if (variance < PACING_THRESHOLDS.behind.warning) {
    return { status: 'behind', variance };
  } else if (variance > PACING_THRESHOLDS.ahead.critical) {
    return { status: 'critical_ahead', variance };
  } else if (variance > PACING_THRESHOLDS.ahead.warning) {
    return { status: 'ahead', variance };
  } else {
    return { status: 'on_pace', variance };
  }
}

/**
 * Get all benchmarks for a campaign configuration
 */
function getCampaignBenchmarks(lob, channel, funnel) {
  return {
    cpm: getCPMBenchmark(channel, funnel),
    ctr: getCTRBenchmark(channel, funnel),
    cpa: getCPABenchmark(lob, funnel),
    roas: getROASBenchmark(lob),
    viewability: getViewabilityBenchmark(channel),
    pacing: PACING_THRESHOLDS
  };
}

/**
 * Generate benchmark report for campaign
 */
function generateBenchmarkReport(metrics, lob, channel, funnel) {
  const benchmarks = getCampaignBenchmarks(lob, channel, funnel);
  
  return {
    cpm: {
      actual: metrics.cpm,
      benchmark: benchmarks.cpm,
      evaluation: evaluateCPM(metrics.cpm, channel, funnel)
    },
    ctr: {
      actual: metrics.ctr,
      benchmark: benchmarks.ctr,
      evaluation: evaluateMetric(metrics.ctr, benchmarks.ctr)
    },
    viewability: {
      actual: metrics.viewability,
      benchmark: benchmarks.viewability,
      evaluation: evaluateMetric(metrics.viewability, benchmarks.viewability)
    },
    roas: metrics.roas ? {
      actual: metrics.roas,
      benchmark: benchmarks.roas,
      evaluation: evaluateMetric(metrics.roas, benchmarks.roas)
    } : null
  };
}

module.exports = {
  CPM_BENCHMARKS,
  CTR_BENCHMARKS,
  CPA_BENCHMARKS,
  ROAS_BENCHMARKS,
  VIEWABILITY_BENCHMARKS,
  VCR_BENCHMARKS,
  PACING_THRESHOLDS,
  getCPMBenchmark,
  getCTRBenchmark,
  getCPABenchmark,
  getROASBenchmark,
  getViewabilityBenchmark,
  getVCRBenchmark,
  evaluateMetric,
  evaluateCPM,
  evaluatePacing,
  getCampaignBenchmarks,
  generateBenchmarkReport
};
