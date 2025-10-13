# Consolidated PSRA-LTSD Codebase Regression Analysis and Inventory Report

**Date:** October 10, 2025
**Scope:** Analysis of all provided archives: `.github.zip`, `vps-complete-setup.zip`, `sevensa_infra_repo(1).zip`, and `CodebaseQ32025-1.zip`.

## 1. Executive Summary: Shift from Restoration to Integration

The initial analysis suggested a need for "restoration" of features from a fragmented legacy system. The inclusion of the **`CodebaseQ32025-1.zip`** archive, which appears to be a highly structured, multi-module monorepo, fundamentally changes the scope. The PSRA-LTSD v2 platform is not a standalone project but a core component within a larger **Enterprise Resource Planning (ERP) or multi-module system** (evidenced by modules like `billing`, `inventory`, `transport`).

The new roadmap must focus on **integrating** the existing LangGraph/FastAPI core into this comprehensive monorepo structure and **completing** the remaining features outlined in the newly discovered **10-Phase Development Plan**.

### 1.1. Key Findings from New Archives

| Archive | Primary Focus | Key Discovery | Strategic Impact |
| :--- | :--- | :--- | :--- |
| **`CodebaseQ32025-1.zip`** | **Enterprise Monorepo** | Full modular FastAPI backend (`/backend`), Next.js UI, **10-Phase Development Plan** (`/phases`). | Defines the complete target architecture and the remaining work. |
| **`sevensa_infra_repo(1).zip`** | **Infrastructure Automation** | Ansible roles for **OpenBao (Vault)** and Docker Compose setup. | Confirms the Zero-Trust, automated deployment strategy and provides the tools for IAM/Secret Management integration. |
| **`vps-complete-setup.zip`** | **VPS Orchestration** | Dedicated `orchestrator.py` and `claude_chat` service. | Introduces a new, high-level **AI Orchestration Layer** for managing the VPS environment and providing a direct LLM interface. |

## 2. Consolidated Codebase Inventory and Structure

The codebase is organized around a modern monorepo structure, primarily using Python (FastAPI) for the backend and TypeScript/Next.js for the frontend.

### 2.1. Core Backend Monorepo (`CodebaseQ32025-1.zip`)

The `/backend` directory reveals a comprehensive, modular architecture built on FastAPI and Alembic (for database migrations).

| Directory/Module | Key Files | Functionality | PSRA-LTSD Relevance |
| :--- | :--- | :--- | :--- |
| **`/backend/app/modules`** | `auth`, `billing`, `inventory`, `transport`, `projects` | **Full ERP/Enterprise Feature Set.** Suggests PSRA is one of many integrated modules. | PSRA must integrate with these modules (e.g., `inventory` for materials, `billing` for reporting). |
| **`/backend/orchestrator`** | `ensemble_policy.yaml`, `router.py` | **Multi-LLM Consensus Core.** This is the intended home for the LangGraph logic and the Judge-Model. | Direct integration point for the current v2 core. |
| **`/backend/rules_engine`** | `origin.py`, `test_origin.py` | **Dedicated PSRA Logic.** Contains the specific Python implementation of the origin calculation. | Source for the final, production-ready PSRA logic. |
| **`/backend/ltsd_service`** | `app.py`, `requirements.txt` | **Dedicated LTSD Microservice.** Confirms LTSD is a separate, critical service. | Must be integrated with the main API and the Certificate Generation feature. |
| **`/backend/connectors`** | `hmrc.py`, `taric.py`, `wco.py` | **External Data Connectors.** Essential for ETL and real-time data updates. | Critical for the Rules-as-Data Engine (RAG). |

### 2.2. Frontend and API Routing

The frontend is a Next.js application, and the API routes are defined in a modern, file-based routing structure.

| Directory/Module | Key Files | Functionality | PSRA-LTSD Relevance |
| :--- | :--- | :--- | :--- |
| **`/app/api`** | `certificates`, `ltsd-addon`, `psr-auto`, `psr-db` | **API Gateway/Routing.** Defines the public-facing endpoints for PSRA and LTSD features. | Confirms the need to implement the LTSD and Certificate Generation APIs. |
| **`/frontend`** | `AdminView.tsx`, `SupplierView.tsx`, `ValidationDashboard.tsx` | **Full UI Components.** Confirms the existence of the full Admin and Supplier portal components. | Restoration of the UI is now an integration task, not a rebuild. |
| **`/lib/ltsd`** | `engine.ts`, `template.ts` | **LTSD Logic (TypeScript).** Mirroring the Python service, this is the client-side logic. | Essential for the UI to interact with the LTSD service. |

### 2.3. Infrastructure and Orchestration

| Directory/Module | Key Files | Functionality | Strategic Impact |
| :--- | :--- | :--- | :--- |
| **`/sevensa_infra/roles/central_vault`** | `bootstrap_init_openbao.sh.j2`, `import_secrets.py.j2` | **Zero-Trust Secret Management.** Provides the Ansible playbooks to deploy and configure OpenBao (Vault). | Directly enables the **IAM Readiness** task in the v2 roadmap. |
| **`/vps_setup`** | `orchestrator.py`, `claude_chat/app.py` | **VPS Management and AI Interface.** Suggests a high-level Python script manages deployment and provides a direct LLM interface for the VPS. | This is the final layer of the **AI Orchestrator** feature (Phase 10 of the discovered plan). |
| **`/k8s`** | `app-deploy.yaml`, `gateway-deploy.yaml` | **Kubernetes Manifests.** Confirms the deployment target for the monorepo. | Ensures the v2 components are deployed correctly within the enterprise cluster. |

## 3. Regression Analysis: Feature Gaps and Integration Priorities

The primary gap is no longer "missing features" but the **integration and functional completion** of existing code within the monorepo. The new codebase provides a detailed **10-Phase Development Plan** that serves as the definitive roadmap for full functionality.

| Feature Group | Status in Consolidated Codebase | Integration Priority |
| :--- | :--- | :--- |
| **PSRA Origin Engine (LangGraph)** | **Structural Port:** Logic exists in `/backend/orchestrator` and `/backend/rules_engine`. | **High:** Integrate the current LangGraph implementation into the `/backend/orchestrator` structure. |
| **LTSD Management** | **Dedicated Service:** Logic exists in `/backend/ltsd_service` (Python) and `/lib/ltsd` (TypeScript). | **High:** Complete the LTSD service implementation and connect it to the API routes (`/app/api/ltsd-addon`). |
| **ERP/Enterprise Modules** | **Modular Structure Exists:** Modules for `inventory`, `billing`, `transport` are defined. | **Medium:** Implement the core data models and repository logic for these modules to support PSRA's integration needs. |
| **UI (Admin/Supplier)** | **Components Exist:** React components for Admin and Supplier views are present. | **High:** Connect these existing components to the restored API endpoints. |
| **Secret Management (IAM)** | **Ansible Playbooks Exist:** OpenBao/Vault setup is defined in `sevensa_infra`. | **High:** Execute the OpenBao deployment and integrate the backend services with the Vault client. |
| **AI Orchestration** | **VPS Scripts Exist:** `orchestrator.py` and `claude_chat` are present. | **Low (Phase 10):** Finalize this feature after all core application logic is stable. |

## 4. Conclusion for Roadmap Development

The new roadmap will be based on the **10-Phase Development Plan** found in the `/codebase_q3/phases` directory, which provides a structured, long-term vision for the entire enterprise suite. The PSRA-LTSD restoration tasks will be mapped directly onto the relevant phases of this master plan. This approach ensures that the PSRA-LTSD project is developed in alignment with the broader enterprise architecture.

---
*This report was generated by Manus AI based on the consolidated analysis of all provided codebase archives.*
