# Deployment Guide (React UI Default)

## Overview
Production now serves the React app build from `ui-react/dist` by default.
Legacy UI files in `ui/` are still present for rollback and are available at `/legacy`.

## Build Steps
1. Install dependencies:
   ```bash
   npm install
   cd ui-react && npm install && cd ..
   ```
2. Build React production assets:
   ```bash
   npm run build
   ```
   This runs `cd ui-react && npm run build` and outputs optimized assets to `ui-react/dist`.

## Environment Variables
Required/commonly used:
- `NODE_ENV=production` (required for production static serving behavior)
- `PORT` (optional; defaults to `3002`)
- Any existing API/integration environment variables used by routes/connectors (unchanged)

## Run in Production
Start server in production mode:
```bash
npm start
```
This runs:
```bash
NODE_ENV=production node server.js
```

## Run in Development (Vite Proxy)
For HMR/local frontend development:
1. Start Vite in `ui-react` (default `http://localhost:5173`)
2. Start API server:
   ```bash
   npm run dev
   ```
   This runs `NODE_ENV=development node server.js` and proxies non-API requests to Vite.

## Legacy UI Access / Rollback
- Legacy UI is still available at:
  - `http://<host>:<port>/legacy`
- Legacy build script remains available:
  ```bash
  npm run build:legacy
  ```
- If full rollback is needed, server static routing can be pointed back to `ui/` or previous `build/` behavior.
