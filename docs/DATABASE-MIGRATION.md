

# Database Migration Guide - Phase 3 Week 1

## Overview

This guide documents the migration from JSON file-based storage to SQLite database using Knex.js query builder. The migration provides a solid foundation for Phase 3 features while maintaining backward compatibility.

## Architecture

### Technology Stack

- **Database:** SQLite 3 (file-based, no server required)
- **Query Builder:** Knex.js (migrations + query interface)
- **Node Package:** `sqlite3` (native binding)

### Database Location

```
database/
├── data/
│   └── ad-ops.db          # SQLite database file
├── db.js                  # Knex connection singleton
├── knexfile.js            # Knex configuration
├── migrations/            # Schema migrations
├── models/                # Data access layer
├── seeds/                 # Test data
└── migrate-from-json.js   # One-time JSON→DB migration
```

## Schema Design

### Tables

#### 1. **projects**
Unified project management for campaigns, JBPs, migrations, etc.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PRIMARY KEY | Project ID |
| name | TEXT | Project name |
| type | TEXT | campaign, dsp-onboarding, jbp, migration, etc. |
| status | TEXT | planning, active, paused, completed, cancelled |
| owner | TEXT | Agent ID or user |
| startDate | TEXT | ISO date |
| endDate | TEXT | ISO date |
| budget | DECIMAL | Project budget |
| platform | TEXT | Platform identifier |
| metadata | JSON | Type-specific data |
| asanaProjectId | TEXT | Asana integration |
| milestones | JSON | Array of milestone objects |
| artifacts | JSON | Array of artifact objects |
| metrics | JSON | Completion, health, blockers |
| createdAt | TIMESTAMP | Creation timestamp |
| updatedAt | TIMESTAMP | Last update timestamp |
| deletedAt | TIMESTAMP | Soft delete timestamp |

**Indexes:** type, status, owner, platform, createdAt

#### 2. **executions**
Workflow execution records with stage tracking

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PRIMARY KEY | Execution ID |
| projectId | TEXT FK | References projects(id) |
| workflowId | TEXT | Workflow identifier |
| status | TEXT | queued, running, completed, failed, cancelled |
| params | JSON | Workflow parameters |
| stages | JSON | Array of stage objects with status |
| result | JSON | Final execution result |
| error | TEXT | Error message if failed |
| artifacts | JSON | Array of artifact objects |
| duration | INTEGER | Execution duration (ms) |
| startedAt | TIMESTAMP | Start time |
| completedAt | TIMESTAMP | Completion time |
| createdAt | TIMESTAMP | Creation timestamp |

**Indexes:** projectId, workflowId, status, createdAt

#### 3. **events**
Event bus persistence

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PRIMARY KEY | Event ID |
| type | TEXT | Event type (workflow.started, etc.) |
| source | TEXT | Component that emitted event |
| payload | JSON | Event data |
| executionId | TEXT FK | References executions(id) |
| projectId | TEXT FK | References projects(id) |
| processed | BOOLEAN | Processing status |
| timestamp | TIMESTAMP | Event timestamp |

**Indexes:** type, source, executionId, projectId, processed, timestamp

#### 4. **workflows**
Workflow definitions and configurations

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PRIMARY KEY | Workflow ID |
| name | TEXT | Workflow name |
| category | TEXT | Category (campaign-management, etc.) |
| version | TEXT | Version string |
| config | JSON | Workflow configuration |
| enabled | BOOLEAN | Enabled status |
| description | TEXT | Description |
| metadata | JSON | Tags, author, etc. |
| createdAt | TIMESTAMP | Creation timestamp |
| updatedAt | TIMESTAMP | Last update timestamp |

**Indexes:** category, enabled, name

#### 5. **campaigns**
Platform campaign tracking

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PRIMARY KEY | Internal campaign ID |
| projectId | TEXT FK | References projects(id) |
| platform | TEXT | google-ads, meta-ads, pinterest, ttd, dv360 |
| externalId | TEXT | Platform's campaign ID |
| name | TEXT | Campaign name |
| status | TEXT | Campaign status |
| budget | DECIMAL | Campaign budget |
| startDate | TEXT | ISO date |
| endDate | TEXT | ISO date |
| metadata | JSON | Platform-specific data |
| syncedAt | TIMESTAMP | Last sync from platform |
| createdAt | TIMESTAMP | Creation timestamp |
| updatedAt | TIMESTAMP | Last update timestamp |

**Indexes:** projectId, platform, externalId, status, platform+externalId

#### 6. **metrics**
Time-series campaign performance metrics

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY AUTOINCREMENT | Metric ID |
| campaignId | TEXT FK | References campaigns(id) |
| date | TEXT | YYYY-MM-DD |
| impressions | INTEGER | Impression count |
| clicks | INTEGER | Click count |
| conversions | INTEGER | Conversion count |
| spend | DECIMAL | Spend amount |
| revenue | DECIMAL | Revenue amount |
| ctr | DECIMAL | Click-through rate (calculated) |
| cpc | DECIMAL | Cost per click (calculated) |
| cpa | DECIMAL | Cost per acquisition (calculated) |
| roas | DECIMAL | Return on ad spend (calculated) |
| metadata | JSON | Additional platform-specific metrics |
| syncedAt | TIMESTAMP | Last sync timestamp |

**Indexes:** campaignId, date, campaignId+date (unique)

## Migration Steps

### 1. Install Dependencies

```bash
npm install knex sqlite3
```

### 2. Run Schema Migrations

```bash
npx knex migrate:latest --knexfile database/knexfile.js
```

This creates all tables with proper indexes and foreign key constraints.

### 3. Migrate Existing Data

```bash
node database/migrate-from-json.js
```

This script:
- Reads existing JSON files (`projects.json`, `executions.json`, `events.json`)
- Inserts data into corresponding database tables
- Creates backup of JSON files in `database/data-backup/`
- Provides migration summary

### 4. Verify Migration

```bash
node test-database.js
```

Runs comprehensive test suite to verify:
- All CRUD operations work
- Data integrity maintained
- Performance acceptable
- Foreign keys enforced

### 5. Update Code

The new models are drop-in replacements for old JSON-based modules:

**Before:**
```javascript
const projects = require('./database/projects');
```

**After:**
```javascript
const models = require('./database/models');
const projects = models.projects;
```

All function signatures remain the same for backward compatibility.

## Data Access Layer

### Models API

All models follow consistent CRUD patterns:

#### Projects

```javascript
const models = require('./database/models');

// Create
const project = await models.projects.create({
  name: 'My Campaign',
  type: 'campaign',
  status: 'active',
  owner: 'trader-agent',
  budget: 50000,
  platform: 'meta-ads'
});

// Read
const project = await models.projects.get(projectId);
const projects = await models.projects.list({ status: 'active' });

// Update
await models.projects.update(projectId, { status: 'completed' });

// Delete (soft delete)
await models.projects.delete(projectId);

// Helpers
await models.projects.addMilestone(projectId, { name: 'Launch', status: 'completed' });
await models.projects.updateMetrics(projectId, { completion: 80, health: 'on-track' });
const stats = await models.projects.getStats();
```

#### Executions

```javascript
// Create
const execution = await models.executions.create({
  workflowId: 'create-campaign',
  projectId: 'proj-123',
  params: { budget: 10000 }
});

// Update with stages
await models.executions.update(executionId, {
  status: 'running',
  startedAt: new Date().toISOString()
});

await models.executions.addStage(executionId, {
  id: 'stage-1',
  name: 'Validate Budget',
  status: 'completed',
  agent: 'analyst'
});

// Query
const recent = await models.executions.getRecent(10);
const byWorkflow = await models.executions.getRecentByWorkflow('create-campaign', 5);
const byProject = await models.executions.getByProject('proj-123');
```

#### Events

```javascript
// Create
const event = await models.events.create({
  type: 'workflow.completed',
  source: 'executor',
  payload: { executionId: 'exec-123', duration: 4500 },
  executionId: 'exec-123'
});

// Query
const unprocessed = await models.events.getUnprocessed();
const byType = await models.events.getByType('workflow.completed');

// Mark processed
await models.events.markProcessed(eventId);
await models.events.markManyProcessed([id1, id2, id3]);

// Cleanup
await models.events.cleanupOldEvents(30); // Delete processed events older than 30 days
```

#### Workflows (NEW)

```javascript
// Register/update workflow
await models.workflows.register({
  id: 'create-campaign',
  name: 'Create Campaign',
  category: 'campaign-management',
  version: '1.0.0',
  config: { stages: [...], agents: [...] },
  enabled: true
});

// Query
const workflow = await models.workflows.get('create-campaign');
const byCategory = await models.workflows.getByCategory('campaign-management');
const enabled = await models.workflows.getAllEnabled();

// Toggle
await models.workflows.setEnabled('create-campaign', false);
```

#### Campaigns (NEW)

```javascript
// Create
const campaign = await models.campaigns.create({
  projectId: 'proj-123',
  platform: 'meta-ads',
  externalId: 'fb-987654321',
  name: 'Q1 Campaign',
  status: 'active',
  budget: 50000
});

// Create from execution
await models.campaigns.createFromExecution(executionData);

// Query
const campaign = await models.campaigns.get(campaignId);
const byPlatform = await models.campaigns.getByPlatform('meta-ads');
const byProject = await models.campaigns.getByProject('proj-123');
const byExternal = await models.campaigns.getByExternalId('meta-ads', 'fb-987654321');
```

#### Metrics (NEW)

```javascript
// Record metrics
await models.metrics.recordMetrics('camp-123', '2026-02-10', {
  impressions: 10000,
  clicks: 250,
  conversions: 10,
  spend: 500,
  revenue: 1000
});

// Calculated fields (CTR, CPC, CPA, ROAS) are computed automatically

// Query
const metrics = await models.metrics.getMetrics('camp-123', '2026-02-01', '2026-02-10');
const latest = await models.metrics.getLatest('camp-123', 30);

// Aggregate
const aggregated = await models.metrics.aggregate({
  campaignIds: ['camp-123', 'camp-456'],
  startDate: '2026-02-01',
  endDate: '2026-02-10'
});

const byPlatform = await models.metrics.aggregateByPlatform({ startDate: '2026-02-01' });

// Top performers
const topCampaigns = await models.metrics.getTopPerformers('roas', 10, {
  startDate: '2026-02-01',
  endDate: '2026-02-10'
});
```

## Testing

### Run Test Suite

```bash
node test-database.js
```

### Test Coverage

- ✅ Database connection
- ✅ CRUD operations (all models)
- ✅ Filters and queries
- ✅ JSON serialization/deserialization
- ✅ Calculated fields (CTR, CPC, CPA, ROAS)
- ✅ Foreign key constraints
- ✅ Soft deletes
- ✅ Concurrent operations
- ✅ Performance (1000 record insert)

### Seed Test Data

```bash
npx knex seed:run --knexfile database/knexfile.js
```

Seeds:
- 5 sample projects
- 10 sample executions
- 15 sample campaigns (5 platforms)
- 100 sample metrics records

## Performance

### Benchmarks (Local Testing)

| Operation | Records | Time | Rate |
|-----------|---------|------|------|
| Insert | 1000 events | ~2-5s | 200-500/sec |
| Query (simple) | 1 project | <5ms | - |
| Query (with joins) | 10 executions | <10ms | - |
| Aggregate | 100 metrics | ~20ms | - |

### Optimization

- All common query patterns have indexes
- JSON fields used only for semi-structured data
- Foreign keys with proper cascading
- Soft deletes instead of hard deletes
- Connection pooling (Knex default)

## Backward Compatibility

### Environment Variable

Set `USE_DATABASE=false` to fall back to JSON mode (not recommended after migration):

```javascript
const useDatabase = process.env.USE_DATABASE !== 'false'; // default true
```

### API Compatibility

All model methods maintain the same signatures as the old JSON-based modules:

- `create(data)` → returns object
- `update(id, data)` → returns updated object
- `get(id)` → returns object or null
- `list(filters)` → returns array
- `delete(id)` → returns { success: boolean }

Existing code using these methods works without modification.

## Troubleshooting

### "Database locked" error

SQLite locks the database file during writes. If you see this error:
- Ensure only one process is accessing the database
- Use transactions for batch operations
- Increase busy timeout: `db.raw('PRAGMA busy_timeout = 5000')`

### Migration fails with "already exists"

The migration script checks for existing records and skips them. If you need to re-run:
```bash
# Delete database
rm database/data/ad-ops.db

# Re-run migrations
npx knex migrate:latest --knexfile database/knexfile.js

# Re-run migration script
node database/migrate-from-json.js
```

### JSON parsing errors

If you see "Unexpected token" errors, check that JSON fields are properly serialized:
- Models handle serialization automatically
- Don't manually stringify before passing to model methods
- Retrieved objects have JSON fields already parsed

### Foreign key constraint violations

If inserts fail with FK errors:
- Ensure parent records exist before creating children
- Use transactions for related inserts
- Check that referenced IDs are correct

## Next Steps

With the database layer complete, Phase 3 can now proceed to:

1. **Week 2:** Real-time UI updates (SSE)
2. **Week 3:** Pinterest connector
3. **Week 4:** Analytics layer (uses metrics table)
4. **Week 5:** Agent intelligence (uses agent_memory tables - future migration)
5. **Week 6:** Integration hub (webhooks, notifications)

All future features will leverage this database foundation.

## Resources

- [Knex.js Documentation](https://knexjs.org/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [Schema Migrations Pattern](https://knexjs.org/#Migrations)

---

**Migration Status:** ✅ Complete (Week 1)  
**Database Version:** 1.0.0  
**Last Updated:** 2026-02-10
