# Database Directory

SQLite database with Knex.js query builder for Ad Ops Command.

## Structure

```
database/
├── data/
│   ├── ad-ops.db                  # SQLite database file
│   └── *.json                     # Legacy JSON files (backed up)
├── data-backup/                   # JSON file backups
├── migrations/                    # Schema migrations (7 files)
├── models/                        # Data access layer (6 models)
├── seeds/                         # Test data (4 seed files)
├── db.js                          # Knex connection singleton
├── knexfile.js                    # Knex configuration
├── migrate-from-json.js           # One-time JSON→DB migration
└── README.md                      # This file
```

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Migrations

```bash
npm run migrate
```

### 3. Seed Test Data (optional)

```bash
npm run seed
```

### 4. Run Tests

```bash
npm run test:db
```

## Models

### Usage

```javascript
const models = require('./database/models');

// Projects
const project = await models.projects.create({ name: 'My Project', type: 'campaign' });
const allProjects = await models.projects.list({ status: 'active' });

// Executions
const execution = await models.executions.create({ workflowId: 'create-campaign' });
const recentExecutions = await models.executions.getRecent(10);

// Events
const event = await models.events.create({ type: 'workflow.started', payload: {...} });
const unprocessed = await models.events.getUnprocessed();

// Workflows (NEW)
await models.workflows.register({ id: 'my-workflow', name: 'My Workflow' });
const workflows = await models.workflows.getAllEnabled();

// Campaigns (NEW)
const campaign = await models.campaigns.create({ platform: 'meta-ads', name: 'Q1 Campaign' });
const metaCampaigns = await models.campaigns.getByPlatform('meta-ads');

// Metrics (NEW)
await models.metrics.recordMetrics('camp-123', '2026-02-10', { impressions: 10000, clicks: 250 });
const metrics = await models.metrics.getMetrics('camp-123', '2026-02-01', '2026-02-10');
```

## Tables

| Table | Purpose | Records (seeded) |
|-------|---------|------------------|
| projects | Project management | 5 sample projects |
| executions | Workflow executions | 10 sample executions |
| events | Event bus persistence | 4 migrated events |
| workflows | Workflow definitions | - |
| campaigns | Platform campaigns | 15 sample campaigns |
| metrics | Performance metrics | 100 sample records |

## NPM Scripts

```bash
npm run migrate              # Apply migrations
npm run migrate:rollback     # Rollback last migration
npm run migrate:json         # Migrate JSON files to DB (one-time)
npm run seed                 # Load test data
npm run test:db              # Run database tests
```

## Knex CLI

```bash
# Create new migration
npx knex migrate:make migration_name --knexfile database/knexfile.js

# Check migration status
npx knex migrate:status --knexfile database/knexfile.js

# Create new seed
npx knex seed:make seed_name --knexfile database/knexfile.js
```

## Documentation

See [`docs/DATABASE-MIGRATION.md`](../docs/DATABASE-MIGRATION.md) for complete documentation including:
- Schema design
- Migration guide
- Model API reference
- Performance benchmarks
- Troubleshooting

## Testing

Run the comprehensive test suite:

```bash
npm run test:db
```

**Test Coverage:**
- ✅ Database connection
- ✅ CRUD operations (all models)
- ✅ Query filters
- ✅ JSON serialization
- ✅ Calculated metrics
- ✅ Foreign keys
- ✅ Concurrent operations
- ✅ Performance (356 records/sec)

## Migration from JSON

If you have existing JSON data files, run:

```bash
npm run migrate:json
```

This will:
1. Read `projects.json`, `executions.json`, `events.json`
2. Insert data into database
3. Create backups in `data-backup/`
4. Verify migration success

## Performance

| Operation | Records | Time | Rate |
|-----------|---------|------|------|
| Insert | 1,000 | 2.8s | 356/sec |
| Query | 1 | <5ms | - |
| Aggregate | 100 | ~20ms | - |

## Backup & Restore

### Backup

```bash
# Database file
cp database/data/ad-ops.db database/data/ad-ops-backup.db

# Or use SQLite command
sqlite3 database/data/ad-ops.db ".backup database/data/ad-ops-backup.db"
```

### Restore

```bash
cp database/data/ad-ops-backup.db database/data/ad-ops.db
```

## Troubleshooting

### "Database locked" error
- Ensure only one process accesses the database
- Use transactions for batch operations

### Foreign key constraint violations
- Ensure parent records exist before children
- Check cascade rules in migrations

### JSON parsing errors
- Models handle JSON serialization automatically
- Don't manually stringify before passing to models

See [`docs/DATABASE-MIGRATION.md`](../docs/DATABASE-MIGRATION.md) for more troubleshooting tips.

---

**Database Version:** 1.0.0  
**Migration Status:** ✅ Complete  
**Last Updated:** 2026-02-10
