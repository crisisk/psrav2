import hvac
import os
import logging

logger = logging.getLogger(__name__)

class VaultIntegration:
    def __init__(self):
        self.client = hvac.Client(url=os.getenv('VAULT_ADDR'), token=os.getenv('VAULT_TOKEN'))
        if not self.client.is_authenticated():
            raise Exception("Vault authentication failed")

    def write_secret(self, path, data):
        """Write a secret to OpenBao with versioning."""
        try:
            self.client.secrets.kv.v2.create_or_update_secret_version(path=path, secret=data)
            logger.info(f"Secret written to {path}")
        except Exception as e:
            logger.error(f"Failed to write secret to {path}: {e}")
            raise

    def read_secret(self, path, version=None):
        """Read a secret from OpenBao."""
        try:
            response = self.client.secrets.kv.v2.read_secret_version(path=path, version=version)
            return response['data']['data']
        except Exception as e:
            logger.error(f"Failed to read secret from {path}: {e}")
            raise

    def list_secrets(self, path):
        """List secrets under a path."""
        try:
            response = self.client.secrets.kv.v2.list_secrets_version(path=path)
            return response['data']['keys']
        except Exception as e:
            logger.error(f"Failed to list secrets under {path}: {e}")
            return []

    def get_secret_versions(self, path):
        """Get metadata including versions."""
        try:
            return self.client.secrets.kv.v2.read_secret_version(path=path, raise_on_deleted_version=False)
        except Exception as e:
            logger.error(f"Failed to get versions for {path}: {e}")
            return None