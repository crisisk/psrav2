# Canary Deployment Pipeline Documentation

## Overview

The Canary Deployment workflow (`deploy-canary.yml`) implements an enterprise-grade continuous deployment pipeline with automated UAT gates and progressive traffic shifting. This ensures zero-downtime deployments with automatic rollback capabilities.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     CANARY DEPLOYMENT PIPELINE                    │
└─────────────────────────────────────────────────────────────────┘

Phase 1: UAT Gate (Quality Assurance)
├── Automated Test Suite
│   ├── Lint & Type Checks
│   ├── Unit Tests
│   ├── E2E Tests (Playwright)
│   ├── API Tests (Newman/Postman)
│   └── Accessibility Tests
└── Manual Approval Gate
    └── Production Approval Environment

Phase 2: Container Build & Push
├── Docker Build with BuildKit
├── Push to GitHub Container Registry
├── Multi-tag Strategy (SHA, latest, canary-{run_number})
└── Layer Caching

Phase 3: Canary Deployment (Progressive Traffic Shift)
├── Stage 1: 10% Traffic → New Version
│   ├── Deploy 1 canary pod
│   ├── Health checks
│   ├── Monitor for 15 minutes
│   └── Auto-rollback on failure
│
├── Stage 2: 50% Traffic → New Version
│   ├── Scale to 2 canary pods
│   ├── Update traffic split
│   ├── Monitor for 30 minutes
│   └── Auto-rollback on failure
│
└── Stage 3: 100% Traffic → New Version (Promote)
    ├── Update production deployment
    ├── Scale to 3 pods
    ├── Final health checks
    └── Cleanup canary resources

Phase 4: Post-Deployment Validation
├── Smoke Tests
├── Health Checks
├── Metrics Verification
└── Deployment Status Verification

Phase 5: Notifications & Reporting
└── Slack Notifications at each stage
```

## Features

### 1. UAT Gate with Manual Approval
- **Automated Testing**: Runs comprehensive test suites before production
- **Newman/Postman Integration**: API contract testing with detailed reports
- **Manual Approval**: Requires human approval before production deployment
- **Skip Option**: Can bypass UAT for emergency deployments (not recommended)

### 2. Progressive Canary Deployment
- **Stage 1 (10%)**: Test with minimal production traffic
- **Stage 2 (50%)**: Validate with half of production traffic
- **Stage 3 (100%)**: Full production rollout
- **Traffic Management**: Uses Traefik weighted services for precise traffic control

### 3. Automatic Rollback
- **Health Check Failures**: Automatic rollback if pods fail health checks
- **Pod Crashes**: Rollback if containers restart unexpectedly
- **Timeout Protection**: Rollback if deployment exceeds time thresholds
- **Emergency Rollback Job**: Dedicated job for catastrophic failures

### 4. Observability & Monitoring
- **Health Checks**: HTTP endpoints checked at each stage
- **Metrics Collection**: Prometheus metrics monitored during rollout
- **Slack Notifications**: Real-time updates to deployment channel
- **Artifact Retention**: Test reports and deployment backups stored for 30 days

## Configuration

### Required GitHub Secrets

```yaml
KUBECONFIG_B64           # Base64-encoded Kubernetes config
SLACK_WEBHOOK_URL        # Slack incoming webhook for notifications
GITHUB_TOKEN             # Automatically provided by GitHub Actions
```

### Environment Variables

```yaml
REGISTRY: ghcr.io                    # Container registry
IMAGE_NAME: ${{ github.repository }} # Image name
NAMESPACE: sevensa                   # Kubernetes namespace
DEPLOYMENT_NAME: psra-new            # Main deployment name
CANARY_DEPLOYMENT_NAME: psra-new-canary
SERVICE_NAME: psra-new
HEALTH_CHECK_ENDPOINT: /health
METRICS_ENDPOINT: /metrics
CANARY_STAGE_1_WEIGHT: 10           # 10% traffic
CANARY_STAGE_2_WEIGHT: 50           # 50% traffic
CANARY_STAGE_3_WEIGHT: 100          # 100% traffic
STAGE_1_DURATION: 900               # 15 minutes
STAGE_2_DURATION: 1800              # 30 minutes
```

## Usage

### Automatic Trigger
The workflow automatically triggers on push to `main` branch:
```bash
git push origin main
```

### Manual Trigger
Trigger manually from GitHub Actions UI or via CLI:
```bash
gh workflow run deploy-canary.yml
```

### Skip UAT Gate (Emergency Only)
```bash
gh workflow run deploy-canary.yml -f skip_uat=true
```

## Deployment Timeline

| Stage | Duration | Traffic Split | Monitoring |
|-------|----------|---------------|------------|
| UAT Tests | ~5-10 min | N/A | Automated checks |
| Manual Approval | Variable | N/A | Human verification |
| Build & Push | ~3-5 min | N/A | Build logs |
| Stage 1 | 15 min | 10% new, 90% old | Health checks, metrics |
| Stage 2 | 30 min | 50% new, 50% old | Health checks, metrics |
| Stage 3 | ~5 min | 100% new | Final validation |
| Smoke Tests | ~2 min | 100% new | Production verification |
| **Total** | **~60-70 min** | Progressive | Full observability |

## Rollback Procedures

### Automatic Rollback Triggers
1. **Health Check Failures**: Pod health checks fail
2. **Pod Restarts**: Container restart count exceeds threshold
3. **Deployment Timeout**: Rollout doesn't complete within timeout
4. **Stage Failures**: Any canary stage fails validation

### Manual Rollback
If you need to manually rollback:

```bash
# Connect to cluster
export KUBECONFIG=/path/to/kubeconfig

# Rollback to previous version
kubectl -n sevensa rollout undo deployment/psra-new

# Verify rollback
kubectl -n sevensa rollout status deployment/psra-new

# Cleanup canary resources
kubectl -n sevensa delete deployment psra-new-canary
kubectl -n sevensa delete service psra-new-canary
kubectl -n sevensa delete traefikservice psra-weighted
```

## Monitoring & Alerts

### Slack Notifications
The workflow sends Slack notifications for:
- UAT test results (pass/fail)
- Manual approval requests
- Build completion
- Each canary stage status
- Smoke test results
- Emergency rollbacks

### Metrics to Monitor
- **Request Latency**: p50, p95, p99 response times
- **Error Rate**: 4xx and 5xx error percentages
- **Pod Health**: Liveness and readiness probe status
- **Resource Usage**: CPU and memory utilization

## Troubleshooting

### Deployment Stuck at Manual Approval
1. Check GitHub Actions UI for pending approval
2. Review UAT test results in artifacts
3. Verify UAT environment is healthy
4. Approve or reject from GitHub UI

### Canary Stage Failing
1. Check pod logs:
   ```bash
   kubectl -n sevensa logs -l app=psra,version=canary --tail=100
   ```
2. Check pod events:
   ```bash
   kubectl -n sevensa describe pod -l app=psra,version=canary
   ```
3. Verify health endpoint:
   ```bash
   kubectl -n sevensa port-forward deployment/psra-new-canary 8000:8000
   curl http://localhost:8000/health
   ```

### Rollback Not Working
1. Check if deployment exists:
   ```bash
   kubectl -n sevensa get deployment psra-new
   ```
2. Manually revert to previous version:
   ```bash
   kubectl -n sevensa rollout undo deployment/psra-new
   ```
3. Force delete canary resources:
   ```bash
   kubectl -n sevensa delete deployment psra-new-canary --force --grace-period=0
   ```

### Slack Notifications Not Received
1. Verify `SLACK_WEBHOOK_URL` secret is set correctly
2. Check webhook URL is valid and not expired
3. Review workflow logs for notification errors
4. Test webhook manually:
   ```bash
   curl -X POST $SLACK_WEBHOOK_URL \
     -H 'Content-Type: application/json' \
     -d '{"text":"Test notification"}'
   ```

## Best Practices

### Before Deployment
1. ✅ Run tests locally: `npm run verify`
2. ✅ Review code changes in PR
3. ✅ Check UAT environment is stable
4. ✅ Notify team in Slack about upcoming deployment
5. ✅ Ensure monitoring dashboards are accessible

### During Deployment
1. ✅ Monitor Slack notifications
2. ✅ Watch Kubernetes dashboard
3. ✅ Check application metrics in Grafana/Prometheus
4. ✅ Be ready to approve or reject at manual gate
5. ✅ Keep rollback commands handy

### After Deployment
1. ✅ Verify smoke tests passed
2. ✅ Check application logs for errors
3. ✅ Monitor error rates for 24 hours
4. ✅ Update deployment documentation
5. ✅ Post deployment summary in Slack

## Newman/Postman Test Integration

### Test Collection Location
- Default location: `tests/postman/uat-collection.json`
- Environment file: `tests/postman/uat-environment.json`

### Creating Custom UAT Tests
1. Export collection from Postman
2. Save to `tests/postman/uat-collection.json`
3. Update environment variables in `tests/postman/uat-environment.json`
4. Commit to repository

### Example Test Structure
```json
{
  "info": {
    "name": "UAT Test Suite",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "pm.test('Status code is 200', function () {",
              "    pm.response.to.have.status(200);",
              "});",
              "pm.test('Response time is less than 500ms', function () {",
              "    pm.expect(pm.response.responseTime).to.be.below(500);",
              "});"
            ]
          }
        }
      ],
      "request": {
        "method": "GET",
        "url": "{{base_url}}/health"
      }
    }
  ]
}
```

## Security Considerations

1. **Secret Management**: All secrets stored in GitHub Secrets, never in code
2. **Image Signing**: Consider implementing image signing with Cosign
3. **RBAC**: Kubernetes service account has minimal required permissions
4. **Network Policies**: Canary pods follow same network policies as production
5. **Audit Logging**: All deployments logged and traceable

## Performance Optimization

1. **Build Caching**: Docker layer caching reduces build times
2. **Parallel Jobs**: Independent jobs run in parallel
3. **Incremental Testing**: Only affected tests run when possible
4. **Resource Limits**: Appropriate resource requests prevent over-provisioning

## Compliance & Audit

- All deployments are traceable to specific commits
- Manual approval creates audit trail
- Test reports stored for 30 days
- Deployment backups retained for rollback
- Slack notifications provide deployment timeline

## Future Enhancements

- [ ] Integration with Argo CD for GitOps
- [ ] Advanced metrics analysis (statistical anomaly detection)
- [ ] A/B testing capabilities
- [ ] Blue-Green deployment option
- [ ] Automated performance regression testing
- [ ] Integration with Datadog/New Relic
- [ ] Custom metrics-based auto-rollback
- [ ] Multi-region canary deployments

## Support

For issues or questions:
1. Check workflow logs in GitHub Actions
2. Review this documentation
3. Check Kubernetes cluster logs
4. Contact DevOps team in #devops Slack channel

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Kubernetes Deployments](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
- [Traefik Service Weighted](https://doc.traefik.io/traefik/routing/services/#weighted)
- [Newman CLI](https://learning.postman.com/docs/running-collections/using-newman-cli/command-line-integration-with-newman/)
- [Canary Deployments Best Practices](https://martinfowler.com/bliki/CanaryRelease.html)
