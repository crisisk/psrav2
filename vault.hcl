storage "file" {
  path = "/vault/data"
}

listener "tcp" {
  address = "0.0.0.0:8200"
  tls_disable = 0
  tls_cert_file = "/vault/certs/cert.pem"
  tls_key_file = "/vault/certs/key.pem"
}

api_addr = "https://vault.sevensa.nl:8200"
ui = true

# Telemetry configuratie voor monitoring
telemetry {
  prometheus_retention_time = "24h"
  disable_hostname = true
}

# Audit logging naar bestand
audit {
  type = "file"
  path = "/vault/logs/audit.log"
}

# Default lease TTL
default_lease_ttl = "168h"    # 7 dagen
max_lease_ttl = "720h"        # 30 dagen
