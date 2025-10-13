# PSRA-LTSD Codebase Regression Analysis and Inventory Report

## 1. Executive Summary

This report documents the extensive regression analysis performed on the newly provided codebase archive, which contains a large volume of historical code, configuration, and documentation files related to the PSRA-LTSD project. The analysis reveals a complex, multi-version history, including:
*   **Legacy Python/Flask Application:** A standalone application (`psra_origin_checker_standalone`) with a comprehensive set of business logic modules (e.g., `origin_checker_logic.py`, `erp_integration.py`, `certificate_generator.py`).
*   **Next.js/Prisma Integration:** Multiple attempts at modernizing the data layer using Prisma and Next.js for API routing (`07_prisma_db_integration`, `08_dual_route_auto`).
*   **Matrix/Rules Engine Evolution:** Several versions of a dedicated PSR (Product Specific Rules) Matrix engine (`01_psr_rules_addon_v1`, `02_matrix_enterprise_v0`, `03_matrix_enterprise_v1`), confirming the core business logic is rules-driven.
*   **ML/AI Stack:** Confirmation of the existence of a separate ML microservices stack (`psra-ml-stack` within the `/test` directory) containing `embed`, `classify`, and `rag` services, which aligns with the previous integration efforts.
*   **Extensive Documentation:** A wealth of planning, UAT, and technical documentation (e.g., `Enterprise UAT Plan`, `PSRA System Debug & Fix Tasks`, `ROADMAP.csv`), which will be crucial for defining the restoration roadmap.

The primary goal of the restoration roadmap must be to reconcile the features found in the legacy Python application and the Next.js/Prisma API routes with the current LangGraph/FastAPI architecture.

## 2. Codebase Inventory and Structure

The extracted files are organized into several distinct projects and historical snapshots. The key directories and their contents are summarized below.

### 2.1. Core Legacy Application (`psra_origin_checker_standalone`)

This directory appears to be the most complete version of the original application, likely built on Flask/Python.

| Component | Key Files | Functionality |
| :--- | :--- | :--- |
| **Business Logic** | `src/logic/*.py` (e.g., `origin_checker_logic.py`, `erp_integration.py`, `certificate_generator.py`, `predictive_analytics.py`) | Contains the core PSRA calculation, ERP synchronization, PDF certificate generation, and AI/ML integration logic. |
| **Web UI/Routes** | `src/routes/*.py`, `src/templates/*.html`, `src/static/js/*.js` | Defines the user interface, including admin views, supplier views, reporting, and the core origin check wizard (`step1_select_product.html`, `step2_results_certificate.html`). |
| **Data** | `data/*.sqlite`, `data/*.csv` | Contains the SQLite database files, material costs, recipes, and VHA (Value-Added) rules. |

### 2.2. Rules Engine Evolution (Matrix Addons)

These directories show the development of the core PSR rules engine, which is critical for the LangGraph's `fetch_rules` node.

| Version | Key Files | Focus |
| :--- | :--- | :--- |
| **`01_psr_rules_addon_v1`** | `rules/*.yaml`, `loader/psr_loader.py` | Initial YAML-based PSR rules definition (CETA, EU_JP_EPA, EU_UK_TCA) and a Python loader. |
| **`02_matrix_enterprise_v0`** | `api/main.py`, `build/build_matrices.py` | Introduction of an API layer and a build process to generate the rules matrix. |
| **`03_matrix_enterprise_v1`** | `integrations/psra_adapter.py` | Focus on integrating the matrix engine with the main PSRA application via an adapter. |
| **`05_integrator_addon_v3`** | `integrators/psr_integrator.py` | Further refinement of the rules integration and ETL process. |

### 2.3. Modernization Attempts (Prisma/Next.js)

These files indicate a shift towards a modern, type-safe data and API layer using TypeScript/Next.js.

| Directory | Key Files | Functionality |
| :--- | :--- | :--- |
| **`07_prisma_db_integration`** | `prisma/schema.fragment.prisma`, `lib/db/psr.service.ts` | Defines the database schema for PSRs and a TypeScript service for data access. |
| **`08_dual_route_auto`** | `app/api/psr-auto/*.ts`, `lib/psr/auto.service.ts` | Implementation of dynamic API routes for automated PSR lookups, likely for the "Dual Route" feature (PSR-DB vs. PSR-Auto). |
| **`api/ltsd-addon`** | `evaluate/route.ts`, `generate/route.ts` | API endpoints for the LTSD (Long-Term Supplier Declaration) feature, including evaluation and certificate generation. |

### 2.4. ML/AI and Infrastructure (`psra-ml-stack` in `/test`)

This confirms the structure of the ML microservices that were structurally ported in the previous development phase.

| Service | Key Files | Functionality |
| :--- | :--- | :--- |
| **`embed`** | `services/embed/app.py` | Sentence Transformer-based embedding service for RAG. |
| **`classify`** | `services/classify/app.py` | SetFit/Joblib-based classification service (e.g., document type, complexity). |
| **`rag`** | `services/rag/app.py` | Haystack-based Retrieval-Augmented Generation pipeline. |
| **Infrastructure** | `docker-compose.yml`, `prometheus.yml`, `vault_snippet.md` | Deployment and monitoring configuration for the ML stack. |

## 3. Regression Analysis: Missing Functions and Feature Gaps

The analysis identifies a significant gap between the current LangGraph/FastAPI architecture and the full feature set present in the legacy codebase. The current v2 platform is a minimal viable product focused on the core origin check, while the legacy system was a full enterprise application.

The following table summarizes the major missing functionalities that must be restored to achieve "full application functionality."

| Feature Group | Missing Functionality (Legacy Source) | Restoration Priority |
| :--- | :--- | :--- |
| **User Interface (UI)** | Full Admin Dashboard (`admin/*.html`), Supplier Portal (`supplier_view.html`), Origin Check Wizard (`step1_select_product.html`), Reporting UI. | **High** (Required for UAT and user adoption) |
| **Data Management** | Bulk Import/Export (`bulk_import_manager.py`), Data Update Manager (`data_update_manager.py`), Data Validation Manager. | **High** (Required for data integrity and ETL) |
| **ERP Integration** | Full ERP Synchronization Logic (`erp_integration.py`), API Endpoints for Partner Integration (`test/app/api/partner/v1`). | **High** (Core business requirement) |
| **LTSD Management** | LTSD Evaluation and Generation (`api/ltsd-addon/*.ts`, `lib/ltsd/*.ts`), Supplier Declaration Management. | **High** (Core business requirement) |
| **Certificate Generation** | PDF Certificate Generation (`certificate_generator.py`), including database storage and retrieval. | **Medium** (Critical for final output) |
| **Advanced Features** | Predictive Analytics (`predictive_analytics.py`), LLM Optimization/Active Learning (`llm_optimizer.py`). | **Medium** (Key for competitive advantage) |
| **CI/CD & Testing** | Full E2E Playwright tests (`09_e2e_playwright`), Fullstack CI Bundle (`11_fullstack_ci_bundle_v1`). | **High** (Required for Zero-Trust deployment) |

## 4. Conclusion for Roadmap Development

The development roadmap must focus on bridging the gap between the current v2 core (LangGraph/FastAPI) and the extensive enterprise features found in the legacy codebase. This involves:
1.  **Re-implementing** the legacy Python logic into the modern FastAPI service structure.
2.  **Adopting** the Next.js/Prisma API routing structure for the new UI.
3.  **Integrating** the functional ML microservices into the LangGraph workflow.

The next phase will use this inventory and gap analysis to construct the detailed 10-20 page development roadmap.

---
*This report was generated by Manus AI based on the analysis of the provided codebase archive.*
