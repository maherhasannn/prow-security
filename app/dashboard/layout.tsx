import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  // Check if user is authenticated
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  // Check if user is admin
  const [user] = await db
    .select({ isAdmin: users.isAdmin })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  if (!user?.isAdmin) {
    redirect('/app') // Redirect non-admins to the regular app
  }

  return <>{children}</>
}
