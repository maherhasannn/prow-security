import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { documents, workspaces } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { getUserOrganizationId } from '@/lib/auth/middleware'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Fetch documents for this workspace
    const workspaceDocuments = await db
      .select({
        id: documents.id,
        name: documents.name,
        type: documents.type,
        createdAt: documents.createdAt,
      })
      .from(documents)
      .where(eq(documents.workspaceId, params.id))
      .orderBy(documents.createdAt)

    return NextResponse.json({
      documents: workspaceDocuments,
    })
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
