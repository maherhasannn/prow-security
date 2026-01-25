import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { workspaces, workspaceNotes } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { getUserOrganizationId } from '@/lib/auth/middleware'
import { createWorkspaceNoteSchema } from '@/lib/utils/validation'

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

    const notes = await db
      .select({
        id: workspaceNotes.id,
        content: workspaceNotes.content,
        type: workspaceNotes.type,
        createdAt: workspaceNotes.createdAt,
        updatedAt: workspaceNotes.updatedAt,
      })
      .from(workspaceNotes)
      .where(eq(workspaceNotes.workspaceId, params.id))
      .orderBy(workspaceNotes.createdAt)

    return NextResponse.json({ notes })
  } catch (error) {
    console.error('Error fetching notes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organizationId = await getUserOrganizationId()

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

    const body = await request.json()
    const validated = createWorkspaceNoteSchema.parse(body)

    const [note] = await db
      .insert(workspaceNotes)
      .values({
        workspaceId: params.id,
        content: validated.content,
        type: 'user-added' as const,
      })
      .returning({
        id: workspaceNotes.id,
        content: workspaceNotes.content,
        type: workspaceNotes.type,
        createdAt: workspaceNotes.createdAt,
        updatedAt: workspaceNotes.updatedAt,
      })

    return NextResponse.json({ note }, { status: 201 })
  } catch (error) {
    console.error('Error creating note:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
