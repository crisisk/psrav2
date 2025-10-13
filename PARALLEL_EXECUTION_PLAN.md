# PSRA-LTSD Enterprise v2 - Parallel Execution Plan
**Strategy:** OpenRouter Task Offloading
**Date:** 13 October 2025
**Execution Mode:** Maximum Parallelization

---

## 🎯 Execution Strategy

### Principle: Maximize Parallel Execution
- Use Claude Code Task agents for independent work streams
- Offload all non-dependent tasks to parallel agents
- Sequential execution only for tasks with strict dependencies

### Task Dependency Graph:

```
[Batch 0: Critical Path - SEQUENTIAL]
  └─> Fix Database Connection (blocks everything else)

[Batch 1: Code Migration - PARALLEL] (4 agents)
  ├─> Agent 1: Migrate Partner API
  ├─> Agent 2: Migrate Webhook Service
  ├─> Agent 3: Migrate LTSD Management
  └─> Agent 4: Migrate ERP Integration code

[Batch 2: Integration - PARALLEL] (3 agents)
  ├─> Agent 5: Update FastAPI router registration
  ├─> Agent 6: Update environment configs
  └─> Agent 7: Port E2E tests

[Batch 3: Services - PARALLEL] (3 agents)
  ├─> Agent 8: Setup Celery worker for webhooks
  ├─> Agent 9: Fix Keycloak restart issue
  └─> Agent 10: Integrate Version Ledger

[Batch 4: Testing - PARALLEL] (2 agents)
  ├─> Agent 11: Run E2E test suite
  └─> Agent 12: API endpoint validation

[Batch 5: Final Deployment - SEQUENTIAL]
  └─> Agent 13: Rebuild, deploy, smoke test
```

---

## 📦 Batch 0: Critical Path (SEQUENTIAL)

**Must complete before all other work**

### Task 0.1: Database Connection Fix
**Agent:** general-purpose
**Priority:** 🔴 CRITICAL
**Estimated Time:** 15 minutes
**Blocking:** ALL OTHER TASKS

**Instructions:**
```
Fix database connection string throughout the codebase.

TASK:
1. Search for all references to database "psra" (not "psra_production")
2. Update the following files:
   - backend/app/db/session.py
   - backend/app/etl/ingest_rules.py
   - Any .env or docker-compose files
   - app/api/hs-codes/route.ts (Next.js API route)
3. Test connection:
   - Run: docker exec psra-postgres psql -U psra -d psra_production -c "\dt"
   - Should see 4 tables: erp_outbox, hs_codes, psra_rules, psra_verdicts
4. Test ETL:
   - Run: cd backend && python -m app.etl.ingest_rules --validate
   - Should complete without "database does not exist" error

SUCCESS CRITERIA:
- All database connections use "psra_production"
- ETL runs successfully
- No "database does not exist" errors

RETURN: Summary of files changed + test results
```

---

## 📦 Batch 1: Code Migration (PARALLEL - 4 Agents)

**Dependencies:** Batch 0 complete
**Execute in parallel:** YES

### Task 1.1: Migrate Partner API
**Agent:** general-purpose
**Priority:** 🟠 HIGH
**Estimated Time:** 30 minutes

**Instructions:**
```
Migrate Partner API v1 from staging to enterprise-v2.

SOURCE: /home/vncuser/psra-ltsd-staging/
TARGET: /home/vncuser/psra-ltsd-enterprise-v2/

TASK:
1. Copy Partner API endpoints:
   cp -r /home/vncuser/psra-ltsd-staging/app/api/partner/ \
         /home/vncuser/psra-ltsd-enterprise-v2/app/api/

2. Copy supporting libraries:
   cp -r /home/vncuser/psra-ltsd-staging/lib/partner-api/ \
         /home/vncuser/psra-ltsd-enterprise-v2/lib/ || true

3. Copy documentation:
   cp /home/vncuser/psra-ltsd-staging/docs/partner_api_v1.md \
      /home/vncuser/psra-ltsd-enterprise-v2/docs/ || mkdir -p docs && cp ...

4. Verify copied files:
   - Check app/api/partner/v1/certificate/ exists
   - Check app/api/partner/v1/origin-check/ exists
   - Check app/api/partner/v1/webhook/ exists

SUCCESS CRITERIA:
- All Partner API v1 endpoints copied
- No TypeScript errors when importing
- Documentation accessible

RETURN: List of copied files + directory structure
```

### Task 1.2: Migrate Webhook Service
**Agent:** general-purpose
**Priority:** 🟠 HIGH
**Estimated Time:** 20 minutes

**Instructions:**
```
Migrate Webhook Service from staging to enterprise-v2.

SOURCE: /home/vncuser/psra-ltsd-staging/backend/
TARGET: /home/vncuser/psra-ltsd-enterprise-v2/backend/

TASK:
1. Create target directories if needed:
   mkdir -p /home/vncuser/psra-ltsd-enterprise-v2/backend/models
   mkdir -p /home/vncuser/psra-ltsd-enterprise-v2/backend/services
   mkdir -p /home/vncuser/psra-ltsd-enterprise-v2/backend/tasks

2. Copy webhook models:
   cp /home/vncuser/psra-ltsd-staging/backend/models/webhook_models.py \
      /home/vncuser/psra-ltsd-enterprise-v2/backend/models/

3. Copy webhook service:
   cp /home/vncuser/psra-ltsd-staging/backend/services/webhook_service.py \
      /home/vncuser/psra-ltsd-enterprise-v2/backend/services/

4. Copy webhook delivery task:
   cp /home/vncuser/psra-ltsd-staging/backend/tasks/webhook_delivery.py \
      /home/vncuser/psra-ltsd-enterprise-v2/backend/tasks/

5. Verify imports work (Python syntax check):
   python3 -c "import sys; sys.path.insert(0, '/home/vncuser/psra-ltsd-enterprise-v2/backend'); from models.webhook_models import WebhookConfig"

SUCCESS CRITERIA:
- All 3 webhook files copied
- No Python import errors
- webhook_models.py, webhook_service.py, webhook_delivery.py present

RETURN: File paths + import validation results
```

### Task 1.3: Migrate LTSD Management
**Agent:** general-purpose
**Priority:** 🟠 HIGH
**Estimated Time:** 20 minutes

**Instructions:**
```
Migrate LTSD Management Service from staging to enterprise-v2.

SOURCE: /home/vncuser/psra-ltsd-staging/backend/
TARGET: /home/vncuser/psra-ltsd-enterprise-v2/backend/

TASK:
1. Create target directories:
   mkdir -p /home/vncuser/psra-ltsd-enterprise-v2/backend/models
   mkdir -p /home/vncuser/psra-ltsd-enterprise-v2/backend/services
   mkdir -p /home/vncuser/psra-ltsd-enterprise-v2/backend/api

2. Copy LTSD models:
   cp /home/vncuser/psra-ltsd-staging/backend/models/ltsd_models.py \
      /home/vncuser/psra-ltsd-enterprise-v2/backend/models/

3. Copy LTSD service:
   cp /home/vncuser/psra-ltsd-staging/backend/services/ltsd_management_service.py \
      /home/vncuser/psra-ltsd-enterprise-v2/backend/services/

4. Copy LTSD API router:
   cp /home/vncuser/psra-ltsd-staging/backend/api/ltsd_router.py \
      /home/vncuser/psra-ltsd-enterprise-v2/backend/api/

5. Verify syntax:
   python3 -c "import sys; sys.path.insert(0, '/home/vncuser/psra-ltsd-enterprise-v2/backend'); from models.ltsd_models import LTSDDeclaration"

SUCCESS CRITERIA:
- All 3 LTSD files copied
- No Python import errors
- ltsd_models.py, ltsd_management_service.py, ltsd_router.py present

RETURN: File paths + validation results
```

### Task 1.4: Migrate ERP Integration Code
**Agent:** general-purpose
**Priority:** 🟡 MEDIUM
**Estimated Time:** 15 minutes

**Instructions:**
```
Ensure ERP integration service is in enterprise-v2.

SOURCE: /home/vncuser/psra-ltsd-staging/backend/erp_integration/
TARGET: /home/vncuser/psra-ltsd-enterprise-v2/backend/erp_integration/

TASK:
1. Check if erp_integration already exists in enterprise-v2:
   ls -la /home/vncuser/psra-ltsd-enterprise-v2/backend/erp_integration/

2. If missing, copy from staging:
   cp -r /home/vncuser/psra-ltsd-staging/backend/erp_integration/ \
         /home/vncuser/psra-ltsd-enterprise-v2/backend/

3. Verify erp_integration/service.py exists and imports work:
   python3 -c "import sys; sys.path.insert(0, '/home/vncuser/psra-ltsd-enterprise-v2/backend'); from erp_integration.service import ERPIntegrationService"

SUCCESS CRITERIA:
- erp_integration/ directory exists
- service.py present
- No import errors

RETURN: ERP integration status + file list
```

---

## 📦 Batch 2: Integration (PARALLEL - 3 Agents)

**Dependencies:** Batch 1 complete
**Execute in parallel:** YES

### Task 2.1: Update FastAPI Router Registration
**Agent:** general-purpose
**Priority:** 🟠 HIGH
**Estimated Time:** 20 minutes

**Instructions:**
```
Register new API routers in FastAPI backend.

FILE: /home/vncuser/psra-ltsd-enterprise-v2/backend/app/main.py (or routes.py)

TASK:
1. Read current main.py or routes.py file
2. Add imports for new routers:
   from backend.api.ltsd_router import router as ltsd_router

3. Register routers:
   app.include_router(ltsd_router, prefix="/api")

4. Verify backend starts without errors:
   cd /home/vncuser/psra-ltsd-enterprise-v2/backend
   python3 -c "from app.main import app; print('FastAPI app loaded successfully')"

NOTE: Partner API endpoints might be Next.js routes (app/api/partner/*), not FastAPI.
Only register ltsd_router in FastAPI backend.

SUCCESS CRITERIA:
- ltsd_router registered in FastAPI
- Backend imports successfully
- No syntax errors

RETURN: Updated main.py content (relevant sections) + validation results
```

### Task 2.2: Update Environment Configuration
**Agent:** general-purpose
**Priority:** 🟠 HIGH
**Estimated Time:** 15 minutes

**Instructions:**
```
Update environment variables for new features.

FILES:
- /home/vncuser/psra-ltsd-enterprise-v2/.env
- /home/vncuser/psra-ltsd-enterprise-v2/docker-compose.psra.yml

TASK:
1. Update .env file with:
   DATABASE_NAME=psra_production
   POSTGRES_DB=psra_production
   ENABLE_PARTNER_API=true
   ENABLE_WEBHOOKS=true
   ENABLE_LTSD_MANAGEMENT=true
   WEBHOOK_SECRET_KEY=<generate 32-char hex string>

2. Update docker-compose.psra.yml if it references "psra" database

3. Generate webhook secret:
   openssl rand -hex 32

4. Verify .env syntax:
   cat .env | grep -v '^#' | grep -v '^$'

SUCCESS CRITERIA:
- All new env vars added
- Database name updated to psra_production
- Webhook secret generated

RETURN: Updated env vars (redact sensitive values) + changes made
```

### Task 2.3: Port E2E Tests
**Agent:** general-purpose
**Priority:** 🟡 MEDIUM
**Estimated Time:** 30 minutes

**Instructions:**
```
Port E2E test suite from staging to enterprise-v2.

SOURCE: /home/vncuser/psra-ltsd-staging/tests/e2e/
TARGET: /home/vncuser/psra-ltsd-enterprise-v2/tests/e2e/

TASK:
1. Create tests directory:
   mkdir -p /home/vncuser/psra-ltsd-enterprise-v2/tests/e2e

2. Copy E2E tests:
   cp -r /home/vncuser/psra-ltsd-staging/tests/e2e/* \
         /home/vncuser/psra-ltsd-enterprise-v2/tests/e2e/

3. Copy test runner script:
   cp /home/vncuser/psra-ltsd-staging/scripts/test_e2e.sh \
      /home/vncuser/psra-ltsd-enterprise-v2/scripts/ || mkdir -p scripts && cp ...

4. Update test routes in *.spec.ts files:
   - Change old route paths to new persona-based paths
   - Update: /dashboard → /dashboard (no change)
   - Update: /cfo → /cfo (no change)
   - Update: /supplier → /supplier (no change)

5. Check if playwright is installed:
   cd /home/vncuser/psra-ltsd-enterprise-v2
   npm list playwright || npm install --save-dev playwright

SUCCESS CRITERIA:
- E2E tests copied
- Route paths updated
- Playwright dependencies present

RETURN: Test files copied + route updates made
```

---

## 📦 Batch 3: Services (PARALLEL - 3 Agents)

**Dependencies:** Batch 2 complete
**Execute in parallel:** YES

### Task 3.1: Setup Celery Worker for Webhooks
**Agent:** general-purpose
**Priority:** 🟡 MEDIUM
**Estimated Time:** 20 minutes

**Instructions:**
```
Setup Celery worker for async webhook delivery.

WORKING DIR: /home/vncuser/psra-ltsd-enterprise-v2/

TASK:
1. Check if Celery is installed:
   cd /home/vncuser/psra-ltsd-enterprise-v2/backend
   python3 -c "import celery; print(celery.__version__)"

2. If not installed:
   pip3 install celery redis

3. Create celery_worker.py if it doesn't exist:
   # Create simple worker script that imports webhook_delivery tasks

4. Test worker starts (don't leave running):
   cd /home/vncuser/psra-ltsd-enterprise-v2/backend
   timeout 10 celery -A tasks.webhook_delivery worker --loglevel=info || echo "Worker test complete"

5. Document how to start worker:
   # Add to README or deployment docs

SUCCESS CRITERIA:
- Celery installed
- Worker can start without errors
- webhook_delivery tasks importable

RETURN: Celery version + worker startup test results + start command
```

### Task 3.2: Diagnose Keycloak Restart Issue
**Agent:** general-purpose
**Priority:** 🟡 MEDIUM
**Estimated Time:** 25 minutes

**Instructions:**
```
Diagnose why Keycloak container keeps restarting.

TASK:
1. Check container status:
   docker ps -a | grep keycloak

2. Check logs:
   docker logs keycloak --tail 100

3. Check resource constraints:
   docker stats keycloak --no-stream

4. Check docker-compose.keycloak.yml for misconfigurations:
   cat /home/vncuser/psra-ltsd-enterprise-v2/docker-compose.keycloak.yml

5. Common issues to check:
   - Database connection failed
   - Port conflict
   - Memory limit too low
   - Environment variables missing
   - Health check failing

6. If fixable, apply fix and restart:
   docker-compose -f docker-compose.keycloak.yml restart keycloak

SUCCESS CRITERIA:
- Root cause identified
- Fix applied (if possible)
- Container stable or issue documented

RETURN: Root cause + fix applied + container status
```

### Task 3.3: Integrate Version Ledger Service
**Agent:** general-purpose
**Priority:** 🟡 MEDIUM
**Estimated Time:** 20 minutes

**Instructions:**
```
Integrate Version Ledger service for EU AI Act compliance.

SOURCE: /opt/psra-ltsd-v2-backup-20251011-065611/version_ledger_service.py
TARGET: /home/vncuser/psra-ltsd-enterprise-v2/backend/services/

TASK:
1. Copy version ledger service:
   cp /opt/psra-ltsd-v2-backup-20251011-065611/version_ledger_service.py \
      /home/vncuser/psra-ltsd-enterprise-v2/backend/services/

2. Check if database table exists:
   docker exec psra-postgres psql -U psra -d psra_production -c "\d version_ledger"

3. If table doesn't exist, check if schema exists in init_db.sql:
   grep -A 20 "CREATE TABLE.*version_ledger" /opt/psra-ltsd-v2-backup-20251011-065611/backend/init_db.sql

4. Verify imports work:
   python3 -c "import sys; sys.path.insert(0, '/home/vncuser/psra-ltsd-enterprise-v2/backend'); from services.version_ledger_service import VersionLedgerService"

SUCCESS CRITERIA:
- version_ledger_service.py copied
- Imports work
- Database table status documented

RETURN: Service integrated + table status + import results
```

---

## 📦 Batch 4: Testing (PARALLEL - 2 Agents)

**Dependencies:** Batch 3 complete
**Execute in parallel:** YES

### Task 4.1: Run E2E Test Suite
**Agent:** general-purpose
**Priority:** 🟡 MEDIUM
**Estimated Time:** 30 minutes

**Instructions:**
```
Run E2E test suite and report results.

WORKING DIR: /home/vncuser/psra-ltsd-enterprise-v2/

TASK:
1. Ensure dev server is running:
   curl -f http://localhost:8090/ || echo "Frontend not reachable"

2. Run E2E tests:
   cd /home/vncuser/psra-ltsd-enterprise-v2
   npx playwright test tests/e2e/ --reporter=list

3. If tests fail, capture screenshots:
   # Playwright auto-captures on failure

4. Summarize results:
   - Total tests run
   - Passed
   - Failed
   - Skipped

SUCCESS CRITERIA:
- E2E tests executed
- Results documented
- Failures analyzed (if any)

RETURN: Test results summary + failure analysis + screenshots (if failed)
```

### Task 4.2: API Endpoint Validation
**Agent:** general-purpose
**Priority:** 🟠 HIGH
**Estimated Time:** 25 minutes

**Instructions:**
```
Validate all new API endpoints are accessible.

BASE URL: https://psra.sevensa.nl

TASK:
1. Test Partner API endpoints (should return 401 without auth):
   curl -i https://psra.sevensa.nl/api/partner/v1/origin-check
   # Expect: 401 Unauthorized (proves endpoint exists)

2. Test LTSD Management endpoint:
   curl -i https://psra.sevensa.nl/api/ltsd
   # Expect: 401 or 200 (depends on auth setup)

3. Test existing frontend endpoints still work:
   curl -f https://psra.sevensa.nl/
   curl -f https://psra.sevensa.nl/dashboard
   curl -f https://psra.sevensa.nl/cfo
   curl -f https://psra.sevensa.nl/supplier

4. Test HS codes endpoint with database:
   curl -f "https://psra.sevensa.nl/api/hs-codes?search=3901"
   # Should return results from psra_production database

SUCCESS CRITERIA:
- All endpoints return expected status codes
- No 500 errors
- Frontend routes still work

RETURN: Endpoint test results + any errors found
```

---

## 📦 Batch 5: Final Deployment (SEQUENTIAL)

**Dependencies:** Batch 4 complete
**Execute in parallel:** NO (must be sequential)

### Task 5.1: Rebuild, Deploy, Smoke Test
**Agent:** general-purpose
**Priority:** 🔴 CRITICAL
**Estimated Time:** 20 minutes

**Instructions:**
```
Final rebuild and deployment with smoke tests.

WORKING DIR: /home/vncuser/psra-ltsd-enterprise-v2/

TASK:
1. Build Next.js frontend:
   cd /home/vncuser/psra-ltsd-enterprise-v2
   npm run build

2. Build Docker image:
   docker build -t psra-frontend:latest .

3. Restart containers:
   docker-compose -f docker-compose.psra.yml restart psra-frontend psra-backend

4. Wait for healthy status:
   sleep 15
   docker ps | grep psra-

5. Smoke tests:
   - curl -f https://psra.sevensa.nl/
   - curl -f https://psra.sevensa.nl/dashboard
   - curl -f https://psra.sevensa.nl/cfo
   - curl -f https://psra.sevensa.nl/supplier
   - docker logs psra-backend --tail 20 | grep -i error

6. Check all 25 containers running:
   docker ps --format "{{.Names}}" | wc -l

SUCCESS CRITERIA:
- Build successful
- All containers running
- All smoke tests pass
- No critical errors in logs

RETURN: Deployment status + smoke test results + container count
```

---

## 📊 Execution Tracking

### Batch Status:
- [ ] Batch 0: Database Fix (SEQUENTIAL) - 15 min
- [ ] Batch 1: Code Migration (PARALLEL x4) - 30 min
- [ ] Batch 2: Integration (PARALLEL x3) - 30 min
- [ ] Batch 3: Services (PARALLEL x3) - 25 min
- [ ] Batch 4: Testing (PARALLEL x2) - 30 min
- [ ] Batch 5: Deployment (SEQUENTIAL) - 20 min

### Estimated Total Time:
- **Sequential:** 15 + 20 = 35 minutes
- **Parallel (longest path):** 30 + 30 + 25 + 30 = 115 minutes
- **TOTAL WALL TIME:** ~150 minutes (2.5 hours)

### Traditional Sequential Time:
- Sum of all tasks: 15 + (30+20+20+15) + (20+15+30) + (20+25+20) + (30+25) + 20 = ~305 minutes (5 hours)

### **Time Savings: 50% reduction via parallelization**

---

**Plan Generated:** 13-10-2025 13:45 UTC
**Ready for Execution:** YES
**Next Step:** Launch Batch 0 (Database Fix)
