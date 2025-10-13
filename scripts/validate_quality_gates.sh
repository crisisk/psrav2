#!/usr/bin/env bash
set -euo pipefail

###############################################################################
# Quality Gates Validation Script
#
# This script validates all quality gates locally before pushing to CI/CD
# Usage: ./scripts/validate_quality_gates.sh [--frontend] [--backend] [--all]
###############################################################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Functions
print_header() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_step() {
    echo -e "${YELLOW}▶${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

print_error() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

print_summary() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  SUMMARY${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}Passed:${NC}   $PASSED"
    echo -e "${RED}Failed:${NC}   $FAILED"
    echo -e "${YELLOW}Warnings:${NC} $WARNINGS"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

    if [ $FAILED -eq 0 ]; then
        echo -e "${GREEN}✓ All quality gates passed! Ready to push.${NC}\n"
        return 0
    else
        echo -e "${RED}✗ Quality gates failed. Please fix the issues above.${NC}\n"
        return 1
    fi
}

# Validation functions
validate_frontend() {
    print_header "Frontend Quality Gates"

    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        print_warning "node_modules not found. Run 'npm ci' first."
        return 1
    fi

    # ESLint
    print_step "Running ESLint..."
    if npm run lint > /dev/null 2>&1; then
        print_success "ESLint passed"
    else
        print_error "ESLint failed - run 'npm run lint' for details"
    fi

    # TypeScript
    print_step "Running TypeScript type checking..."
    if npm run typecheck > /dev/null 2>&1; then
        print_success "TypeScript type checking passed"
    else
        print_error "TypeScript type checking failed - run 'npm run typecheck' for details"
    fi

    # Vitest
    print_step "Running Vitest unit tests..."
    if npm run test > /dev/null 2>&1; then
        print_success "Vitest unit tests passed"
    else
        print_error "Vitest unit tests failed - run 'npm run test' for details"
    fi
}

validate_backend() {
    print_header "Backend Quality Gates (Python)"

    # Check if poetry is installed
    if ! command -v poetry &> /dev/null; then
        print_error "Poetry is not installed. Install it first."
        return 1
    fi

    # Check if virtualenv exists
    if ! poetry env info --path > /dev/null 2>&1; then
        print_warning "Poetry environment not found. Run 'poetry install --with dev' first."
        return 1
    fi

    # Ruff linting
    print_step "Running Ruff linting..."
    if poetry run ruff check . > /dev/null 2>&1; then
        print_success "Ruff linting passed"
    else
        print_error "Ruff linting failed - run 'poetry run ruff check .' for details"
        echo -e "         ${YELLOW}Tip:${NC} Run 'poetry run ruff check . --fix' to auto-fix issues"
    fi

    # Ruff formatting
    print_step "Running Ruff format check..."
    if poetry run ruff format --check . > /dev/null 2>&1; then
        print_success "Ruff format check passed"
    else
        print_error "Ruff format check failed - run 'poetry run ruff format --check .' for details"
        echo -e "         ${YELLOW}Tip:${NC} Run 'poetry run ruff format .' to auto-format code"
    fi

    # MyPy type checking
    print_step "Running MyPy type checking (strict mode)..."
    if poetry run mypy . --strict > /dev/null 2>&1; then
        print_success "MyPy type checking passed"
    else
        print_error "MyPy type checking failed - run 'poetry run mypy . --strict' for details"
    fi

    # Pytest with coverage
    print_step "Running Pytest with coverage (>= 80%)..."
    if poetry run pytest --cov=. --cov-fail-under=80 -q > /dev/null 2>&1; then
        print_success "Pytest with coverage passed (>= 80%)"
    else
        print_error "Pytest failed or coverage < 80% - run 'poetry run pytest --cov=.' for details"
        echo -e "         ${YELLOW}Tip:${NC} Run 'poetry run coverage html' to generate an HTML report"
    fi

    # Get coverage percentage
    COVERAGE=$(poetry run coverage report 2>/dev/null | grep TOTAL | awk '{print $4}' | sed 's/%//' || echo "0")
    if [ -n "$COVERAGE" ] && [ "$COVERAGE" != "0" ]; then
        if (( $(echo "$COVERAGE >= 80" | bc -l) )); then
            echo -e "         Coverage: ${GREEN}${COVERAGE}%${NC}"
        else
            echo -e "         Coverage: ${RED}${COVERAGE}%${NC} (minimum: 80%)"
        fi
    fi
}

validate_performance() {
    print_header "Performance Tests (k6)"

    # Check if k6 is installed
    if ! command -v k6 &> /dev/null; then
        print_warning "k6 is not installed. Skipping performance tests."
        print_warning "Install k6: https://k6.io/docs/getting-started/installation/"
        return 0
    fi

    # Check if test file exists
    if [ ! -f "ops/loadtest/k6_smoke.js" ]; then
        print_warning "k6 smoke test file not found at ops/loadtest/k6_smoke.js"
        return 0
    fi

    print_step "Running k6 smoke test..."
    print_warning "k6 requires a running service. This is optional for local validation."
    echo -e "         ${YELLOW}Tip:${NC} Run 'k6 run ops/loadtest/k6_smoke.js' manually if needed"
}

# Usage
usage() {
    cat <<EOF
Usage: $0 [OPTIONS]

Validate quality gates locally before pushing to CI/CD.

OPTIONS:
    --frontend      Validate frontend quality gates only
    --backend       Validate backend quality gates only
    --performance   Validate performance tests only
    --all           Validate all quality gates (default)
    --help, -h      Show this help message

EXAMPLES:
    $0                  # Validate all gates
    $0 --frontend       # Validate frontend only
    $0 --backend        # Validate backend only
    $0 --all            # Validate all gates

EOF
}

# Main
main() {
    local validate_fe=false
    local validate_be=false
    local validate_perf=false

    # Parse arguments
    if [ $# -eq 0 ]; then
        validate_fe=true
        validate_be=true
        validate_perf=true
    else
        while [ $# -gt 0 ]; do
            case "$1" in
                --frontend)
                    validate_fe=true
                    ;;
                --backend)
                    validate_be=true
                    ;;
                --performance)
                    validate_perf=true
                    ;;
                --all)
                    validate_fe=true
                    validate_be=true
                    validate_perf=true
                    ;;
                --help|-h)
                    usage
                    exit 0
                    ;;
                *)
                    echo "Unknown option: $1"
                    usage
                    exit 1
                    ;;
            esac
            shift
        done
    fi

    echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║         Quality Gates Validation - Local Environment         ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"

    # Run validations
    if [ "$validate_fe" = true ]; then
        validate_frontend
    fi

    if [ "$validate_be" = true ]; then
        validate_backend
    fi

    if [ "$validate_perf" = true ]; then
        validate_performance
    fi

    # Print summary
    print_summary
}

# Run main
main "$@"
