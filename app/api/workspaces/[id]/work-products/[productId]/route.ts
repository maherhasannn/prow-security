import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { workspaces, workProducts, users } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { getUserOrganizationId } from '@/lib/auth/middleware'
import { updateWorkProductSchema } from '@/lib/utils/validation'

export async function GET(
  request: Request,
  { params }: { params: { id: string; productId: string } }
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

    const [product] = await db
      .select({
        id: workProducts.id,
        title: workProducts.title,
        type: workProducts.type,
        content: workProducts.content,
        noteId: workProducts.noteId,
        metadata: workProducts.metadata,
        createdAt: workProducts.createdAt,
        updatedAt: workProducts.updatedAt,
        createdByName: users.name,
      })
      .from(workProducts)
      .leftJoin(users, eq(workProducts.createdBy, users.id))
      .where(
        and(
          eq(workProducts.id, params.productId),
          eq(workProducts.workspaceId, params.id)
        )
      )
      .limit(1)

    if (!product) {
      return NextResponse.json({ error: 'Work product not found' }, { status: 404 })
    }

    return NextResponse.json({ workProduct: product })
  } catch (error) {
    console.error('Error fetching work product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; productId: string } }
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
    const validated = updateWorkProductSchema.parse(body)

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    }

    if (validated.title !== undefined) {
      updateData.title = validated.title
    }
    if (validated.content !== undefined) {
      updateData.content = validated.content
    }
    if (validated.metadata !== undefined) {
      updateData.metadata = validated.metadata
    }

    const [product] = await db
      .update(workProducts)
      .set(updateData)
      .where(
        and(
          eq(workProducts.id, params.productId),
          eq(workProducts.workspaceId, params.id)
        )
      )
      .returning({
        id: workProducts.id,
        title: workProducts.title,
        type: workProducts.type,
        content: workProducts.content,
        noteId: workProducts.noteId,
        metadata: workProducts.metadata,
        createdAt: workProducts.createdAt,
        updatedAt: workProducts.updatedAt,
      })

    if (!product) {
      return NextResponse.json({ error: 'Work product not found' }, { status: 404 })
    }

    return NextResponse.json({ workProduct: product })
  } catch (error) {
    console.error('Error updating work product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; productId: string } }
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

    const [product] = await db
      .delete(workProducts)
      .where(
        and(
          eq(workProducts.id, params.productId),
          eq(workProducts.workspaceId, params.id)
        )
      )
      .returning({
        id: workProducts.id,
      })

    if (!product) {
      return NextResponse.json({ error: 'Work product not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting work product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
