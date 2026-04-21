# Meridian — Multi-Agent Predictive Logistics Platform

> Google Solution Challenge · "Build with AI" Track

Meridian turns reactive supply-chain management into a predictive discipline. A swarm of AI agents continuously monitors live shipment routes, detects weather and traffic threats, and dispatches Gemini 1.5 Pro to calculate optimised re-routes — before delays cascade.

---

## Quick Start (Development)

### 1. Prerequisites
- Node.js ≥ 18
- A MongoDB Atlas cluster (free tier works)
- A Google AI Studio API key (Gemini 1.5 Pro access)

### 2. Configure environment
Fill in the two values in the root `.env` file:
```
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/meridian
GOOGLE_API_KEY=AIza...
```

### 3. Install dependencies
```bash
# Server
npm install --prefix server

# Client
npm install --prefix client

# Root (concurrently)
npm install
```

### 4. Seed the database
```bash
npm run seed
```

### 5. Boot the platform (single command)
```bash
npm run dev
```

This starts both servers concurrently:
| Service | URL |
|---|---|
| React frontend (Vite) | http://localhost:3000 |
| Express API | http://localhost:5000 |

---

## Production Build

```bash
# 1. Build the React app into server/public/
npm run build

# 2. Start Express — it serves both the API and the static frontend
NODE_ENV=production npm run start
```

Everything is served from a single port (5000) in production.

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Liveness check |
| `GET` | `/api/map-state` | Full world state (shipments, alerts, logs) |
| `POST` | `/api/simulate` | Trigger the full Gemini AI pipeline |
| `PUT` | `/api/optimize/:id/execute` | Approve a pending reroute |

---

## Architecture

```
┌─────────────────────────────────────────────┐
│              React Frontend                  │
│  WorldMap · ReasoningPanel · AgentActivity  │
└──────────────────┬──────────────────────────┘
                   │  /api/*  (Vite proxy in dev)
┌──────────────────▼──────────────────────────┐
│            Express API (server/)             │
│  GET /map-state  POST /simulate  PUT /exec  │
└──────┬───────────────────────┬──────────────┘
       │                       │
┌──────▼──────┐    ┌───────────▼────────────┐
│  MongoDB    │    │  LangChain + Gemini     │
│  Atlas      │    │  OrchestratorAgent.ts   │
│  Shipment   │    │  StructuredOutputParser │
│  RiskAlert  │    │  Zod schema validation  │
│  OptLog     │    └────────────────────────┘
└─────────────┘
```

## Project Structure

```
meridian/
├── .env                   ← secrets (never commit)
├── .gitignore
├── package.json           ← root: concurrently dev script
├── README.md
│
├── client/                ← React frontend
│   ├── index.html
│   ├── vite.config.js     ← /api proxy → localhost:5000
│   ├── package.json
│   └── public/
│       ├── styles.css
│       └── src/           ← JSX components (CDN Babel)
│
└── server/                ← Express + LangChain API
    ├── server.ts          ← entry point
    ├── tsconfig.json
    ├── package.json
    ├── controllers/
    │   └── LogisticsController.ts
    ├── models/
    │   ├── Shipment.ts
    │   ├── RiskAlert.ts
    │   └── OptimizationLog.ts
    ├── routes/
    │   └── api.ts
    ├── services/
    │   └── OrchestratorAgent.ts   ← Gemini chain
    └── scripts/
        └── seed.ts
```
