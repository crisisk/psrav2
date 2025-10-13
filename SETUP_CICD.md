# Sevensa PSRA CI/CD Handleiding

Deze handleiding beschrijft hoe de GitHub Actions workflow en Kubernetes deployment voor `psra-ltsd-enterprise-v2` functioneren en hoe je ze kunt beheren.

## GitHub Container Registry

De workflow bouwt en pushed een image naar GitHub Container Registry (GHCR):
- Repository: `ghcr.io/crisisk/psra-ltsd-enterprise-v2`
- Tag: `latest`

Zorg dat het repository publicaties naar GHCR toestaat en dat gebruikers die lokaal willen pullen zijn aangemeld bij GHCR.

## Benodigde repository secrets

| Secret            | Beschrijving                                                                 |
|-------------------|------------------------------------------------------------------------------|
| `KUBECONFIG_B64`  | Base64-gecodeerde kubeconfig met toegang tot het `default` cluster.          |

De workflow gebruikt het standaard `GITHUB_TOKEN` voor authenticatie richting GHCR.

## Workflow overzicht

Bestand: `.github/workflows/deploy.yml`

1. Checkt de code uit.
2. Logt in op GHCR.
3. Bouwt en pushed het Docker-image op basis van de `Dockerfile` in de root.
4. Installeert `kubectl` versie 1.30.0.
5. Schrijft de kubeconfig uit `KUBECONFIG_B64` naar `~/.kube/config`.
6. Update of creëert de deployment `psra-new` in namespace `sevensa`.
7. Wacht op een succesvolle rollout.

De workflow draait bij pushes naar `main` en kan handmatig worden gestart via `workflow_dispatch`.

## Kubernetes resources

Bestand: `k8s/psra.yaml`

### Deployment
- Namespace: `sevensa`
- Naam: `psra-new`
- Replica's: 2
- Container: `web`
  - Image: `ghcr.io/crisisk/psra-ltsd-enterprise-v2:latest`
  - Poort: 3000
  - Readiness & liveness probes: `GET /api/health`

### Service
- Naam: `psra-new-svc`
- Type: `NodePort`
- NodePort: `31080`
- Doelpoort: `3000`

## Eerste deploy uitvoeren

1. Controleer dat namespace `sevensa` bestaat (`kubectl get ns`). Maak hem eventueel aan.
2. Apply manifest: `kubectl apply -f k8s/psra.yaml`.
3. Volg de rollout: `kubectl -n sevensa rollout status deployment/psra-new`.
4. Controleer bereikbaarheid via Traefik: `curl -k https://psra.sevensa.nl`.

## Problemen oplossen

- **Image pull errors**: Verifieer dat het image in GHCR beschikbaar is en dat nodes toegang hebben.
- **NodePort bezet**: Kies een alternatieve poort en werk zowel `k8s/psra.yaml` als Traefik-config bij.
- **Traefik routing issues**: Controleer de host routing naar `127.0.0.1:31080` en herstart Traefik indien nodig.
