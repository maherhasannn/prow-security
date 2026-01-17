import { z } from 'zod'

// Organization schemas
export const createOrganizationSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
})

export const updateOrganizationSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
})

// Workspace schemas
export const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  organizationId: z.string().uuid(),
})

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
})

// Document schemas
export const uploadDocumentSchema = z.object({
  workspaceId: z.string().uuid(),
  name: z.string().min(1).max(255),
})

// AI Session schemas
export const createAISessionSchema = z.object({
  workspaceId: z.string().uuid(),
  provider: z.enum(['openai', 'anthropic']),
  model: z.string().min(1),
})

export const sendAIMessageSchema = z.object({
  content: z.string().min(1).max(10000),
  documentIds: z.array(z.string().uuid()).optional(),
})

// Organization Member schemas
export const addOrganizationMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['owner', 'admin', 'member', 'viewer']),
})

export const updateOrganizationMemberSchema = z.object({
  role: z.enum(['owner', 'admin', 'member', 'viewer']),
})

// Audit log query schema
export const queryAuditLogsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  action: z.string().optional(),
  resourceType: z.string().optional(),
  userId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

// QuickBooks schemas
export const fetchQuickBooksDataSchema = z.object({
  reportType: z.enum(['profit_and_loss', 'balance_sheet', 'transactions', 'accounts']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})


