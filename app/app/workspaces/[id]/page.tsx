import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { workspaces } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { getUserOrganizationId } from '@/lib/auth/middleware'
import SecureChatInterface from '@/components/SecureChatInterface'

export default async function WorkspaceChatPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await auth()

  if (!session) {
    redirect('/auth/signin')
  }

  const organizationId = await getUserOrganizationId()

  // Verify workspace exists and user has access
  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(
      and(
        eq(workspaces.id, params.id),
        eq(workspaces.organizationId, organizationId)
      )
    )
    .limit(1)

  if (!workspace) {
    redirect('/app')
  }

  return <SecureChatInterface workspaceId={params.id} workspaceName={workspace.name} />
}

