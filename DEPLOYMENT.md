# 🚀 PSRA-LTSD Enterprise v2 - Deployment Guide

## 📋 Overview

Dual-site deployment for PSRA-LTSD trade compliance platform:
- **Production**: https://psra.sevensa.nl (full persona experience)
- **Demo**: https://demo.psra.sevensa.nl (one-page showcase)

## 🏗️ Architecture

```
├── Production Site (psra.sevensa.nl)
│   ├── /              → Persona Home (3 kaarten)
│   ├── /dashboard     → Compliance Manager (Suus)
│   ├── /cfo           → CFO Dashboard
│   ├── /supplier      → Supplier Portal
│   └── /assessment/[id] → Assessment Detail + XAI Explainer
│
└── Demo Site (demo.psra.sevensa.nl)
    ├── /              → One-page demo (4 sections)
    ├── /features      → Feature overview
    └── /tech          → API & Security docs
```

## 🔧 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS 3.4 + Sevensa Design System
- **State**: TanStack Query
- **Icons**: Lucide React
- **Validation**: Zod
- **Testing**: Playwright + Vitest
- **AI**: OpenRouter (Claude 3.5 Sonnet)

## 📦 Installation

```bash
# Install dependencies
make install
# or
npm install

# Setup environment
cp .env.local .env
```

## 🔑 Environment Variables

```bash
# API Configuration
API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# OpenRouter (for AI-powered features)
OPENROUTER_API_KEY=sk-or-v1-...
NEXT_PUBLIC_OPENROUTER_API_KEY=sk-or-v1-...

# Feature Flags
NEXT_PUBLIC_ENABLE_XAI=true
NEXT_PUBLIC_ENABLE_TELEMETRY=true
NEXT_PUBLIC_MOCK_DATA=false  # true = use mock data (no backend required)

# Demo Mode
NEXT_PUBLIC_DEMO_MODE=false  # true for demo.psra.sevensa.nl
```

## 🖥️ Development

```bash
# Production mode
make dev
# or
npm run dev

# Demo mode
make dev-demo
# or
npm run dev:demo

# Open browsers
- http://localhost:3000 (production)
- http://localhost:3000 (demo mode if DEMO_MODE=true)
```

## 🏭 Build & Deploy

### Production Build

```bash
make build
# or
npm run build

# Start production server
make start
# or
npm start
```

### Demo Build

```bash
make build-demo
# or
npm run build:demo
```

### Docker Deployment

```bash
# Build image
make docker-build

# Run container
make docker-run

# Docker Compose (all services)
make docker-compose-up
```

### VPS Deployment

```bash
# Deploy to VPS (both prod & demo)
make deploy-vps

# This will:
# 1. SSH to vncuser@psra.sevensa.nl
# 2. Pull latest code
# 3. Install dependencies
# 4. Build both sites
# 5. Restart docker-compose services
```

## 🧪 Testing

```bash
# Unit tests
make test

# E2E tests (Playwright)
make test-e2e

# E2E with UI
make test-e2e-ui

# Accessibility tests
make test-a11y

# All tests
make test-all
```

## 🎭 Personas & Features

### Compliance Manager (Suus) - /dashboard
- Recent assessments with verdicts
- CTA Strip: Start Origin Check, Generate LTSD, Upload CoO
- Insights Row: p95 latency, pass/fail 7d, exceptions, LTSD due
- Assessments Table with filters
- Missing CoO List with "Vraag CoO aan" button

### CFO Dashboard - /cfo
- KPI Strip: Savings MTD, At Risk, Avg Decision Time, Open Approvals
- Trends: Pass/Fail 7d + Savings by Agreement
- Risk Table
- Approvals Table with inline approve

### Supplier Portal - /supplier
- Chain Overview: Status, coverage%, BOM tree
- Add CoO Wizard: Multi-step upload (init → upload → complete → revalidate)
- Missing nodes with upload prompts

### Assessment Detail - /assessment/[id]
- Product information
- Decision verdict with confidence
- **XAI Result Explainer** (slide-over):
  - Decision Summary
  - Rule Path with checkpoints
  - Chain Closure (BOM tree, coverage%)
  - Data Inputs
  - Trace & Confidence
  - Next Best Actions

## 🎨 Design System

All components use Sevensa brand tokens:

**Colors:**
- Primary: `sevensa-teal` (#00A896)
- Secondary: `sevensa-dark` (#2D3A45)
- Semantic: `success`, `error`, `warning`, `info`
- Functional: `bg-*`, `text-*`, `border-*`
- Dark mode: `dark:bg-*`, `dark:text-*`, etc.

**Typography:**
- Font: Montserrat (400, 500, 600, 700, 800)
- Scale: xs, sm, base, lg, xl, 2xl, 3xl, 4xl, 5xl

**Components:**
- Cards: `shadow-card`, `rounded-xl`, `border`
- Buttons: `bg-sevensa-teal hover:bg-sevensa-teal-600`
- Pills: `bg-success/10 text-success` (verdict badges)

## 🔌 API Integration

### Proxy Mode (Production)
Set `API_BASE_URL` → requests proxy to FastAPI backend

### Mock Mode (Development/Demo)
Set `NEXT_PUBLIC_MOCK_DATA=true` → use built-in mock data (no backend required)

### API Routes
All routes in `/app/api/*` support both modes:
- `/api/assessments` - List assessments
- `/api/insights/overview` - Dashboard insights
- `/api/cfo/kpis` - CFO KPIs
- `/api/cfo/trend` - Pass/fail trend
- `/api/cfo/savings-by-agreement` - Savings breakdown
- `/api/cfo/at-risk` - Risk table data
- `/api/cfo/approvals` - Approval requests
- `/api/chain/[ltsdId]` - BOM chain overview
- `/api/chain/[ltsdId]/node/[nodeId]/request-coo` - Request CoO from supplier
- `/api/chain/[ltsdId]/node/[nodeId]/upload/init` - Init CoO upload
- `/api/assessments/[id]/xai` - XAI explanation

## 📊 Telemetry Events

Events tracked (console in dev, Sentry/OTEL in prod):
- `persona_home_click` - Persona card clicked
- `dashboard_mount` - Dashboard loaded
- `cfo_mount` - CFO dashboard loaded
- `supplier_mount` - Supplier portal loaded
- `cta_click` - CTA button clicked
- `table_filter` - Table filtered
- `assessment_open` - Assessment detail opened
- `coo_request_sent` - CoO request sent to supplier
- `coo_upload_start` - CoO upload started
- `coo_upload_complete` - CoO upload completed
- `xai_open` - XAI explainer opened
- `xai_section_expand` - XAI section expanded
- `xai_copy` - XAI data copied for audit
- `finalize_attempt` - Finalize LTSD attempted
- `finalize_success` - LTSD finalized successfully

## 🛠️ Makefile Commands

```bash
make help              # Show all commands
make dev               # Dev server (production mode)
make dev-demo          # Dev server (demo mode)
make build             # Build production
make build-demo        # Build demo
make start             # Start production server
make test              # Run unit tests
make test-e2e          # Run E2E tests
make test-e2e-ui       # E2E with Playwright UI
make test-a11y         # Accessibility tests
make test-all          # All tests
make lint              # ESLint
make typecheck         # TypeScript check
make format            # Prettier format
make verify            # Lint + typecheck + test
make clean             # Clean build artifacts
make docker-build      # Build Docker image
make docker-run        # Run Docker container
make docker-compose-up # Start all services
make deploy-vps        # Deploy to VPS
make health-check      # Check service health
make logs-prod         # View production logs
make logs-demo         # View demo logs
```

## 🌐 URLs

- **Production**: https://psra.sevensa.nl
- **Demo**: https://demo.psra.sevensa.nl
- **API (backend)**: http://localhost:8000 (dev)
- **Health Check**: https://psra.sevensa.nl/api/health

## 📝 Notes

- **Mock Data**: Set `NEXT_PUBLIC_MOCK_DATA=true` to develop without backend
- **Dark Mode**: Toggle in app header (stores in localStorage)
- **Traefik**: Handles TLS termination, routing to prod/demo containers
- **Role Guards**: Header `X-Role` for demo mode (will use Keycloak JWT in production)

## 🚨 Troubleshooting

### Port conflicts
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Build errors
```bash
make clean
make install
make build
```

### API not responding
```bash
# Check backend health
curl http://localhost:8000/healthz

# Check frontend API route
curl http://localhost:3000/api/assessments
```

### Docker issues
```bash
docker-compose down -v
docker system prune -af
make docker-compose-up
```

## 🔐 Security

- **HTTPS**: Enforced via Traefik
- **CORS**: Configured for psra.sevensa.nl and demo.psra.sevensa.nl
- **Auth**: Keycloak SSO (production), Header-based (demo)
- **Secrets**: Never commit .env files, use environment variables
- **PII**: XAI explainer sanitizes personal data

## 📈 Performance

- **Target**: LCP < 2.5s, FID < 100ms, CLS < 0.1
- **Bundle Size**: < 250KB gzipped (per route)
- **Caching**: API responses cached 60s, stale-while-revalidate 300s
- **Skeletons**: Used instead of spinners for better UX
- **Code Splitting**: Automatic per route

## 🎯 Roadmap

- [ ] Playwright tests (6 specs)
- [ ] Lighthouse CI integration
- [ ] Axe accessibility tests
- [ ] GitHub Actions workflow
- [ ] Demo /features and /tech subpages
- [ ] Supplier Submissions Table
- [ ] Finalize LTSD guard (disabled until chain complete)
- [ ] Export Audit Pack (PDF generation)

---

**Generated with OpenRouter Claude 3.5 Sonnet** | Sevensa © 2025
