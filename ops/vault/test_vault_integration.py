#!/usr/bin/env python3
"""
Test script for OpenBao/Vault integration
Tests the vault_client.py implementation with real Vault server

Usage:
    python test_vault_integration.py

Environment Variables:
    VAULT_ADDR: Vault server address
    VAULT_ROLE_ID: AppRole role ID
    VAULT_SECRET_ID: AppRole secret ID

Created: 2025-10-13
"""

import sys
import os
import logging
from datetime import datetime

# Add backend to path
sys.path.insert(0, '/home/vncuser/psra-ltsd-enterprise-v2/backend')

from services.vault_client import (
    get_vault_client,
    VaultClient,
    VaultClientError,
    VaultSecretNotFoundError
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def print_section(title):
    """Print a section header"""
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)


def test_health_check():
    """Test Vault health check"""
    print_section("Test 1: Health Check")

    try:
        vault = get_vault_client()
        health = vault.health_check()

        print(f"✓ Vault Status:")
        print(f"  - Initialized: {health['initialized']}")
        print(f"  - Sealed: {health['sealed']}")
        print(f"  - Authenticated: {health['authenticated']}")
        print(f"  - Vault Version: {health['vault_version']}")
        print(f"  - Cluster Name: {health['cluster_name']}")
        print(f"  - Token TTL: {health['token_ttl']}s")
        print(f"  - Token Renewable: {health['token_renewable']}")

        return health['authenticated']

    except Exception as e:
        print(f"✗ Health check failed: {e}")
        return False


def test_read_secret():
    """Test reading a secret"""
    print_section("Test 2: Read Secret")

    try:
        vault = get_vault_client()

        # Try to read database secret
        secret = vault.read_secret("database/psra-primary")
        print(f"✓ Successfully read secret: database/psra-primary")
        print(f"  - Database: {secret.get('database', 'N/A')}")
        print(f"  - Host: {secret.get('host', 'N/A')}")
        print(f"  - Port: {secret.get('port', 'N/A')}")
        print(f"  - Description: {secret.get('description', 'N/A')}")

        return True

    except VaultSecretNotFoundError as e:
        print(f"⚠ Secret not found: {e}")
        print("  (This is expected if init_vault.sh hasn't been run)")
        return False
    except Exception as e:
        print(f"✗ Failed to read secret: {e}")
        return False


def test_write_and_read_secret():
    """Test writing and reading a secret"""
    print_section("Test 3: Write and Read Secret")

    try:
        vault = get_vault_client()

        # Write a test secret
        test_path = "test/integration-test"
        test_data = {
            "message": "Hello from Vault integration test!",
            "timestamp": datetime.now().isoformat(),
            "test_number": 42
        }

        print(f"Writing test secret to: {test_path}")
        response = vault.write_secret(test_path, test_data)
        print(f"✓ Secret written successfully")
        print(f"  - Version: {response['version']}")

        # Read it back
        print(f"Reading test secret from: {test_path}")
        retrieved = vault.read_secret(test_path)
        print(f"✓ Secret read successfully")
        print(f"  - Message: {retrieved['message']}")
        print(f"  - Timestamp: {retrieved['timestamp']}")
        print(f"  - Test Number: {retrieved['test_number']}")

        # Verify data matches
        if retrieved == test_data:
            print("✓ Data matches original")
            return True
        else:
            print("✗ Data does not match original")
            return False

    except Exception as e:
        print(f"✗ Test failed: {e}")
        return False


def test_list_secrets():
    """Test listing secrets"""
    print_section("Test 4: List Secrets")

    try:
        vault = get_vault_client()

        # List secrets in different paths
        paths_to_check = ["database", "api-keys", "test"]

        for path in paths_to_check:
            try:
                secrets = vault.list_secrets(path)
                print(f"✓ Secrets in '{path}/': {len(secrets)} items")
                if secrets:
                    for secret in secrets[:5]:  # Show first 5
                        print(f"  - {secret}")
                    if len(secrets) > 5:
                        print(f"  ... and {len(secrets) - 5} more")
            except Exception as e:
                print(f"⚠ No secrets in '{path}/': {e}")

        return True

    except Exception as e:
        print(f"✗ List secrets failed: {e}")
        return False


def test_secret_rotation():
    """Test secret rotation"""
    print_section("Test 5: Secret Rotation")

    try:
        vault = get_vault_client()

        test_path = "test/rotation-test"

        # Write initial secret
        print("Writing initial secret...")
        initial_data = {
            "key": "initial-value",
            "version": 1,
            "created_at": datetime.now().isoformat()
        }
        vault.write_secret(test_path, initial_data)
        print("✓ Initial secret written")

        # Rotate the secret
        print("Rotating secret...")
        rotated_data = {
            "key": "rotated-value",
            "version": 2,
            "rotated_at": datetime.now().isoformat()
        }
        response = vault.rotate_secret(test_path, rotated_data)
        print(f"✓ Secret rotated successfully")
        print(f"  - New version: {response['version']}")

        # Read the new version
        current = vault.read_secret(test_path)
        print(f"✓ Current value: {current['key']}")

        # Read the old version
        old = vault.read_secret(test_path, version=1)
        print(f"✓ Previous value: {old['key']}")

        if current['key'] == "rotated-value" and old['key'] == "initial-value":
            print("✓ Rotation successful, versions maintained")
            return True
        else:
            print("✗ Rotation verification failed")
            return False

    except Exception as e:
        print(f"✗ Rotation test failed: {e}")
        return False


def test_convenience_functions():
    """Test convenience functions"""
    print_section("Test 6: Convenience Functions")

    try:
        vault = get_vault_client()

        # Test get_api_key
        try:
            api_key = vault.get_api_key("openai")
            print(f"✓ Retrieved OpenAI API key")
            print(f"  - Key prefix: {api_key[:10]}..." if api_key else "  - Empty key")
        except VaultSecretNotFoundError:
            print("⚠ OpenAI API key not configured (expected)")

        # Test get_encryption_key
        try:
            enc_key = vault.get_encryption_key("default")
            print(f"✓ Retrieved encryption key")
            print(f"  - Key length: {len(enc_key)} bytes")
        except VaultSecretNotFoundError:
            print("⚠ Encryption key not configured (expected)")

        return True

    except Exception as e:
        print(f"✗ Convenience functions test failed: {e}")
        return False


def test_context_manager():
    """Test context manager usage"""
    print_section("Test 7: Context Manager")

    try:
        # Use context manager
        with VaultClient() as vault:
            health = vault.health_check()
            print(f"✓ Context manager works")
            print(f"  - Authenticated: {health['authenticated']}")

        print("✓ Context manager closed successfully")
        return True

    except Exception as e:
        print(f"✗ Context manager test failed: {e}")
        return False


def test_token_operations():
    """Test token operations"""
    print_section("Test 8: Token Operations")

    try:
        vault = get_vault_client()

        # Get token info
        print("Token information:")
        print(f"  - TTL: {vault._token_ttl}s")
        print(f"  - Renewable: {vault._token_renewable}")
        print(f"  - Creation time: {vault._token_creation_time}")

        # Test token renewal (if renewable)
        if vault._token_renewable:
            print("Testing token renewal...")
            vault.renew_token()
            print(f"✓ Token renewed successfully")
            print(f"  - New TTL: {vault._token_ttl}s")
        else:
            print("⚠ Token not renewable")

        return True

    except Exception as e:
        print(f"✗ Token operations test failed: {e}")
        return False


def cleanup_test_secrets():
    """Clean up test secrets"""
    print_section("Cleanup: Removing Test Secrets")

    try:
        vault = get_vault_client()

        test_paths = [
            "test/integration-test",
            "test/rotation-test"
        ]

        for path in test_paths:
            try:
                vault.delete_secret(path)
                print(f"✓ Deleted: {path}")
            except Exception as e:
                print(f"⚠ Could not delete {path}: {e}")

        return True

    except Exception as e:
        print(f"✗ Cleanup failed: {e}")
        return False


def main():
    """Run all tests"""
    print("\n" + "=" * 70)
    print("  OpenBao/Vault Integration Test Suite")
    print("=" * 70)

    # Check environment
    print("\nEnvironment Configuration:")
    print(f"  VAULT_ADDR: {os.getenv('VAULT_ADDR', 'NOT SET')}")
    print(f"  VAULT_ROLE_ID: {'SET' if os.getenv('VAULT_ROLE_ID') else 'NOT SET'}")
    print(f"  VAULT_SECRET_ID: {'SET' if os.getenv('VAULT_SECRET_ID') else 'NOT SET'}")

    # Run tests
    results = []

    tests = [
        ("Health Check", test_health_check),
        ("Read Secret", test_read_secret),
        ("Write and Read Secret", test_write_and_read_secret),
        ("List Secrets", test_list_secrets),
        ("Secret Rotation", test_secret_rotation),
        ("Convenience Functions", test_convenience_functions),
        ("Context Manager", test_context_manager),
        ("Token Operations", test_token_operations),
    ]

    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            logger.error(f"Test '{test_name}' raised exception: {e}")
            results.append((test_name, False))

    # Cleanup
    cleanup_test_secrets()

    # Print summary
    print_section("Test Summary")

    passed = sum(1 for _, result in results if result)
    total = len(results)

    print(f"\nResults: {passed}/{total} tests passed\n")

    for test_name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"  {status}: {test_name}")

    print("\n" + "=" * 70)

    # Exit with appropriate code
    exit_code = 0 if passed == total else 1

    if exit_code == 0:
        print("\n✓ All tests passed! Vault integration is working correctly.")
    else:
        print(f"\n⚠ {total - passed} test(s) failed. Check the output above for details.")

    print("=" * 70 + "\n")

    return exit_code


if __name__ == "__main__":
    try:
        exit_code = main()
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ Fatal error: {e}")
        logger.exception("Fatal error in test suite")
        sys.exit(1)
