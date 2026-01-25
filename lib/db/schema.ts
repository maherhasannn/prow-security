import { pgTable, uuid, text, timestamp, bigint, jsonb, pgEnum, index, unique } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Enums
export const organizationMemberRoleEnum = pgEnum('organization_member_role', ['owner', 'admin', 'member', 'viewer'])
export const documentTypeEnum = pgEnum('document_type', ['excel', 'csv', 'pdf', 'quickbooks'])
export const aiSessionStatusEnum = pgEnum('ai_session_status', ['active', 'completed', 'archived'])
export const aiMessageRoleEnum = pgEnum('ai_message_role', ['user', 'assistant', 'system'])
export const workspaceModeEnum = pgEnum('workspace_mode', ['secure', 'internet-enabled'])
export const workspaceNoteTypeEnum = pgEnum('workspace_note_type', ['ai-generated', 'user-added'])

// Organizations table
export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Users table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Organization members table (many-to-many relationship)
export const organizationMembers = pgTable('organization_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: organizationMemberRoleEnum('role').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  uniqueOrgUser: unique().on(table.organizationId, table.userId),
  orgIdIdx: index('org_members_org_id_idx').on(table.organizationId),
  userIdIdx: index('org_members_user_id_idx').on(table.userId),
}))

// Workspaces table
export const workspaces = pgTable('workspaces', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  mode: workspaceModeEnum('mode').default('secure').notNull(),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orgIdIdx: index('workspaces_org_id_idx').on(table.organizationId),
}))

// Documents table
export const documents = pgTable('documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: documentTypeEnum('type').notNull(),
  blobUrl: text('blob_url').notNull(),
  fileSize: bigint('file_size', { mode: 'number' }).notNull(),
  mimeType: text('mime_type').notNull(),
  encryptionKeyId: text('encryption_key_id').notNull(),
  metadata: jsonb('metadata'),
  processedAt: timestamp('processed_at'),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  workspaceIdIdx: index('documents_workspace_id_idx').on(table.workspaceId),
  orgIdIdx: index('documents_org_id_idx').on(table.organizationId),
}))

// Document chunks table
export const documentChunks = pgTable('document_chunks', {
  id: uuid('id').defaultRandom().primaryKey(),
  documentId: uuid('document_id').notNull().references(() => documents.id, { onDelete: 'cascade' }),
  chunkIndex: bigint('chunk_index', { mode: 'number' }).notNull(),
  content: text('content').notNull(), // encrypted content
  embedding: text('embedding'), // JSON stringified vector for future semantic search
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  documentIdIdx: index('document_chunks_document_id_idx').on(table.documentId),
  chunkIndexIdx: index('document_chunks_chunk_index_idx').on(table.documentId, table.chunkIndex),
}))

// AI sessions table
export const aiSessions = pgTable('ai_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id),
  provider: text('provider').notNull(), // 'openai', 'anthropic', etc.
  model: text('model').notNull(),
  status: aiSessionStatusEnum('status').default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  workspaceIdIdx: index('ai_sessions_workspace_id_idx').on(table.workspaceId),
  userIdIdx: index('ai_sessions_user_id_idx').on(table.userId),
}))

// AI messages table
export const aiMessages = pgTable('ai_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').notNull().references(() => aiSessions.id, { onDelete: 'cascade' }),
  role: aiMessageRoleEnum('role').notNull(),
  content: text('content').notNull(), // encrypted
  documentIds: text('document_ids').array(), // Array of UUID strings
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  sessionIdIdx: index('ai_messages_session_id_idx').on(table.sessionId),
}))

// Workspace notes table
export const workspaceNotes = pgTable('workspace_notes', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  type: workspaceNoteTypeEnum('type').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  workspaceIdIdx: index('workspace_notes_workspace_id_idx').on(table.workspaceId),
}))

// Audit logs table
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id),
  action: text('action').notNull(), // 'document_upload', 'document_delete', 'ai_query', 'user_access', etc.
  resourceType: text('resource_type').notNull(), // 'document', 'workspace', 'user', etc.
  resourceId: uuid('resource_id'),
  metadata: jsonb('metadata'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  orgIdCreatedAtIdx: index('audit_logs_org_id_created_at_idx').on(table.organizationId, table.createdAt),
  userIdIdx: index('audit_logs_user_id_idx').on(table.userId),
}))

// QuickBooks connections table
export const quickbooksConnections = pgTable('quickbooks_connections', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  accessToken: text('access_token').notNull(), // encrypted
  refreshToken: text('refresh_token').notNull(), // encrypted
  realmId: text('realm_id').notNull(), // QuickBooks company ID
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orgIdIdx: index('quickbooks_connections_org_id_idx').on(table.organizationId),
  workspaceIdIdx: index('quickbooks_connections_workspace_id_idx').on(table.workspaceId),
}))

// Relations
export const organizationsRelations = relations(organizations, ({ many }) => ({
  members: many(organizationMembers),
  workspaces: many(workspaces),
  documents: many(documents),
  auditLogs: many(auditLogs),
  quickbooksConnections: many(quickbooksConnections),
}))

export const usersRelations = relations(users, ({ many }) => ({
  organizationMemberships: many(organizationMembers),
  createdWorkspaces: many(workspaces),
  createdDocuments: many(documents),
  aiSessions: many(aiSessions),
  auditLogs: many(auditLogs),
}))

export const organizationMembersRelations = relations(organizationMembers, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationMembers.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [organizationMembers.userId],
    references: [users.id],
  }),
}))

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [workspaces.organizationId],
    references: [organizations.id],
  }),
  creator: one(users, {
    fields: [workspaces.createdBy],
    references: [users.id],
  }),
  documents: many(documents),
  aiSessions: many(aiSessions),
  notes: many(workspaceNotes),
  quickbooksConnections: many(quickbooksConnections),
}))

export const documentsRelations = relations(documents, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [documents.workspaceId],
    references: [workspaces.id],
  }),
  organization: one(organizations, {
    fields: [documents.organizationId],
    references: [organizations.id],
  }),
  creator: one(users, {
    fields: [documents.createdBy],
    references: [users.id],
  }),
  chunks: many(documentChunks),
}))

export const documentChunksRelations = relations(documentChunks, ({ one }) => ({
  document: one(documents, {
    fields: [documentChunks.documentId],
    references: [documents.id],
  }),
}))

export const aiSessionsRelations = relations(aiSessions, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [aiSessions.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, {
    fields: [aiSessions.userId],
    references: [users.id],
  }),
  messages: many(aiMessages),
}))

export const aiMessagesRelations = relations(aiMessages, ({ one }) => ({
  session: one(aiSessions, {
    fields: [aiMessages.sessionId],
    references: [aiSessions.id],
  }),
}))

export const workspaceNotesRelations = relations(workspaceNotes, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [workspaceNotes.workspaceId],
    references: [workspaces.id],
  }),
}))

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  organization: one(organizations, {
    fields: [auditLogs.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}))

export const quickbooksConnectionsRelations = relations(quickbooksConnections, ({ one }) => ({
  organization: one(organizations, {
    fields: [quickbooksConnections.organizationId],
    references: [organizations.id],
  }),
  workspace: one(workspaces, {
    fields: [quickbooksConnections.workspaceId],
    references: [workspaces.id],
  }),
}))



