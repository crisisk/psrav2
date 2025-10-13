#!/bin/bash

# Script om alle benodigde Docker netwerken voor ZTNA te initialiseren
# Dit script moet worden uitgevoerd voordat de Docker Compose bestanden worden gestart

set -e

echo "Initializing Zero-Trust Network Access (ZTNA) Docker networks..."

# Hoofdnetwerk voor Traefik
docker network create --driver=bridge --subnet=172.20.0.0/24 traefik-net || echo "traefik-net already exists"

# RentGuy netwerken
docker network create --driver=bridge --subnet=172.20.1.0/24 --internal rentguy-net || echo "rentguy-net already exists"
docker network create --driver=bridge --subnet=172.20.2.0/24 --internal rentguy-db-net || echo "rentguy-db-net already exists"

# PSRA netwerken
docker network create --driver=bridge --subnet=172.20.3.0/24 --internal psra-net || echo "psra-net already exists"
docker network create --driver=bridge --subnet=172.20.4.0/24 --internal psra-db-net || echo "psra-db-net already exists"

# WPCS netwerken
docker network create --driver=bridge --subnet=172.20.5.0/24 --internal wpcs-net || echo "wpcs-net already exists"
docker network create --driver=bridge --subnet=172.20.6.0/24 --internal wpcs-db-net || echo "wpcs-db-net already exists"

# AI Orchestration netwerk
docker network create --driver=bridge --subnet=172.20.7.0/24 --internal ai-net || echo "ai-net already exists"

# Keycloak netwerk
docker network create --driver=bridge --subnet=172.20.8.0/24 --internal keycloak-net || echo "keycloak-net already exists"

# Monitoring netwerk
docker network create --driver=bridge --subnet=172.20.9.0/24 --internal monitoring-net || echo "monitoring-net already exists"

# Logging netwerk
docker network create --driver=bridge --subnet=172.20.10.0/24 --internal logging-net || echo "logging-net already exists"

echo "All ZTNA networks have been initialized."
echo "Network list:"
docker network ls | grep -E 'traefik-net|rentguy|psra|wpcs|ai-net|keycloak|monitoring|logging'

echo ""
echo "Next steps:"
echo "1. Copy ztna.env.example to .env and fill in the required values"
echo "2. Start Keycloak: docker-compose -f docker-compose.keycloak.yml up -d"
echo "3. Start Traefik: docker-compose -f docker-compose.traefik.yml up -d"
echo "4. Start services: docker-compose -f docker-compose.rentguy.yml up -d"
