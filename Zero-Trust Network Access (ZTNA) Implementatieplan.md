# Zero-Trust Network Access (ZTNA) Implementatieplan

## Overzicht

Dit document beschrijft de implementatie van Zero-Trust Network Access (ZTNA) voor de multi-tenant Docker-omgeving op VPS 147.93.57.40. Het doel is om de beveiliging te verbeteren door micro-segmentatie, identiteitsgebaseerde toegang en continue verificatie.

## Huidige Situatie

De huidige architectuur bestaat uit:
- Docker containers beheerd via Docker Compose
- Traefik als reverse proxy voor externe routing
- Gedeeld Docker netwerk ('web') voor alle services
- Beperkte interne netwerksegmentatie
- Geen gecentraliseerde identiteitsverificatie

## Implementatiestrategie

### 1. Micro-segmentatie

We implementeren micro-segmentatie door:
1. Dedicated netwerken te creëren voor elke service
2. Expliciete netwerk policies te definiëren voor toegestane communicatie
3. Docker network aliases te gebruiken voor service discovery

### 2. Identiteitsgebaseerde Toegang

We implementeren een gecentraliseerde identiteitsprovider (IdP) met:
1. Keycloak als centrale IdP
2. OAuth2/OIDC integratie voor alle services
3. Role-Based Access Control (RBAC)

### 3. Continue Verificatie

We implementeren continue verificatie door:
1. Korte sessie timeouts
2. Regelmatige token vernieuwing
3. Gedragsanalyse en anomaliedetectie

## Implementatiefasen

### Fase 1: Docker Netwerk Micro-segmentatie (Week 1-2)

1. Definieer service-specifieke netwerken
2. Configureer Traefik voor routering tussen netwerken
3. Update Docker Compose bestanden voor alle services

### Fase 2: Keycloak IdP Implementatie (Week 3-4)

1. Implementeer Keycloak container
2. Configureer realms, clients en rollen
3. Integreer met bestaande gebruikersdatabase

### Fase 3: Service Integratie (Week 5-8)

1. Integreer RentGuy met Keycloak
2. Integreer PSRA-LTSD met Keycloak
3. Integreer WPCS met Keycloak
4. Integreer AI/Orchestration services met Keycloak

### Fase 4: Continue Verificatie (Week 9-12)

1. Implementeer Wazuh voor security monitoring
2. Configureer anomaliedetectie
3. Implementeer automatische response mechanismen

## Technische Specificaties

### Docker Netwerk Configuratie

```yaml
networks:
  traefik-net:
    name: traefik-net
  rentguy-net:
    name: rentguy-net
  psra-net:
    name: psra-net
  wpcs-net:
    name: wpcs-net
  ai-net:
    name: ai-net
  db-net:
    name: db-net
```

### Keycloak Configuratie

```yaml
version: '3'

services:
  keycloak:
    image: quay.io/keycloak/keycloak:21.1.1
    container_name: keycloak
    environment:
      - KEYCLOAK_ADMIN=admin
      - KEYCLOAK_ADMIN_PASSWORD=${KEYCLOAK_ADMIN_PASSWORD}
      - KC_DB=postgres
      - KC_DB_URL=jdbc:postgresql://keycloak-db:5432/keycloak
      - KC_DB_USERNAME=${KEYCLOAK_DB_USER}
      - KC_DB_PASSWORD=${KEYCLOAK_DB_PASSWORD}
      - KC_HOSTNAME=auth.sevensa.nl
    command: start-dev
    networks:
      - traefik-net
      - keycloak-net
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.keycloak.rule=Host(`auth.sevensa.nl`)"
      - "traefik.http.routers.keycloak.entrypoints=websecure"
      - "traefik.http.routers.keycloak.tls=true"
      - "traefik.http.services.keycloak.loadbalancer.server.port=8080"
    depends_on:
      - keycloak-db
    restart: unless-stopped

  keycloak-db:
    image: postgres:14
    container_name: keycloak-db
    environment:
      - POSTGRES_DB=keycloak
      - POSTGRES_USER=${KEYCLOAK_DB_USER}
      - POSTGRES_PASSWORD=${KEYCLOAK_DB_PASSWORD}
    volumes:
      - keycloak-db-data:/var/lib/postgresql/data
    networks:
      - keycloak-net
    restart: unless-stopped

networks:
  traefik-net:
    external: true
  keycloak-net:
    name: keycloak-net

volumes:
  keycloak-db-data:
```

## Risico's en Mitigatie

| Risico | Impact | Waarschijnlijkheid | Mitigatie |
|--------|--------|-------------------|-----------|
| Service onbereikbaarheid | Hoog | Medium | Gefaseerde uitrol, rollback plan |
| Prestatievermindering | Medium | Laag | Performance testing, optimalisatie |
| Gebruikersacceptatie | Medium | Medium | Documentatie, training |
| Integratieproblemen | Hoog | Medium | Uitgebreide tests, compatibiliteitscontroles |

## Succesfactoren

- Alle services zijn alleen toegankelijk via geverifieerde identiteiten
- Netwerkcommunicatie is beperkt tot alleen noodzakelijke paden
- Alle toegangspogingen worden gelogd en gemonitord
- Anomalieën worden automatisch gedetecteerd en gerapporteerd

## Volgende Stappen

1. Creëer Docker netwerk configuratie bestanden
2. Implementeer Keycloak container
3. Update Docker Compose bestanden voor alle services
4. Configureer Traefik voor integratie met Keycloak
