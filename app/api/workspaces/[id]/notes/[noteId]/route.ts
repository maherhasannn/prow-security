import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { workspaces, workspaceNotes } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { getUserOrganizationId } from '@/lib/auth/middleware'
import { updateWorkspaceNoteSchema } from '@/lib/utils/validation'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; noteId: string } }
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
    const validated = updateWorkspaceNoteSchema.parse(body)

    const [note] = await db
      .update(workspaceNotes)
      .set({
        content: validated.content,
        title: validated.title,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(workspaceNotes.id, params.noteId),
          eq(workspaceNotes.workspaceId, params.id)
        )
      )
      .returning({
        id: workspaceNotes.id,
        title: workspaceNotes.title,
        content: workspaceNotes.content,
        type: workspaceNotes.type,
        createdAt: workspaceNotes.createdAt,
        updatedAt: workspaceNotes.updatedAt,
      })

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    return NextResponse.json({ note })
  } catch (error) {
    console.error('Error updating note:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; noteId: string } }
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

    const [note] = await db
      .delete(workspaceNotes)
      .where(
        and(
          eq(workspaceNotes.id, params.noteId),
          eq(workspaceNotes.workspaceId, params.id)
        )
      )
      .returning({
        id: workspaceNotes.id,
      })

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting note:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
