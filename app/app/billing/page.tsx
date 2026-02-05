import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/config'
import { isBillingEnabled } from '@/lib/utils/env'
import BillingDashboard from '@/components/billing/BillingDashboard'

export default async function BillingPage() {
  const session = await auth()

  if (!session) {
    redirect('/auth/signin')
  }

  // Check if billing is enabled
  if (!isBillingEnabled()) {
    redirect('/app')
  }

  return <BillingDashboard />
}
