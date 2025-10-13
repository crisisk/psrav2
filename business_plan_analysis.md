# PSRA-LTSD Business Plan and Subsidy Analysis

This document synthesizes the key findings from the "Sevensa PSRA-LTSD Businessplan" and "Subsidiekansen voor Sevensa PSRA-LTSD" documents to inform the ongoing development and strategic prioritization of the PSRA-LTSD Enterprise v2 platform.

## 1. Core Strategic and Technical Requirements

The project's success is fundamentally tied to its unique technological advantages and compliance features, which differentiate it from traditional rule-based systems.

| Category | Key Requirement/Feature | Business Justification | Technical Implication |
| :--- | :--- | :--- | :--- |
| **Core Technology** | **Multi-LLM Consensus Core** and **RL-HITL Architecture** | Superior accuracy, robustness, and continuous improvement. | Requires a multi-agent system (LangGraph) with a Judge-Model and a feedback loop mechanism. |
| **Compliance** | **Explainability per Rule Passage** and **Version Ledger** | Essential for audit-readiness, reducing legal risk, and meeting **EU AI Act** requirements. | The LangGraph Origin Engine must output the specific rule citation and version used for every decision. Requires a persistent, auditable storage mechanism for rule versions. |
| **Performance** | **Time per certificate $\le 3$ minutes** and **Rework Rate $< 1\%$** | Reduces operational costs and provides a strong ROI for customers. | Requires high-performance architecture, advanced caching, and efficient **Judge-Model & Gating** logic. |
| **Financial** | **Gating/Caching Logic** (70-80% of requests) | Critical for maintaining the projected **90% Gross Margin** by minimizing high LLM inference costs (€0.08 per certificate). | The advanced caching implemented must function as the primary 'gating' mechanism, only escalating to the full Multi-LLM Consensus Core when necessary. |
| **Market** | **API-first** with **Adapters** for competitors (AEB, MIC, etc.) | Enables seamless integration and positions PSRA-LTSD as a complementary tool, facilitating market entry. | Requires robust, well-documented API and a clear strategy for building integration layers. |
| **Enterprise** | **SSO, RBAC, Compliance Dashboard** | Necessary for targeting MKB+ and Enterprise customers (Phase 3). | The API and frontend architecture must be designed from the start to support these IAM features. |

## 2. Strategic Roadmap Integration

The development roadmap must be aligned with the business plan's phased approach, prioritizing features that unlock the next stage of growth and compliance.

| Business Plan Phase | Timeline | Key Technical Deliverables | Current Progress Alignment |
| :--- | :--- | :--- | :--- |
| **Phase 1: MVP & Pilot** | M1-M6 | Basic Multi-LLM Core, Rules-as-Data Engine, Explainability (confidence scores). | **Strong Alignment:** LangGraph Origin Engine and API server architecture are complete. |
| **Phase 2: Production & Scale** | M7-M12 | **RL-HITL**, **Judge-Model & Gating** (inference optimization), Full API documentation. | **Partial Alignment:** Advanced caching is done, but the RL-HITL feedback loop and explicit Judge-Model logic need formal implementation. |
| **Phase 3: Uitbreiding & Integratie** | M13-M24 | **Version Ledger**, **Enterprise Features (SSO, RBAC)**, Adapters. | **Future Focus:** These features must be incorporated into the current infrastructure design (Kubernetes/IAM) to avoid refactoring later. |
| **Phase 4: EU-uitbreiding & AI Act** | M25-M36 | Full **EU AI Act Governance** (logging, monitoring, explainability). | **Future Focus:** The current Kubernetes and CI/CD setup should be prepared for this level of governance and scaling (HA/DR). |

## 3. Subsidy-Driven R&D Focus

The subsidy strategy provides clear direction for prioritizing R&D efforts to secure funding (WBSO, MIT Zuid).

| R&D Focus Area | Subsidy Relevance | Technical Priority |
| :--- | :--- | :--- |
| **Multi-LLM Architecture** | Technical-scientific research (WBSO) | Formalize the LangGraph structure to explicitly show the multi-agent consensus and Judge-Model logic. |
| **RL-HITL Framework** | Technical-scientific research (WBSO) | Implement the feedback loop mechanism to capture human corrections and use them for model refinement. |
| **AI Act Compliance Module** | Compliance and innovation (WBSO, MIT) | Ensure the **Explainability** and **Audit-Trail** features are robust, including the **Version Ledger** design. |

## 4. Immediate Next Steps for Development

Based on the synthesis, the immediate next steps should focus on formalizing the core technological differentiators and ensuring the infrastructure supports the critical Phase 3 enterprise features.

1.  **Refine LangGraph Engine:** Explicitly implement the **Explainability** (rule citation, confidence score) and **Judge-Model/Gating** logic within `/home/ubuntu/git/PSRA-LTSD-v02/implementation/phase1/origin_engine/origin_calculation_graph.py`.
2.  **Design Version Ledger:** Create a design document for the **Version Ledger** (Phase 3) to ensure the current API/DB schema can support it.
3.  **Kubernetes/IAM Preparation:** Review the current Kubernetes configuration (`/home/ubuntu/git/PSRA-LTSD-v02/implementation/phase3/kubernetes/README.md`) to ensure it is ready for **SSO/RBAC** integration (e.g., readiness for Keycloak/OpenBao sidecars or external services).
4.  **Update Roadmap:** Formalize the updated roadmap in a dedicated document.
