# PSRA-LTSD Enterprise v2 Restoration and Development Roadmap (15 Pages)

**Author:** Manus AI
**Date:** October 10, 2025
**Goal:** Achieve full application functionality by reconciling legacy enterprise features with the modern LangGraph/FastAPI architecture.

---

## 1. Executive Summary: Bridging the Feature Gap

The PSRA-LTSD Enterprise v2 platform, currently centered on the core **LangGraph Origin Engine**, represents a strong foundation for the future. However, the regression analysis of the historical codebase reveals a significant feature gap compared to the full enterprise functionality previously developed. The legacy system included comprehensive **ERP Integration**, **LTSD Management**, a full **User Interface (UI)** with admin and supplier portals, and robust **Data Management** tools.

This roadmap outlines a phased approach to restore these critical enterprise features, integrating them seamlessly into the modern, scalable, and EU AI Act-compliant v2 architecture. The plan prioritizes features based on business criticality (ERP, LTSD) and compliance (UI for auditability).

### 1.1. Strategic Alignment

| Strategic Goal | Current v2 Status | Restoration Focus |
| :--- | :--- | :--- |
| **90% Gross Margin** | Gating/Caching logic implemented. | Restore **ERP Integration** to automate data flow and reduce manual input costs. |
| **EU AI Act Compliance** | Version Ledger and Explainability integrated. | Restore **LTSD Management** and **Certificate Generation** for auditable output artifacts. |
| **Enterprise Readiness** | Kubernetes optimized, IAM readiness complete. | Restore **Full UI (Admin/Supplier)** and **E2E Testing** for operational stability and user adoption. |

---

## 2. Phase 1: Data and Core Services Restoration (4 Weeks)

This phase focuses on restoring the foundational data management and PSR (Product Specific Rules) engine capabilities, which are prerequisites for all other features.

### 2.1. Task Group: Rules Engine Finalization

| ID | Task Description | Legacy Source | Target v2 Component | Effort (Days) |
| :--- | :--- | :--- | :--- | :--- |
| **1.1** | **Functional ML Integration:** Integrate actual model loading and inference logic from `psra-ml-stack/services/embed/app.py` and `classify/app.py` into `ml_service.py`. | `psra-ml-stack` | `ml_service.py`, LangGraph `classify` node | 5 |
| **1.2** | **PSR Data Migration:** Migrate all historical PSR YAML files (CETA, EU_JP_EPA, TCA) from `01_psr_rules_addon_v1/rules` into a structured database (e.g., PostgreSQL). | `01_psr_rules_addon_v1` | PostgreSQL Schema, ETL Scripts | 7 |
| **1.3** | **PSR Data Access Layer:** Implement the data access layer (DAL) in FastAPI to replace the current `MockVersionLedgerService` for rule retrieval, utilizing the migrated PSR data. | `07_prisma_db_integration/lib/db/psr.service.ts` | FastAPI DAL (Python) | 5 |

### 2.2. Task Group: Data Management and ETL

| ID | Task Description | Legacy Source | Target v2 Component | Effort (Days) |
| :--- | :--- | :--- | :--- | :--- |
| **1.4** | **Bulk Import/Export API:** Restore API endpoints for bulk import of material costs and recipes, utilizing logic from `bulk_import_manager.py`. | `logic/bulk_import_manager.py` | FastAPI API Endpoints | 6 |
| **1.5** | **Data Validation Service:** Restore the core data validation logic from `data_validation_manager.py` to ensure input quality before processing by the LangGraph engine. | `logic/data_validation_manager.py` | FastAPI Service Layer | 5 |

---

## 3. Phase 2: Enterprise Integration and LTSD (6 Weeks)

This phase restores the critical ERP and LTSD functionalities, directly impacting the projected gross margin and compliance.

### 3.1. Task Group: ERP Integration Restoration

| ID | Task Description | Legacy Source | Target v2 Component | Effort (Days) |
| :--- | :--- | :--- | :--- | :--- |
| **2.1** | **ERP Adapter Service:** Restore the core ERP integration logic, focusing on data synchronization and error handling from `erp_integration.py`. | `logic/erp_integration.py` | FastAPI Service (`erp_integration_service.py`) | 10 |
| **2.2** | **Partner API Restoration:** Restore the external-facing Partner API endpoints for origin checks and certificate retrieval, based on the Next.js API structure. | `test/app/api/partner/v1` | FastAPI API Endpoints | 8 |
| **2.3** | **Webhooks Implementation:** Implement the webhook notification system for asynchronous updates to partner systems (e.g., ERP, WMS). | `test/lib/notifications/webhook.ts` | FastAPI Webhook Service | 7 |

### 3.2. Task Group: LTSD Management

| ID | Task Description | Legacy Source | Target v2 Component | Effort (Days) |
| :--- | :--- | :--- | :--- | :--- |
| **2.4** | **LTSD Evaluation Logic:** Restore the core logic for evaluating the validity and compliance of Long-Term Supplier Declarations. | `api/ltsd-addon/evaluate/route.ts`, `lib/ltsd/engine.ts` | FastAPI API Endpoints, `ltsd_service.py` | 8 |
| **2.5** | **Certificate Generation Service:** Restore the PDF generation logic from `certificate_generator.py` and integrate it with the Version Ledger to log the generated artifact. | `logic/certificate_generator.py` | FastAPI Service, Version Ledger | 7 |

---

## 4. Phase 3: User Interface and Operational Readiness (8 Weeks)

This phase focuses on the front-end restoration, E2E testing, and advanced features required for a complete enterprise solution.

### 4.1. Task Group: Front-End Restoration (Next.js/React)

The front-end should be built using the Next.js/React structure found in `apps/ui`.

| ID | Task Description | Legacy Source | Target v2 Component | Effort (Days) |
| :--- | :--- | :--- | :--- | :--- |
| **3.1** | **Origin Check Wizard UI:** Restore the multi-step origin check wizard, integrating with the new FastAPI endpoints. | `src/templates/step1_select_product.html` | Next.js `app/origin/new/page.tsx` | 10 |
| **3.2** | **Admin Dashboard UI:** Restore the full Admin Dashboard, including user management, audit logs, and system settings. | `src/templates/admin/*.html` | Next.js `app/settings/page.tsx` | 15 |
| **3.3** | **Supplier Portal UI:** Restore the Supplier Portal for managing supplier declarations and LTSDs. | `src/templates/suppliers.html` | Next.js `app/suppliers/page.tsx` | 10 |

### 4.2. Task Group: Testing and Advanced Features

| ID | Task Description | Legacy Source | Target v2 Component | Effort (Days) |
| :--- | :--- | :--- | :--- | :--- |
| **3.4** | **E2E Test Restoration:** Restore and adapt the Playwright E2E tests to validate the new FastAPI/Next.js routes. | `09_e2e_playwright/tests/e2e/psr-routes.spec.ts` | CI/CD Pipeline | 10 |
| **3.5** | **Predictive Analytics Integration:** Restore the logic for predictive analytics (e.g., risk scoring) and integrate it as an optional node in the LangGraph workflow. | `logic/predictive_analytics.py` | LangGraph Node, FastAPI Endpoint | 10 |
| **3.6** | **LLM Optimization/RL-HITL Finalization:** Finalize the RL-HITL feedback loop by integrating the logic from `llm_optimizer.py` to use human feedback for model fine-tuning. | `llm_optimizer.py` | RL-HITL Pipeline | 5 |

---

## 5. Phase 4: Final Deployment and Monitoring (2 Weeks)

This final phase ensures the system is production-ready, observable, and fully compliant with the Zero-Trust methodology.

| ID | Task Description | Legacy Source | Target v2 Component | Effort (Days) |
| :--- | :--- | :--- | :--- | :--- |
| **4.1** | **Vault/Keycloak Integration:** Implement the final Vault/Keycloak integration using the prepared Kubernetes manifests and the `vault_snippet.md` for secret and IAM management. | `test/psra-ml-stack/security/vault_snippet.md` | Kubernetes, FastAPI | 5 |
| **4.2** | **Observability Stack Finalization:** Finalize Grafana dashboards and Prometheus alerts based on the legacy monitoring configuration. | `test/ops/grafana/*.json`, `test/prometheus/prometheus.yml` | Monitoring Stack | 5 |
| **4.3** | **Final UAT and Documentation:** Execute the full UAT plan and update all technical documentation (`PSRA Origin Checker - Technical Documentation.md`). | `Enterprise UAT Plan - PSRA_LTSD Complete Feature Validation.md` | Documentation, Final Release | 5 |

---

## 6. Resource Allocation and Timeline Summary

The total estimated effort for full application functionality restoration is **20 weeks** (100 working days), structured into four distinct phases.

| Phase | Focus | Duration (Weeks) | Key Deliverable |
| :--- | :--- | :--- | :--- |
| **1** | Data and Core Services Restoration | 4 | Functional ML Integration, PSR Data Access Layer |
| **2** | Enterprise Integration and LTSD | 6 | Functional ERP Integration, LTSD Certificate Generation |
| **3** | User Interface and Operational Readiness | 8 | Full Admin/Supplier UI, E2E Test Suite |
| **4** | Final Deployment and Monitoring | 2 | Zero-Trust IAM, Production Observability |
| **Total** | | **20 Weeks** | **Full PSRA-LTSD Enterprise v2 Functionality** |

---
*End of Roadmap Document*
