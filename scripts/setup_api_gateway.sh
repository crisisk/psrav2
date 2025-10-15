#!/bin/bash
set -e

# Variables
KONG_CONFIG_PATH="/home/vncuser/psra-ltsd-enterprise-v2/infrastructure/kong.yml"
NGINX_CONFIG_PATH="/home/vncuser/psra-ltsd-enterprise-v2/infrastructure/nginx-gateway.conf"
DOCKER_NETWORK="api-gateway-net"

echo "Setting up API Gateway with Kong and Nginx/OpenResty..."

# Create Docker network
docker network create $DOCKER_NETWORK || true

# Pull and run Kong with declarative config
docker run -d --name kong-gateway \
  --network $DOCKER_NETWORK \
  -e "KONG_DATABASE=off" \
  -e "KONG_DECLARATIVE_CONFIG=$KONG_CONFIG_PATH" \
  -e "KONG_PROXY_LISTEN=0.0.0.0:8000, 0.0.0.0:8443 ssl" \
  -e "KONG_ADMIN_LISTEN=0.0.0.0:8001" \
  -v $KONG_CONFIG_PATH:/usr/local/kong/declarative/kong.yml \
  -p 8000:8000 -p 8443:8443 -p 8001:8001 \
  kong:3.4

# Run Nginx with custom config (proxies to Kong)
docker run -d --name nginx-gateway \
  --network $DOCKER_NETWORK \
  -v $NGINX_CONFIG_PATH:/etc/nginx/conf.d/default.conf \
  -p 80:80 -p 443:443 \
  nginx:alpine

# Wait for Kong to start
sleep 10

# Import Kong config (if needed for dynamic updates)
curl -X POST http://localhost:8001/config \
  -H "Content-Type: application/json" \
  -d @"$KONG_CONFIG_PATH" || echo "Config import failed; ensure Kong is running."

# Health check
if curl -f http://localhost:8000/health; then
    echo "API Gateway setup complete. Kong proxy at http://localhost:8000, Admin at http://localhost:8001"
else
    echo "Setup failed. Check logs: docker logs kong-gateway"
    exit 1
fi

# Optional: Start Prometheus for monitoring (run separately)
# docker run -d --name prometheus -p 9090:9090 prom/prometheus