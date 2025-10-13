# PSRA-LTSD Enterprise v2 Restoration and Development Roadmap (18 Pages)

**Author:** Manus AI
**Date:** October 10, 2025
**Goal:** Achieve full application functionality by integrating the PSRA-LTSD core into the Enterprise Monorepo structure and executing the discovered 10-Phase Master Plan.

---

## 1. Introduction and Strategic Re-Alignment

The discovery of the **Enterprise Monorepo** (`CodebaseQ32025-1.zip`) and its embedded **10-Phase Development Plan** necessitates a strategic re-alignment of the PSRA-LTSD project. The focus shifts from restoring a fragmented legacy application to **integrating** the current LangGraph/FastAPI core into a robust, modular enterprise architecture. This roadmap is a detailed plan for executing the PSRA-LTSD specific tasks within the context of the larger Enterprise Master Plan.

### 1.1. Master Plan Overview (Discovered in `/codebase_q3/phases`)

The Enterprise Master Plan is structured into ten phases, each with specific KPIs and deliverables. The PSRA-LTSD project directly contributes to the first four phases and is a foundational component for the later phases.

| Phase ID | Master Plan Focus | PSRA-LTSD Contribution |
| :--- | :--- | :--- |
| **Phase 1** | **Stabilization** | Integrate PSRA core into Monorepo, establish health checks. |
| **Phase 2** | **CI/CD** | Implement E2E Playwright tests for PSRA routes. |
| **Phase 3** | **Admin UI** | Connect PSRA/LTSD endpoints to the existing Admin UI components. |
| **Phase 4** | **AI SEO & Reviews** | Finalize ML integration (Embed/Classify) for Rules-as-Data Engine. |
| **Phase 5-10** | *Advanced Enterprise* | PSRA-LTSD acts as a stable, integrated service for these phases. |

---

## 2. Phase 1: Stabilization and Core Integration (4 Weeks)

The primary goal is to integrate the existing PSRA-LTSD v2 core (LangGraph/FastAPI) into the monorepo's modular structure and establish foundational services.

### 2.1. Task Group: Monorepo Integration

| ID | Task Description | Source Code Integration | Effort (Days) |
| :--- | :--- | :--- | :--- |
| **1.1** | **LangGraph Orchestrator Integration:** Port the LangGraph logic into the monorepo's designated orchestrator structure. | Move `origin_calculation_graph.py` logic into `/backend/orchestrator/router.py`. | 5 |
| **1.2** | **PSRA Rules Engine Finalization:** Integrate the core PSRA calculation logic into the dedicated rules engine module. | Port `origin.py` logic from legacy to `/backend/rules_engine/origin.py`. | 5 |
| **1.3** | **Health Gate Implementation:** Implement the strict health gate logic to ensure all dependencies (DB, Redis, LLM) are available before serving requests. | Implement logic from `scripts/health_gate_strict.py` into the FastAPI startup. | 3 |

### 2.2. Task Group: Foundational Services

| ID | Task Description | Source Code Integration | Effort (Days) |
| :--- | :--- | :--- | :--- |
| **1.4** | **OpenBao (Vault) Deployment:** Execute the Ansible playbooks from `sevensa_infra_repo` to deploy and bootstrap the OpenBao server. | Execute `roles/central_vault/tasks/main.yml` via Ansible. | 7 |
| **1.5** | **Secret Management Integration:** Integrate the FastAPI backend with the OpenBao client for all sensitive configurations (API keys, DB credentials). | Implement logic from `vault_snippet.md` into `/backend/app/core/config.py`. | 5 |
| **1.6** | **LTSD Service Mockup:** Establish the dedicated LTSD microservice structure. | Finalize `/backend/ltsd_service/app.py` and ensure it runs as a separate container. | 3 |

---

## 3. Phase 2: CI/CD and Testing Readiness (6 Weeks)

Focus on operational readiness by restoring the comprehensive E2E testing suite and integrating it into the CI/CD pipeline.

### 3.1. Task Group: Testing Restoration

| ID | Task Description | Source Code Integration | Effort (Days) |
| :--- | :--- | :--- | :--- |
| **2.1** | **E2E Test Restoration (Playwright):** Restore and adapt the Playwright E2E tests for the core PSRA origin check and LTSD routes. | Adapt `09_e2e_playwright/tests/e2e/psr-routes.spec.ts` to the new monorepo API structure. | 10 |
| **2.2** | **Load Testing Integration (k6):** Integrate the k6 load tests to validate the sub-2 second latency requirement under load. | Adapt `k6/load_test.js` to target the new PSRA API endpoints. | 7 |
| **2.3** | **Fullstack CI Bundle Integration:** Integrate the full CI bundle to ensure automated ETL and health checks run on every commit. | Integrate logic from `11_fullstack_ci_bundle_v1/scripts/etl_from_json_to_db.py` into the CI pipeline. | 8 |

### 3.2. Task Group: Data and LTSD API

| ID | Task Description | Source Code Integration | Effort (Days) |
| :--- | :--- | :--- | :--- |
| **2.4** | **PSR Data Migration and Access:** Complete the migration of all PSR YAML data into the monorepo's PostgreSQL database and finalize the data access layer. | Finalize ETL process using `/backend/app/etl/ingest_rules.py` and the `psr.service.ts` logic. | 10 |
| **2.5** | **LTSD API Finalization:** Implement the full API endpoints for LTSD evaluation and generation. | Finalize `app/api/ltsd-addon/evaluate/route.ts` and `generate/route.ts`. | 5 |

---

## 4. Phase 3: Admin UI and Enterprise Modules (8 Weeks)

Focus on connecting the front-end components to the backend services and establishing the necessary ERP integration points.

### 4.1. Task Group: UI Integration

| ID | Task Description | Source Code Integration | Effort (Days) |
| :--- | :--- | :--- | :--- |
| **3.1** | **Admin Dashboard Connection:** Connect the existing Admin UI components to the PSRA/LTSD management endpoints (e.g., rule updates, audit logs). | Connect `frontend/components/PersonaViews/AdminView.tsx` to `/backend/app/modules/platform/routes.py`. | 10 |
| **3.2** | **Supplier Portal Connection:** Connect the Supplier Portal UI to the LTSD generation and submission endpoints. | Connect `frontend/supplier-portal/main_magic.jsx` to the LTSD API. | 10 |
| **3.3** | **Certificate Generation UI:** Implement the final UI flow for generating and downloading the PDF certificate, linked to the Version Ledger. | Implement logic in the Next.js UI to call `app/api/certificates/[id]/route.ts`. | 7 |

### 4.2. Task Group: ERP Integration Points

| ID | Task Description | Source Code Integration | Effort (Days) |
| :--- | :--- | :--- | :--- |
| **3.4** | **Inventory Module Integration:** Implement the necessary data models and repository logic in the Inventory module to support PSRA's material cost and recipe lookups. | Finalize `/backend/app/modules/inventory/models.py` and `repo.py`. | 10 |
| **3.5** | **External Connector Finalization:** Finalize the ETL process for external data sources (HMRC, WCO, TARIC) to ensure continuous data updates for the Rules-as-Data Engine. | Finalize `/backend/app/connectors/*.py` and the ETL scripts. | 10 |

---

## 5. Phase 4: AI Finalization and Operational Excellence (2 Weeks)

The final phase focuses on completing the AI-driven features and ensuring the system is fully observable and ready for production deployment.

### 5.1. Task Group: AI and Orchestration

| ID | Task Description | Source Code Integration | Effort (Days) |
| :--- | :--- | :--- | :--- |
| **4.1** | **RL-HITL Finalization:** Implement the full feedback loop, connecting the HITL API endpoint to the model fine-tuning process. | Integrate the feedback loop logic into the LangGraph Orchestrator. | 5 |
| **4.2** | **AI Orchestrator Finalization (Phase 10):** Integrate the VPS orchestration scripts into the monorepo's deployment process. | Finalize `vps-complete-setup/orchestrator.py` and integrate it into the CI/CD pipeline. | 5 |

### 5.2. Task Group: Operational Readiness

| ID | Task Description | Source Code Integration | Effort (Days) |
| :--- | :--- | :--- | :--- |
| **4.3** | **Observability Stack Finalization:** Deploy and configure the full Grafana/Prometheus stack, including PSRA-LTSD specific dashboards and alerts. | Deploy manifests from `/k8s` and configure dashboards from `/grafana`. | 5 |
| **4.4** | **Final UAT and Documentation:** Execute the final UAT plan and update all technical documentation for handover. | Execute `uat/UAT_PLAN.md` and update all relevant `docs/` files. | 5 |

---

## 6. Resource Allocation and Timeline Summary

The total estimated effort for full application functionality restoration and integration into the Enterprise Monorepo is **20 weeks** (100 working days).

| Phase | Master Plan Focus | PSRA-LTSD Focus | Duration (Weeks) |
| :--- | :--- | :--- | :--- |
| **1** | Stabilization | Monorepo Integration, OpenBao/Vault Setup | 4 |
| **2** | CI/CD | E2E Testing, LTSD API Finalization | 6 |
| **3** | Admin UI | UI Connection, ERP Integration Points | 8 |
| **4** | AI Finalization | RL-HITL, Observability Stack | 2 |
| **Total** | | **Full PSRA-LTSD Enterprise v2 Functionality** | **20 Weeks** |

---
*End of Roadmap Document*
