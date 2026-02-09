'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { ChevronRight, Home, LogOut, CreditCard, LayoutDashboard } from 'lucide-react'
import { useNavigation } from '@/contexts/NavigationContext'
import { motion } from 'framer-motion'

interface PortalNavigationProps {
  showBreadcrumbs?: boolean
}

export default function PortalNavigation({ showBreadcrumbs = true }: PortalNavigationProps) {
  const { data: session } = useSession()
  const { getBreadcrumbs } = useNavigation()
  const breadcrumbs = getBreadcrumbs()

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background-elevated/95 backdrop-blur-sm shadow-subtle">
      <div className="max-w-[var(--container-max-width)] mx-auto px-6 md:px-12">
        <div className="flex items-center justify-between h-14">
          {/* Left: Logo & Breadcrumbs */}
          <div className="flex items-center gap-4">
            {/* PROW Home Link */}
            <Link
              href="/"
              className="flex items-center gap-2.5 text-text hover:text-accent transition-colors group"
              title="Return to PROW home"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2.5"
              >
                <div className="w-8 h-8 bg-accent group-hover:bg-accent-hover rounded-md flex items-center justify-center transition-colors shadow-subtle">
                  <Home className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-heading font-bold tracking-tight">PROW</span>
              </motion.div>
            </Link>

            {/* Breadcrumbs */}
            {showBreadcrumbs && breadcrumbs.length > 1 && (
              <nav className="hidden md:flex items-center gap-1.5 text-sm pl-3 border-l border-border">
                {breadcrumbs.slice(1).map((crumb, index) => (
                  <div key={crumb.href} className="flex items-center gap-1.5">
                    <ChevronRight className="w-3.5 h-3.5 text-text-subtle" />
                    {index === breadcrumbs.length - 2 ? (
                      <span className="text-text-secondary font-medium">{crumb.label}</span>
                    ) : (
                      <Link
                        href={crumb.href}
                        className="text-text-muted hover:text-text transition-colors"
                      >
                        {crumb.label}
                      </Link>
                    )}
                  </div>
                ))}
              </nav>
            )}
          </div>

          {/* Right: User Menu */}
          <div className="flex items-center gap-2">
            {session?.user && (
              <>
                {/* Quick Navigation Links */}
                <nav className="hidden md:flex items-center gap-0.5">
                  <Link
                    href="/app"
                    className="px-3 py-1.5 text-sm text-text-secondary hover:text-text hover:bg-background-sunken rounded-md transition-colors flex items-center gap-2"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Workspaces
                  </Link>
                  <Link
                    href="/app/billing"
                    className="px-3 py-1.5 text-sm text-text-secondary hover:text-text hover:bg-background-sunken rounded-md transition-colors flex items-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    Billing
                  </Link>
                </nav>

                <div className="h-5 w-px bg-border hidden md:block mx-1" />

                {/* User Info */}
                <div className="flex items-center gap-2">
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium text-text leading-tight">
                      {session.user.name || session.user.email}
                    </p>
                    {session.user.organizationId && (
                      <p className="text-xs text-text-muted leading-tight">
                        Org: {session.user.organizationId.slice(0, 8)}...
                      </p>
                    )}
                  </div>

                  {/* Sign Out */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="px-3 py-1.5 text-sm text-text-secondary hover:text-text border border-border hover:border-border-strong rounded-md transition-colors flex items-center gap-2 hover:bg-background-sunken"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </motion.button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
