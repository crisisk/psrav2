#!/usr/bin/env python3
"""
Validation script for Prometheus metrics setup.

This script validates the setup without running the application.
"""

import sys
import ast
from pathlib import Path


def validate_file_exists(filepath, description):
    """Validate that a file exists."""
    path = Path(filepath)
    if path.exists():
        print(f"✓ {description}")
        return True
    else:
        print(f"✗ {description} - File not found: {filepath}")
        return False


def validate_python_imports(filepath, required_imports):
    """Validate that a Python file has required imports."""
    try:
        with open(filepath, 'r') as f:
            content = f.read()
            tree = ast.parse(content)

            imports = set()
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        imports.add(alias.name)
                elif isinstance(node, ast.ImportFrom):
                    if node.module:
                        imports.add(node.module)

            missing = []
            for req in required_imports:
                if not any(req in imp for imp in imports):
                    missing.append(req)

            if missing:
                print(f"  ⚠ Missing imports: {', '.join(missing)}")
                return False
            return True
    except Exception as e:
        print(f"  ✗ Error parsing file: {e}")
        return False


def validate_metrics_middleware():
    """Validate the Prometheus middleware file."""
    print("\n[1/5] Validating Prometheus Middleware...")
    filepath = "backend/middleware/prometheus_exporter.py"

    if not validate_file_exists(filepath, "Prometheus middleware file exists"):
        return False

    with open(filepath, 'r') as f:
        content = f.read()

    checks = {
        "prometheus_client imported": "from prometheus_client import" in content,
        "Counter metric defined": "Counter(" in content,
        "Histogram metric defined": "Histogram(" in content,
        "Gauge metric defined": "Gauge(" in content,
        "PrometheusMiddleware class": "class PrometheusMiddleware" in content,
        "metrics_endpoint function": "def metrics_endpoint" in content or "async def metrics_endpoint" in content,
        "HTTP request tracking": "psra_http_requests_total" in content,
        "Duration tracking": "psra_http_request_duration_seconds" in content,
        "HS code metrics": "psra_hs_code_lookups_total" in content,
        "Assessment metrics": "psra_origin_assessments_total" in content,
        "LLM metrics": "psra_llm_calls_total" in content,
        "Cache metrics": "psra_cache_hits_total" in content,
    }

    passed = sum(1 for result in checks.values() if result)
    for check, result in checks.items():
        status = "✓" if result else "✗"
        print(f"  {status} {check}")

    print(f"\n  Checks passed: {passed}/{len(checks)}")
    return passed == len(checks)


def validate_main_app():
    """Validate the main application file."""
    print("\n[2/5] Validating Main Application...")
    filepath = "backend/main.py"

    if not validate_file_exists(filepath, "Main application file exists"):
        return False

    with open(filepath, 'r') as f:
        content = f.read()

    checks = {
        "FastAPI imported": "from fastapi import FastAPI" in content,
        "PrometheusMiddleware imported": "from backend.middleware.prometheus_exporter import" in content and "PrometheusMiddleware" in content,
        "Middleware added": "add_middleware(PrometheusMiddleware)" in content or "app.add_middleware(PrometheusMiddleware)" in content,
        "Metrics endpoint mounted": "@app.get(\"/metrics\")" in content or "async def metrics" in content,
        "Health check endpoint": "/healthz" in content,
        "Readiness endpoint": "/readyz" in content,
    }

    passed = sum(1 for result in checks.values() if result)
    for check, result in checks.items():
        status = "✓" if result else "✗"
        print(f"  {status} {check}")

    print(f"\n  Checks passed: {passed}/{len(checks)}")
    return passed == len(checks)


def validate_prometheus_config():
    """Validate Prometheus configuration."""
    print("\n[3/5] Validating Prometheus Configuration...")
    filepath = "ops/observability/prometheus.yml"

    if not validate_file_exists(filepath, "Prometheus config file exists"):
        return False

    with open(filepath, 'r') as f:
        content = f.read()

    checks = {
        "Global config": "global:" in content,
        "Scrape interval defined": "scrape_interval:" in content,
        "Scrape configs": "scrape_configs:" in content,
        "PSRA API job": "psra-ltsd-api" in content,
        "Metrics path": "metrics_path:" in content or "/metrics" in content,
        "Retention policy": "retention" in content,
        "Alertmanager config": "alerting:" in content,
    }

    passed = sum(1 for result in checks.values() if result)
    for check, result in checks.items():
        status = "✓" if result else "✗"
        print(f"  {status} {check}")

    print(f"\n  Checks passed: {passed}/{len(checks)}")
    return passed >= len(checks) - 1  # Allow one optional check to fail


def validate_grafana_dashboards():
    """Validate Grafana dashboards."""
    print("\n[4/5] Validating Grafana Dashboards...")

    dashboard_dir = Path("ops/observability/grafana-dashboards")
    if not dashboard_dir.exists():
        print(f"✗ Dashboard directory not found: {dashboard_dir}")
        return False

    required_dashboards = [
        ("http-metrics-dashboard.json", "HTTP Metrics Dashboard"),
        ("business-metrics-dashboard.json", "Business Metrics Dashboard"),
        ("llm-usage-dashboard.json", "LLM Usage Dashboard"),
        ("system-overview-dashboard.json", "System Overview Dashboard"),
    ]

    passed = 0
    for filename, description in required_dashboards:
        filepath = dashboard_dir / filename
        if filepath.exists():
            # Validate it's valid JSON
            try:
                import json
                with open(filepath, 'r') as f:
                    data = json.load(f)
                    if "panels" in data and "title" in data:
                        print(f"  ✓ {description} ({filename})")
                        passed += 1
                    else:
                        print(f"  ⚠ {description} exists but may be invalid")
            except json.JSONDecodeError:
                print(f"  ✗ {description} contains invalid JSON")
        else:
            print(f"  ✗ {description} not found")

    # Check for README
    readme_path = dashboard_dir / "README.md"
    if readme_path.exists():
        print(f"  ✓ Dashboard README exists")
        passed += 1

    print(f"\n  Checks passed: {passed}/{len(required_dashboards) + 1}")
    return passed >= len(required_dashboards)


def validate_test_files():
    """Validate test files."""
    print("\n[5/5] Validating Test Files...")

    test_files = [
        ("backend/tests/test_prometheus_metrics.py", "Pytest test suite"),
        ("backend/tests/validate_metrics_setup.py", "Validation script"),
    ]

    passed = 0
    for filepath, description in test_files:
        if Path(filepath).exists():
            print(f"  ✓ {description} ({filepath})")
            passed += 1
        else:
            print(f"  ✗ {description} not found")

    print(f"\n  Checks passed: {passed}/{len(test_files)}")
    return passed == len(test_files)


def main():
    """Main validation function."""
    print("=" * 80)
    print("PSRA-LTSD Prometheus Metrics Setup Validation")
    print("=" * 80)

    results = []

    results.append(validate_metrics_middleware())
    results.append(validate_main_app())
    results.append(validate_prometheus_config())
    results.append(validate_grafana_dashboards())
    results.append(validate_test_files())

    print("\n" + "=" * 80)
    print("VALIDATION SUMMARY")
    print("=" * 80)

    passed = sum(results)
    total = len(results)

    print(f"\nTotal: {passed}/{total} validation sections passed")

    if passed == total:
        print("\n✓ ALL VALIDATIONS PASSED")
        print("\nYour Prometheus metrics integration is ready!")
        print("\nNext steps:")
        print("1. Start the application:")
        print("   uvicorn backend.main:app --host 0.0.0.0 --port 8000")
        print("\n2. Test the metrics endpoint:")
        print("   curl http://localhost:8000/metrics")
        print("\n3. Start Prometheus with the config:")
        print("   prometheus --config.file=ops/observability/prometheus.yml")
        print("\n4. Import Grafana dashboards from:")
        print("   ops/observability/grafana-dashboards/")
        return True
    else:
        print(f"\n⚠ {total - passed} validation(s) failed")
        print("\nPlease review the output above and fix any issues.")
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
