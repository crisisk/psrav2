#!/usr/bin/env python3
"""
Manual test script to verify Prometheus metrics integration.

This script can be run directly to test the metrics endpoint without starting the full server.
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from fastapi.testclient import TestClient


def test_metrics_integration():
    """Test the Prometheus metrics integration."""
    print("=" * 80)
    print("PSRA-LTSD Prometheus Metrics Integration Test")
    print("=" * 80)
    print()

    try:
        # Import the app
        print("[1/6] Importing FastAPI application...")
        from backend.main import app
        print("✓ Application imported successfully")
        print()

        # Create test client
        print("[2/6] Creating test client...")
        client = TestClient(app)
        print("✓ Test client created")
        print()

        # Test health endpoint
        print("[3/6] Testing health endpoint...")
        response = client.get("/healthz")
        assert response.status_code == 200, f"Health check failed: {response.status_code}"
        print(f"✓ Health endpoint OK: {response.json()}")
        print()

        # Test metrics endpoint
        print("[4/6] Testing /metrics endpoint...")
        response = client.get("/metrics")
        assert response.status_code == 200, f"Metrics endpoint failed: {response.status_code}"
        print(f"✓ Metrics endpoint returns: {response.status_code}")
        print(f"  Content-Type: {response.headers.get('content-type')}")
        print(f"  Content length: {len(response.text)} bytes")
        print()

        # Validate metrics format
        print("[5/6] Validating Prometheus format...")
        content = response.text

        checks = {
            "Contains HELP comments": "# HELP" in content,
            "Contains TYPE comments": "# TYPE" in content,
            "Contains HTTP metrics": "psra_http_requests_total" in content,
            "Contains duration metrics": "psra_http_request_duration_seconds" in content,
            "Contains active requests": "psra_active_requests" in content,
            "Contains HS code metrics": "psra_hs_code_lookups_total" in content,
            "Contains assessment metrics": "psra_origin_assessments_total" in content,
            "Contains LTSD metrics": "psra_ltsd_operations_total" in content,
            "Contains LLM metrics": "psra_llm_calls_total" in content,
            "Contains cache metrics": "psra_cache_hits_total" in content,
            "Contains DB metrics": "psra_database_query_duration_seconds" in content,
        }

        passed = 0
        failed = 0
        for check, result in checks.items():
            status = "✓" if result else "✗"
            print(f"  {status} {check}")
            if result:
                passed += 1
            else:
                failed += 1

        print()
        print(f"  Checks passed: {passed}/{len(checks)}")
        print()

        # Display sample metrics
        print("[6/6] Sample metrics output:")
        print("-" * 80)
        lines = content.split('\n')
        # Show first 50 lines
        for line in lines[:50]:
            if line.strip():
                print(f"  {line}")
        if len(lines) > 50:
            print(f"  ... ({len(lines) - 50} more lines)")
        print("-" * 80)
        print()

        # Final summary
        print("=" * 80)
        if failed == 0:
            print("✓ ALL TESTS PASSED - Prometheus integration is working correctly!")
        else:
            print(f"⚠ {failed} checks failed - Review the output above")
        print("=" * 80)
        print()

        print("Next steps:")
        print("1. Start the application: uvicorn backend.main:app --reload")
        print("2. Access metrics: curl http://localhost:8000/metrics")
        print("3. Configure Prometheus to scrape: http://localhost:8000/metrics")
        print("4. Import Grafana dashboards from: ops/observability/grafana-dashboards/")
        print()

        return failed == 0

    except ImportError as e:
        print(f"✗ Import error: {e}")
        print()
        print("This might be due to missing dependencies.")
        print("Make sure you have installed all requirements:")
        print("  pip install -r requirements.txt")
        return False

    except AssertionError as e:
        print(f"✗ Assertion failed: {e}")
        return False

    except Exception as e:
        print(f"✗ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = test_metrics_integration()
    sys.exit(0 if success else 1)
