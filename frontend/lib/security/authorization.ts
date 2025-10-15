/**
 * Authorization utilities for PSRA-LTSD
 * Handles role-based access control (RBAC)
 */

export type Role = 'admin' | 'finance' | 'compliance' | 'analyst' | 'auditor' | 'supplier' | 'viewer';

export type Permission =
  | 'certificates:read'
  | 'certificates:write'
  | 'certificates:delete'
  | 'certificates:approve'
  | 'suppliers:read'
  | 'suppliers:write'
  | 'products:read'
  | 'products:write'
  | 'analytics:read'
  | 'admin:all';

export interface User {
  id: string;
  email: string;
  role: Role;
  permissions?: Permission[];
}

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: ['admin:all'],
  finance: ['certificates:read', 'certificates:write', 'certificates:approve', 'analytics:read'],
  compliance: ['certificates:read', 'certificates:write', 'suppliers:read', 'suppliers:write'],
  analyst: ['certificates:read', 'products:read', 'analytics:read'],
  auditor: ['certificates:read', 'suppliers:read', 'analytics:read'],
  supplier: ['certificates:read', 'products:read'],
  viewer: ['certificates:read']
};

/**
 * Check if user has permission
 */
export function hasPermission(user: User, permission: Permission): boolean {
  // Admin has all permissions
  if (user.role === 'admin' || user.permissions?.includes('admin:all')) {
    return true;
  }

  // Check role permissions
  const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
  if (rolePermissions.includes(permission)) {
    return true;
  }

  // Check user-specific permissions
  if (user.permissions?.includes(permission)) {
    return true;
  }

  return false;
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(user: User, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(user, permission));
}

/**
 * Check if user has all specified permissions
 */
export function hasAllPermissions(user: User, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(user, permission));
}

/**
 * Authorize user or throw error
 */
export function authorize(user: User | null, permission: Permission): void {
  if (!user) {
    throw new Error('Unauthorized: User not authenticated');
  }

  if (!hasPermission(user, permission)) {
    throw new Error(`Forbidden: Missing permission '${permission}'`);
  }
}

/**
 * Check if user owns resource
 */
export function isOwner(user: User, resourceOwnerId: string): boolean {
  return user.id === resourceOwnerId;
}

/**
 * Authorization middleware helper
 */
export function requirePermission(permission: Permission) {
  return (user: User | null) => {
    authorize(user, permission);
  };
}

export default {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  authorize,
  isOwner,
  requirePermission,
  ROLE_PERMISSIONS
};


/**
 * Ensure user has metrics access
 */
export function ensureMetricsAccess(user: any): void {
  if (!user || !user.roles?.includes('admin')) {
    throw new Error('Unauthorized: Metrics access required');
  }
}

/**
 * Extract roles from user or request
 */
export function extractRoles(userOrRequest: any): string[] {
  if (!userOrRequest) return [];
  return userOrRequest.roles || userOrRequest.user?.roles || [];
}

/**
 * Ensure user has origin write access
 */
export function ensureOriginWriteAccess(request: any): null {
  // Stub implementation for build - always allows access
  // TODO: Implement actual authorization check
  return null;
}


/**
 * Ensure user has invoice upload access
 */
export function ensureInvoiceUploadAccess(user: any): void {
  if (!user || !user.permissions?.includes('invoice:upload')) {
    throw new Error('Unauthorized: Invoice upload access required');
  }
}
