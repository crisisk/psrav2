"""
OpenBao/Vault Client Service
Provides secure secrets management using AppRole authentication.

Features:
- AppRole authentication with role_id and secret_id
- Secret read/write operations
- Secret rotation support
- Connection pooling and retry logic
- Lease management
- Dynamic secret support

Created: 2025-10-13
"""

import os
import logging
import time
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
import threading
import hvac
from hvac.exceptions import VaultError, InvalidPath, Forbidden
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

logger = logging.getLogger(__name__)


class VaultClientError(Exception):
    """Base exception for Vault client errors"""
    pass


class VaultAuthenticationError(VaultClientError):
    """Raised when authentication fails"""
    pass


class VaultSecretNotFoundError(VaultClientError):
    """Raised when a secret is not found"""
    pass


class VaultClient:
    """
    OpenBao/Vault client with AppRole authentication and connection pooling.

    Environment Variables:
        VAULT_ADDR: Vault server address (default: http://127.0.0.1:8200)
        VAULT_ROLE_ID: AppRole role_id for authentication
        VAULT_SECRET_ID: AppRole secret_id for authentication
        VAULT_NAMESPACE: Vault namespace (optional)
        VAULT_TOKEN: Direct token authentication (for testing only)
    """

    def __init__(
        self,
        vault_addr: Optional[str] = None,
        role_id: Optional[str] = None,
        secret_id: Optional[str] = None,
        namespace: Optional[str] = None,
        token: Optional[str] = None,
        mount_point: str = "secret",
        auto_renew: bool = True
    ):
        """
        Initialize Vault client with AppRole authentication.

        Args:
            vault_addr: Vault server address
            role_id: AppRole role_id
            secret_id: AppRole secret_id
            namespace: Vault namespace (Enterprise feature)
            token: Direct token (for testing only)
            mount_point: KV secrets engine mount point
            auto_renew: Automatically renew token before expiration
        """
        self.vault_addr = vault_addr or os.getenv("VAULT_ADDR", "http://127.0.0.1:8200")
        self.role_id = role_id or os.getenv("VAULT_ROLE_ID")
        self.secret_id = secret_id or os.getenv("VAULT_SECRET_ID")
        self.namespace = namespace or os.getenv("VAULT_NAMESPACE")
        self.token = token or os.getenv("VAULT_TOKEN")
        self.mount_point = mount_point
        self.auto_renew = auto_renew

        # Initialize client
        self.client = None
        self._token_renew_thread = None
        self._shutdown = False
        self._lock = threading.Lock()

        # Token metadata
        self._token_ttl = 0
        self._token_renewable = False
        self._token_creation_time = None

        # Initialize connection
        self._initialize_client()

        logger.info(f"Vault client initialized for {self.vault_addr}")

    def _initialize_client(self):
        """Initialize Vault client and authenticate"""
        try:
            # Create client
            self.client = hvac.Client(
                url=self.vault_addr,
                namespace=self.namespace
            )

            # Authenticate
            if self.token:
                # Use direct token (for testing)
                logger.warning("Using direct token authentication - not recommended for production")
                self.client.token = self.token
            elif self.role_id and self.secret_id:
                # Use AppRole authentication
                self._authenticate_approle()
            else:
                raise VaultAuthenticationError(
                    "No authentication method provided. Set VAULT_ROLE_ID and VAULT_SECRET_ID, "
                    "or VAULT_TOKEN for testing."
                )

            # Verify authentication
            if not self.client.is_authenticated():
                raise VaultAuthenticationError("Authentication failed")

            # Get token metadata
            self._update_token_metadata()

            # Start auto-renewal if enabled
            if self.auto_renew and self._token_renewable:
                self._start_token_renewal()

            logger.info("Vault client authenticated successfully")

        except Exception as e:
            logger.error(f"Failed to initialize Vault client: {e}")
            raise VaultClientError(f"Vault initialization failed: {e}") from e

    def _authenticate_approle(self):
        """Authenticate using AppRole"""
        try:
            auth_response = self.client.auth.approle.login(
                role_id=self.role_id,
                secret_id=self.secret_id
            )

            self.client.token = auth_response['auth']['client_token']
            logger.info("AppRole authentication successful")

        except Exception as e:
            logger.error(f"AppRole authentication failed: {e}")
            raise VaultAuthenticationError(f"AppRole login failed: {e}") from e

    def _update_token_metadata(self):
        """Update token metadata from Vault"""
        try:
            token_info = self.client.auth.token.lookup_self()
            self._token_ttl = token_info['data']['ttl']
            self._token_renewable = token_info['data']['renewable']
            self._token_creation_time = datetime.now()

            logger.debug(f"Token TTL: {self._token_ttl}s, Renewable: {self._token_renewable}")

        except Exception as e:
            logger.warning(f"Failed to get token metadata: {e}")

    def _start_token_renewal(self):
        """Start background thread for token renewal"""
        if self._token_renew_thread and self._token_renew_thread.is_alive():
            return

        self._shutdown = False
        self._token_renew_thread = threading.Thread(
            target=self._token_renewal_loop,
            daemon=True
        )
        self._token_renew_thread.start()
        logger.info("Token auto-renewal started")

    def _token_renewal_loop(self):
        """Background loop to renew token before expiration"""
        while not self._shutdown:
            try:
                if self._token_renewable and self._token_ttl > 0:
                    # Renew at 80% of TTL
                    renewal_time = self._token_ttl * 0.8
                    time.sleep(renewal_time)

                    if not self._shutdown:
                        with self._lock:
                            self.renew_token()
                else:
                    time.sleep(60)  # Check every minute if not renewable

            except Exception as e:
                logger.error(f"Error in token renewal loop: {e}")
                time.sleep(60)

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type(VaultError)
    )
    def renew_token(self, increment: Optional[int] = None):
        """
        Renew the current token.

        Args:
            increment: Requested TTL extension in seconds
        """
        try:
            response = self.client.auth.token.renew_self(increment=increment)
            self._update_token_metadata()
            logger.info(f"Token renewed successfully, new TTL: {self._token_ttl}s")
            return response

        except Exception as e:
            logger.error(f"Token renewal failed: {e}")
            raise VaultClientError(f"Failed to renew token: {e}") from e

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type(VaultError)
    )
    def read_secret(self, path: str, version: Optional[int] = None) -> Dict[str, Any]:
        """
        Read a secret from Vault KV v2.

        Args:
            path: Secret path (without mount point)
            version: Secret version (None for latest)

        Returns:
            Secret data dictionary

        Raises:
            VaultSecretNotFoundError: If secret doesn't exist
            VaultClientError: For other errors
        """
        try:
            # KV v2 read
            response = self.client.secrets.kv.v2.read_secret_version(
                path=path,
                mount_point=self.mount_point,
                version=version
            )

            if not response or 'data' not in response:
                raise VaultSecretNotFoundError(f"Secret not found: {path}")

            secret_data = response['data']['data']
            metadata = response['data']['metadata']

            logger.debug(f"Read secret: {path} (version {metadata.get('version')})")
            return secret_data

        except InvalidPath as e:
            logger.warning(f"Secret not found: {path}")
            raise VaultSecretNotFoundError(f"Secret not found: {path}") from e
        except Forbidden as e:
            logger.error(f"Access denied to secret: {path}")
            raise VaultClientError(f"Access denied: {path}") from e
        except Exception as e:
            logger.error(f"Failed to read secret {path}: {e}")
            raise VaultClientError(f"Failed to read secret: {e}") from e

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type(VaultError)
    )
    def write_secret(self, path: str, data: Dict[str, Any], cas: Optional[int] = None) -> Dict[str, Any]:
        """
        Write a secret to Vault KV v2.

        Args:
            path: Secret path (without mount point)
            data: Secret data to write
            cas: Check-and-Set version (for optimistic locking)

        Returns:
            Response with version information
        """
        try:
            response = self.client.secrets.kv.v2.create_or_update_secret(
                path=path,
                secret=data,
                mount_point=self.mount_point,
                cas=cas
            )

            version = response['data']['version']
            logger.info(f"Wrote secret: {path} (version {version})")
            return response['data']

        except Exception as e:
            logger.error(f"Failed to write secret {path}: {e}")
            raise VaultClientError(f"Failed to write secret: {e}") from e

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type(VaultError)
    )
    def delete_secret(self, path: str, versions: Optional[List[int]] = None):
        """
        Delete secret versions from Vault KV v2.

        Args:
            path: Secret path (without mount point)
            versions: List of versions to delete (None for latest)
        """
        try:
            if versions:
                # Delete specific versions
                self.client.secrets.kv.v2.delete_secret_versions(
                    path=path,
                    versions=versions,
                    mount_point=self.mount_point
                )
                logger.info(f"Deleted secret versions {versions}: {path}")
            else:
                # Delete latest version
                self.client.secrets.kv.v2.delete_latest_version_of_secret(
                    path=path,
                    mount_point=self.mount_point
                )
                logger.info(f"Deleted latest secret version: {path}")

        except Exception as e:
            logger.error(f"Failed to delete secret {path}: {e}")
            raise VaultClientError(f"Failed to delete secret: {e}") from e

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type(VaultError)
    )
    def list_secrets(self, path: str = "") -> List[str]:
        """
        List secrets at a given path.

        Args:
            path: Directory path to list

        Returns:
            List of secret names
        """
        try:
            response = self.client.secrets.kv.v2.list_secrets(
                path=path,
                mount_point=self.mount_point
            )

            keys = response['data']['keys']
            logger.debug(f"Listed {len(keys)} secrets at {path}")
            return keys

        except InvalidPath:
            logger.debug(f"No secrets found at {path}")
            return []
        except Exception as e:
            logger.error(f"Failed to list secrets at {path}: {e}")
            raise VaultClientError(f"Failed to list secrets: {e}") from e

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type(VaultError)
    )
    def rotate_secret(self, path: str, new_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Rotate a secret by writing a new version.

        Args:
            path: Secret path
            new_data: New secret data

        Returns:
            Response with new version information
        """
        try:
            # Read current secret to verify it exists
            current = self.read_secret(path)

            # Write new version
            response = self.write_secret(path, new_data)

            logger.info(f"Rotated secret: {path} (new version {response['version']})")
            return response

        except VaultSecretNotFoundError:
            # If secret doesn't exist, just write it
            logger.info(f"Creating new secret during rotation: {path}")
            return self.write_secret(path, new_data)

    def get_database_credentials(self, role: str = "psra-app") -> Dict[str, str]:
        """
        Get dynamic database credentials from Vault.

        Args:
            role: Database role name

        Returns:
            Dictionary with username and password
        """
        try:
            response = self.client.secrets.database.generate_credentials(
                name=role
            )

            credentials = {
                'username': response['data']['username'],
                'password': response['data']['password'],
                'lease_id': response['lease_id'],
                'lease_duration': response['lease_duration']
            }

            logger.info(f"Generated database credentials for role: {role}")
            return credentials

        except Exception as e:
            logger.error(f"Failed to get database credentials: {e}")
            raise VaultClientError(f"Failed to get database credentials: {e}") from e

    def get_api_key(self, service: str) -> str:
        """
        Get API key for a service.

        Args:
            service: Service name (e.g., 'openai', 'stripe')

        Returns:
            API key string
        """
        try:
            secret_data = self.read_secret(f"api-keys/{service}")
            return secret_data.get('key', '')

        except VaultSecretNotFoundError:
            logger.error(f"API key not found for service: {service}")
            raise

    def get_encryption_key(self, purpose: str = "default") -> bytes:
        """
        Get encryption key for a specific purpose.

        Args:
            purpose: Key purpose (e.g., 'default', 'database', 'file')

        Returns:
            Encryption key as bytes
        """
        try:
            secret_data = self.read_secret(f"encryption-keys/{purpose}")
            key_hex = secret_data.get('key', '')
            return bytes.fromhex(key_hex)

        except VaultSecretNotFoundError:
            logger.error(f"Encryption key not found for purpose: {purpose}")
            raise

    def get_tls_certificate(self, domain: str) -> Dict[str, str]:
        """
        Get TLS certificate for a domain.

        Args:
            domain: Domain name

        Returns:
            Dictionary with certificate, private_key, and ca_chain
        """
        try:
            secret_data = self.read_secret(f"tls-certificates/{domain}")
            return {
                'certificate': secret_data.get('certificate', ''),
                'private_key': secret_data.get('private_key', ''),
                'ca_chain': secret_data.get('ca_chain', ''),
                'expiry': secret_data.get('expiry', '')
            }

        except VaultSecretNotFoundError:
            logger.error(f"TLS certificate not found for domain: {domain}")
            raise

    def health_check(self) -> Dict[str, Any]:
        """
        Check Vault health and client status.

        Returns:
            Dictionary with health information
        """
        try:
            health = self.client.sys.read_health_status()

            return {
                'initialized': health['initialized'],
                'sealed': health['sealed'],
                'authenticated': self.client.is_authenticated(),
                'vault_version': health.get('version', 'unknown'),
                'cluster_name': health.get('cluster_name', 'unknown'),
                'token_renewable': self._token_renewable,
                'token_ttl': self._token_ttl
            }

        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return {
                'error': str(e),
                'authenticated': False
            }

    def close(self):
        """Close the Vault client and cleanup resources"""
        self._shutdown = True

        if self._token_renew_thread and self._token_renew_thread.is_alive():
            self._token_renew_thread.join(timeout=5)

        logger.info("Vault client closed")

    def __enter__(self):
        """Context manager entry"""
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        self.close()


# Global client instance
_vault_client: Optional[VaultClient] = None
_client_lock = threading.Lock()


def get_vault_client() -> VaultClient:
    """
    Get or create the global Vault client instance.

    Returns:
        VaultClient instance
    """
    global _vault_client

    if _vault_client is None:
        with _client_lock:
            if _vault_client is None:
                _vault_client = VaultClient()

    return _vault_client


def close_vault_client():
    """Close the global Vault client"""
    global _vault_client

    if _vault_client is not None:
        with _client_lock:
            if _vault_client is not None:
                _vault_client.close()
                _vault_client = None


# Convenience functions
def read_secret(path: str, version: Optional[int] = None) -> Dict[str, Any]:
    """Read a secret using the global client"""
    client = get_vault_client()
    return client.read_secret(path, version)


def write_secret(path: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """Write a secret using the global client"""
    client = get_vault_client()
    return client.write_secret(path, data)


def rotate_secret(path: str, new_data: Dict[str, Any]) -> Dict[str, Any]:
    """Rotate a secret using the global client"""
    client = get_vault_client()
    return client.rotate_secret(path, new_data)


def get_database_credentials(role: str = "psra-app") -> Dict[str, str]:
    """Get database credentials using the global client"""
    client = get_vault_client()
    return client.get_database_credentials(role)


def get_api_key(service: str) -> str:
    """Get API key using the global client"""
    client = get_vault_client()
    return client.get_api_key(service)
