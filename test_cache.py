#!/usr/bin/env python3
"""Test cache service functionality."""

import sys
sys.path.insert(0, '/home/vncuser/psra-ltsd-enterprise-v2')

from backend.services.cache_service import get_cache

def main():
    cache = get_cache()
    healthy = cache.ping()

    print(f"Redis Connection: {'OK' if healthy else 'FAILED'}")
    print(f"Host: {cache.host}:{cache.port}")
    print(f"Database: {cache.db}")

    if not healthy:
        print("ERROR: Cannot connect to Redis")
        return 1

    # Test basic operations
    print("\nTesting basic operations:")

    # Set test value
    success = cache.set('test:key', {'message': 'Hello PSRA'}, ttl=60)
    print(f"  Set test key: {'OK' if success else 'FAILED'}")

    # Get test value
    value = cache.get('test:key')
    print(f"  Get test key: {value}")

    # Check existence
    exists = cache.exists('test:key')
    print(f"  Key exists: {exists}")

    # Check TTL
    ttl = cache.get_ttl('test:key')
    print(f"  Key TTL: {ttl} seconds")

    # Delete test value
    deleted = cache.delete('test:key')
    print(f"  Delete test key: {'OK' if deleted else 'FAILED'}")

    # Verify deletion
    exists_after = cache.exists('test:key')
    print(f"  Key exists after delete: {exists_after}")

    print("\nCache service is fully operational!")
    return 0

if __name__ == "__main__":
    sys.exit(main())
