# Version Ledger Data Model Design

The Version Ledger is a critical component for achieving **EU AI Act compliance** and **Audit-Readiness** (Phase 3/4 requirements). It must provide an immutable, traceable record of all rules, decisions, and human interventions.

## 1. Core Requirements

1.  **Immutability:** Once a record is written, it cannot be modified (suggests a blockchain-like ledger or a database with strict append-only policies, e.g., using a dedicated database or a time-series database).
2.  **Traceability:** Every origin calculation must link to the exact version of the rules used.
3.  **Reproducibility:** Historical decisions must be reproducible by retrieving the rule set and input data used at the time of calculation.
4.  **Audit Trail:** Must log all system decisions, confidence scores, and human-in-the-loop (HITL) interventions.

## 2. Proposed Data Model (PostgreSQL/NoSQL)

We propose two primary tables/collections: `RuleVersion` and `OriginDecision`.

### Table 1: RuleVersion (Immutable Rule Set)

This table stores the complete, versioned set of rules used by the Rules-as-Data Engine.

| Field Name | Data Type | Description | Indexing |
| :--- | :--- | :--- | :--- |
| `version_id` | UUID/Serial | **Primary Key.** Unique identifier for this rule set version. | Primary |
| `rule_set_name` | String | e.g., "PEM 2023", "UCC Annex 22-15" | |
| `effective_date` | Timestamp | Date/time when this rule set became active. | Time-series |
| `deactivation_date` | Timestamp | Date/time when this rule set was replaced (NULL if active). | |
| `rules_content` | JSON/Text | The full content of the rule set (e.g., a list of rules and their logic). | |
| `checksum` | String (SHA256) | Hash of the `rules_content` to ensure immutability and integrity. | Unique |
| `created_by` | String | User or system that uploaded the rule set. | |

### Table 2: OriginDecision (Immutable Decision Log)

This table logs every origin calculation performed by the LangGraph Origin Engine.

| Field Name | Data Type | Description | Indexing |
| :--- | :--- | :--- | :--- |
| `decision_id` | UUID/Serial | **Primary Key.** Unique identifier for the decision. | Primary |
| `tenant_id` | UUID | Identifier for the multi-tenant client. | Indexed |
| `timestamp` | Timestamp | Time of the calculation. | Time-series |
| `input_data` | JSON | The raw input data (product, materials, etc.) used for the calculation. | |
| `output_origin` | String | The final determined origin (e.g., "EU Preferential"). | |
| `confidence_score` | Float | The confidence score from the Judge-Model. | |
| `rule_citation` | String | The specific rule passage cited for Explainability. | |
| `rule_version_id` | UUID | **Foreign Key** linking to the exact `RuleVersion` used. | Indexed |
| `llm_trace` | JSON | Full trace of the Multi-LLM Consensus Core (inputs, outputs, individual confidence scores). | |
| `is_cached` | Boolean | True if the decision was made via the Gating/Caching mechanism. | |
| `escalation_status` | String | e.g., "NONE", "PENDING_HITL", "HITL_APPROVED", "HITL_OVERRULED" | |
| `hitl_log` | JSON | Log of human intervention (user, timestamp, reason, correction). | |

## 3. Integration with LangGraph

The `judge_model_and_explainability` node in the LangGraph Origin Engine must be responsible for:
1.  Retrieving the currently active `version_id` from the `RuleVersion` table.
2.  Populating all relevant fields in the `OriginDecision` table before the process ends.

This design ensures that the core business requirements for auditability and compliance are met, and it provides the foundation for the Phase 4 Compliance Dashboard.
