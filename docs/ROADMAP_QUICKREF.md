# ROADMAP.md Quick Reference Guide

## Document Overview

**File:** `/home/vncuser/psra-ltsd-enterprise-v2/docs/ROADMAP.md`
**Size:** 54KB (1,366 lines)
**Created:** October 13, 2025
**Source:** Sevensa_Development_TaskMatrix.xlsx (125 tasks)

---

## Key Statistics

- **Total Tasks**: 125
- **Total Effort**: 1,264 person-days (~5.7 person-years)
- **Year 1**: 49 tasks, 369 days (Foundation & Compliance)
- **Year 2**: 26 tasks, 445 days (Scale & Innovation)
- **Year 3**: 23 tasks, 450 days (Market Leadership)
- **High-Impact Tasks**: 48 (38.4%)
- **Tasks with Dependencies**: 74 (59.2%)

---

## Document Structure

### 1. Executive Summary
- Mission statement
- Key metrics overview
- Strategic principles

### 2. Year 1: Foundation & Compliance (2025)
- **Y1-A**: PSRA Core Platform (172 days, 27 tasks)
  - JSON Schema, Parser, DAL, ETL, Origin Engine
  - Multi-LLM Orchestrator, LTSD Service, Partner API
- **Y1-B**: AI Act Compliance (40 days, 7 tasks)
  - Risk assessment, data governance, EU registration
- **Y1-C**: ESG Integration (32 days, 5 tasks)
  - UFLPA/EUDR connectors, ESG controls
- **Y1-D**: Go-to-Market (55 days, 5 tasks)
  - Market analysis, sales kit, 3-5 pilot customers
- **Y1-E**: Security & Certifications (70 days, 5 tasks)
  - ISO 27001, SOC2 Type 1
- **Supporting Infrastructure**:
  - Security (OpenBao, mTLS, Keycloak)
  - Observability (Prometheus, Grafana, SLO dashboards)
  - CI/CD (GitHub Actions, SBOM, Trivy)
  - Audit & Privacy (DSAR, RTBF, PITR backups)

### 3. Year 2: Scale & Innovation (2026)
- **Y2-A**: Low-Code/No-Code Platform (115 days, 6 tasks)
  - Drag-and-drop workflow builder, 20+ components
- **Y2-B**: AI Act Continuous Compliance (70 days, 4 tasks)
  - Internal/external audits, model drift monitoring
- **Y2-C**: Advanced Analytics & Risk (65 days, 4 tasks)
  - Data warehouse, ML models, risk dashboard
- **Y2-D**: Partner API v2.0 (60 days, 4 tasks)
  - OpenAPI v3, Python SDK, JS/TS SDK
- **Y2-E**: Partner Ecosystem (85 days, 4 tasks)
  - Partner program, LMS, portal, 10-15 partners
- **Y2-F**: Self-Hosted LLM (50 days, 4 tasks)
  - On-premises LLM deployment, fine-tuning pipeline

### 4. Year 3: Market Leadership (2027-2028)
- **Y3-A**: Generative AI Reporting (110 days, 5 tasks)
  - LLM-powered report drafts, HITL review
- **Y3-B**: AI Act Final Compliance (45 days, 4 tasks)
  - Final audit, Trust Center, regulator engagement
- **Y3-C**: Trade Intelligence Platform (80 days, 5 tasks)
  - Anonymized data intelligence, market insights
- **Y3-D**: Regulatory Horizon Scanning (70 days, 4 tasks)
  - Web scrapers, NLP forecasting, early warnings
- **Y3-E**: Global Expansion (145 days, 5 tasks)
  - US/APAC market entry, CCPA/PIPL compliance

### 5. Critical Path Analysis
- **Year 1 Critical Path**: 110 days
  - JSON Schema → Parser → DAL → ETL → Origin Engine → LTSD → ISO Audit
- **Year 2 Critical Path**: 150 days
  - LCNC Design → Execution Engine → Frontend → AI Act Audits
- **Year 3 Critical Path**: 180 days
  - GenAI Selection → Reporting Service → HITL → Global Expansion

### 6. Timeline & Gantt Charts
- **3 comprehensive Mermaid Gantt charts**:
  - Year 1 timeline with all phases
  - Year 2 timeline with parallel workstreams
  - Year 3 timeline with global rollout
- **Full 3-year Gantt chart** with 80+ tasks visualized

### 7. Risk Assessment
- **20 identified risks** with impact/probability/mitigation
- **Risk Matrix** (Mermaid diagram)
- **Risk Register** with owners and mitigation strategies
- Categories: Critical (4), High (7), Medium (7), Low (2)

### 8. Milestones & Deliverables
- **18 major milestones** (M1-M18)
- Quarterly targets with success criteria
- Examples:
  - M1: Core Engine Ready (Q1 2025)
  - M6: Certifications (Q4 2025)
  - M12: AI Act Re-Compliance (Q4 2026)
  - M18: AI Act Final Compliance (Q3 2027)

### 9. Resource Planning
- **Year 1**: 8-10 FTEs (€800K budget)
- **Year 2**: 12-15 FTEs (€1.2M budget)
- **Year 3**: 18-25 FTEs (€2.0M budget)
- **Total 3-Year Budget**: €4.0M

### 10. Success Metrics
- **Year 1 KPIs**: Test coverage (95%), ISO/SOC2 certs, 3-5 pilots
- **Year 2 KPIs**: 50+ LCNC workflows, 10-15 partners, €500K-€1M ARR
- **Year 3 KPIs**: 25-40 customers, €2M-€3M ARR, US/APAC expansion

### Appendices
- **Appendix A**: Task Inventory (CORE, LLM, Y1, Y2, Y3)
- **Appendix B**: Dependency Maps (3 Mermaid diagrams)
- **Appendix C**: Technology Stack
- **Glossary**: 40+ technical terms defined

---

## How to Use This Roadmap

### For Project Managers
1. Review **Critical Path Analysis** to identify bottlenecks
2. Monitor **Milestones** (M1-M18) for quarterly progress
3. Use **Risk Assessment** for proactive mitigation
4. Track **Resource Planning** for hiring pipeline

### For Engineers
1. Check **Task Inventory** for your team's assignments
2. Review **Dependency Maps** to understand blockers
3. Reference **Technology Stack** for implementation guidance
4. Use **Timeline Gantt Charts** for sprint planning

### For Leadership
1. Read **Executive Summary** for high-level overview
2. Review **Budget Estimates** and **Resource Planning**
3. Monitor **Success Metrics** (KPIs) quarterly
4. Track **Go-to-Market** and **Expansion** milestones

### For Compliance/Legal
1. Focus on **Y1-B**, **Y2-B**, **Y3-B** (AI Act phases)
2. Review **Risk Assessment** for regulatory risks
3. Track **Certification** milestones (ISO 27001, SOC2)
4. Monitor **GDPR/Privacy** tasks (DSAR, RTBF)

### For Sales/Marketing
1. Focus on **Y1-D** (Go-to-Market), **Y2-E** (Partner Ecosystem), **Y3-E** (Expansion)
2. Track **Milestone M5** (First Pilots), **M8** (Partner Launch), **M16/M17** (US/APAC)
3. Use **Sales Kit** and **Partner Program** deliverables

---

## Critical Dates to Remember

| Date | Event | Milestone |
|------|-------|-----------|
| **Q1 2025** | Core Engine Ready | M1 |
| **Q2 2025** | Platform MVP | M2 |
| **Q3 2025** | First Pilots Live | M5 |
| **Q4 2025** | ISO 27001 & SOC2 Certified | M6 |
| **Q2 2026** | LCNC Platform Beta | M7 |
| **Aug 2026** | AI Act Compliance Deadline | M12 |
| **Q4 2026** | Self-Hosted LLM Deployed | M10 |
| **Q2 2027** | GenAI Reporting Beta | M13 |
| **Aug 2027** | AI Act Final Compliance | M18 |
| **Q4 2027** | US Market Entry | M16 |
| **Q1 2028** | APAC Expansion | M17 |

---

## Top 10 High-Priority Tasks

1. **Y1-A.1**: Define JSON Schema for Rules-as-Code (3 days) - **CRITICAL**
2. **Y1-A.9**: Deterministic Origin Engine (10 days) - **CRITICAL**
3. **Y1-E.2**: Implement ISO 27001 Controls (30 days) - **CRITICAL**
4. **Y1-E.4**: ISO 27001 Stage 1 & 2 Audits (15 days) - **CRITICAL**
5. **Y1-B.7**: Register in EU AI System Database (2 days) - **HIGH**
6. **Y2-B.1**: Internal AI Act Audit (15 days) - **CRITICAL**
7. **Y2-B.4**: External AI Act Audit (25 days) - **CRITICAL**
8. **Y3-B.1**: Final AI Act Compliance Audit (15 days) - **CRITICAL**
9. **Y3-E.3**: Establish Legal Entities (US/APAC) (40 days) - **CRITICAL**
10. **Y1-D.3**: Contract 3-5 Pilot Customers (20 days) - **HIGH**

---

## Dependency Chains (Quick View)

### Longest Dependency Chain (Critical Path)
```
JSON Schema (3d) → Parser (5d) → Pre-commit (2d) → CI Gate (2d)
→ DAL (6d) → ETL (7d) → Origin Engine (10d) → LTSD Service (8d)
→ Partner API (7d) → ISO Gap (10d) → Implement Controls (30d)
→ Select Auditor (5d) → ISO Audit (15d)
= 110 days
```

### Major Dependency Trees
1. **Core Platform**: Schema → Parser → ETL → Engine → Services
2. **Security**: OpenBao → mTLS → Keycloak → RBAC
3. **AI Act**: Risk Assessment → Logging → Docs → Conformity → Registration
4. **LCNC**: UI Design → Engine → Components → Builder → Integration
5. **Global Expansion**: Research → Localization → Legal Entities → Compliance → Rollout

---

## Mermaid Diagram Summary

The roadmap includes **7 Mermaid diagrams**:
1. Y1-A Dependencies Graph
2. Year 1 Gantt Chart
3. Year 2 Gantt Chart
4. Year 3 Gantt Chart
5. Full 3-Year Gantt Chart (80+ tasks)
6. Risk Matrix
7. Year 1/2/3 Dependency Maps (in Appendix B)

---

## Contact & Updates

- **Roadmap Owner**: Project Manager
- **Update Frequency**: Quarterly
- **Next Review**: Q1 2026
- **Version Control**: Git-tracked in `/docs/ROADMAP.md`

---

## Quick Navigation Tips

1. **Search by Task ID**: Use `Y1-A.1`, `Y2-B.3`, etc.
2. **Search by Phase**: Use `Y1-A`, `Y2-C`, `Y3-E`
3. **Search by Group**: Use `PSRA`, `AI Act`, `Security`, `LCNC`, `Expansion`
4. **Jump to Sections**: Use Table of Contents links
5. **Find Dependencies**: Check Appendix B for full dependency maps

---

**Last Updated:** October 13, 2025
**Document Version:** 1.0
