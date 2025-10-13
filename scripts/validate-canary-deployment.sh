#!/bin/bash
#
# Canary Deployment Validation Script
# This script validates that all prerequisites for canary deployment are met
#

set -e

echo "================================================"
echo "Canary Deployment Pre-flight Validation"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track validation status
VALIDATION_PASSED=true

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print status
print_status() {
    local status=$1
    local message=$2
    if [ "$status" = "pass" ]; then
        echo -e "${GREEN}✓${NC} $message"
    elif [ "$status" = "fail" ]; then
        echo -e "${RED}✗${NC} $message"
        VALIDATION_PASSED=false
    else
        echo -e "${YELLOW}⚠${NC} $message"
    fi
}

echo "1. Checking Required Tools..."
echo "------------------------------"

# Check kubectl
if command_exists kubectl; then
    KUBECTL_VERSION=$(kubectl version --client --short 2>/dev/null | head -1)
    print_status "pass" "kubectl installed: $KUBECTL_VERSION"
else
    print_status "fail" "kubectl not installed"
fi

# Check Docker
if command_exists docker; then
    DOCKER_VERSION=$(docker --version)
    print_status "pass" "Docker installed: $DOCKER_VERSION"
else
    print_status "fail" "Docker not installed"
fi

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    print_status "pass" "Node.js installed: $NODE_VERSION"
else
    print_status "fail" "Node.js not installed"
fi

# Check npm
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    print_status "pass" "npm installed: v$NPM_VERSION"
else
    print_status "fail" "npm not installed"
fi

# Check GitHub CLI (optional)
if command_exists gh; then
    GH_VERSION=$(gh --version | head -1)
    print_status "pass" "GitHub CLI installed: $GH_VERSION"
else
    print_status "warn" "GitHub CLI not installed (optional)"
fi

echo ""
echo "2. Checking Kubernetes Cluster Access..."
echo "----------------------------------------"

# Check kubeconfig
if [ -f "$HOME/.kube/config" ]; then
    print_status "pass" "Kubeconfig exists: $HOME/.kube/config"

    # Try to connect to cluster
    if kubectl cluster-info >/dev/null 2>&1; then
        CLUSTER_URL=$(kubectl cluster-info | grep "control plane" | awk '{print $NF}')
        print_status "pass" "Cluster accessible: $CLUSTER_URL"

        # Check namespace
        NAMESPACE="sevensa"
        if kubectl get namespace "$NAMESPACE" >/dev/null 2>&1; then
            print_status "pass" "Namespace exists: $NAMESPACE"

            # Check deployments
            if kubectl -n "$NAMESPACE" get deployment psra-new >/dev/null 2>&1; then
                REPLICAS=$(kubectl -n "$NAMESPACE" get deployment psra-new -o jsonpath='{.status.replicas}')
                READY=$(kubectl -n "$NAMESPACE" get deployment psra-new -o jsonpath='{.status.readyReplicas}')
                print_status "pass" "Deployment exists: psra-new (${READY}/${REPLICAS} ready)"
            else
                print_status "warn" "Deployment 'psra-new' not found (will be created)"
            fi
        else
            print_status "fail" "Namespace '$NAMESPACE' does not exist"
        fi
    else
        print_status "fail" "Cannot connect to Kubernetes cluster"
    fi
else
    print_status "fail" "Kubeconfig not found at $HOME/.kube/config"
fi

echo ""
echo "3. Checking GitHub Secrets Configuration..."
echo "-------------------------------------------"

# Note: We can't directly check GitHub secrets, but we can check if gh CLI is configured
if command_exists gh; then
    if gh auth status >/dev/null 2>&1; then
        print_status "pass" "GitHub CLI authenticated"

        # Check if in a git repository
        if git rev-parse --git-dir >/dev/null 2>&1; then
            REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null)
            if [ -n "$REPO" ]; then
                print_status "pass" "Repository: $REPO"

                # List required secrets (just informational)
                echo ""
                echo "   Required GitHub Secrets:"
                echo "   • KUBECONFIG_B64 - Base64 encoded kubeconfig"
                echo "   • SLACK_WEBHOOK_URL - Slack webhook for notifications"
                echo ""
                echo "   To check secrets, run:"
                echo "   gh secret list"
            else
                print_status "warn" "Not in a GitHub repository"
            fi
        else
            print_status "warn" "Not in a git repository"
        fi
    else
        print_status "warn" "GitHub CLI not authenticated (run: gh auth login)"
    fi
fi

echo ""
echo "4. Checking Project Dependencies..."
echo "-----------------------------------"

# Check if package.json exists
if [ -f "package.json" ]; then
    print_status "pass" "package.json found"

    # Check if node_modules exists
    if [ -d "node_modules" ]; then
        print_status "pass" "node_modules installed"
    else
        print_status "warn" "node_modules not found (run: npm install)"
    fi

    # Check required scripts
    REQUIRED_SCRIPTS=("lint" "typecheck" "test" "test:e2e")
    for script in "${REQUIRED_SCRIPTS[@]}"; do
        if npm run | grep -q "^  $script$"; then
            print_status "pass" "npm script exists: $script"
        else
            print_status "warn" "npm script missing: $script"
        fi
    done
else
    print_status "fail" "package.json not found"
fi

echo ""
echo "5. Checking Workflow Files..."
echo "-----------------------------"

# Check if workflow file exists
WORKFLOW_FILE=".github/workflows/deploy-canary.yml"
if [ -f "$WORKFLOW_FILE" ]; then
    print_status "pass" "Canary deployment workflow exists"

    # Validate YAML syntax (if yq is available)
    if command_exists yq; then
        if yq eval '.' "$WORKFLOW_FILE" >/dev/null 2>&1; then
            print_status "pass" "Workflow YAML is valid"
        else
            print_status "fail" "Workflow YAML has syntax errors"
        fi
    fi
else
    print_status "fail" "Canary deployment workflow not found: $WORKFLOW_FILE"
fi

# Check for UAT test collection
UAT_COLLECTION="tests/postman/uat-collection.json"
if [ -f "$UAT_COLLECTION" ]; then
    print_status "pass" "UAT test collection exists"
else
    print_status "warn" "UAT test collection not found (will be auto-generated)"
fi

echo ""
echo "6. Checking Docker Configuration..."
echo "----------------------------------"

# Check Dockerfile
if [ -f "Dockerfile" ]; then
    print_status "pass" "Dockerfile exists"
else
    print_status "fail" "Dockerfile not found"
fi

# Check if Docker daemon is running
if docker info >/dev/null 2>&1; then
    print_status "pass" "Docker daemon is running"
else
    print_status "fail" "Docker daemon is not running"
fi

echo ""
echo "7. Checking Health Endpoints..."
echo "-------------------------------"

# Check if health endpoint exists in code
if grep -r "'/health'" src/ app/ backend/ 2>/dev/null | grep -q "health"; then
    print_status "pass" "Health endpoint found in code"
else
    print_status "warn" "Health endpoint not found (ensure /health is implemented)"
fi

# Check if metrics endpoint exists in code
if grep -r "'/metrics'" src/ app/ backend/ 2>/dev/null | grep -q "metrics"; then
    print_status "pass" "Metrics endpoint found in code"
else
    print_status "warn" "Metrics endpoint not found (ensure /metrics is implemented)"
fi

echo ""
echo "================================================"
echo "Validation Summary"
echo "================================================"
echo ""

if [ "$VALIDATION_PASSED" = true ]; then
    echo -e "${GREEN}✓ All critical checks passed!${NC}"
    echo ""
    echo "You are ready to deploy using the canary workflow."
    echo ""
    echo "Next steps:"
    echo "1. Commit your changes: git add . && git commit -m 'feat: add canary deployment'"
    echo "2. Push to main: git push origin main"
    echo "3. Monitor deployment: gh run watch"
    echo "4. Or trigger manually: gh workflow run deploy-canary.yml"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Some checks failed${NC}"
    echo ""
    echo "Please fix the issues above before deploying."
    echo "Review the documentation at: .github/workflows/CANARY_DEPLOYMENT.md"
    echo ""
    exit 1
fi
