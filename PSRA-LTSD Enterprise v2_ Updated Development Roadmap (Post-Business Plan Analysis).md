# PSRA-LTSD Enterprise v2: Updated Development Roadmap (Post-Business Plan Analysis)

This roadmap is revised based on the strategic requirements outlined in the "Sevensa PSRA-LTSD Businessplan" and the "Subsidiekansen" documents. The focus is on integrating core technological differentiators, ensuring EU AI Act compliance readiness, and optimizing for the projected 90% Gross Margin through efficient LLM inference.

**Current State:** Development Phase 3 (Kubernetes/Infrastructure) is in progress. LangGraph Origin Engine and API server architecture are complete.

**Strategic Priority:** **PSRA-LTSD** development is prioritized over RentGuy. All efforts must focus on achieving the core PSRA-LTSD technical milestones.

## 1. Immediate Focus: Phase 3 Continuation & Business Integration

The immediate focus is to complete the Kubernetes infrastructure while integrating the critical business requirements into the core components.

| ID | Task Description | Strategic Driver | Deliverable | Status |
| :--- | :--- | :--- | :--- | :--- |
| **3.1** | **LangGraph Gating & Explainability Implementation** | **90% Gross Margin & EU AI Act Compliance** | Update `origin_calculation_graph.py` to explicitly implement the **Judge-Model & Gating** logic (caching/single-model inference for 70-80% of requests) and ensure output includes **Rule Passage Citation** and **Confidence Score**. | **To Do** |
| **3.2** | **Version Ledger Data Model Design** | **EU AI Act Compliance & Audit-Readiness** | Design document for the immutable data model to store all rule versions and decision logs (the **Version Ledger**). This informs the API/DB schema. | **To Do** |
| **3.3** | **Kubernetes IAM Readiness Assessment** | **Enterprise Features (SSO/RBAC)** | Review and update Kubernetes manifests (`implementation/phase3/kubernetes/`) to ensure readiness for external Identity and Access Management (IAM) components (e.g., Keycloak, OpenBao/Vault) for future SSO/RBAC implementation. | **To Do** |
| **3.4** | **Kubernetes HPA Optimization** | **High Performance (Sub-2s Response)** | Review and refine Horizontal Pod Autoscaler (HPA) configurations for the LangGraph Origin Engine to ensure sub-2 second response times under load, balancing performance with cost efficiency. | **In Progress** |
| **3.5** | **Finalize Phase 3 Documentation** | **Evidence-Based, Zero-Trust** | Complete the Kubernetes deployment documentation, including instructions for deploying the LangGraph Engine with the new Gating logic. | **To Do** |

## 2. Next Major Phase: Phase 4 (Enterprise & RL-HITL)

This phase focuses on implementing the enterprise-grade features and the continuous learning mechanism, which are critical for market expansion and WBSO/MIT subsidy claims.

| ID | Task Description | Strategic Driver | Deliverable |
| :--- | :--- | :--- | :--- |
| **4.1** | **RL-HITL Feedback Loop Implementation** | **Continuous Improvement & WBSO R&D** | Implement the API endpoints and database logic to capture human corrections and feed them back to the Judge-Model for reinforcement learning. |
| **4.2** | **SSO/RBAC Integration** | **Enterprise Readiness (Phase 3 Deliverable)** | Integrate Keycloak/OpenBao for Single Sign-On (SSO) and Role-Based Access Control (RBAC) across the API and Frontend. |
| **4.3** | **Version Ledger Implementation** | **Audit-Readiness** | Implement the immutable storage solution for the Version Ledger, ensuring all historical origin decisions are traceable. |
| **4.4** | **Compliance Dashboard MVP** | **PSRA-Manager Persona** | Develop the initial frontend dashboard for PSRA-Managers to view audit trails, confidence scores, and human-in-the-loop interventions. |

## 3. Technical Debt & Best Practices

All development must adhere to the following non-functional requirements:

*   **Multi-Tenant Architecture:** Maintain strict separation of data and configuration for all tenants.
*   **Performance:** All calculation endpoints must target a **sub-2 second response time**.
*   **Kubernetes Best Practices:** Utilize Kustomize/Helm for environment-specific configurations (Dev/Prod) and implement Network Policies for Zero-Trust networking.
*   **Code Quality:** Ensure all new and modified code is fully tested and adheres to established style guides.

This roadmap provides a clear path to align the technical implementation with the high-value, high-compliance requirements of the business plan. The immediate focus on **Gating** and **Explainability** is paramount for financial viability and regulatory compliance.
