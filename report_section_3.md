## III. Cross-Service Technical Architecture and Security Improvements

The current multi-tenant architecture, based on Docker Compose and Traefik, provides a solid foundation for service isolation and routing. However, to achieve enterprise-grade stability, scalability, and security in line with 2025 trends, a strategic evolution of the underlying infrastructure is imperative [1]. This section outlines the necessary cross-service improvements focusing on security hardening, multi-tenant optimization, and the integration of an advanced AI orchestration layer.

### 3.1. Security Hardening and Compliance

The modern threat landscape for multi-tenant SaaS applications necessitates a move beyond perimeter defense. The proposed strategy centers on the **Zero-Trust Network Access (ZTNA)** model, where trust is never assumed, and every access request is rigorously verified [2].

#### 3.1.1. Zero-Trust Network Access (ZTNA) Implementation

Implementing ZTNA involves micro-segmentation of the network, especially within the Docker environment. Currently, Traefik handles external routing, but internal service-to-service communication lacks granular control.

**Proposed ZTNA Enhancements:**
*   **Micro-segmentation:** Define strict network policies between Docker containers (e.g., RentGuy API can only communicate with the RentGuy database container). This minimizes the blast radius in case of a breach.
*   **Identity-Centric Access:** Integrate a centralized Identity Provider (IdP) for all services, ensuring that authentication is performed before authorization is granted to any resource, regardless of network location [3].
*   **Continuous Verification:** Implement continuous monitoring of user and service behavior to detect anomalies, moving beyond static access controls.

#### 3.1.2. Centralized Secret Management

The current practice of managing secrets via environment variables in Docker Compose files is a significant security risk. A centralized, encrypted secret management solution is mandatory for compliance and security best practices.

**Recommendation:** Implement a solution like **HashiCorp Vault** or leverage a cloud-native equivalent (if migrating to a hybrid cloud model is considered). This allows for:
*   **Dynamic Secrets:** Generating short-lived credentials for databases and APIs on demand.
*   **Auditing:** Comprehensive logging of all secret access attempts.
*   **Rotation:** Automated rotation of critical credentials.

#### 3.1.3. Container Security Best Practices

To enhance the security posture of the deployed containers, several best practices must be enforced:
*   **Rootless Containers:** All containers should run as non-root users to prevent privilege escalation attacks.
*   **Image Scanning:** Integrate an automated image scanning tool (e.g., Clair, Trivy) into the build pipeline to identify and mitigate vulnerabilities before deployment.
*   **Principle of Least Privilege:** Minimize the attack surface by ensuring containers only contain the necessary binaries and libraries to run the application.

### 3.2. Multi-Tenant Optimization and Scalability

To support the projected growth and maintain the high performance required by services like PSRA-LTSD (sub-2 second certificate generation), the architecture must be optimized for scalability and operational visibility.

#### 3.2.1. Standardized Service Orchestration

While Docker Compose is effective for a single VPS, a strategic plan for migration to a more robust orchestration platform, such as **Kubernetes (K8s)**, is necessary for true horizontal scaling and high availability [4].

| Feature | Current (Docker Compose) | Proposed (Kubernetes Strategy) | Benefit |
| :--- | :--- | :--- | :--- |
| **Scaling** | Manual, limited to single host | Automated, horizontal pod autoscaling | Elasticity and performance under load |
| **Self-Healing** | Requires external scripts | Automatic restart, rescheduling of failed containers | Increased uptime and reliability |
| **Load Balancing** | Basic Traefik routing | Advanced L4/L7 Ingress Controllers | Granular traffic management and resilience |
| **Configuration** | Static YAML files | Dynamic ConfigMaps and Secrets | Improved security and agility |

#### 3.2.2. Centralized Logging and Monitoring (CLM)

Operational visibility is currently fragmented. A centralized system is required for proactive health checks, performance monitoring, and rapid incident response.

**Recommendation:** Implement a CLM stack, such as **Prometheus and Grafana**.
*   **Prometheus:** Collects metrics (CPU, memory, request latency) from all service containers.
*   **Grafana:** Provides customizable dashboards for real-time visualization of service health, Traefik performance, and tenant-specific usage.
*   **Loki/ELK Stack:** Centralizes application logs from all services, enabling fast searching and analysis for debugging and auditing.

#### 3.2.3. Database Isolation Strategy

For multi-tenant SaaS, database isolation is critical for security and performance. The current approach should be formalized.

*   **Performance Isolation:** For high-load services like PSRA, consider a **separate database instance** per large enterprise client (e.g., Witcom).
*   **Security Isolation:** For smaller tenants, utilize a **shared database instance with strict schema separation** and unique database credentials for each service, managed by the Centralized Secret Manager. This ensures that a compromise in one service cannot access data from another.

### 3.3. AI Orchestration Layer

The VPS Manager (`ai.sevensa.nl`) and the AI services (Claude Chat, LangGraph, N8N) represent the core of the future AI-driven platform. The goal is to consolidate these into a unified, intelligent orchestration layer.

#### 3.3.1. Research and Integration of Local LLM for VPS Orchestration (2026 Roadmap)

To reduce latency, enhance data privacy, and provide a dedicated, cost-effective orchestration engine, the integration of a local Large Language Model (LLM) is proposed for the 2026 roadmap [5].

**Local LLM Requirements for Orchestration:**
*   **Model Size:** Must be runnable on the VPS hardware (e.g., a quantized 7B or 13B parameter model like Llama 3 or Mistral).
*   **Functionality:** Capable of interpreting natural language commands (e.g., "Rollback RentGuy to yesterday's state") and translating them into shell/API calls.
*   **Deployment:** Utilize platforms like **Ollama** or **vLLM** within a dedicated Docker container on the VPS for efficient GPU/CPU utilization [6].

This local LLM will act as the **"Brain"** for the VPS Manager, enabling advanced features like automated rollback, predictive scaling, and self-healing based on natural language policies.

#### 3.3.2. LangGraph and N8N Synergy

The research confirms that **LangGraph** and **N8N** are complementary, not competitive [7].
*   **LangGraph** should be utilized as the **AI Reasoning Engine** for complex, multi-step agentic workflows (e.g., PSRA's certificate generation logic, or the VPS Manager's decision-making process).
*   **N8N** should serve as the **Integration and Automation Backbone**, handling external API calls, data transformation, and connecting services (e.g., connecting RentGuy's onboarding form to a CRM).

This synergy ensures that the platform leverages the best of both worlds: advanced AI logic and robust, visual automation.

***

**Estimated Page Count for Section III:** ~4 pages.

**References for Section III:**
[1] Cloud Technology Future: 10 Key Trends to Track in 2025. https://www.practicallogix.com/the-future-of-cloud-10-key-trends-to-track-in-2025/
[2] Zero Trust in the Cloud: Securing Multi-Tenant. https://www.rsaconference.com/library/blog/zero-trust-in-the-cloud-securing-multi-tenant-environments-at-scale-1
[3] Designing Multi Tenant SaaS Security Platforms On Cloud. https://www.revinfotech.com/blog/multi-tenant-saas-security
[4] The New Era of Solution Architecture: Trends Shaping 2025. https://medium.com/@hareshvidja/the-new-era-of-solution-architecture-trends-shaping-2025-6456ac45bab7
[5] Research and Integrate Local LLM for VPS Orchestration. (Internal Knowledge)
[6] LLM VPS Hosting | AI model deployment made easy. https://www.hostinger.com/vps/llm-hosting
[7] LangGraph and n8n in 2025: The AI Stack You Can't Ignore? https://medium.com/javarevisited/langgraph-and-n8n-in-2025-the-ai-stack-you-cant-ignore-9064e718ee63
