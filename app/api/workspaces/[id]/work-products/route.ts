import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { workspaces, workProducts, users } from '@/lib/db/schema'
import { and, eq, desc } from 'drizzle-orm'
import { getUserOrganizationId, getUserId } from '@/lib/auth/middleware'
import { createWorkProductSchema } from '@/lib/utils/validation'

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

    const products = await db
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
      .where(eq(workProducts.workspaceId, params.id))
      .orderBy(desc(workProducts.createdAt))

    return NextResponse.json({ workProducts: products })
  } catch (error) {
    console.error('Error fetching work products:', error)
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
    const userId = await getUserId()

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
    const validated = createWorkProductSchema.parse(body)

    const [product] = await db
      .insert(workProducts)
      .values({
        workspaceId: params.id,
        noteId: validated.noteId || null,
        title: validated.title,
        type: validated.type,
        content: validated.content,
        metadata: validated.metadata || null,
        createdBy: userId,
      })
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

    return NextResponse.json({ workProduct: product }, { status: 201 })
  } catch (error) {
    console.error('Error creating work product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
