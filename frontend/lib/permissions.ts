// Tier-based permission definitions
export enum UserRole {
  ADMIN = 'ADMIN',
  AUDITOR = 'AUDITOR',
  INSPECTOR = 'INSPECTOR',
  VIEWER = 'VIEWER'
}

export enum UserTier {
  TIER1 = 'TIER1',
  TIER2 = 'TIER2',
  TIER3 = 'TIER3'
}

export type Permission = {
  id: string
  name: string
  description: string
}

export const tierPermissions: Record<UserTier, Permission[]> = {
  TIER1: [
    { id: 'view-reports', name: 'View Reports', description: 'Read-only access to assessment reports' },
    { id: 'basic-comments', name: 'Post Comments', description: 'Add comments to assessments' }
  ],
  TIER2: [
    { id: 'edit-reports', name: 'Edit Reports', description: 'Modify assessment reports' },
    { id: 'approve-comments', name: 'Approve Comments', description: 'Approve user comments' }
  ],
  TIER3: [
    { id: 'delete-reports', name: 'Delete Reports', description: 'Permanently remove reports' },
    { id: 'manage-users', name: 'Manage Users', description: 'Add/remove system users' },
    { id: 'audit-trail', name: 'Access Audit Trail', description: 'View system activity logs' }
  ]
}

export const checkPermission = (tier: UserTier, permissionId: string): boolean => {
  const permissions = tierPermissions[tier] || []
  return permissions.some(p => p.id === permissionId)
}
