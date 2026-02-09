'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import CreateWorkspaceModal from './CreateWorkspaceModal'
import PortalNavigation from './PortalNavigation'
import { Plus } from 'lucide-react'

interface Workspace {
  id: string
  name: string
  description: string | null
  mode: 'secure' | 'core'
  createdAt: Date
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  const fetchWorkspaces = useCallback(async () => {
    try {
      const response = await fetch('/api/workspaces')
      if (response.ok) {
        const data = await response.json()
        setWorkspaces(data.workspaces || [])
      }
    } catch (error) {
      console.error('Error fetching workspaces:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (session) {
      fetchWorkspaces()
    }
  }, [session, fetchWorkspaces])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-text/60">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <PortalNavigation />

      {/* Main Content */}
      <main className="max-w-[var(--container-max-width)] mx-auto px-6 md:px-12 py-12">
        {/* Welcome Section */}
        <div className="mb-8">
          <p className="text-text/60 text-sm mb-1">
            Welcome back, {session.user.name}
          </p>
        </div>

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-heading font-bold mb-2">Workspaces</h2>
            <p className="text-text/70">
              Manage your secure AI workspaces and documents
            </p>
          </div>
          {workspaces.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsCreateModalOpen(true)}
              className="px-6 py-3 bg-text text-background font-medium rounded-sm hover:bg-accent transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Workspace
            </motion.button>
          )}
        </div>

        {workspaces.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-background-alt border border-text/10 rounded-sm p-12 text-center"
          >
            <h3 className="text-xl font-heading font-semibold mb-2">
              No workspaces yet
            </h3>
            <p className="text-text/70 mb-6">
              Create your first workspace to start working with your data securely
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-text text-background font-medium rounded-sm hover:bg-accent transition-colors flex items-center gap-2"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="w-5 h-5" />
              Create Workspace
            </motion.button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workspaces.map((workspace, index) => (
              <motion.div
                key={workspace.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-background-alt border border-text/10 rounded-sm p-6 hover:border-text/20 transition-colors cursor-pointer"
                onClick={() => {
                  router.push(`/app/workspaces/${workspace.id}`)
                }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-lg font-heading font-semibold">
                    {workspace.name}
                  </h3>
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-sm border ${
                      workspace.mode === 'core'
                        ? 'bg-amber-50/70 border-amber-200 text-amber-700'
                        : 'bg-background border-text/10 text-text/60'
                    }`}
                  >
                    {workspace.mode === 'core' ? 'Core' : 'Secure'}
                  </span>
                </div>
                {workspace.description && (
                  <p className="text-sm text-text/70 mb-4 line-clamp-2">
                    {workspace.description}
                  </p>
                )}
                <div className="text-xs text-text/50">
                  Created {new Date(workspace.createdAt).toLocaleDateString()}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-background-alt border border-text/10 rounded-sm p-6"
          >
            <h3 className="font-heading font-semibold mb-2">Upload Documents</h3>
            <p className="text-sm text-text/70 mb-4">
              Upload Excel, CSV, or PDF files to your workspace
            </p>
            <button className="text-sm text-accent hover:underline">
              Upload →
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-background-alt border border-text/10 rounded-sm p-6"
          >
            <h3 className="font-heading font-semibold mb-2">Connect QuickBooks</h3>
            <p className="text-sm text-text/70 mb-4">
              Link your QuickBooks account for read-only data access
            </p>
            <button className="text-sm text-accent hover:underline">
              Connect →
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-background-alt border border-text/10 rounded-sm p-6"
          >
            <h3 className="font-heading font-semibold mb-2">Start AI Session</h3>
            <p className="text-sm text-text/70 mb-4">
              Begin a new AI conversation with your documents
            </p>
            <button className="text-sm text-accent hover:underline">
              Start Chat →
            </button>
          </motion.div>
        </div>
      </main>

      {/* Create Workspace Modal */}
      <CreateWorkspaceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          fetchWorkspaces()
        }}
      />
    </div>
  )
}

