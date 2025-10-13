# DNS Record to Service Mapping

Based on the provided DNS A records and the context of the application packages, the following mapping is proposed for Traefik routing. The base domain for each service is inferred from the context (e.g., `rentguy` for RentGuy, `sevensa.nl` for the Sevensa Suite/WPCS components, and a placeholder for PSRA-LTSD).

**Inferred Base Domains:**
*   **RentGuy:** `rentguy.com`
*   **Sevensa Suite/WPCS/General:** `sevensa.nl`
*   **PSRA-LTSD:** `psra-ltsd.com`

| Subdomain | Full Domain (Inferred) | Application Suite | Intended Service/Module | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `rentguy` | `rentguy.com` | RentGuy | Main Application/Frontend | Maps to the main RentGuy service. |
| `onboarding` | `onboarding.rentguy.com` | RentGuy | Onboarding Module | Maps to the `mr-dj-onboarding` service. |
| `observability` | `observability.sevensa.nl` | Shared/Monitoring | Grafana/Prometheus | Will map to the monitoring stack (e.g., Grafana). |
| `agency` | `agency.sevensa.nl` | WPCS Suite | Digital Marketing Automation | Maps to the `agency` service in WPCS. |
| `manus` | `manus.sevensa.nl` | General | Manus AI Interface | Will require a new Docker Compose file (e.g., for `claude-chat`). |
| `wpcs` | `wpcs.sevensa.nl` | WPCS Suite | WPCS Backend/API | Maps to the `wpcs` service in WPCS. |
| `orchestrator` | `orchestrator.sevensa.nl` | WPCS Suite | Orchestrator AI Agent | Maps to a dedicated orchestrator service (likely part of WPCS). |
| `quote-generator` | `quote-generator.sevensa.nl` | PSRA-LTSD/Legacy | Quote Generator | Will map to the `calculation-engine` or a dedicated service. |
| `installer` | `installer.sevensa.nl` | WPCS Suite | Installer Subdomain | Maps to the `installer` service in WPCS. |
| `mcp` | `mcp.sevensa.nl` | WPCS Suite | MCP Server | Maps to the `mcp` service in WPCS. |
| `n8n` | `n8n.sevensa.nl` | WPCS Suite | N8N Workflow Automation | Maps to the `n8n` service in WPCS. |
| `traefik` | `traefik.sevensa.nl` | Traefik | Traefik Dashboard | Will be configured as an internal service in Traefik. |
| `roi` | `roi.psra-ltsd.com` | PSRA-LTSD | ROI Module | Will map to a specific PSRA-LTSD service (e.g., `bento-gateway` or a new service). |
| `psra` | `psra.psra-ltsd.com` | PSRA-LTSD | Main Application | Will map to the main PSRA-LTSD service (e.g., `bento-gateway`). |
| `sevensaai` | `sevensaai.sevensa.nl` | General | VPS Manager Application | Will map to the same service as `ai.sevensa.nl`. |
| `ai` | `ai.sevensa.nl` | General | VPS Manager Application | Will map to the same service as `sevensaai.sevensa.nl`. |
| `canary.ai` | `canary.ai.sevensa.nl` | General | Canary Testing | Will require a new, simple test service. |
| `langgraph` | `langgraph.sevensa.nl` | PSRA-LTSD/AI | LangGraph Service | Will map to a PSRA-LTSD ML service (e.g., `rag` or a new service). |
| `trading` | `trading.sevensa.nl` | General | Trading Bot | Will require a new Docker Compose file. |
| `customer-analyse` | `customer-analyse.sevensa.nl` | WPCS Suite | Module of Sevensa Agency Tools | Will map to the `agency` or `wpcs` service, or a new service. |
| `calculation-engine` | `calculation-engine.psra-ltsd.com` | PSRA-LTSD | Calculation Engine | Will map to a PSRA-LTSD ML service (e.g., `classify` or a new service). |
| `lovable` | `lovable.sevensa.nl` | General | OpenLovable v2.0 | Will require a new Docker Compose file. |
| `claude` | `claude.sevensa.nl` | General | Claude Chat Agent | Will map to the `claude-chat.service` (systemd service). |

## Traefik Configuration Strategy

1.  **Traefik Setup:** Ensure the main Traefik container is running and configured to use the Docker and File providers.
2.  **Network:** Create a shared external network named `traefik_public` for all services that need to be exposed.
3.  **Docker Compose Modifications:**
    *   **RentGuy:** Update Traefik labels in `docker-compose.production.yml` to use the inferred `rentguy.com` domains.
    *   **PSRA-LTSD:** Update Traefik labels in `docker-compose.yml` to use the inferred `psra-ltsd.com` domains.
    *   **WPCS Suite:** Heavily modify `docker-compose.yml` to remove the internal Nginx proxy, remove all external port mappings, and add Traefik labels using the inferred `sevensa.nl` domains.
4.  **Systemd Service:** Configure the `claude-chat.service` to run the application and expose it to Traefik via a dedicated network or by using the File provider.

**Next Step:** Proceed to Phase 3 to modify the Docker Compose files and implement the Traefik configuration.
