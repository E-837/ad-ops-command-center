/**
 * Reports Routes
 * Template library, generation, schedules, and history
 */

const express = require('express');
const router = express.Router();

const templates = [
  {
    id: 'tmpl-performance',
    name: 'Performance Overview',
    description: 'Spend, CTR, CPC, conversions, and ROAS by day and platform.',
    type: 'performance',
    metrics: ['impressions', 'clicks', 'spend', 'conversions', 'roas'],
    dimensions: ['date', 'platform', 'campaign'],
    defaultDateRangeDays: 30,
  },
  {
    id: 'tmpl-pacing',
    name: 'Budget Pacing Watch',
    description: 'Pacing variance and burn-rate trends for active campaigns.',
    type: 'pacing',
    metrics: ['budget', 'spend', 'pacingVariance'],
    dimensions: ['campaign', 'date', 'platform'],
    defaultDateRangeDays: 14,
  },
  {
    id: 'tmpl-exec',
    name: 'Executive Summary',
    description: 'Topline KPIs and anomalies for stakeholder reporting.',
    type: 'executive',
    metrics: ['spend', 'revenue', 'roas', 'cpa'],
    dimensions: ['platform', 'project'],
    defaultDateRangeDays: 30,
  },
];

let schedules = [
  {
    id: 'sched-1',
    templateId: 'tmpl-performance',
    templateName: 'Performance Overview',
    frequency: 'weekly',
    nextRunAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(),
    recipients: ['ops@example.com'],
    active: true,
  },
];

let history = [
  {
    id: 'rep-1',
    name: 'Performance Overview - Last 30 days',
    type: 'performance',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    status: 'ready',
    downloadUrl: '/api/reports/download/rep-1',
  },
];

function filterHistory(items, query) {
  return items.filter((item) => {
    if (query.type && item.type !== query.type) return false;
    if (query.startDate && new Date(item.createdAt) < new Date(query.startDate)) return false;
    if (query.endDate && new Date(item.createdAt) > new Date(query.endDate)) return false;
    return true;
  });
}

router.get('/', (req, res) => {
  res.json({
    templates,
    scheduled: schedules,
    history: filterHistory(history, req.query),
  });
});

router.get('/templates', (req, res) => {
  res.json(templates);
});

router.get('/schedules', (req, res) => {
  res.json(schedules);
});

router.post('/schedules', (req, res) => {
  const template = templates.find((t) => t.id === req.body.templateId);
  if (!template) return res.status(400).json({ error: 'Unknown templateId' });

  const schedule = {
    id: `sched-${Date.now()}`,
    templateId: template.id,
    templateName: template.name,
    frequency: req.body.frequency || 'weekly',
    nextRunAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
    recipients: Array.isArray(req.body.recipients) ? req.body.recipients : [],
    active: true,
  };
  schedules = [schedule, ...schedules];
  res.json(schedule);
});

router.get('/history', (req, res) => {
  res.json(filterHistory(history, req.query));
});

router.post('/generate', (req, res) => {
  const template = templates.find((t) => t.id === req.body.templateId);
  if (!template) return res.status(400).json({ error: 'Unknown templateId' });

  const report = {
    id: `rep-${Date.now()}`,
    name: req.body.name || `${template.name} (${req.body.startDate} to ${req.body.endDate})`,
    type: template.type,
    createdAt: new Date().toISOString(),
    status: 'ready',
    downloadUrl: `/api/reports/download/rep-${Date.now()}`,
  };
  history = [report, ...history];
  res.json(report);
});

router.get('/download/:id', (req, res) => {
  const item = history.find((h) => h.id === req.params.id);
  if (!item) return res.status(404).send('Report not found');

  const body = `report_id,report_name,type,generated_at\n${item.id},"${item.name}",${item.type},${item.createdAt}\n`;
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${item.id}.csv"`);
  res.send(body);
});

module.exports = router;
