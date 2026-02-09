'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { LayoutDashboard, Users, BarChart3, Settings, ArrowLeft, Shield, Home, Briefcase } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/users', label: 'Users', icon: Users },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/security', label: 'Security', icon: Shield },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-background-alt border-r border-text/10 min-h-screen flex flex-col">
      <div className="p-6 border-b border-text/10">
        {/* PROW Home Link */}
        <Link
          href="/"
          className="flex items-center gap-2 text-text hover:text-accent transition-colors group mb-4"
        >
          <div className="w-8 h-8 bg-text group-hover:bg-accent rounded-sm flex items-center justify-center transition-colors">
            <Home className="w-4 h-4 text-background" />
          </div>
          <span className="text-xl font-heading font-bold">PROW</span>
        </Link>

        {/* Quick Navigation */}
        <div className="flex items-center gap-2 mb-4">
          <Link
            href="/app"
            className="flex items-center gap-1.5 text-xs text-text/60 hover:text-accent transition-colors"
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>User Portal</span>
          </Link>
        </div>

        <h1 className="text-lg font-heading font-semibold text-text">Admin Dashboard</h1>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-sm text-sm font-medium transition-colors relative ${
                    isActive
                      ? 'text-accent bg-accent/10'
                      : 'text-text/60 hover:text-text hover:bg-text/5'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute left-0 top-0 bottom-0 w-1 bg-accent rounded-r"
                    />
                  )}
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-text/10">
        <div className="bg-background border border-text/10 rounded-sm p-4">
          <p className="text-xs text-text/50 mb-2">Admin Access</p>
          <p className="text-sm text-text/70">
            You have full system access. Handle with care.
          </p>
        </div>
      </div>
    </aside>
  )
}
