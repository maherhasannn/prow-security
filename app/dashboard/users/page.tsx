'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Search, ChevronLeft, ChevronRight, Trash2, MoreVertical,
  User, Shield, Zap, Clock, Globe, Activity, X, Check, AlertTriangle,
  Download, Filter
} from 'lucide-react'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
})

interface UserType {
  id: string
  email: string
  name: string
  isAdmin: boolean
  status: string
  role: string
  loginCount: number
  lastLoginAt: string | null
  tokensUsed: number
  maxTokensLimit: number | null
  createdAt: string
}

export default function UsersPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [showBatchMenu, setShowBatchMenu] = useState(false)

  const { data, isLoading, mutate } = useSWR(
    `/api/admin/users?page=${page}&limit=20&search=${search}`,
    fetcher
  )

  const { data: userDetail, isLoading: detailLoading } = useSWR(
    selectedUser ? `/api/admin/users/${selectedUser}` : null,
    fetcher
  )

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const toggleSelectAll = () => {
    if (!data?.users) return
    if (selectedUsers.length === data.users.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(data.users.map((u: UserType) => u.id))
    }
  }

  const handleBatchAction = async (action: string) => {
    if (selectedUsers.length === 0) return

    try {
      const response = await fetch('/api/admin/users/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, userIds: selectedUsers }),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(result.message)
        setSelectedUsers([])
        mutate()
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error('Failed to perform batch action')
    }
    setShowBatchMenu(false)
  }

  const handleUpdateUser = async (userId: string, updates: Record<string, unknown>) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (response.ok) {
        toast.success('User updated')
        mutate()
      } else {
        const result = await response.json()
        toast.error(result.error)
      }
    } catch {
      toast.error('Failed to update user')
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'Never'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    })
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-heading font-bold text-text">User Management</h1>
              <p className="text-text/60">Manage users, roles, and permissions</p>
            </div>
          </div>

          <div className="flex gap-6">
            {/* User List */}
            <div className={`${selectedUser ? 'w-1/2' : 'w-full'} transition-all`}>
              <div className="bg-background-alt border border-text/10 rounded-sm">
                {/* Toolbar */}
                <div className="p-4 border-b border-text/10 flex items-center justify-between gap-4">
                  <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text/40" />
                    <input
                      type="text"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="Search users..."
                      className="w-full pl-10 pr-4 py-2 bg-background border border-text/20 rounded-sm text-sm"
                    />
                  </form>

                  {selectedUsers.length > 0 && (
                    <div className="relative">
                      <button
                        onClick={() => setShowBatchMenu(!showBatchMenu)}
                        className="px-4 py-2 bg-accent text-background text-sm font-medium rounded-sm flex items-center gap-2"
                      >
                        Actions ({selectedUsers.length})
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {showBatchMenu && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-background-alt border border-text/10 rounded-sm shadow-lg z-10">
                          <button
                            onClick={() => handleBatchAction('suspend')}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-text/5"
                          >
                            Suspend Users
                          </button>
                          <button
                            onClick={() => handleBatchAction('activate')}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-text/5"
                          >
                            Activate Users
                          </button>
                          <button
                            onClick={() => handleBatchAction('reset_tokens')}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-text/5"
                          >
                            Reset Token Usage
                          </button>
                          <hr className="border-text/10" />
                          <button
                            onClick={() => handleBatchAction('set_role_user')}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-text/5"
                          >
                            Set Role: User
                          </button>
                          <button
                            onClick={() => handleBatchAction('set_role_power_user')}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-text/5"
                          >
                            Set Role: Power User
                          </button>
                          <hr className="border-text/10" />
                          <button
                            onClick={() => handleBatchAction('delete')}
                            className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10"
                          >
                            Delete Users
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Table */}
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-text/10">
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={data?.users?.length > 0 && selectedUsers.length === data?.users?.length}
                          onChange={toggleSelectAll}
                          className="rounded"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text/60 uppercase">User</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text/60 uppercase">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text/60 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text/60 uppercase">Tokens</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text/60 uppercase">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      [...Array(5)].map((_, i) => (
                        <tr key={i} className="border-b border-text/5">
                          <td colSpan={6} className="px-4 py-4">
                            <div className="h-10 bg-text/5 rounded animate-pulse" />
                          </td>
                        </tr>
                      ))
                    ) : data?.users?.map((user: UserType) => (
                      <tr
                        key={user.id}
                        className={`border-b border-text/5 hover:bg-text/5 cursor-pointer ${
                          selectedUser === user.id ? 'bg-accent/5' : ''
                        }`}
                        onClick={() => setSelectedUser(user.id)}
                      >
                        <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => toggleUserSelection(user.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                              <span className="text-sm font-medium text-accent">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-text">{user.name}</p>
                              <p className="text-xs text-text/50">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <select
                            value={user.role}
                            onChange={(e) => {
                              e.stopPropagation()
                              handleUpdateUser(user.id, { role: e.target.value })
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-background border border-text/20 rounded px-2 py-1 text-xs"
                          >
                            <option value="user">User</option>
                            <option value="power_user">Power User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            user.status === 'active' ? 'bg-green-500/10 text-green-400' :
                            user.status === 'suspended' ? 'bg-red-500/10 text-red-400' :
                            'bg-yellow-500/10 text-yellow-400'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-text/70">
                          {user.tokensUsed.toLocaleString()}
                        </td>
                        <td className="px-4 py-4 text-sm text-text/70">
                          {formatDate(user.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                {data?.pagination && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-text/10">
                    <p className="text-sm text-text/60">
                      Page {data.pagination.page} of {data.pagination.totalPages}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-2 border border-text/20 rounded-sm disabled:opacity-30"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setPage(p => p + 1)}
                        disabled={page >= data.pagination.totalPages}
                        className="p-2 border border-text/20 rounded-sm disabled:opacity-30"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* User Detail Panel */}
            <AnimatePresence>
              {selectedUser && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="w-1/2"
                >
                  <div className="bg-background-alt border border-text/10 rounded-sm">
                    <div className="p-4 border-b border-text/10 flex items-center justify-between">
                      <h3 className="font-semibold text-text">User Details</h3>
                      <button
                        onClick={() => setSelectedUser(null)}
                        className="p-2 hover:bg-text/5 rounded-sm"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {detailLoading ? (
                      <div className="p-8 text-center">
                        <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto" />
                      </div>
                    ) : userDetail?.user && (
                      <div className="p-4 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                        {/* User Info */}
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
                            <span className="text-2xl font-bold text-accent">
                              {userDetail.user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-text">{userDetail.user.name}</h4>
                            <p className="text-sm text-text/60">{userDetail.user.email}</p>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-background p-3 rounded-sm">
                            <div className="flex items-center gap-2 text-text/60 mb-1">
                              <Zap className="w-4 h-4" />
                              <span className="text-xs">Tokens</span>
                            </div>
                            <p className="text-lg font-semibold">{userDetail.user.tokensUsed.toLocaleString()}</p>
                          </div>
                          <div className="bg-background p-3 rounded-sm">
                            <div className="flex items-center gap-2 text-text/60 mb-1">
                              <Activity className="w-4 h-4" />
                              <span className="text-xs">Logins</span>
                            </div>
                            <p className="text-lg font-semibold">{userDetail.user.loginCount}</p>
                          </div>
                          <div className="bg-background p-3 rounded-sm">
                            <div className="flex items-center gap-2 text-text/60 mb-1">
                              <Clock className="w-4 h-4" />
                              <span className="text-xs">Last Login</span>
                            </div>
                            <p className="text-sm font-medium">{formatDate(userDetail.user.lastLoginAt)}</p>
                          </div>
                        </div>

                        {/* Subscription */}
                        {userDetail.subscription && (
                          <div>
                            <h5 className="text-sm font-medium text-text/60 mb-2">Subscription</h5>
                            <div className="bg-background p-3 rounded-sm">
                              <div className="flex justify-between items-center">
                                <span className="font-medium">{userDetail.subscription.planName}</span>
                                <span className={`px-2 py-1 text-xs rounded ${
                                  userDetail.subscription.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-text/10 text-text/60'
                                }`}>
                                  {userDetail.subscription.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Flags */}
                        {userDetail.flags?.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-text/60 mb-2">Flags</h5>
                            <div className="space-y-2">
                              {userDetail.flags.map((flag: any) => (
                                <div key={flag.id} className={`p-3 rounded-sm border ${
                                  flag.severity === 'critical' ? 'bg-red-500/10 border-red-500/30' :
                                  flag.severity === 'high' ? 'bg-orange-500/10 border-orange-500/30' :
                                  'bg-yellow-500/10 border-yellow-500/30'
                                }`}>
                                  <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span className="text-sm font-medium">{flag.flagType}</span>
                                  </div>
                                  {flag.description && (
                                    <p className="text-xs text-text/60 mt-1">{flag.description}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Activity Log */}
                        <div>
                          <h5 className="text-sm font-medium text-text/60 mb-2">Recent Activity</h5>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {userDetail.activityLogs?.length > 0 ? (
                              userDetail.activityLogs.map((log: any) => (
                                <div key={log.id} className="flex items-center justify-between py-2 border-b border-text/5">
                                  <span className="text-sm">{log.action}</span>
                                  <span className="text-xs text-text/50">{formatDate(log.createdAt)}</span>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-text/50">No recent activity</p>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateUser(selectedUser, {
                              status: userDetail.user.status === 'active' ? 'suspended' : 'active'
                            })}
                            className={`flex-1 py-2 text-sm font-medium rounded-sm ${
                              userDetail.user.status === 'active'
                                ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                                : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                            }`}
                          >
                            {userDetail.user.status === 'active' ? 'Suspend' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleUpdateUser(selectedUser, { tokensUsed: 0 })}
                            className="flex-1 py-2 text-sm font-medium rounded-sm bg-text/5 hover:bg-text/10"
                          >
                            Reset Tokens
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  )
}
