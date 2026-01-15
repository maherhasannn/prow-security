'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import CreateWorkspaceModal from './CreateWorkspaceModal'
import { Plus } from 'lucide-react'

interface Workspace {
  id: string
  name: string
  description: string | null
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
      {/* Header */}
      <header className="border-b border-text/10 bg-background-alt">
        <div className="max-w-[var(--container-max-width)] mx-auto px-6 md:px-12 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-heading font-bold">PROW</h1>
              <p className="text-sm text-text/60">
                Welcome back, {session.user.name}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-text/60">
                {session.user.organizationId ? `Org: ${session.user.organizationId.slice(0, 8)}...` : 'No organization'}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="px-4 py-2 text-sm text-text/70 hover:text-text border border-text/20 rounded-sm hover:border-text/40 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[var(--container-max-width)] mx-auto px-6 md:px-12 py-12">
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
                <h3 className="text-lg font-heading font-semibold mb-2">
                  {workspace.name}
                </h3>
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

