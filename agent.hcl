exit_after_auth = false
pid_file = "/vault/config/agent.pid"

auto_auth {
  method "approle" {
    mount_path = "auth/approle"
    config = {
      role_id_file_path = "/vault/config/role-id"
      secret_id_file_path = "/vault/config/secret-id"
      remove_secret_id_file_after_reading = false
    }
  }

  sink "file" {
    config = {
      path = "/vault/config/token"
    }
  }
}

vault {
  address = "https://vault.sevensa.nl:8200"
  tls_skip_verify = true
}

template {
  source = "/vault/config/database.tmpl"
  destination = "/vault/secrets/database.json"
  perms = 0644
}

template {
  source = "/vault/config/redis.tmpl"
  destination = "/vault/secrets/redis.json"
  perms = 0644
}

template {
  source = "/vault/config/jwt.tmpl"
  destination = "/vault/secrets/jwt.json"
  perms = 0644
}

template {
  source = "/vault/config/keycloak.tmpl"
  destination = "/vault/secrets/keycloak.json"
  perms = 0644
}

template {
  source = "/vault/config/smtp.tmpl"
  destination = "/vault/secrets/smtp.json"
  perms = 0644
}

listener "tcp" {
  address = "127.0.0.1:8100"
  tls_disable = true
}

cache {
  use_auto_auth_token = true
}

api_proxy {
  use_auto_auth_token = true
}
