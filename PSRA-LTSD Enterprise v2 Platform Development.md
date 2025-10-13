# PSRA-LTSD Enterprise v2 Platform Development

This repository contains the ongoing development for the PSRA-LTSD Enterprise v2 platform, focusing on a high-performance, multi-tenant, and EU AI Act-compliant solution for preferential origin determination and LTSD management.

## 1. Project Overview

The platform is built around a **LangGraph Origin Engine** utilizing a **Multi-LLM Consensus Core** and a **Rules-as-Data Engine**. The architecture is designed for scalability, sub-2 second response times, and a high gross margin through advanced caching and gating mechanisms.

**Key Technologies:**
*   **AI/ML:** LangGraph, Multi-LLM Consensus, RL-HITL
*   **Backend:** FastAPI (API Server)
*   **Frontend:** React.js
*   **Infrastructure:** Kubernetes (Kustomize, ArgoCD), Vault/Keycloak (IAM/Secrets)

## 2. Current Development Status (Phase 3: Infrastructure & Integration)

| Component | Status | Strategic Alignment |
| :--- | :--- | :--- |
| **LangGraph Origin Engine** | **Implemented (Gating/Explainability)** | **90% Gross Margin** (via Gating) and **EU AI Act Compliance** (via Explainability outputs). |
| **Kubernetes Infrastructure** | **In Progress (IAM Readiness)** | Prepared base manifests for integration with external IAM (Keycloak) and Secret Management (Vault) for future SSO/RBAC implementation. |
| **Version Ledger** | **Design Complete** | Data model designed for immutable audit trail of rules and decisions. Implementation pending. |
| **RL-HITL Framework** | **Design Pending** | Core logic for human-in-the-loop escalation is in place; feedback loop implementation pending. |

## 3. Code Re-use Analysis Plan: PSRA-LTSD v5.6 ML Stack

A legacy codebase, `PSRA-LTSD_v5.6_+ML.zip` (unzipped to `/home/ubuntu/psra_v5_6_ml_codebase/psra-ml-stack`), has been acquired. This stack contains a set of ML microservices that may accelerate the development of the LangGraph Origin Engine's underlying components.

**Analysis Goal:** Identify reusable services and components to enhance the current LangGraph architecture, specifically for the RAG and Classification steps within the Multi-LLM Consensus Core.

| ML Stack Component | Potential Re-use in v2 | Action Plan |
| :--- | :--- | :--- |
| **`qdrant` & `embed`** | Vector DB and Embedding service for the **Rules-as-Data Engine** (RAG). | **High Priority:** Integrate the `embed` service into the LangGraph `fetch_rules` node to retrieve relevant rules based on product input. |
| **`rag`** | Haystack-based retrieval and answer synthesis. | **Medium Priority:** Evaluate if the `rag` service can replace or augment the LLM calls in the Multi-LLM Consensus Core for rule-based reasoning. |
| **`classify`** | Few-shot SetFit classifiers for document/HS code relevance. | **High Priority:** Use the `classify` service as a pre-processing step or as part of the **Judge-Model** logic to validate the input data quality and relevance. |
| **`bento-gateway`** | Unified API gateway orchestrator. | **Low Priority:** The current FastAPI API server is the primary orchestrator. The logic within the `bento-gateway` may contain useful orchestration patterns for the LangGraph API layer. |
| **`security/vault_snippet.md`** | Vault integration examples. | **High Priority:** Use this snippet to inform the final implementation of the Vault/OpenBao integration in the Kubernetes infrastructure. |

**Next Step (Phase 4):** The implementation of the Version Ledger and RL-HITL will proceed, but the LangGraph implementation will be updated to integrate the reusable components identified in this analysis.

## 4. Updated Development Roadmap

Refer to `docs/roadmap/updated_development_roadmap.md` for the detailed, prioritized roadmap.



## 5. Hourly Status Log

### 05:46 AM Status Update (Phase 4: Version Ledger & RL-HITL Mockup)

**Progress:**
*   **Version Ledger Persistence Layer (Mockup):** Completed a mock in-memory service (`version_ledger_service.py`) and Pydantic models (`version_ledger.py`) for the immutable ledger.
*   **RL-HITL Integration:**
    *   Implemented the `/hitl/feedback` API endpoint in the FastAPI server to capture human corrections.
    *   Integrated the logging of all origin decisions into the **LangGraph Origin Engine** (`origin_calculation_graph.py`), ensuring every calculation is logged to the Version Ledger with a unique `decision_id` and `rule_version_id`.
    *   The LangGraph now correctly sets the `escalation_status` to `PENDING_HITL` for low-confidence results.

**Next Focus:**
*   **Integrate ML Stack Components:** Begin integrating the reusable components from the `psra-ml-stack` (specifically the `embed` and `classify` services) into the LangGraph workflow to replace the current mock functions. This is critical for the next iteration of the `fetch_rules` and `judge` nodes.

**Git Commit:** `FEAT: Implement Version Ledger service mockup and integrate RL-HITL logging into LangGraph.`


### 06:46 AM Status Update (Phase 4: ML Component Integration Mockup)

**Progress:**
*   **ML Component Integration Mockup:** Completed the integration of mock services for the reusable ML components from the v5.6 ML stack into the LangGraph workflow.
    *   **`ml_service_mock.py`** created to simulate the `embed` (Qdrant RAG) and `classify` services.
    *   **LangGraph Update:** The workflow was refactored to include a new `classify` node and the `fetch_rules` node now uses the RAG-based `ml_service` instead of the simple mock.
    *   **Gating Enhancement:** The `gating` node now uses the ML classification result (`is_complex_case`) to force a cache miss and ensure complex cases always go through the full Multi-LLM Consensus, aligning with the financial strategy.

**Next Focus:**
*   **Kubernetes Manifest Refinement:** The next step is to refine the Kubernetes manifests to ensure they are ready for the deployment of the integrated LangGraph and the future ML microservices. This includes checking the HPA configuration for the sub-2 second response time requirement.

**Git Commit:** `FEAT: Integrate ML Stack components (Embed/Qdrant/Classify) mockups into LangGraph workflow.`


### 07:46 AM Status Update (Phase 3: Kubernetes Optimization)

**Progress:**
*   **Kubernetes HPA Optimization:** Refined the Horizontal Pod Autoscaler (HPA) configuration (`hpa.yaml`) to prioritize low latency (sub-2 second response time).
    *   Increased `minReplicas` from 3 to 5 and `maxReplicas` to 20.
    *   Lowered `averageUtilization` target for CPU from 70% to 50% to trigger scaling sooner.
    *   Added a mock custom metric (`http_requests_in_flight`) to target scaling based on request queue depth.
*   **Readiness Probe Tuning:** Tuned the readiness probe in `deployment.yaml` to be more aggressive (shorter `periodSeconds` and `timeoutSeconds`) for faster detection of service degradation.

**Next Focus:**
*   **Finalize Kubernetes IAM Readiness:** Review the `deployment.yaml` to ensure all necessary environment variables for Vault/Keycloak are correctly configured and prepare a final Kubernetes manifest push.

**Git Commit:** `INFRA: Refine Kubernetes HPA and readiness probes for sub-2s latency requirement.`


### 08:46 AM Status Update (Phase 3: Kubernetes Finalization)

**Progress:**
*   **Kubernetes Deployment Finalization:** Completed the final review and synchronization of the Kubernetes deployment manifests.
    *   The `replicas` count in `deployment.yaml` was synchronized with the `minReplicas` count (5) in `hpa.yaml` to ensure the minimum required capacity for low-latency operation is guaranteed upon deployment.
    *   All necessary environment variables for **Vault/Keycloak** integration were confirmed to be present in `deployment.yaml` and `configmap.yaml`, completing the **IAM Readiness** task.

**Next Focus:**
*   **Integrate ML Stack Components (Real Code):** The next logical step is to move from mock services to integrating the actual code from the `psra-ml-stack` (unzipped in `/home/ubuntu/psra_v5_6_ml_codebase/psra-ml-stack`) into the FastAPI application structure, specifically focusing on the `embed` and `classify` services.

**Git Commit:** `INFRA: Sync deployment replicas with HPA minReplicas (5) for guaranteed low latency.`


### 09:46 AM Status Update (Phase 4: ML Service Integration - Real Code Structure)

**Progress:**
*   **ML Service Integration (Real Code Structure):** Successfully replaced the generic `ml_service_mock.py` with a new `ml_service.py` that mirrors the exact structure and function signatures of the core logic found in the v5.6 `embed/app.py` and `classify/app.py` files.
    *   This new service is a **direct structural port** of the legacy code, ensuring that when the required dependencies (SentenceTransformer, SetFit, joblib) are installed and models are available, the service will function as intended without further refactoring of the LangGraph integration.
    *   The LangGraph engine is now fully integrated with this new service structure.

**Next Focus:**
*   **Final Review and Report Generation:** The final hour will be dedicated to a comprehensive review of all implemented features and the generation of the final status report for 11:00 AM. This includes a final check of the Version Ledger and RL-HITL logic.

**Git Commit:** `FEAT: Replace ML service mock with v5.6-based service structure.`


### 10:46 AM Final Status Update (Phase 4: Final Review and Summary)

**Progress:**
*   **Comprehensive Review:** All major components for Phase 4 (Version Ledger, RL-HITL, and ML Integration Structure) have been implemented as mockups or structural ports, and the Kubernetes infrastructure has been optimized for the sub-2 second latency requirement.
*   **Key Deliverables Completed:**
    1.  **Gating/Explainability Logic** in LangGraph.
    2.  **Version Ledger Logging** integrated into LangGraph.
    3.  **RL-HITL Feedback API** implemented.
    4.  **ML Stack Re-use Analysis** completed and integrated into the new service structure.
    5.  **Kubernetes HPA/Deployment** optimized for performance and IAM readiness.
*   **Next Steps (Post 11:00 AM):** The immediate next step is to install the required Python dependencies (e.g., `sentence-transformers`, `setfit`) and integrate the actual model loading logic into `ml_service.py` to move from structural mockups to functional components.

**Git Commit:** *Final status log will be pushed with the final report.*
