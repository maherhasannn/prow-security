import { pgTable, uuid, text, timestamp, bigint, jsonb, pgEnum, index, unique, integer, boolean } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Enums
export const organizationMemberRoleEnum = pgEnum('organization_member_role', ['owner', 'admin', 'member', 'viewer'])
export const documentTypeEnum = pgEnum('document_type', ['excel', 'csv', 'pdf', 'quickbooks'])
export const aiSessionStatusEnum = pgEnum('ai_session_status', ['active', 'completed', 'archived'])
export const aiMessageRoleEnum = pgEnum('ai_message_role', ['user', 'assistant', 'system'])
export const workspaceModeEnum = pgEnum('workspace_mode', ['secure', 'core'])
export const workspaceNoteTypeEnum = pgEnum('workspace_note_type', ['ai-generated', 'user-added'])
export const workProductTypeEnum = pgEnum('work_product_type', [
  'article', 'brief', 'memo', 'executive-summary',
  'messaging-framework', 'decision-explanation'
])

// Company size enum
export const companySizeEnum = pgEnum('company_size', ['1', '2-10', '10-100', '100+'])

// Billing enums
export const subscriptionPlanTypeEnum = pgEnum('subscription_plan_type', ['free', 'starter', 'professional', 'enterprise'])
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'canceled', 'past_due', 'trialing', 'paused'])
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded'])
export const paymentMethodTypeEnum = pgEnum('payment_method_type', ['credit_card', 'debit_card', 'ach'])
export const billingIntervalEnum = pgEnum('billing_interval', ['monthly', 'yearly'])

// Organizations table
export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  companySize: companySizeEnum('company_size'),
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
  roleTitle: text('role_title'),
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
  title: text('title'),
  content: text('content').notNull(),
  type: workspaceNoteTypeEnum('type').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  workspaceIdIdx: index('workspace_notes_workspace_id_idx').on(table.workspaceId),
}))

// Work products table
export const workProducts = pgTable('work_products', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  noteId: uuid('note_id').references(() => workspaceNotes.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  type: workProductTypeEnum('type').notNull(),
  content: text('content').notNull(),
  metadata: jsonb('metadata'),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  workspaceIdIdx: index('work_products_workspace_id_idx').on(table.workspaceId),
  noteIdIdx: index('work_products_note_id_idx').on(table.noteId),
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

// Subscription plans table
export const subscriptionPlans = pgTable('subscription_plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  type: subscriptionPlanTypeEnum('type').notNull().unique(),
  description: text('description'),
  priceMonthly: integer('price_monthly').notNull(), // in cents
  priceYearly: integer('price_yearly').notNull(), // in cents
  maxSeats: integer('max_seats').notNull(),
  maxWorkspaces: integer('max_workspaces').notNull(),
  maxDocuments: integer('max_documents').notNull(),
  features: jsonb('features').$type<string[]>().default([]),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Billing customers table (maps org to billing info)
export const billingCustomers = pgTable('billing_customers', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }).unique(),
  email: text('email').notNull(),
  name: text('name'),
  addressLine1: text('address_line1'),
  addressLine2: text('address_line2'),
  city: text('city'),
  state: text('state'),
  postalCode: text('postal_code'),
  country: text('country').default('US'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orgIdIdx: index('billing_customers_org_id_idx').on(table.organizationId),
}))

// Payment methods table (tokenized cards)
export const paymentMethods = pgTable('payment_methods', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  billingCustomerId: uuid('billing_customer_id').notNull().references(() => billingCustomers.id, { onDelete: 'cascade' }),
  type: paymentMethodTypeEnum('type').notNull(),
  elavonToken: text('elavon_token').notNull(), // encrypted token from Elavon
  cardLast4: text('card_last4'),
  cardBrand: text('card_brand'), // visa, mastercard, amex, discover
  expMonth: integer('exp_month'),
  expYear: integer('exp_year'),
  isDefault: boolean('is_default').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orgIdIdx: index('payment_methods_org_id_idx').on(table.organizationId),
  billingCustomerIdIdx: index('payment_methods_billing_customer_id_idx').on(table.billingCustomerId),
}))

// Subscriptions table
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }).unique(),
  planId: uuid('plan_id').notNull().references(() => subscriptionPlans.id),
  status: subscriptionStatusEnum('status').notNull().default('active'),
  billingInterval: billingIntervalEnum('billing_interval').notNull().default('monthly'),
  currentPeriodStart: timestamp('current_period_start').notNull(),
  currentPeriodEnd: timestamp('current_period_end').notNull(),
  canceledAt: timestamp('canceled_at'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false).notNull(),
  trialStart: timestamp('trial_start'),
  trialEnd: timestamp('trial_end'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orgIdIdx: index('subscriptions_org_id_idx').on(table.organizationId),
  planIdIdx: index('subscriptions_plan_id_idx').on(table.planId),
  statusIdx: index('subscriptions_status_idx').on(table.status),
}))

// Payments table (transaction records)
export const payments = pgTable('payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  subscriptionId: uuid('subscription_id').references(() => subscriptions.id),
  paymentMethodId: uuid('payment_method_id').references(() => paymentMethods.id),
  amount: integer('amount').notNull(), // in cents
  currency: text('currency').default('USD').notNull(),
  status: paymentStatusEnum('status').notNull().default('pending'),
  elavonTransactionId: text('elavon_transaction_id'),
  elavonApprovalCode: text('elavon_approval_code'),
  description: text('description'),
  failureReason: text('failure_reason'),
  refundedAmount: integer('refunded_amount').default(0),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orgIdIdx: index('payments_org_id_idx').on(table.organizationId),
  subscriptionIdIdx: index('payments_subscription_id_idx').on(table.subscriptionId),
  statusIdx: index('payments_status_idx').on(table.status),
  elavonTxnIdx: index('payments_elavon_txn_idx').on(table.elavonTransactionId),
}))

// Payment events table (raw Elavon events for auditing)
export const paymentEvents = pgTable('payment_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  paymentId: uuid('payment_id').references(() => payments.id, { onDelete: 'cascade' }),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  eventType: text('event_type').notNull(), // checkout_initiated, payment_completed, payment_failed, refund_processed, etc.
  rawPayload: jsonb('raw_payload'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  paymentIdIdx: index('payment_events_payment_id_idx').on(table.paymentId),
  orgIdIdx: index('payment_events_org_id_idx').on(table.organizationId),
  eventTypeIdx: index('payment_events_event_type_idx').on(table.eventType),
}))

// Relations
export const organizationsRelations = relations(organizations, ({ one, many }) => ({
  members: many(organizationMembers),
  workspaces: many(workspaces),
  documents: many(documents),
  auditLogs: many(auditLogs),
  quickbooksConnections: many(quickbooksConnections),
  billingCustomer: one(billingCustomers),
  subscription: one(subscriptions),
  paymentMethods: many(paymentMethods),
  payments: many(payments),
  paymentEvents: many(paymentEvents),
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
  workProducts: many(workProducts),
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

export const workspaceNotesRelations = relations(workspaceNotes, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [workspaceNotes.workspaceId],
    references: [workspaces.id],
  }),
  workProducts: many(workProducts),
}))

export const workProductsRelations = relations(workProducts, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [workProducts.workspaceId],
    references: [workspaces.id],
  }),
  note: one(workspaceNotes, {
    fields: [workProducts.noteId],
    references: [workspaceNotes.id],
  }),
  creator: one(users, {
    fields: [workProducts.createdBy],
    references: [users.id],
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

// Billing relations
export const subscriptionPlansRelations = relations(subscriptionPlans, ({ many }) => ({
  subscriptions: many(subscriptions),
}))

export const billingCustomersRelations = relations(billingCustomers, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [billingCustomers.organizationId],
    references: [organizations.id],
  }),
  paymentMethods: many(paymentMethods),
}))

export const paymentMethodsRelations = relations(paymentMethods, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [paymentMethods.organizationId],
    references: [organizations.id],
  }),
  billingCustomer: one(billingCustomers, {
    fields: [paymentMethods.billingCustomerId],
    references: [billingCustomers.id],
  }),
  payments: many(payments),
}))

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [subscriptions.organizationId],
    references: [organizations.id],
  }),
  plan: one(subscriptionPlans, {
    fields: [subscriptions.planId],
    references: [subscriptionPlans.id],
  }),
  payments: many(payments),
}))

export const paymentsRelations = relations(payments, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [payments.organizationId],
    references: [organizations.id],
  }),
  subscription: one(subscriptions, {
    fields: [payments.subscriptionId],
    references: [subscriptions.id],
  }),
  paymentMethod: one(paymentMethods, {
    fields: [payments.paymentMethodId],
    references: [paymentMethods.id],
  }),
  events: many(paymentEvents),
}))

export const paymentEventsRelations = relations(paymentEvents, ({ one }) => ({
  payment: one(payments, {
    fields: [paymentEvents.paymentId],
    references: [payments.id],
  }),
  organization: one(organizations, {
    fields: [paymentEvents.organizationId],
    references: [organizations.id],
  }),
}))



