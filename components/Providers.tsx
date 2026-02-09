'use client'

import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'sonner'
import { NavigationProvider } from '@/contexts/NavigationContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <NavigationProvider>
        {children}
        <Toaster position="top-right" richColors />
      </NavigationProvider>
    </SessionProvider>
  )
}



