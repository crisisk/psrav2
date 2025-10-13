# Service Configuration Analysis and Traefik Routing Plan

The goal is to consolidate the three service stacks (PSRA-LTSD, RentGuy, and WPCS Suite) onto the VPS using a single Traefik instance for routing and SSL termination.

## 1. Traefik Base Configuration

The base Traefik configuration from `vps-complete-setup.zip` confirms the use of Docker and a file provider for dynamic configuration, which is the correct approach for a multi-tenant setup.

| Parameter | Value | Note |
| :--- | :--- | :--- |
| HTTP Entrypoint | `:80` | Redirect to HTTPS will be configured dynamically. |
| HTTPS Entrypoint | `:443` | Required for Let's Encrypt SSL. |
| Docker Provider | `unix:///var/run/docker.sock` | Required for automatic service discovery. |
| File Provider | `/etc/traefik/dynamic` | Used for manual routing rules and middleware. |

## 2. PSRA-LTSD (ML Stack) Configuration

The PSRA-LTSD stack uses a `docker-compose.yml` that defines multiple services, each with a placeholder host rule (e.g., `Host(\`qdrant.local\`)`). These must be updated to use the actual subdomains.

| Service | Internal Port | Current Traefik Rule (Placeholder) | Proposed Subdomain |
| :--- | :--- | :--- | :--- |
| `qdrant` | `6333` | `Host(\`qdrant.local\`)` | `qdrant.psra-ltsd.com` (Example) |
| `mlflow` | `5000` | `Host(\`mlflow.local\`)` | `mlflow.psra-ltsd.com` (Example) |
| `parser` | `8000` | `Host(\`parser.local\`)` | `parser.psra-ltsd.com` (Example) |
| `embed` | `8000` | `Host(\`embed.local\`)` | `embed.psra-ltsd.com` (Example) |
| `rag` | `8000` | `Host(\`rag.local\`)` | `rag.psra-ltsd.com` (Example) |
| `classify` | `8000` | `Host(\`classify.local\`)` | `classify.psra-ltsd.com` (Example) |
| `ner` | `8000` | `Host(\`ner.local\`)` | `ner.psra-ltsd.com` (Example) |
| `bento-gateway` | `8000` | `Host(\`ml.local\`)` | `ml.psra-ltsd.com` (Example) |

**Action Required:** The placeholder `.local` domains must be replaced with the actual subdomains configured in DNS. Since the actual DNS records are not provided, I will use a generic placeholder domain (`psra-ltsd.com`) and request the user to confirm the actual subdomains. For now, I will prepare the configuration files with a consistent naming scheme.

## 3. RentGuy Configuration

The RentGuy stack uses a `docker-compose.production.yml` which already includes Traefik labels and defines several services, including the Celery components (implicitly via the `rentguy-api` service's dependencies on Redis and the need for separate Celery worker/beat services, which are not explicitly listed but are a known issue).

| Service | Internal Port | Traefik Rule | Proposed Subdomain |
| :--- | :--- | :--- | :--- |
| `mr-dj-onboarding` | `80` | `Host(\`onboarding.rentguy\`)` | `onboarding.rentguy.com` (Example) |
| `rentguy-api` | `3000` | `Host(\`api.rentguy\`)` | `api.rentguy.com` (Example) |
| `prometheus` | `9090` | `Host(\`prometheus.rentguy\`)` | `prometheus.rentguy.com` (Example) |
| `grafana` | `3000` | `Host(\`grafana.rentguy\`)` | `grafana.rentguy.com` (Example) |
| `kibana` | `5601` | `Host(\`kibana.rentguy\`)` | `kibana.rentguy.com` (Example) |

**Action Required:** The placeholder `.rentguy` domains must be replaced with the actual subdomains. I will use a generic placeholder domain (`rentguy.com`) and request the user to confirm the actual subdomains. The Celery issue must be addressed in Phase 3, likely by adding dedicated `celery-worker` and `celery-beat` services to the `docker-compose.production.yml`.

## 4. WPCS Suite (Sevensa Suite) Configuration

The WPCS Suite uses a `docker-compose.yml` that relies on an internal Nginx proxy and exposes ports directly (e.g., `n8n` on `5678`, `mcp` on `8787`). This conflicts with the Traefik-based routing strategy.

| Service | Internal Port | External Port | Conflict/Issue |
| :--- | :--- | :--- | :--- |
| `proxy` (Nginx) | `80` | `80:80` | **Major Conflict:** Directly exposes port 80, which is needed by Traefik. |
| `n8n` | `5678` | `5678:5678` | **Conflict:** Directly exposes port, should be routed via Traefik. |
| `mcp` | `8787` | `8787:8787` | **Conflict:** Directly exposes port, should be routed via Traefik. |
| `grafana` | `3000` | `3000:3000` | **Conflict:** Directly exposes port, should be routed via Traefik. |
| `installer` | `8089` | `8089:8089` | **Conflict:** Directly exposes port, should be routed via Traefik. |

**Action Required:** The WPCS Suite's `docker-compose.yml` must be heavily modified to:
1. Remove the internal Nginx `proxy` service.
2. Remove all external port mappings (`ports: [...]`).
3. Add Traefik labels to all services that require external access (`agency`, `wpcs`, `n8n`, `mcp`, `grafana`, `installer`).
4. Define a shared external network for Traefik communication.

**Proposed WPCS Subdomains:**
* `agency.sevensa.nl` (from n8n config)
* `wpcs.sevensa.nl` (Example)
* `n8n.sevensa.nl` (Example)
* `mcp.sevensa.nl` (Example)
* `grafana.sevensa.nl` (Example)
* `installer.sevensa.nl` (Example)

## 5. Next Steps

To proceed with Phase 2 (Traefik Configuration), I need the actual subdomains for all three suites to correctly configure the Traefik labels.

**Question for User:**

Please provide the definitive subdomains for the three application suites:

1.  **PSRA-LTSD (ML Stack):** Please list the base domain and any subdomains (e.g., `ml.psra-ltsd.com`, `qdrant.psra-ltsd.com`).
2.  **RentGuy:** Please list the base domain and any subdomains (e.g., `api.rentguy.com`, `onboarding.rentguy.com`).
3.  **WPCS Suite (Sevensa Suite):** Please list the base domain and any subdomains (e.g., `agency.sevensa.nl`, `mcp.sevensa.nl`).

Once these are confirmed, I can proceed with modifying the Docker Compose files and setting up the Traefik dynamic configuration.
