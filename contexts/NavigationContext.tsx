'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { usePathname } from 'next/navigation'

type SidebarSection = 'chats' | 'projects' | 'images'

interface NavigationState {
  currentWorkspace: { id: string; name: string } | null
  previousRoute: string | null
  sidebarCollapsed: boolean
  sidebarSection: SidebarSection
  navigationHistory: string[]
}

interface NavigationContextType {
  state: NavigationState
  setCurrentWorkspace: (workspace: { id: string; name: string } | null) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setSidebarSection: (section: SidebarSection) => void
  toggleSidebar: () => void
  getBreadcrumbs: () => { label: string; href: string }[]
}

const defaultState: NavigationState = {
  currentWorkspace: null,
  previousRoute: null,
  sidebarCollapsed: false,
  sidebarSection: 'chats',
  navigationHistory: [],
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

const STORAGE_KEY = 'prow-navigation-state'
const SIDEBAR_STORAGE_KEY = 'prow-sidebar-state'

export function NavigationProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [state, setState] = useState<NavigationState>(defaultState)
  const [isHydrated, setIsHydrated] = useState(false)

  // Load state from storage on mount
  useEffect(() => {
    try {
      // Load navigation state from sessionStorage
      const stored = sessionStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setState(prev => ({
          ...prev,
          ...parsed,
          navigationHistory: parsed.navigationHistory || [],
        }))
      }

      // Load sidebar state from localStorage (persists across sessions)
      const sidebarStored = localStorage.getItem(SIDEBAR_STORAGE_KEY)
      if (sidebarStored) {
        const sidebarParsed = JSON.parse(sidebarStored)
        setState(prev => ({
          ...prev,
          sidebarCollapsed: sidebarParsed.sidebarCollapsed ?? prev.sidebarCollapsed,
          sidebarSection: sidebarParsed.sidebarSection ?? prev.sidebarSection,
        }))
      }
    } catch (e) {
      console.error('Failed to load navigation state:', e)
    }
    setIsHydrated(true)
  }, [])

  // Track route changes and update history
  useEffect(() => {
    if (!isHydrated) return

    setState(prev => {
      const history = prev.navigationHistory
      const lastRoute = history[history.length - 1]

      // Don't add duplicate consecutive routes
      if (lastRoute === pathname) return prev

      const newHistory = [...history, pathname].slice(-10) // Keep last 10 routes

      const newState = {
        ...prev,
        previousRoute: lastRoute || null,
        navigationHistory: newHistory,
      }

      // Persist to sessionStorage
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newState))
      } catch (e) {
        console.error('Failed to save navigation state:', e)
      }

      return newState
    })
  }, [pathname, isHydrated])

  const setCurrentWorkspace = useCallback((workspace: { id: string; name: string } | null) => {
    setState(prev => {
      const newState = { ...prev, currentWorkspace: workspace }
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newState))
      } catch (e) {
        console.error('Failed to save navigation state:', e)
      }
      return newState
    })
  }, [])

  const setSidebarCollapsed = useCallback((collapsed: boolean) => {
    setState(prev => {
      const newState = { ...prev, sidebarCollapsed: collapsed }
      try {
        // Save sidebar state to localStorage for persistence across sessions
        localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify({
          sidebarCollapsed: newState.sidebarCollapsed,
          sidebarSection: newState.sidebarSection,
        }))
      } catch (e) {
        console.error('Failed to save sidebar state:', e)
      }
      return newState
    })
  }, [])

  const setSidebarSection = useCallback((section: SidebarSection) => {
    setState(prev => {
      const newState = { ...prev, sidebarSection: section }
      try {
        // Save sidebar state to localStorage for persistence across sessions
        localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify({
          sidebarCollapsed: newState.sidebarCollapsed,
          sidebarSection: newState.sidebarSection,
        }))
      } catch (e) {
        console.error('Failed to save sidebar state:', e)
      }
      return newState
    })
  }, [])

  const toggleSidebar = useCallback(() => {
    setState(prev => {
      const newState = { ...prev, sidebarCollapsed: !prev.sidebarCollapsed }
      try {
        // Save sidebar state to localStorage for persistence across sessions
        localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify({
          sidebarCollapsed: newState.sidebarCollapsed,
          sidebarSection: newState.sidebarSection,
        }))
      } catch (e) {
        console.error('Failed to save sidebar state:', e)
      }
      return newState
    })
  }, [])

  const getBreadcrumbs = useCallback(() => {
    const breadcrumbs: { label: string; href: string }[] = [
      { label: 'PROW', href: '/' },
    ]

    if (pathname.startsWith('/app')) {
      breadcrumbs.push({ label: 'Workspaces', href: '/app' })

      if (pathname.includes('/workspaces/') && state.currentWorkspace) {
        breadcrumbs.push({
          label: state.currentWorkspace.name,
          href: `/app/workspaces/${state.currentWorkspace.id}`,
        })

        if (pathname.includes('/work-products/')) {
          breadcrumbs.push({ label: 'Work Product', href: pathname })
        }
      }

      if (pathname === '/app/billing') {
        breadcrumbs.push({ label: 'Billing', href: '/app/billing' })
      }
    }

    if (pathname.startsWith('/dashboard')) {
      breadcrumbs.push({ label: 'Admin', href: '/dashboard' })

      if (pathname === '/dashboard/users') {
        breadcrumbs.push({ label: 'Users', href: '/dashboard/users' })
      } else if (pathname === '/dashboard/analytics') {
        breadcrumbs.push({ label: 'Analytics', href: '/dashboard/analytics' })
      } else if (pathname === '/dashboard/security') {
        breadcrumbs.push({ label: 'Security', href: '/dashboard/security' })
      } else if (pathname === '/dashboard/settings') {
        breadcrumbs.push({ label: 'Settings', href: '/dashboard/settings' })
      }
    }

    return breadcrumbs
  }, [pathname, state.currentWorkspace])

  return (
    <NavigationContext.Provider
      value={{
        state,
        setCurrentWorkspace,
        setSidebarCollapsed,
        setSidebarSection,
        toggleSidebar,
        getBreadcrumbs,
      }}
    >
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }
  return context
}
