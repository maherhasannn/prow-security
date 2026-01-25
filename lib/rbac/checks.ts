import { db } from '@/lib/db'
import { workspaces, documents, organizationMembers } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { requireRole, getUserRole, type UserRole } from '@/lib/auth/middleware'
import { hasPermission } from './permissions'
import { AuthorizationError, NotFoundError } from '@/lib/utils/errors'

/**
 * Checks if user can access a workspace
 */
export async function canAccessWorkspace(
  workspaceId: string,
  organizationId: string,
  userId: string,
  requiredRole?: UserRole
): Promise<boolean> {
  // Verify workspace exists and belongs to organization
  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(
      and(
        eq(workspaces.id, workspaceId),
        eq(workspaces.organizationId, organizationId)
      )
    )
    .limit(1)

  if (!workspace) {
    return false
  }

  // Check organization membership
  const role = await getUserRole(organizationId)
  if (!role) {
    return false
  }

  // If specific role required, check it
  if (requiredRole) {
    return hasPermission(role, 'workspace', 'view') && 
           await requireRole(organizationId, requiredRole).then(() => true).catch(() => false)
  }

  return hasPermission(role, 'workspace', 'view')
}

/**
 * Checks if user can upload documents
 */
export async function canUploadDocument(
  workspaceId: string,
  organizationId: string,
  userId: string
): Promise<boolean> {
  const role = await getUserRole(organizationId)
  if (!role) return false

  if (!hasPermission(role, 'document', 'upload')) {
    return false
  }

  // Verify workspace access
  return canAccessWorkspace(workspaceId, organizationId, userId)
}

/**
 * Checks if user can delete a document
 */
export async function canDeleteDocument(
  documentId: string,
  organizationId: string,
  userId: string
): Promise<boolean> {
  const role = await getUserRole(organizationId)
  if (!role) return false

  if (!hasPermission(role, 'document', 'delete')) {
    return false
  }

  // Verify document exists and belongs to organization
  const [document] = await db
    .select()
    .from(documents)
    .where(
      and(
        eq(documents.id, documentId),
        eq(documents.organizationId, organizationId)
      )
    )
    .limit(1)

  return !!document
}

/**
 * Checks if user can manage organization members
 */
export async function canManageMembers(
  organizationId: string,
  userId: string
): Promise<boolean> {
  const role = await getUserRole(organizationId)
  if (!role) return false

  return hasPermission(role, 'member', 'add')
}

/**
 * Ensures user can access workspace, throws if not
 */
export async function requireWorkspaceAccess(
  workspaceId: string,
  organizationId: string,
  userId: string
): Promise<void> {
  const hasAccess = await canAccessWorkspace(workspaceId, organizationId, userId)
  if (!hasAccess) {
    throw new AuthorizationError('Access denied to this workspace')
  }
}

/**
 * Ensures user can upload documents, throws if not
 */
export async function requireDocumentUploadPermission(
  workspaceId: string,
  organizationId: string,
  userId: string
): Promise<void> {
  const hasPermission = await canUploadDocument(workspaceId, organizationId, userId)
  if (!hasPermission) {
    throw new AuthorizationError('Permission denied to upload documents')
  }
}

/**
 * Ensures user can delete document, throws if not
 */
export async function requireDocumentDeletePermission(
  documentId: string,
  organizationId: string,
  userId: string
): Promise<void> {
  const hasPermission = await canDeleteDocument(documentId, organizationId, userId)
  if (!hasPermission) {
    throw new AuthorizationError('Permission denied to delete this document')
  }
}



