#!/bin/bash

# Setup UFW for Docker-based PSRA deployment
# Assumes Ubuntu/Debian; install UFW if not present: apt-get install ufw

# Enable UFW
ufw --force enable

# Default deny all incoming
ufw default deny incoming

# Default allow outgoing
ufw default allow outgoing

# Allow HTTPS (443) for external access to frontend
ufw allow 443/tcp

# Allow SSH (22) only from VPN subnet (e.g., 10.0.0.0/8; replace with your VPN CIDR)
ufw allow from 10.0.0.0/8 to any port 22 proto tcp

# Allow Docker internal networks (if needed for inter-container comms; Docker handles this, but explicit for clarity)
# Note: Docker networks are isolated; UFW rules apply to host ports

# Allow Prometheus metrics (9090) from internal network or VPN
ufw allow from 10.0.0.0/8 to any port 9090 proto tcp

# Deny all other ports
ufw --force reload

# Status check
ufw status verbose

echo "Firewall setup complete. Admin access restricted to VPN."