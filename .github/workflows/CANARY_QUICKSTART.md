# Canary Deployment - Quick Start Guide

## What is Canary Deployment?

Canary deployment is a progressive rollout strategy that reduces risk by gradually shifting traffic to the new version while monitoring for issues. If problems are detected, traffic is automatically shifted back to the stable version.

## Quick Reference

### Deployment Flow
```
Push to main → UAT Tests → Manual Approval → Build → 10% → 15min → 50% → 30min → 100% → Done
```

### Time Estimates
- **UAT Tests**: 5-10 minutes
- **Manual Approval**: Variable (human approval)
- **Build & Push**: 3-5 minutes
- **Stage 1 (10%)**: 15 minutes
- **Stage 2 (50%)**: 30 minutes
- **Stage 3 (100%)**: 5 minutes
- **Total**: ~60-70 minutes

## How to Deploy

### Method 1: Automatic (Recommended)
```bash
# Simply push to main branch
git push origin main

# Workflow automatically starts
# Monitor at: https://github.com/{org}/{repo}/actions
```

### Method 2: Manual Trigger
```bash
# Using GitHub CLI
gh workflow run deploy-canary.yml

# Or via GitHub UI
# Actions → Canary Deployment with UAT Gate → Run workflow
```

### Method 3: Emergency Deploy (Skip UAT)
```bash
# NOT RECOMMENDED - Only for emergencies
gh workflow run deploy-canary.yml -f skip_uat=true
```

## Monitoring Your Deployment

### GitHub Actions
```bash
# Watch the workflow in real-time
gh run watch

# List recent runs
gh run list --workflow=deploy-canary.yml

# View logs
gh run view --log
```

### Slack Notifications
Watch the deployment channel for:
- ✅ UAT tests passed
- ⏳ Awaiting manual approval
- 🚀 Stage 1 (10%) started
- 🚀 Stage 2 (50%) started
- 🚀 Stage 3 (100%) - Promoted
- ✅ Deployment complete

### Kubernetes
```bash
# Watch pods during deployment
kubectl -n sevensa get pods -l app=psra -w

# Check deployment status
kubectl -n sevensa rollout status deployment/psra-new

# View canary pods
kubectl -n sevensa get pods -l version=canary
```

## Manual Approval Gate

When deployment reaches the approval gate:

1. **Review UAT Results**
   - Check test reports in GitHub Actions artifacts
   - Verify UAT environment: https://uat.sevensa.nl
   - Review code changes in the commit

2. **Approve or Reject**
   - Go to GitHub Actions UI
   - Click on the "UAT - Manual Approval Gate" job
   - Click "Review deployments"
   - Select "production-approval" environment
   - Click "Approve" or "Reject"

3. **What Happens Next**
   - **Approved**: Canary deployment begins
   - **Rejected**: Workflow stops, no deployment

## Rollback Procedures

### Automatic Rollback
The system automatically rolls back if:
- Health checks fail
- Pods restart unexpectedly
- Deployment times out
- Any stage validation fails

### Manual Rollback
If you need to rollback manually:

```bash
# Quick rollback
kubectl -n sevensa rollout undo deployment/psra-new

# Verify rollback
kubectl -n sevensa rollout status deployment/psra-new

# Cleanup canary resources
kubectl -n sevensa delete deployment psra-new-canary
kubectl -n sevensa delete service psra-new-canary
```

## Common Issues & Solutions

### Issue: UAT Tests Failing
```bash
# Run tests locally first
npm run lint
npm run typecheck
npm run test
npm run test:e2e

# Fix issues, commit, and push again
```

### Issue: Deployment Stuck at Approval
- Check GitHub Actions UI for pending approval
- Review UAT environment health
- Contact team lead if approval is needed

### Issue: Canary Pod Not Starting
```bash
# Check pod logs
kubectl -n sevensa logs -l app=psra,version=canary

# Check pod events
kubectl -n sevensa describe pod -l app=psra,version=canary

# Check image pull status
kubectl -n sevensa get events --sort-by='.lastTimestamp'
```

### Issue: Health Checks Failing
```bash
# Port forward to canary pod
kubectl -n sevensa port-forward deployment/psra-new-canary 8000:8000

# Test health endpoint
curl http://localhost:8000/health

# Check logs
kubectl -n sevensa logs deployment/psra-new-canary
```

## Pre-Deployment Checklist

Before deploying to production:

- [ ] All tests pass locally
- [ ] Code reviewed and approved
- [ ] Breaking changes documented
- [ ] Database migrations tested
- [ ] Environment variables updated
- [ ] Team notified in Slack
- [ ] Monitoring dashboards ready
- [ ] Rollback plan understood

## Post-Deployment Checklist

After successful deployment:

- [ ] Smoke tests passed
- [ ] No errors in logs
- [ ] Metrics look normal
- [ ] User-facing features working
- [ ] No increase in error rates
- [ ] Team notified in Slack
- [ ] Update deployment log

## Key Commands Cheat Sheet

```bash
# Validation
./scripts/validate-canary-deployment.sh

# Trigger deployment
gh workflow run deploy-canary.yml

# Watch deployment
gh run watch

# Check cluster
kubectl -n sevensa get all

# Check pods
kubectl -n sevensa get pods -l app=psra

# Check deployments
kubectl -n sevensa get deployments

# View logs
kubectl -n sevensa logs -l app=psra --tail=100

# Port forward
kubectl -n sevensa port-forward service/psra-new 8080:80

# Rollback
kubectl -n sevensa rollout undo deployment/psra-new

# Cleanup
kubectl -n sevensa delete deployment psra-new-canary
```

## Traffic Split Visualization

```
Stage 1: 10% Canary
┌────────────────────────────────────────┐
│ ██                                      │ 10% → Canary (new)
│ ████████████████████████████████████    │ 90% → Stable (old)
└────────────────────────────────────────┘

Stage 2: 50% Canary
┌────────────────────────────────────────┐
│ ████████████████████                    │ 50% → Canary (new)
│ ████████████████████                    │ 50% → Stable (old)
└────────────────────────────────────────┘

Stage 3: 100% Production
┌────────────────────────────────────────┐
│ ████████████████████████████████████████│ 100% → Production (new)
└────────────────────────────────────────┘
```

## Environment URLs

- **UAT**: https://uat.sevensa.nl
- **Production**: https://app.sevensa.nl
- **Metrics**: https://app.sevensa.nl/metrics
- **Health**: https://app.sevensa.nl/health

## GitHub Secrets Required

Set these in: Settings → Secrets and variables → Actions

```
KUBECONFIG_B64
  Base64-encoded Kubernetes configuration
  To create: cat ~/.kube/config | base64 -w 0

SLACK_WEBHOOK_URL
  Slack incoming webhook URL
  Get from: https://api.slack.com/messaging/webhooks

GITHUB_TOKEN
  Automatically provided by GitHub Actions
  No action needed
```

## Metrics to Monitor

During canary deployment, watch these metrics:

- **Error Rate**: Should stay < 1%
- **Response Time**: p95 < 500ms
- **Success Rate**: > 99%
- **Pod Restarts**: Should be 0
- **Memory Usage**: Should be stable
- **CPU Usage**: Should be stable

## Support & Help

- **Documentation**: `.github/workflows/CANARY_DEPLOYMENT.md`
- **Validation**: `./scripts/validate-canary-deployment.sh`
- **Slack Channel**: `#devops`
- **On-Call**: Check PagerDuty rotation

## Best Practices

### DO:
✅ Run tests locally before pushing
✅ Deploy during business hours
✅ Monitor deployment actively
✅ Keep rollback commands ready
✅ Communicate with team
✅ Review approval carefully

### DON'T:
❌ Skip UAT gate without good reason
❌ Deploy on Friday afternoon
❌ Deploy without monitoring
❌ Ignore failed health checks
❌ Approve without reviewing UAT
❌ Deploy breaking changes without notice

## Success Criteria

A deployment is considered successful when:
- All UAT tests pass
- All canary stages complete
- Health checks pass consistently
- No increase in error rates
- Smoke tests pass
- No user-reported issues within 24h

## Emergency Contacts

If deployment fails catastrophically:
1. Check Slack alerts
2. Review GitHub Actions logs
3. Check Kubernetes events
4. Contact DevOps team lead
5. Escalate to on-call engineer if needed

---

**Remember**: Progressive deployment is slower but safer. Each stage gives us confidence that the new version is stable before exposing it to all users. Patience is a feature, not a bug!
