# UAT Test Suite - Postman/Newman

This directory contains Postman collections for UAT (User Acceptance Testing) that run automatically during the canary deployment pipeline.

## Files

- `uat-collection.template.json` - Template collection with common test patterns
- `uat-collection.json` - Your customized UAT test collection (create from template)
- `uat-environment.json` - Environment variables for UAT testing (auto-generated)

## Quick Start

### 1. Create Your UAT Collection

Copy the template to get started:
```bash
cp uat-collection.template.json uat-collection.json
```

### 2. Customize Tests

Edit `uat-collection.json` to add your application-specific tests:
- API endpoint tests
- Authentication flows
- Business logic validation
- Integration tests
- Performance benchmarks

### 3. Test Locally with Newman

Install Newman (if not already installed):
```bash
npm install -g newman newman-reporter-htmlextra
```

Run tests locally:
```bash
newman run uat-collection.json \
  --env-var "base_url=http://localhost:3000" \
  --reporters cli,htmlextra \
  --reporter-htmlextra-export report.html
```

### 4. Test with Postman Desktop

1. Open Postman
2. Import `uat-collection.json`
3. Set environment variable: `base_url = http://localhost:3000`
4. Run the collection
5. Review results

## Collection Structure

The template includes tests for:

### Health & Status Checks
- Health endpoint (`/health`)
- Metrics endpoint (`/metrics`)
- Readiness probe (`/ready`)

### API Endpoints
- API root
- API version
- Custom endpoints (add your own)

### Dependencies
- Database connectivity
- Redis cache
- External services (add as needed)

### Performance Tests
- Response time validation
- Load time checks
- Timeout verification

### Security
- Security headers verification
- HTTPS enforcement
- CORS policy checks

### Error Handling
- 404 responses
- 500 error handling
- Validation errors

## Writing Effective UAT Tests

### Test Structure
```javascript
pm.test('Test description', function () {
    // Test assertion
    pm.expect(pm.response.code).to.equal(200);
});
```

### Common Patterns

#### Status Code Check
```javascript
pm.test('Status code is 200', function () {
    pm.response.to.have.status(200);
});
```

#### Response Time Check
```javascript
pm.test('Response time is less than 500ms', function () {
    pm.expect(pm.response.responseTime).to.be.below(500);
});
```

#### JSON Validation
```javascript
pm.test('Response has required fields', function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('status');
    pm.expect(jsonData).to.have.property('data');
});
```

#### Header Validation
```javascript
pm.test('Has correct content type', function () {
    pm.response.to.have.header('Content-Type', 'application/json');
});
```

#### Data Type Validation
```javascript
pm.test('ID is a number', function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.id).to.be.a('number');
});
```

#### Array Validation
```javascript
pm.test('Response is an array', function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.be.an('array');
    pm.expect(jsonData.length).to.be.above(0);
});
```

## Environment Variables

The UAT environment file is auto-generated with:
```json
{
  "name": "UAT Environment",
  "values": [
    {
      "key": "base_url",
      "value": "https://uat.sevensa.nl",
      "enabled": true
    }
  ]
}
```

Add custom variables as needed:
```json
{
  "key": "api_key",
  "value": "{{UAT_API_KEY}}",
  "enabled": true
}
```

## Integration with CI/CD

The workflow automatically:
1. Checks for `uat-collection.json`
2. Creates default collection if none exists
3. Generates environment file
4. Runs Newman tests
5. Generates HTML report
6. Uploads report as artifact
7. Fails deployment if tests fail

## Best Practices

### DO:
✅ Test critical user journeys
✅ Validate response structure
✅ Check error handling
✅ Verify performance benchmarks
✅ Test authentication/authorization
✅ Validate data types and formats
✅ Check security headers
✅ Test edge cases

### DON'T:
❌ Test implementation details
❌ Include sensitive data in collections
❌ Skip negative test cases
❌ Ignore response time checks
❌ Over-complicate test logic
❌ Test non-deterministic behavior
❌ Depend on test execution order

## Adding Custom Tests

Example: Testing a custom API endpoint
```json
{
  "name": "Get User Profile",
  "event": [
    {
      "listen": "test",
      "script": {
        "exec": [
          "pm.test('Status code is 200', function () {",
          "    pm.response.to.have.status(200);",
          "});",
          "",
          "pm.test('User has required fields', function () {",
          "    const user = pm.response.json();",
          "    pm.expect(user).to.have.property('id');",
          "    pm.expect(user).to.have.property('email');",
          "    pm.expect(user).to.have.property('name');",
          "});",
          "",
          "pm.test('Email is valid format', function () {",
          "    const user = pm.response.json();",
          "    pm.expect(user.email).to.match(/^[^@]+@[^@]+\\.[^@]+$/);",
          "});"
        ]
      }
    }
  ],
  "request": {
    "method": "GET",
    "header": [
      {
        "key": "Authorization",
        "value": "Bearer {{access_token}}"
      }
    ],
    "url": {
      "raw": "{{base_url}}/api/user/profile",
      "host": ["{{base_url}}"],
      "path": ["api", "user", "profile"]
    }
  }
}
```

## Troubleshooting

### Tests Fail Locally but Pass in CI
- Check environment variables
- Verify base URL is correct
- Ensure services are running
- Check for timing issues

### Tests Timeout
- Increase timeout: `newman run --timeout-request 10000`
- Check network connectivity
- Verify service is running
- Check for slow endpoints

### SSL Certificate Errors
- Disable SSL verification for testing: `newman run --insecure`
- Add certificate: `newman run --ssl-client-cert cert.pem`

### JSON Parsing Errors
- Verify response is valid JSON
- Check Content-Type header
- Add error handling in test script:
  ```javascript
  try {
      const jsonData = pm.response.json();
      pm.expect(jsonData).to.exist;
  } catch (e) {
      pm.test('Response is valid JSON', function () {
          throw new Error('Invalid JSON: ' + e.message);
      });
  }
  ```

## Viewing Test Reports

After workflow runs:
1. Go to GitHub Actions
2. Click on the workflow run
3. Scroll to "Artifacts"
4. Download `newman-test-reports`
5. Open `newman-report.html` in browser

## Newman CLI Reference

```bash
# Run collection
newman run collection.json

# Run with environment
newman run collection.json -e environment.json

# Set environment variable
newman run collection.json --env-var "key=value"

# Generate HTML report
newman run collection.json --reporters htmlextra

# Set timeout
newman run collection.json --timeout-request 10000

# Bail on failure
newman run collection.json --bail

# Run specific folder
newman run collection.json --folder "Health Checks"

# Set iterations
newman run collection.json -n 10

# Set delay between requests
newman run collection.json --delay-request 1000

# Export results
newman run collection.json --reporters json --reporter-json-export results.json
```

## Examples Repository

For more examples, see:
- [Postman Learning Center](https://learning.postman.com/docs/writing-scripts/test-scripts/)
- [Newman Documentation](https://learning.postman.com/docs/running-collections/using-newman-cli/command-line-integration-with-newman/)
- [Postman Community](https://community.postman.com/)

## Support

For help with UAT tests:
1. Check this documentation
2. Review template collection
3. Test locally with Newman
4. Ask in #devops Slack channel
