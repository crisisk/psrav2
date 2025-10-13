# Consolidated DNS Records for VPS (147.93.57.40)

The following table consolidates the provided DNS A records, infers the full domain name based on the context (primarily `sevensa.nl` and `rentguy.com`), and maps them to the intended application suite.

| Subdomain | Full Domain (Inferred) | Application Suite | Intended Service/Module |
| :--- | :--- | :--- | :--- |
| `rentguy` | `rentguy.com` | RentGuy | Main Application/Frontend |
| `onboarding` | `onboarding.rentguy.com` | RentGuy | Onboarding Module |
| `observability` | `observability.sevensa.nl` | Shared/Monitoring | Grafana/Prometheus/Kibana |
| `agency` | `agency.sevensa.nl` | WPCS Suite | Digital Marketing Automation / Agency Backend |
| `manus` | `manus.sevensa.nl` | General | Manus AI Chat Interface |
| `wpcs` | `wpcs.sevensa.nl` | WPCS Suite | WPCS Backend/API |
| `orchestrator` | `orchestrator.sevensa.nl` | WPCS Suite | Orchestrator AI Agent |
| `quote-generator` | `quote-generator.sevensa.nl` | PSRA-LTSD/Legacy | Quote Generator / Calculation Engine |
| `installer` | `installer.sevensa.nl` | WPCS Suite | Installer Subdomain |
| `mcp` | `mcp.sevensa.nl` | WPCS Suite | MCP Server |
| `n8n` | `n8n.sevensa.nl` | WPCS Suite | N8N Workflow Automation |
| `traefik` | `traefik.sevensa.nl` | Traefik | Traefik Dashboard |
| `roi` | `roi.psra-ltsd.com` | PSRA-LTSD | ROI Module |
| `psra` | `psra.psra-ltsd.com` | PSRA-LTSD | Main Application |
| `sevensaai` | `sevensaai.sevensa.nl` | General | VPS Manager Application |
| `ai` | `ai.sevensa.nl` | General | VPS Manager Application |
| `canary.ai` | `canary.ai.sevensa.nl` | General | Canary Testing |
| `langgraph` | `langgraph.sevensa.nl` | PSRA-LTSD/AI | LangGraph Service |
| `trading` | `trading.sevensa.nl` | General | Trading Bot |
| `customer-analyse` | `customer-analyse.sevensa.nl` | WPCS Suite | Module of Sevensa Agency Tools |
| `calculation-engine` | `calculation-engine.psra-ltsd.com` | PSRA-LTSD | Calculation Engine |
| `lovable` | `lovable.sevensa.nl` | General | OpenLovable v2.0 |
| `claude` | `claude.sevensa.nl` | General | Claude Chat Agent |

**Note on Base Domains:**
*   The `rentguy` and `onboarding` subdomains imply a base domain of `rentguy.com`.
*   The `psra` and `roi` subdomains imply a base domain of `psra-ltsd.com`.
*   All other subdomains are inferred to be under the primary domain `sevensa.nl`.

This consolidated list will be used to configure the Traefik routing rules in the next phase. The total number of domains to secure with SSL is 23.

**Domains for PSRA-LTSD:**
*   `psra.psra-ltsd.com`
*   `roi.psra-ltsd.com`
*   `calculation-engine.psra-ltsd.com`

**Domains for RentGuy:**
*   `rentguy.com`
*   `onboarding.rentguy.com`

**Domains for WPCS Suite/General:**
*   `observability.sevensa.nl`
*   `agency.sevensa.nl`
*   `manus.sevensa.nl`
*   `wpcs.sevensa.nl`
*   `orchestrator.sevensa.nl`
*   `quote-generator.sevensa.nl`
*   `installer.sevensa.nl`
*   `mcp.sevensa.nl`
*   `n8n.sevensa.nl`
*   `traefik.sevensa.nl`
*   `sevensaai.sevensa.nl`
*   `ai.sevensa.nl`
*   `canary.ai.sevensa.nl`
*   `langgraph.sevensa.nl`
*   `trading.sevensa.nl`
*   `customer-analyse.sevensa.nl`
*   `lovable.sevensa.nl`
*   `claude.sevensa.nl`
