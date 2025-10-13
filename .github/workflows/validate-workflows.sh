#!/usr/bin/env bash
#
# Workflow Validation Script
# Validates GitHub Actions workflow YAML syntax and configuration
#
# Usage: bash .github/workflows/validate-workflows.sh
#

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL=0
PASSED=0
FAILED=0

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}GitHub Actions Workflow Validator${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to validate YAML syntax
validate_yaml() {
    local file=$1
    local filename=$(basename "$file")

    echo -n "Validating $filename... "
    TOTAL=$((TOTAL + 1))

    # Check if file exists
    if [[ ! -f "$file" ]]; then
        echo -e "${RED}FAIL${NC} - File not found"
        FAILED=$((FAILED + 1))
        return 1
    fi

    # Check YAML syntax using Python
    if python3 -c "import yaml; yaml.safe_load(open('$file'))" 2>/dev/null; then
        echo -e "${GREEN}PASS${NC}"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}FAIL${NC} - Invalid YAML syntax"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# Function to check required fields
check_required_fields() {
    local file=$1
    local filename=$(basename "$file")

    echo -n "Checking required fields in $filename... "
    TOTAL=$((TOTAL + 1))

    local has_name=$(grep -c "^name:" "$file" || true)
    local has_on=$(grep -c "^on:" "$file" || true)
    local has_jobs=$(grep -c "^jobs:" "$file" || true)

    if [[ $has_name -gt 0 && $has_on -gt 0 && $has_jobs -gt 0 ]]; then
        echo -e "${GREEN}PASS${NC}"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}FAIL${NC} - Missing required fields"
        [[ $has_name -eq 0 ]] && echo "  - Missing 'name' field"
        [[ $has_on -eq 0 ]] && echo "  - Missing 'on' field"
        [[ $has_jobs -eq 0 ]] && echo "  - Missing 'jobs' field"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# Function to check for common issues
check_common_issues() {
    local file=$1
    local filename=$(basename "$file")
    local issues=0

    echo "Checking common issues in $filename..."
    TOTAL=$((TOTAL + 1))

    # Check for hardcoded secrets
    if grep -qE "(password|token|key):\s*['\"]?[A-Za-z0-9]+" "$file" 2>/dev/null; then
        echo -e "  ${YELLOW}WARNING${NC}: Potential hardcoded secret detected"
        issues=$((issues + 1))
    fi

    # Check for missing timeout
    if ! grep -q "timeout-minutes:" "$file"; then
        echo -e "  ${YELLOW}WARNING${NC}: No timeout specified (consider adding timeout-minutes)"
    fi

    # Check for actions versions (should use @v* or @sha)
    if grep -E "uses:.*@[^v][^0-9]" "$file" | grep -v "@main" | grep -v "@master" >/dev/null 2>&1; then
        echo -e "  ${YELLOW}WARNING${NC}: Some actions may not use versioned references"
    fi

    if [[ $issues -eq 0 ]]; then
        echo -e "  ${GREEN}PASS${NC} - No critical issues found"
        PASSED=$((PASSED + 1))
    else
        echo -e "  ${YELLOW}WARNINGS${NC} - $issues potential issues"
        PASSED=$((PASSED + 1))  # Warnings don't fail the check
    fi
}

# Main validation
WORKFLOWS_DIR=".github/workflows"

if [[ ! -d "$WORKFLOWS_DIR" ]]; then
    echo -e "${RED}ERROR${NC}: Workflows directory not found: $WORKFLOWS_DIR"
    exit 1
fi

echo -e "${BLUE}Validating workflows in $WORKFLOWS_DIR${NC}"
echo ""

# Find all YAML workflow files
shopt -s nullglob
WORKFLOW_FILES=("$WORKFLOWS_DIR"/*.yml "$WORKFLOWS_DIR"/*.yaml)

if [[ ${#WORKFLOW_FILES[@]} -eq 0 ]]; then
    echo -e "${RED}ERROR${NC}: No workflow files found"
    exit 1
fi

echo -e "${BLUE}Found ${#WORKFLOW_FILES[@]} workflow file(s)${NC}"
echo ""

# Validate each workflow
for workflow in "${WORKFLOW_FILES[@]}"; do
    validate_yaml "$workflow"
    check_required_fields "$workflow"
    check_common_issues "$workflow"
    echo ""
done

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Validation Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Total checks: $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
[[ $FAILED -gt 0 ]] && echo -e "${RED}Failed: $FAILED${NC}" || echo -e "Failed: 0"
echo ""

# Workflow statistics
echo -e "${BLUE}Workflow Statistics:${NC}"
for workflow in "${WORKFLOW_FILES[@]}"; do
    filename=$(basename "$workflow")
    lines=$(wc -l < "$workflow")
    jobs=$(grep -c "^  [a-zA-Z_-]*:" "$workflow" || true)
    echo "  - $filename: $lines lines, ~$jobs jobs"
done
echo ""

# Feature detection
echo -e "${BLUE}Detected Features:${NC}"
grep -h "uses: actions/checkout" "$WORKFLOWS_DIR"/*.yml >/dev/null 2>&1 && echo "  - Source checkout: ✓"
grep -h "uses: actions/setup-node" "$WORKFLOWS_DIR"/*.yml >/dev/null 2>&1 && echo "  - Node.js setup: ✓"
grep -h "uses: actions/setup-python" "$WORKFLOWS_DIR"/*.yml >/dev/null 2>&1 && echo "  - Python setup: ✓"
grep -h "uses: docker/" "$WORKFLOWS_DIR"/*.yml >/dev/null 2>&1 && echo "  - Docker build/push: ✓"
grep -h "uses: aquasecurity/trivy" "$WORKFLOWS_DIR"/*.yml >/dev/null 2>&1 && echo "  - Trivy security scanning: ✓"
grep -h "uses: anchore/sbom" "$WORKFLOWS_DIR"/*.yml >/dev/null 2>&1 && echo "  - SBOM generation (Syft): ✓"
grep -h "@playwright/test" "$WORKFLOWS_DIR"/*.yml >/dev/null 2>&1 && echo "  - Playwright E2E tests: ✓"
grep -h "pytest" "$WORKFLOWS_DIR"/*.yml >/dev/null 2>&1 && echo "  - Python testing (pytest): ✓"
grep -h "coverage" "$WORKFLOWS_DIR"/*.yml >/dev/null 2>&1 && echo "  - Code coverage: ✓"
grep -h "ruff" "$WORKFLOWS_DIR"/*.yml >/dev/null 2>&1 && echo "  - Ruff linting: ✓"
grep -h "mypy" "$WORKFLOWS_DIR"/*.yml >/dev/null 2>&1 && echo "  - MyPy type checking: ✓"
echo ""

# Exit with appropriate code
if [[ $FAILED -gt 0 ]]; then
    echo -e "${RED}Validation completed with failures${NC}"
    exit 1
else
    echo -e "${GREEN}All validations passed!${NC}"
    exit 0
fi
