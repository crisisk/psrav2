## IV. Service-Specific Improvement Plans and Feature Roadmaps

This section details the strategic improvements and feature roadmaps for the core services, aligning their development with current market trends and the foundational architectural enhancements outlined in Section III.

### 4.1. RentGuy (Property Management & Onboarding)

RentGuy, serving the PropTech sector, must evolve to meet the demands for seamless digital experiences and advanced automation [1]. The focus shifts from basic management to a comprehensive platform integrating smart technologies and tenant lifecycle management.

#### 4.1.1. Market Analysis: Latest Trends in PropTech and SaaS

The PropTech market is driven by **AI-driven automation**, **digital twin technology**, and enhanced **tenant experience** [2]. Key features in leading platforms include automated maintenance scheduling, virtual property tours, and integrated financial reporting.

#### 4.1.2. Feature Roadmap: Enterprise Authentication, Advanced Inventory, CRM Integration

| Feature Category | Proposed Improvement | Business Value | Priority |
| :--- | :--- | :--- | :--- |
| **Authentication** | **Enterprise SSO/SAML Integration** | Enhanced security and compliance for large clients. | High |
| **Inventory** | **Advanced Inventory Management** (Digital Twin Integration) | Real-time asset tracking, predictive maintenance scheduling. | High |
| **Integration** | **Two-Way CRM Integration** (e.g., Zoho, Salesforce) | Automated lead-to-tenant conversion and centralized communication. | Medium |
| **Onboarding** | **AI-Powered Document Verification** | Faster, more secure tenant screening and reduced manual effort. | High |
| **User Experience** | **Mobile-First Tenant Portal** | Improved tenant satisfaction and reduced support load. | Medium |

#### 4.1.3. Technical Refactoring: API Performance and Scalability

The RentGuy API must be refactored to support high-volume, real-time data access. This includes migrating to a more efficient database ORM (e.g., Prisma or SQLAlchemy 2.0) and implementing caching layers (e.g., Redis) for frequently accessed data, such as property listings and user sessions. The API should adopt a **GraphQL endpoint** alongside REST for more efficient data fetching by the frontend.

### 4.2. PSRA-LTSD (Preferential Origin Checker)

PSRA-LTSD is a critical compliance tool with a clear mandate: to reduce certificate generation time to under 2 seconds and achieve 99.8% compliance accuracy [3]. The roadmap is focused on enhancing the core rules engine and integrating with enterprise systems.

#### 4.2.1. Market Analysis: Latest Trends in Trade Compliance and AI

Trade compliance is increasingly reliant on **AI and automation** to navigate complex, frequently changing trade agreements [4]. The trend is towards **real-time origin calculation** and seamless integration with ERP systems to prevent retroactive duties and penalties.

#### 4.2.2. Feature Roadmap: Origin Calculation Engine, HS Codes Database, Real-time Analytics Dashboard

| Feature Category | Proposed Improvement | Business Value | Priority |
| :--- | :--- | :--- | :--- |
| **Core Engine** | **Next-Gen Origin Calculation Engine** (LangGraph Integration) | Sub-2 second calculation time and 99.8% accuracy. | Critical |
| **Data** | **Integrated HS Codes & Trade Agreement Database** | Automated updates and cross-referencing of rules of origin. | High |
| **Integration** | **ERP Connector Module** (AMF/Witcom, SAP) | Automated data exchange for Bill of Materials (BOM) and supplier declarations. | Critical |
| **Analytics** | **Real-time Analytics Dashboard** | Proactive identification of compliance risks and optimization opportunities. | High |
| **Compliance** | **RCEP and New Trade Agreement Support** | Expansion into new markets and increased client base. | Medium |

#### 4.2.3. Technical Refactoring: Integration with ERPs (e.g., AMF/Witcom) and API Coupling

The PSRA API must be designed for robust, high-throughput machine-to-machine communication. This requires:
*   **Standardized API Contracts:** Using OpenAPI/Swagger for clear, versioned API documentation.
*   **Asynchronous Processing:** Utilizing message queues (e.g., RabbitMQ or Kafka) for handling large ERP data imports and certificate generation requests without blocking the API.
*   **Dedicated Integration Layer:** A separate microservice to handle the complexity of ERP protocols (e.g., SOAP, proprietary formats) before data reaches the core PSRA logic.

### 4.3. WPCS (WordPress Control Suite)

WPCS must compete with established managed WordPress hosting platforms by offering superior automation, security, and developer tools [5]. The goal is to transform WPCS from a simple control panel into a comprehensive, managed hosting platform.

#### 4.3.1. Market Analysis: Latest Trends in Managed WordPress Hosting and Automation

Leading managed hosting providers offer features like automatic core/plugin updates, built-in staging environments, and advanced security features such as malware scanning and DDoS protection [6]. The key differentiator is the level of **proactive, automated management**.

#### 4.3.2. Feature Roadmap: Advanced Site Management, Security Audits, Multi-Site Support

| Feature Category | Proposed Improvement | Business Value | Priority |
| :--- | :--- | :--- | :--- |
| **Security** | **Automated Malware Scanning & Removal** | Proactive site protection and reduced manual cleanup time. | High |
| **Development** | **One-Click Staging/Production Sync** | Safe testing environment for updates and new features. | High |
| **Management** | **Multi-Site Management Dashboard** | Efficiently manage multiple WordPress installations from a single interface. | Medium |
| **Performance** | **Integrated Caching and CDN Management** | Faster site loading times and improved SEO performance. | Medium |

#### 4.3.3. Technical Refactoring: Backend API Modernization

The WPCS backend needs to be modernized to handle concurrent requests from a large number of managed sites. This involves:
*   **Microservices Architecture:** Decoupling core functions (e.g., backup, update, security scan) into separate, scalable microservices.
*   **Standardized API:** Ensuring the backend API is robust and secure for communication with the frontend and external tools.

### 4.4. VPS Manager & AI/Orchestration Services

These services form the **Operational Intelligence Layer** of the entire platform, responsible for deployment, monitoring, and automated decision-making.

#### 4.4.1. Consolidation and Standardization of AI Services

The current AI services (Claude Chat, LangGraph, N8N) should be consolidated under a single **AI Orchestrator** service, accessible via a unified API gateway (`ai.sevensa.nl`).

| Service | Proposed Role | Integration Point |
| :--- | :--- | :--- |
| **Claude Chat** | Enterprise-grade conversational interface for support and documentation. | Integrated into RentGuy/PSRA portals via API. |
| **LangGraph** | Core AI Reasoning Engine for complex, stateful workflows (e.g., PSRA, VPS Manager). | Backend service called by the AI Orchestrator API. |
| **N8N** | External Integration and Automation Backbone (CRM, Email, Webhooks). | Primary tool for connecting all services to external APIs. |

#### 4.4.2. VPS Manager Feature Expansion (e.g., Automated Health Checks, Rollback Functionality)

The VPS Manager must evolve into a **Deployment and Operations Control Panel**.

*   **Automated Health Checks:** Implement continuous health checks for all Docker containers and Traefik routes, alerting the centralized monitoring system upon failure.
*   **Automated Rollback:** Implement a one-click or automated rollback feature to revert a service to its last known good state, leveraging Docker volume snapshots or Git history [7]. This is a critical feature for minimizing downtime.
*   **Local LLM Integration:** As per Section 3.3.1, integrate the local LLM to enable natural language control over the VPS operations.

***

**Estimated Page Count for Section IV:** ~8 pages.

**References for Section IV:**
[1] Property Management Technology Trends to Watch in 2025. https://inoxoft.com/blog/key-property-management-technology-trends/
[2] 12 Proptech Trends You Should Know in 2025. https://www.buildium.com/blog/proptech-trends-to-know/
[3] PSRA System Integration Preparation for ERPs. (Internal Knowledge)
[4] Trade Compliance Trends 2025 | Key Insights. https://oneunionsolutions.com/blog/trade-compliance-trends-2025/
[5] Best Managed WordPress Hosting of 2025: Expert Tested. https://www.hostingadvice.com/best/managed-wordpress-hosting/
[6] Managed WordPress Hosting: Is It Worth It? Here's How to ... https://wordpress.com/blog/2025/04/28/managed-wordpress-hosting/
[7] OPS06-BP04 Automate testing and rollback. https://docs.aws.amazon.com/wellarchitected/latest/framework/ops_mit_deploy_risks_auto_testing_and_rollback.html
