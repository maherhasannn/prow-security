-- Migration: Enable Row Level Security (RLS) on all public tables
-- This migration secures all tables against direct Supabase REST API access
-- The service_role (used by Drizzle ORM) bypasses RLS by default

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quickbooks_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTION: Check if a user is a member of an organization
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_org_member(org_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id AND organization_members.user_id = is_org_member.user_id
  );
$$;

-- ============================================================================
-- HELPER FUNCTION: Get organization ID from workspace
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_workspace_org_id(ws_id uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT organization_id FROM public.workspaces WHERE id = ws_id;
$$;

-- ============================================================================
-- HELPER FUNCTION: Get organization ID from document
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_document_org_id(doc_id uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT organization_id FROM public.documents WHERE id = doc_id;
$$;

-- ============================================================================
-- HELPER FUNCTION: Get organization ID from AI session (via workspace)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_session_org_id(sess_id uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT w.organization_id
  FROM public.ai_sessions s
  JOIN public.workspaces w ON w.id = s.workspace_id
  WHERE s.id = sess_id;
$$;

-- ============================================================================
-- RLS POLICIES FOR: users
-- Users can only view/update their own record
-- ============================================================================

CREATE POLICY "users_select_own"
  ON public.users
  FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "users_update_own"
  ON public.users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================================================
-- RLS POLICIES FOR: organizations
-- Users can view organizations they are members of
-- ============================================================================

CREATE POLICY "organizations_select_member"
  ON public.organizations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = organizations.id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "organizations_update_admin"
  ON public.organizations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = organizations.id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- RLS POLICIES FOR: organization_members
-- Users can view members of organizations they belong to
-- ============================================================================

CREATE POLICY "org_members_select"
  ON public.organization_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "org_members_insert_admin"
  ON public.organization_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "org_members_update_admin"
  ON public.organization_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "org_members_delete_admin"
  ON public.organization_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- RLS POLICIES FOR: workspaces
-- Users can access workspaces in their organization
-- ============================================================================

CREATE POLICY "workspaces_select"
  ON public.workspaces
  FOR SELECT
  USING (public.is_org_member(organization_id, auth.uid()));

CREATE POLICY "workspaces_insert"
  ON public.workspaces
  FOR INSERT
  WITH CHECK (public.is_org_member(organization_id, auth.uid()));

CREATE POLICY "workspaces_update"
  ON public.workspaces
  FOR UPDATE
  USING (public.is_org_member(organization_id, auth.uid()));

CREATE POLICY "workspaces_delete"
  ON public.workspaces
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = workspaces.organization_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- RLS POLICIES FOR: documents
-- Users can access documents in their organization
-- ============================================================================

CREATE POLICY "documents_select"
  ON public.documents
  FOR SELECT
  USING (public.is_org_member(organization_id, auth.uid()));

CREATE POLICY "documents_insert"
  ON public.documents
  FOR INSERT
  WITH CHECK (public.is_org_member(organization_id, auth.uid()));

CREATE POLICY "documents_update"
  ON public.documents
  FOR UPDATE
  USING (public.is_org_member(organization_id, auth.uid()));

CREATE POLICY "documents_delete"
  ON public.documents
  FOR DELETE
  USING (public.is_org_member(organization_id, auth.uid()));

-- ============================================================================
-- RLS POLICIES FOR: document_chunks
-- Users can access chunks for documents they can access
-- ============================================================================

CREATE POLICY "document_chunks_select"
  ON public.document_chunks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_chunks.document_id
      AND public.is_org_member(d.organization_id, auth.uid())
    )
  );

CREATE POLICY "document_chunks_insert"
  ON public.document_chunks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_chunks.document_id
      AND public.is_org_member(d.organization_id, auth.uid())
    )
  );

CREATE POLICY "document_chunks_update"
  ON public.document_chunks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_chunks.document_id
      AND public.is_org_member(d.organization_id, auth.uid())
    )
  );

CREATE POLICY "document_chunks_delete"
  ON public.document_chunks
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_chunks.document_id
      AND public.is_org_member(d.organization_id, auth.uid())
    )
  );

-- ============================================================================
-- RLS POLICIES FOR: ai_sessions
-- Users can access AI sessions in workspaces they have access to
-- ============================================================================

CREATE POLICY "ai_sessions_select"
  ON public.ai_sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = ai_sessions.workspace_id
      AND public.is_org_member(w.organization_id, auth.uid())
    )
  );

CREATE POLICY "ai_sessions_insert"
  ON public.ai_sessions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = ai_sessions.workspace_id
      AND public.is_org_member(w.organization_id, auth.uid())
    )
  );

CREATE POLICY "ai_sessions_update"
  ON public.ai_sessions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = ai_sessions.workspace_id
      AND public.is_org_member(w.organization_id, auth.uid())
    )
  );

CREATE POLICY "ai_sessions_delete"
  ON public.ai_sessions
  FOR DELETE
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.workspaces w
      JOIN public.organization_members om ON om.organization_id = w.organization_id
      WHERE w.id = ai_sessions.workspace_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- RLS POLICIES FOR: ai_messages
-- Users can access messages in sessions they have access to
-- ============================================================================

CREATE POLICY "ai_messages_select"
  ON public.ai_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_sessions s
      JOIN public.workspaces w ON w.id = s.workspace_id
      WHERE s.id = ai_messages.session_id
      AND public.is_org_member(w.organization_id, auth.uid())
    )
  );

CREATE POLICY "ai_messages_insert"
  ON public.ai_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ai_sessions s
      JOIN public.workspaces w ON w.id = s.workspace_id
      WHERE s.id = ai_messages.session_id
      AND public.is_org_member(w.organization_id, auth.uid())
    )
  );

CREATE POLICY "ai_messages_update"
  ON public.ai_messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_sessions s
      JOIN public.workspaces w ON w.id = s.workspace_id
      WHERE s.id = ai_messages.session_id
      AND public.is_org_member(w.organization_id, auth.uid())
    )
  );

CREATE POLICY "ai_messages_delete"
  ON public.ai_messages
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_sessions s
      JOIN public.workspaces w ON w.id = s.workspace_id
      WHERE s.id = ai_messages.session_id
      AND public.is_org_member(w.organization_id, auth.uid())
    )
  );

-- ============================================================================
-- RLS POLICIES FOR: workspace_notes
-- Users can access notes in workspaces they have access to
-- ============================================================================

CREATE POLICY "workspace_notes_select"
  ON public.workspace_notes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = workspace_notes.workspace_id
      AND public.is_org_member(w.organization_id, auth.uid())
    )
  );

CREATE POLICY "workspace_notes_insert"
  ON public.workspace_notes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = workspace_notes.workspace_id
      AND public.is_org_member(w.organization_id, auth.uid())
    )
  );

CREATE POLICY "workspace_notes_update"
  ON public.workspace_notes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = workspace_notes.workspace_id
      AND public.is_org_member(w.organization_id, auth.uid())
    )
  );

CREATE POLICY "workspace_notes_delete"
  ON public.workspace_notes
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = workspace_notes.workspace_id
      AND public.is_org_member(w.organization_id, auth.uid())
    )
  );

-- ============================================================================
-- RLS POLICIES FOR: work_products
-- Users can access work products in workspaces they have access to
-- ============================================================================

CREATE POLICY "work_products_select"
  ON public.work_products
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = work_products.workspace_id
      AND public.is_org_member(w.organization_id, auth.uid())
    )
  );

CREATE POLICY "work_products_insert"
  ON public.work_products
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = work_products.workspace_id
      AND public.is_org_member(w.organization_id, auth.uid())
    )
  );

CREATE POLICY "work_products_update"
  ON public.work_products
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = work_products.workspace_id
      AND public.is_org_member(w.organization_id, auth.uid())
    )
  );

CREATE POLICY "work_products_delete"
  ON public.work_products
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = work_products.workspace_id
      AND public.is_org_member(w.organization_id, auth.uid())
    )
  );

-- ============================================================================
-- RLS POLICIES FOR: quickbooks_connections
-- Users can access QuickBooks connections in their organization
-- SENSITIVE: Contains access_token and refresh_token
-- ============================================================================

CREATE POLICY "quickbooks_connections_select"
  ON public.quickbooks_connections
  FOR SELECT
  USING (public.is_org_member(organization_id, auth.uid()));

CREATE POLICY "quickbooks_connections_insert"
  ON public.quickbooks_connections
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = quickbooks_connections.organization_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "quickbooks_connections_update"
  ON public.quickbooks_connections
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = quickbooks_connections.organization_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "quickbooks_connections_delete"
  ON public.quickbooks_connections
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = quickbooks_connections.organization_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- RLS POLICIES FOR: audit_logs
-- Users can view audit logs for their organization (read-only for non-service roles)
-- ============================================================================

CREATE POLICY "audit_logs_select"
  ON public.audit_logs
  FOR SELECT
  USING (public.is_org_member(organization_id, auth.uid()));

-- No INSERT/UPDATE/DELETE policies for audit_logs via direct client access
-- Audit logs should only be created by the server via service_role
