# Ad Ops Command Center

A digital media/advertising-specific operations platform for managing programmatic advertising campaigns across multiple DSPs.

## Features

- **Multi-DSP Management**: Unified view of TTD, DV360, and Amazon DSP campaigns
- **AI Agents**: Specialized agents for media planning, trading, analysis, creative ops, and compliance
- **Workflow Automation**: Campaign launch, pacing checks, WoW reports, optimization, anomaly detection
- **Domain Intelligence**: Ad tech taxonomy, benchmarks, glossary, and business rules
- **Real-time Dashboard**: Pacing overview, campaign status, insights, agent activity

## Quick Start

```bash
npm install
npm start
```

Server runs on http://localhost:3002

## Architecture

```
├── agents/           # AI agents (Media Planner, Trader, Analyst, etc.)
├── connectors/       # DSP integrations (TTD, DV360, Amazon DSP)
├── domain/           # Ad tech taxonomy, benchmarks, glossary, rules
├── workflows/        # Multi-step automation workflows
├── memory/           # Agent memory and learning
├── database/         # SQLite + DuckDB for persistence
├── ui/               # Modern glass-morphism dashboard
```

## Agents

| Agent | Role | Model |
|-------|------|-------|
| Media Planner | Strategy, budgets, channel mix | Sonnet |
| Trader | DSP execution, bidding, pacing | Haiku |
| Analyst | Reporting, insights, anomalies | Sonnet |
| Creative Ops | Assets, specs, rotations | Haiku |
| Compliance | Brand safety, fraud, viewability | Haiku |

## API Endpoints

- `GET /api/campaigns` - List all campaigns
- `POST /api/campaigns` - Create campaign
- `GET /api/pacing` - Get pacing status
- `GET /api/insights` - Get performance insights
- `POST /api/query` - Natural language query
- `GET /api/agents` - List agents
- `POST /api/workflows/:name/run` - Execute workflow

## Domain Model

### LOB (Line of Business)
- Mobile
- Wearables
- Home
- Education
- Business

### Channel
- Display
- OLV (Online Video)
- Audio
- Demand Gen (DV360 only)
- CTV (Connected TV)

### Funnel Stage
- Awareness
- Consideration
- Conversion

### DSP
- The Trade Desk (TTD)
- DV360 (Google)
- Amazon DSP

## License

MIT
