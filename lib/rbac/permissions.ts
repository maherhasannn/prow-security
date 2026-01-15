export type UserRole = 'owner' | 'admin' | 'member' | 'viewer'

export interface Permission {
  resource: string
  action: string
  roles: UserRole[]
}

/**
 * Permission matrix defining what each role can do
 */
export const PERMISSIONS: Permission[] = [
  // Organization management
  { resource: 'organization', action: 'view', roles: ['owner', 'admin', 'member', 'viewer'] },
  { resource: 'organization', action: 'update', roles: ['owner', 'admin'] },
  { resource: 'organization', action: 'delete', roles: ['owner'] },
  
  // Member management
  { resource: 'member', action: 'view', roles: ['owner', 'admin', 'member', 'viewer'] },
  { resource: 'member', action: 'add', roles: ['owner', 'admin'] },
  { resource: 'member', action: 'update', roles: ['owner', 'admin'] },
  { resource: 'member', action: 'remove', roles: ['owner', 'admin'] },
  
  // Workspace management
  { resource: 'workspace', action: 'view', roles: ['owner', 'admin', 'member', 'viewer'] },
  { resource: 'workspace', action: 'create', roles: ['owner', 'admin', 'member'] },
  { resource: 'workspace', action: 'update', roles: ['owner', 'admin', 'member'] },
  { resource: 'workspace', action: 'delete', roles: ['owner', 'admin'] },
  
  // Document management
  { resource: 'document', action: 'view', roles: ['owner', 'admin', 'member', 'viewer'] },
  { resource: 'document', action: 'upload', roles: ['owner', 'admin', 'member'] },
  { resource: 'document', action: 'update', roles: ['owner', 'admin', 'member'] },
  { resource: 'document', action: 'delete', roles: ['owner', 'admin'] },
  
  // AI usage
  { resource: 'ai', action: 'use', roles: ['owner', 'admin', 'member'] },
  { resource: 'ai', action: 'view_history', roles: ['owner', 'admin', 'member', 'viewer'] },
  
  // Audit logs
  { resource: 'audit', action: 'view', roles: ['owner', 'admin'] },
  
  // QuickBooks
  { resource: 'quickbooks', action: 'connect', roles: ['owner', 'admin', 'member'] },
  { resource: 'quickbooks', action: 'view', roles: ['owner', 'admin', 'member', 'viewer'] },
  { resource: 'quickbooks', action: 'disconnect', roles: ['owner', 'admin'] },
]

/**
 * Checks if a role has permission for a resource/action
 */
export function hasPermission(
  role: UserRole | undefined,
  resource: string,
  action: string
): boolean {
  if (!role) return false
  
  const permission = PERMISSIONS.find(
    (p) => p.resource === resource && p.action === action
  )
  
  if (!permission) return false
  
  return permission.roles.includes(role)
}

/**
 * Gets all permissions for a role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return PERMISSIONS.filter((p) => p.roles.includes(role))
}

