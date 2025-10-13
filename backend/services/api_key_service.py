"""
API Key Service

Handles generation, validation, and management of Partner API keys.
Provides secure key generation with SHA-256 hashing and validation.
"""

import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

# Note: Using print for logging to avoid conflict with local logging.py module
# In production, integrate with your existing logging system


class APIKeyService:
    """Service for managing Partner API keys"""

    @staticmethod
    def generate_api_key() -> tuple[str, str]:
        """
        Generate a new 64-character hex API key with SHA-256 hash.

        Returns:
            tuple: (api_key, key_hash) - The plaintext key and its SHA-256 hash

        Example:
            >>> api_key, key_hash = APIKeyService.generate_api_key()
            >>> len(api_key)
            64
            >>> len(key_hash)
            64
        """
        # Generate 32 random bytes (256 bits) and convert to 64 hex characters
        random_bytes = secrets.token_bytes(32)
        api_key = random_bytes.hex()

        # Generate SHA-256 hash of the API key for storage
        key_hash = hashlib.sha256(api_key.encode('utf-8')).hexdigest()

        return api_key, key_hash

    @staticmethod
    def hash_api_key(api_key: str) -> str:
        """
        Generate SHA-256 hash of an API key.

        Args:
            api_key: The plaintext API key to hash

        Returns:
            str: SHA-256 hash of the key (64 hex characters)
        """
        return hashlib.sha256(api_key.encode('utf-8')).hexdigest()

    @staticmethod
    def validate_api_key(api_key: str, stored_hash: str) -> bool:
        """
        Validate an API key against its stored hash.

        Args:
            api_key: The plaintext API key to validate
            stored_hash: The stored SHA-256 hash to compare against

        Returns:
            bool: True if the key is valid, False otherwise

        Example:
            >>> api_key, key_hash = APIKeyService.generate_api_key()
            >>> APIKeyService.validate_api_key(api_key, key_hash)
            True
            >>> APIKeyService.validate_api_key("invalid_key", key_hash)
            False
        """
        if not api_key or not stored_hash:
            return False

        # Validate format (64 hex characters)
        if len(api_key) != 64 or not all(c in '0123456789abcdef' for c in api_key.lower()):
            return False

        # Hash the provided key and compare with stored hash
        computed_hash = APIKeyService.hash_api_key(api_key)

        # Use constant-time comparison to prevent timing attacks
        is_valid = secrets.compare_digest(computed_hash, stored_hash)

        return is_valid

    @staticmethod
    def revoke_api_key(key_id: str, revoked_by: str, reason: Optional[str] = None) -> Dict[str, Any]:
        """
        Revoke an API key (marks it as inactive).

        Args:
            key_id: The unique identifier of the API key
            revoked_by: Username/ID of person revoking the key
            reason: Optional reason for revocation

        Returns:
            dict: Revocation details including timestamp and reason

        Note:
            This function returns revocation metadata. Actual database update
            should be performed by the caller.
        """
        revocation_data = {
            'key_id': key_id,
            'revoked_at': datetime.utcnow().isoformat(),
            'revoked_by': revoked_by,
            'reason': reason or 'No reason provided',
            'is_active': False,
        }

        return revocation_data

    @staticmethod
    def validate_key_format(api_key: str) -> bool:
        """
        Validate that an API key has the correct format.

        Args:
            api_key: The API key to validate

        Returns:
            bool: True if format is valid (64 hex chars), False otherwise
        """
        if not api_key or len(api_key) != 64:
            return False

        # Check if all characters are hexadecimal
        try:
            int(api_key, 16)
            return True
        except ValueError:
            return False

    @staticmethod
    def get_key_prefix(api_key: str) -> str:
        """
        Get the prefix of an API key for logging/display purposes.

        Args:
            api_key: The full API key

        Returns:
            str: First 8 characters of the key with ellipsis
        """
        if not api_key or len(api_key) < 8:
            return "invalid"

        return f"{api_key[:8]}..."

    @staticmethod
    def create_key_metadata(
        partner_name: str,
        api_key: str,
        key_hash: str,
        expires_days: int = 365
    ) -> Dict[str, Any]:
        """
        Create metadata for a new API key.

        Args:
            partner_name: Name of the partner organization
            api_key: The generated API key (for prefix extraction)
            key_hash: SHA-256 hash of the API key
            expires_days: Number of days until expiration (default: 365)

        Returns:
            dict: Complete key metadata ready for database insertion
        """
        now = datetime.utcnow()
        expires_at = now + timedelta(days=expires_days)

        metadata = {
            'key_prefix': api_key[:8],
            'key_hash': key_hash,
            'partner_name': partner_name,
            'created_at': now.isoformat(),
            'expires_at': expires_at.isoformat(),
            'is_active': True,
            'last_used_at': None,
            'usage_count': 0,
            'rate_limit': 100,  # requests per minute
        }

        return metadata

    @staticmethod
    def is_key_expired(expires_at: datetime) -> bool:
        """
        Check if an API key has expired.

        Args:
            expires_at: Expiration datetime of the key

        Returns:
            bool: True if expired, False otherwise
        """
        if not expires_at:
            return False

        return datetime.utcnow() > expires_at


# Convenience functions for backward compatibility
def generate_api_key() -> tuple[str, str]:
    """Generate a new API key - convenience wrapper"""
    return APIKeyService.generate_api_key()


def validate_api_key(api_key: str, stored_hash: str) -> bool:
    """Validate an API key - convenience wrapper"""
    return APIKeyService.validate_api_key(api_key, stored_hash)


def revoke_api_key(key_id: str, revoked_by: str, reason: Optional[str] = None) -> Dict[str, Any]:
    """Revoke an API key - convenience wrapper"""
    return APIKeyService.revoke_api_key(key_id, revoked_by, reason)
