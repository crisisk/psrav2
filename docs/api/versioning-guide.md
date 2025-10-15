# API Versioning Guide

This guide explains how to use and manage API versioning in our system.

## Overview
We support multiple API versions to ensure backward compatibility while allowing evolution. Versions are managed via URL paths or headers.

## Supported Versions
- **v1**: Deprecated (sunset: 2024-12-31). Migrate to v2.
- **v2**: Active (latest).

## Usage

### URL-Based Versioning
Prefix your requests with the version: `/api/v1/resource` or `/api/v2/resource`.

### Header-Based Version Negotiation
Use the `Accept-Version` header: `Accept-Version: v2`. Falls back to the latest version if omitted.

### Deprecation and Sunset
- Deprecated versions return warnings in the `Warning` header.
- Sunset versions include `Sunset` and `Link` headers (RFC 8594) pointing to this guide.

## Version Compatibility Matrix
| Version | Status      | Compatible With | Sunset Date  | Notes |
|---------|-------------|-----------------|--------------|-------|
| v1     | Deprecated | v1             | 2024-12-31  | Migrate to v2 |
| v2     | Active     | v1, v2         | N/A         | Latest |

## Changelog Generation
Changelogs are auto-generated from version metadata. Example:
- **v2.0.0**: Added new endpoints for advanced features.
- **v1.5.0**: Bug fixes (deprecated).

To generate: Run `python -m app.versioning.api_version --generate-changelog`.

## Client SDK Versioning
- SDKs are versioned to match API versions (e.g., SDK v2.0 for API v2).
- Tag releases in Git with version tags (e.g., `sdk-v2.0.0`).
- Update SDK changelogs to reflect API changes.

## Migration Guide Template
Use this template when deprecating a version.

### Migration from [Old Version, e.g., v1] to [New Version, e.g., v2]

#### Overview
[Brief description of changes, e.g., "API v1 is deprecated due to security updates. v2 introduces OAuth2 authentication."]

#### Breaking Changes
- [List changes, e.g., "Endpoint `/old` renamed to `/new`."]
- [e.g., "Authentication now requires Bearer tokens."]

#### Migration Steps
1. Update client code to use `/api/v2/` prefixes.
2. Implement new authentication if required.
3. Test against staging environment.
4. Deploy and monitor for errors.

#### Timeline
- Deprecation notice: [Date]
- Sunset: [Date]
- Support ends: [Date]

#### Resources
- [Link to full changelog]
- [Contact for support]