# PSRA Network Security Guide

## Overview
This guide outlines the network segmentation and security measures for the Docker-based PSRA deployment. It ensures isolation, secure communication, and protection against threats.

## Architecture
- **Networks**: Separate Docker networks for `frontend`, `backend`, `database`, and `ml` services.
- **Communication**: All internal traffic uses TLS/SSL (HTTPS).
- **External Access**: Only HTTPS (443) is exposed; admin access via VPN-restricted SSH (22).

## Key Components

### 1. Docker Networks
- Defined in `docker-compose.security.yml`.
- `frontend`: External-facing with NGINX proxy.
- `backend`, `database`, `ml`: Internal-only, isolated networks.

### 2. Firewall Rules (UFW)
- Script: `scripts/setup_firewall.sh`.
- Allows: HTTPS (443), SSH (22 via VPN), Prometheus (9090 via VPN).
- Denies: All other incoming traffic.

### 3. AWS Security Groups
- Defined in `network-config.yml` (Terraform snippet).
- `frontend_sg`: HTTPS from anywhere, SSH from VPN subnet.
- `internal_sg`: Internal traffic only from frontend SG.

### 4. TLS/SSL
- Certificates: Stored as Docker secrets (`tls_cert`, `tls_key`).
- Services: Enforce HTTPS internally (e.g., backend to database).
- Generate certs: `openssl req -x509 -newkey rsa:4096 -keyout server.key -out server.crt -days 365 -nodes`.
- In production, use Let's Encrypt or a CA.

### 5. Network Policies (Kubernetes)
- Defined in `network-config.yml`.
- Policies restrict ingress/egress between pods (e.g., backend can only access database).
- Apply with `kubectl apply -f network-config.yml`.

### 6. DDoS Protection
- Implemented via NGINX rate limiting in `docker-compose.security.yml`.
- Limits: 10 requests/second per IP (configurable in `nginx.conf`).

### 7. VPN Access
- Admin SSH restricted to VPN subnet (e.g., 10.0.0.0/8).
- Use OpenVPN or AWS Client VPN. Configure client configs accordingly.

### 8. Network Monitoring
- Prometheus: Integrated in `docker-compose.security.yml`.
- Scrapes metrics from services (configure targets in `prometheus.yml`).
- Access: http://localhost:9090 (via VPN).

## Deployment Steps
1. Generate TLS certs and place in `./certs/`.
2. Run `docker-compose -f infrastructure/docker-compose.security.yml up -d`.
3. Execute `sudo scripts/setup_firewall.sh`.
4. For AWS: Apply Security Groups via Terraform.
5. For K8s: Deploy and apply NetworkPolicies.

## Security Best Practices
- Rotate certs regularly.
- Monitor logs with Prometheus/Grafana.
- Use secrets management (e.g., HashiCorp Vault) for passwords.
- Test segmentation: Attempt cross-network access (should fail).
- Backup configs and audit changes.

## Troubleshooting
- **TLS Errors**: Verify cert paths and service configs.
- **Firewall Blocks**: Check `ufw status`.
- **Network Isolation**: Use `docker network inspect` to verify.
- **VPN Issues**: Ensure client is connected to the correct subnet.

For issues, refer to logs or contact the security team.