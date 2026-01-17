import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/config'
import Dashboard from '@/components/Dashboard'

export default async function AppPage() {
  const session = await auth()

  if (!session) {
    redirect('/auth/signin')
  }

  return <Dashboard />
}


