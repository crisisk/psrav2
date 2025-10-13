#!/usr/bin/env python3
"""
API Key Service Test Script

Demonstrates the API key service functionality.
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.services.api_key_service import APIKeyService


def test_key_generation():
    """Test API key generation"""
    print("=" * 70)
    print("TEST 1: API Key Generation")
    print("=" * 70)

    api_key, key_hash = APIKeyService.generate_api_key()

    print(f"✓ Generated API key: {api_key}")
    print(f"✓ Key length: {len(api_key)} characters")
    print(f"✓ Key hash: {key_hash}")
    print(f"✓ Hash length: {len(key_hash)} characters")

    # Verify format
    assert len(api_key) == 64, "API key should be 64 characters"
    assert len(key_hash) == 64, "Hash should be 64 characters"
    assert api_key != key_hash, "Key and hash should be different"

    print("✓ Format validation: PASS\n")
    return api_key, key_hash


def test_key_validation(api_key, key_hash):
    """Test API key validation"""
    print("=" * 70)
    print("TEST 2: API Key Validation")
    print("=" * 70)

    # Test valid key
    is_valid = APIKeyService.validate_api_key(api_key, key_hash)
    print(f"✓ Valid key test: {is_valid}")
    assert is_valid, "Valid key should pass validation"

    # Test invalid key
    invalid_key = "0" * 64
    is_valid = APIKeyService.validate_api_key(invalid_key, key_hash)
    print(f"✓ Invalid key test: {is_valid}")
    assert not is_valid, "Invalid key should fail validation"

    # Test malformed key
    malformed_key = "not_a_valid_key"
    is_valid = APIKeyService.validate_api_key(malformed_key, key_hash)
    print(f"✓ Malformed key test: {is_valid}")
    assert not is_valid, "Malformed key should fail validation"

    print("✓ Validation tests: PASS\n")


def test_format_validation():
    """Test key format validation"""
    print("=" * 70)
    print("TEST 3: Format Validation")
    print("=" * 70)

    # Valid format
    valid_key = "a" * 64
    assert APIKeyService.validate_key_format(valid_key), "Valid format should pass"
    print(f"✓ Valid format (64 hex chars): PASS")

    # Invalid length
    short_key = "a" * 32
    assert not APIKeyService.validate_key_format(short_key), "Short key should fail"
    print(f"✓ Invalid length test: PASS")

    # Invalid characters
    invalid_chars = "g" * 64  # 'g' is not hexadecimal
    assert not APIKeyService.validate_key_format(invalid_chars), "Non-hex should fail"
    print(f"✓ Invalid characters test: PASS")

    print("✓ Format validation tests: PASS\n")


def test_key_revocation():
    """Test key revocation"""
    print("=" * 70)
    print("TEST 4: Key Revocation")
    print("=" * 70)

    revocation = APIKeyService.revoke_api_key(
        key_id="test_key_123",
        revoked_by="admin@sevensa.nl",
        reason="Testing revocation functionality"
    )

    print(f"✓ Revocation data:")
    print(f"  - Key ID: {revocation['key_id']}")
    print(f"  - Revoked at: {revocation['revoked_at']}")
    print(f"  - Revoked by: {revocation['revoked_by']}")
    print(f"  - Reason: {revocation['reason']}")
    print(f"  - Is active: {revocation['is_active']}")

    assert revocation['key_id'] == "test_key_123"
    assert revocation['is_active'] is False
    assert revocation['revoked_by'] == "admin@sevensa.nl"

    print("✓ Revocation test: PASS\n")


def test_with_generated_keys():
    """Test with the actual generated keys"""
    print("=" * 70)
    print("TEST 5: Validate Generated Keys")
    print("=" * 70)

    # Test keys from api_keys_secure.json
    test_cases = [
        {
            "partner": "Acme Corporation",
            "api_key": "25b7ffb7e32872f6601ba37ef8721de0c86fcb9c49bc6c9b7fcf75e9ac85e0c6",
            "key_hash": "fc9a73b269effa94ea589cf04c5e21c81cbcf69532409a65901c2b41599d0074",
        },
        {
            "partner": "GlobalTrade Inc",
            "api_key": "17cb4dc11678e9a43723b9446aa544aa457d671ff728186520937ba1e34ae38b",
            "key_hash": "01e953086b55cd7ea9a9e76bec0692f25c0bf13d0a0395521a317f82b80c0c83",
        },
        {
            "partner": "Test Partner",
            "api_key": "ec9a6a4c8395a7cb2884af922bed7c8aa7b5a46b1512e789f2a77958c33f9873",
            "key_hash": "9d496f1f17d4a7f82240dd503f5b3f1470c641f73df65dcfc4a758851f9738a0",
        },
    ]

    for test in test_cases:
        is_valid = APIKeyService.validate_api_key(
            test["api_key"],
            test["key_hash"]
        )
        prefix = APIKeyService.get_key_prefix(test["api_key"])
        status = "✓ VALID" if is_valid else "✗ INVALID"

        print(f"{status} - {test['partner']}")
        print(f"  Prefix: {prefix}")

        assert is_valid, f"Key for {test['partner']} should be valid"

    print("\n✓ All generated keys validated: PASS\n")


def main():
    """Run all tests"""
    print("\n" + "=" * 70)
    print("API Key Service Test Suite")
    print("=" * 70 + "\n")

    try:
        # Run tests
        api_key, key_hash = test_key_generation()
        test_key_validation(api_key, key_hash)
        test_format_validation()
        test_key_revocation()
        test_with_generated_keys()

        # Summary
        print("=" * 70)
        print("ALL TESTS PASSED ✓")
        print("=" * 70)
        print("\nAPI Key Service is working correctly!")
        print("- Key generation: OK")
        print("- Key validation: OK")
        print("- Format validation: OK")
        print("- Key revocation: OK")
        print("- Generated keys: OK")
        print()

    except AssertionError as e:
        print(f"\n✗ TEST FAILED: {e}\n")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ ERROR: {e}\n")
        sys.exit(1)


if __name__ == "__main__":
    main()
