-- Ad Ops Command Center Database Schema
-- SQLite compatible

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  advertiser_id TEXT,
  dsp TEXT NOT NULL,
  lob TEXT,
  channel TEXT,
  funnel TEXT,
  market TEXT DEFAULT 'us',
  status TEXT DEFAULT 'draft',
  budget REAL,
  spent REAL DEFAULT 0,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Flights table
CREATE TABLE IF NOT EXISTS flights (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'scheduled',
  budget REAL,
  spent REAL DEFAULT 0,
  start_date DATE,
  end_date DATE,
  pacing_strategy TEXT DEFAULT 'even',
  bid_strategy TEXT,
  frequency_cap_daily INTEGER,
  frequency_cap_weekly INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
);

-- Creatives table
CREATE TABLE IF NOT EXISTS creatives (
  id TEXT PRIMARY KEY,
  campaign_id TEXT,
  flight_id TEXT,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  channel TEXT,
  format TEXT,
  size TEXT,
  duration INTEGER,
  file_path TEXT,
  status TEXT DEFAULT 'pending',
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
  FOREIGN KEY (flight_id) REFERENCES flights(id)
);

-- Daily performance metrics
CREATE TABLE IF NOT EXISTS daily_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id TEXT NOT NULL,
  flight_id TEXT,
  date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  spend REAL DEFAULT 0,
  viewability REAL,
  vcr REAL,
  ctr REAL,
  cpm REAL,
  cpa REAL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
  UNIQUE(campaign_id, date)
);

-- Agent activity log
CREATE TABLE IF NOT EXISTS agent_activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id TEXT NOT NULL,
  action TEXT NOT NULL,
  campaign_id TEXT,
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Workflow executions
CREATE TABLE IF NOT EXISTS workflow_runs (
  id TEXT PRIMARY KEY,
  workflow_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  params TEXT,
  result TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alerts
CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  severity TEXT DEFAULT 'info',
  campaign_id TEXT,
  message TEXT NOT NULL,
  acknowledged BOOLEAN DEFAULT 0,
  acknowledged_by TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_dsp ON campaigns(dsp);
CREATE INDEX IF NOT EXISTS idx_flights_campaign ON flights(campaign_id);
CREATE INDEX IF NOT EXISTS idx_creatives_campaign ON creatives(campaign_id);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_campaign ON daily_metrics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON daily_metrics(date);
CREATE INDEX IF NOT EXISTS idx_agent_activity_agent ON agent_activity(agent_id);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(type);
