import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { appSettings, auditLogs } from '@/lib/db/schema'
import { requireAdmin } from '@/lib/auth/middleware'
import { eq } from 'drizzle-orm'

// Default settings
const DEFAULT_SETTINGS = {
  maintenance_mode: { value: 'false', description: 'Enable maintenance mode' },
  max_tokens_per_user: { value: '100000', description: 'Default max tokens per user' },
  app_name: { value: 'PROW', description: 'Application name' },
  support_email: { value: 'support@prowco.ai', description: 'Support contact email' },
  logo_url: { value: '', description: 'Custom logo URL' },
}

// GET all settings
export async function GET() {
  try {
    await requireAdmin()

    const settings = await db.select().from(appSettings)

    // Merge with defaults
    const settingsMap: Record<string, { value: string | null; description: string | null; updatedAt: Date | null }> = {}

    // Start with defaults
    for (const [key, def] of Object.entries(DEFAULT_SETTINGS)) {
      settingsMap[key] = { value: def.value, description: def.description, updatedAt: null }
    }

    // Override with database values
    for (const setting of settings) {
      settingsMap[setting.key] = {
        value: setting.value,
        description: setting.description,
        updatedAt: setting.updatedAt,
      }
    }

    return NextResponse.json({ settings: settingsMap })
  } catch (error) {
    console.error('Admin settings error:', error)
    if (error instanceof Error && error.message.includes('Admin access required')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

// POST/PUT update a setting
export async function POST(request: Request) {
  try {
    const session = await requireAdmin()
    const body = await request.json()

    const { key, value, description } = body

    if (!key) {
      return NextResponse.json({ error: 'Setting key required' }, { status: 400 })
    }

    // Check if setting exists
    const [existing] = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.key, key))
      .limit(1)

    let setting
    if (existing) {
      // Update
      [setting] = await db
        .update(appSettings)
        .set({
          value,
          description: description ?? existing.description,
          updatedBy: session.user.id,
          updatedAt: new Date(),
        })
        .where(eq(appSettings.key, key))
        .returning()
    } else {
      // Insert
      [setting] = await db
        .insert(appSettings)
        .values({
          key,
          value,
          description: description ?? DEFAULT_SETTINGS[key as keyof typeof DEFAULT_SETTINGS]?.description,
          updatedBy: session.user.id,
        })
        .returning()
    }

    // Log the action
    if (session.user.organizationId) {
      await db.insert(auditLogs).values({
        organizationId: session.user.organizationId,
        userId: session.user.id,
        action: 'admin_setting_update',
        resourceType: 'app_setting',
        resourceId: setting.id,
        metadata: { key, value },
      })
    }

    return NextResponse.json({ success: true, setting })
  } catch (error) {
    console.error('Admin update setting error:', error)
    if (error instanceof Error && error.message.includes('Admin access required')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 })
  }
}
