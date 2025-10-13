import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const ROLE_HEADER = 'x-psra-roles';
const FALLBACK_ROLE_HEADER = 'x-user-roles';
const ORIGIN_WRITE_ROLES = ['origin:write', 'admin:full', 'compliance:manager'];
const INVOICE_UPLOAD_ROLES = ['supplier:upload', 'origin:write', 'compliance:manager'];

function normaliseRole(value: string) {
  return value.trim().toLowerCase();
}

export function parseRoleHeader(value: string | null | undefined): string[] {
  if (!value) {
    return [];
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return [];
  }

  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map(String).map(normaliseRole).filter(Boolean);
      }
    } catch (error) {
      console.warn('Unable to parse JSON role header, falling back to delimiter parsing:', error);
    }
  }

  return trimmed
    .split(/[\s,;]+/)
    .map(normaliseRole)
    .filter(Boolean);
}

export function extractRoles(request: NextRequest): string[] {
  const roleCandidates = [
    ...parseRoleHeader(request.headers.get(ROLE_HEADER)),
    ...parseRoleHeader(request.headers.get(FALLBACK_ROLE_HEADER)),
  ];

  return Array.from(new Set(roleCandidates));
}

export function hasOriginWriteAccess(roles: string[]): boolean {
  return ORIGIN_WRITE_ROLES.some(required => roles.includes(required));
}

export function ensureOriginWriteAccess(request: NextRequest) {
  const roles = extractRoles(request);

  if (roles.length === 0) {
    return NextResponse.json(
      { error: 'Missing role claims for origin calculation.' },
      {
        status: 403,
        headers: { 'WWW-Authenticate': 'Bearer realm="PSRA-LTSD"' },
      }
    );
  }

  if (!hasOriginWriteAccess(roles)) {
    return NextResponse.json(
      {
        error: 'Insufficient permissions to perform origin calculations.',
        requiredRoles: ORIGIN_WRITE_ROLES,
      },
      { status: 403 }
    );
  }

  return null;
}

export function hasInvoiceUploadAccess(roles: string[]): boolean {
  return INVOICE_UPLOAD_ROLES.some(required => roles.includes(required));
}

export function ensureInvoiceUploadAccess(request: NextRequest) {
  const roles = extractRoles(request);

  if (roles.length === 0) {
    return NextResponse.json(
      { error: 'Missing role claims for invoice validation.' },
      {
        status: 403,
        headers: { 'WWW-Authenticate': 'Bearer realm="PSRA-LTSD"' },
      }
    );
  }

  if (!hasInvoiceUploadAccess(roles)) {
    return NextResponse.json(
      {
        error: 'Insufficient permissions to validate invoices.',
        requiredRoles: INVOICE_UPLOAD_ROLES,
      },
      { status: 403 }
    );
  }

  return null;
}

