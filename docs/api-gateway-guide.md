# API Gateway Setup Guide

This guide covers the implementation of a centralized API Gateway using Kong (on OpenResty/Nginx) for the PSRA-LTSD Enterprise v2 project. The gateway handles routing, authentication, rate limiting, and more for backend microservices.

## Overview
- **Technology**: Kong (API Gateway on OpenResty/Nginx).
- **Key Components**:
  - `kong.yml`: Declarative config for services, routes, plugins, and upstreams.
  - `nginx-gateway.conf`: Custom Nginx config for SSL, logging, and proxying.
  - `setup_api_gateway.sh`: Automated setup script.
- **Assumed Backends**: `user-service` and `product-service` (replace with your services).
- **Ports**:
  - Proxy: 8000 (HTTP), 8443 (HTTPS).
  - Admin: 8001 (for config/metrics).
  - Nginx: 80/443 (SSL termination).

## Requirements Mapping
1. **Request Routing**: Routes defined in `kong.yml` (e.g., `/v1/users` → user-service).
2. **Authentication**: JWT plugin validates tokens on routes.
3. **Rate Limiting**: Rate-limiting plugin (100 req/min per consumer).
4. **Request Transformation**: Request-transformer plugin adds headers/modifies body.
5. **Response Caching**: Proxy-cache plugin caches GET responses (5 min TTL).
6. **Load Balancing**: Upstreams with targets distribute load (e.g., round-robin).
7. **API Versioning**: Routes with versioned paths (e.g., `/v1/`, `/v2/`).
8. **Monitoring**: Prometheus plugin exposes metrics (integrate with Grafana/Prometheus at `http://localhost:8001/metrics`).
9. **Circuit Breaking**: Circuit-breaker plugin trips on failures, recovers automatically.
10. **API Documentation**: Auto-generated from OpenAPI spec. Example spec below (upload to Kong Manager or use `kong-portal` plugin).

## Installation and Setup
1. Ensure Docker is installed.
2. Run the setup script: `sudo bash scripts/setup_api_gateway.sh`.
3. Verify: `curl http://localhost:8000/v1/users` (should route/authenticate).

## Usage
- **Routing Example**: `GET http://localhost:8000/v1/users` → Load-balanced to user-service.
- **Auth**: Include JWT in `Authorization: Bearer <token>` header.
- **Monitoring**: Access metrics at `http://localhost:8001/metrics` (Prometheus format).
- **Caching**: GET responses are cached; clear via admin API.
- **Circuit Breaking**: If backends fail, requests are blocked until recovery.

## Sample OpenAPI Spec for Auto-Documentation
Upload this to Kong for auto-generated docs (via Kong Manager or `kong-portal` plugin).