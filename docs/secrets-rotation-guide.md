# Secrets Rotation Guide

This guide outlines the automated secrets rotation system integrated with OpenBao (a HashiCorp Vault fork). The system ensures secure, zero-downtime rotation of secrets like database credentials, API keys, JWT secrets, and encryption keys.

## Overview

- **Secrets Storage**: Secrets are stored in OpenBao's KV v2 secrets engine with versioning enabled. Each secret has a path like `secret/<app>/<type>/<name>` (e.g., `secret/myapp/db/mysql_password`).
- **Rotation Logic**: A Python script (`rotate_secrets.py`) runs periodically (e.g., via cron) to check and perform rotations. It generates new secrets, stores them in OpenBao, and handles zero-downtime updates.
- **Zero-Downtime**: For DB credentials, the system updates the secret and assumes services refresh connections dynamically (e.g., via a signal or config reload). For other secrets, services should support dynamic lookups.
- **Audit and Monitoring**: All events are logged. Failures trigger alerts (e.g., email).

## Prerequisites

- OpenBao server running with KV v2 engine enabled.
- Python 3.8+ with dependencies: `pip install hvac sqlalchemy smtplib`.
- Environment variables: `VAULT_ADDR`, `VAULT_TOKEN`, `DB_CONNECTION_STRING` (for DB tests), `ALERT_EMAIL` (for notifications).
- Cron job for automation: `0 2 * * * /usr/bin/python3 /home/vncuser/psra-ltsd-enterprise-v2/backend/scripts/rotate_secrets.py` (runs daily at 2 AM).

## Configuration

Create a config file `/home/vncuser/psra-ltsd-enterprise-v2/backend/config/secrets_config.json`: