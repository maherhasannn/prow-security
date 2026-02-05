'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, ChevronLeft, ChevronRight, Trash2, ArrowUpDown, Filter, X } from 'lucide-react'

interface User {
  id: string
  email: string
  name: string
  isAdmin: boolean
  loginCount: number
  lastLoginAt: string | null
  tokensUsed: number
  createdAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface UserTableProps {
  users: User[] | undefined
  pagination: Pagination | undefined
  isLoading: boolean
  onPageChange: (page: number) => void
  onSearch: (search: string) => void
  onSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void
  onFilter: (filters: FilterState) => void
  onDeleteUser: (user: User) => void
  currentSort: { sortBy: string; sortOrder: 'asc' | 'desc' }
  currentFilters: FilterState
}

export interface FilterState {
  minTokens?: string
  maxTokens?: string
  dateFrom?: string
  dateTo?: string
}

export function UserTable({
  users,
  pagination,
  isLoading,
  onPageChange,
  onSearch,
  onSort,
  onFilter,
  onDeleteUser,
  currentSort,
  currentFilters,
}: UserTableProps) {
  const [searchValue, setSearchValue] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [localFilters, setLocalFilters] = useState<FilterState>(currentFilters)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(searchValue)
  }

  const handleSort = (column: string) => {
    const newOrder = currentSort.sortBy === column && currentSort.sortOrder === 'desc' ? 'asc' : 'desc'
    onSort(column, newOrder)
  }

  const handleApplyFilters = () => {
    onFilter(localFilters)
    setShowFilters(false)
  }

  const handleClearFilters = () => {
    setLocalFilters({})
    onFilter({})
    setShowFilters(false)
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return 'Never'
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const SortHeader = ({ column, label }: { column: string; label: string }) => (
    <button
      onClick={() => handleSort(column)}
      className="flex items-center gap-1 hover:text-accent transition-colors"
    >
      {label}
      <ArrowUpDown className={`w-3 h-3 ${currentSort.sortBy === column ? 'text-accent' : 'text-text/30'}`} />
    </button>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-background-alt border border-text/10 rounded-sm"
    >
      <div className="p-4 border-b border-text/10">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <h3 className="text-lg font-semibold text-text">User Management</h3>
          <div className="flex gap-2">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text/40" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search by email or name..."
                className="pl-10 pr-4 py-2 bg-background border border-text/20 rounded-sm text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent w-64"
              />
            </form>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-2 border rounded-sm text-sm font-medium transition-colors flex items-center gap-2 ${
                showFilters || Object.keys(currentFilters).length > 0
                  ? 'border-accent text-accent bg-accent/10'
                  : 'border-text/20 text-text/70 hover:border-text/40'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {Object.keys(currentFilters).length > 0 && (
                <span className="bg-accent text-background text-xs px-1.5 rounded-full">
                  {Object.keys(currentFilters).length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-4 pt-4 border-t border-text/10"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-text/60 mb-1">Min Tokens</label>
                <input
                  type="number"
                  value={localFilters.minTokens || ''}
                  onChange={(e) => setLocalFilters({ ...localFilters, minTokens: e.target.value })}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-background border border-text/20 rounded-sm text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text/60 mb-1">Max Tokens</label>
                <input
                  type="number"
                  value={localFilters.maxTokens || ''}
                  onChange={(e) => setLocalFilters({ ...localFilters, maxTokens: e.target.value })}
                  placeholder="Unlimited"
                  className="w-full px-3 py-2 bg-background border border-text/20 rounded-sm text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text/60 mb-1">Joined After</label>
                <input
                  type="date"
                  value={localFilters.dateFrom || ''}
                  onChange={(e) => setLocalFilters({ ...localFilters, dateFrom: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-text/20 rounded-sm text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text/60 mb-1">Joined Before</label>
                <input
                  type="date"
                  value={localFilters.dateTo || ''}
                  onChange={(e) => setLocalFilters({ ...localFilters, dateTo: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-text/20 rounded-sm text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleApplyFilters}
                className="px-4 py-2 bg-accent text-background text-sm font-medium rounded-sm hover:bg-accent/90 transition-colors"
              >
                Apply Filters
              </button>
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 border border-text/20 text-text/70 text-sm font-medium rounded-sm hover:bg-text/5 transition-colors"
              >
                Clear All
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-text/10">
              <th className="text-left text-xs font-medium text-text/60 uppercase tracking-wider px-4 py-3">
                User
              </th>
              <th className="text-left text-xs font-medium text-text/60 uppercase tracking-wider px-4 py-3">
                <SortHeader column="createdAt" label="Joined" />
              </th>
              <th className="text-left text-xs font-medium text-text/60 uppercase tracking-wider px-4 py-3">
                <SortHeader column="tokensUsed" label="Tokens" />
              </th>
              <th className="text-left text-xs font-medium text-text/60 uppercase tracking-wider px-4 py-3">
                <SortHeader column="loginCount" label="Logins" />
              </th>
              <th className="text-left text-xs font-medium text-text/60 uppercase tracking-wider px-4 py-3">
                <SortHeader column="lastLoginAt" label="Last Active" />
              </th>
              <th className="text-left text-xs font-medium text-text/60 uppercase tracking-wider px-4 py-3">
                Status
              </th>
              <th className="text-right text-xs font-medium text-text/60 uppercase tracking-wider px-4 py-3">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-text/5">
                  <td colSpan={7} className="px-4 py-4">
                    <div className="h-10 bg-text/5 rounded animate-pulse" />
                  </td>
                </tr>
              ))
            ) : users && users.length > 0 ? (
              users.map((user) => (
                <tr key={user.id} className="border-b border-text/5 hover:bg-text/5 transition-colors">
                  <td className="px-4 py-4">
                    <div>
                      <p className="text-sm font-medium text-text">{user.name}</p>
                      <p className="text-xs text-text/50">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-text/70">{formatDate(user.createdAt)}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm font-medium text-text">{user.tokensUsed.toLocaleString()}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-text/70">{user.loginCount}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-text/70">{formatDateTime(user.lastLoginAt)}</p>
                  </td>
                  <td className="px-4 py-4">
                    {user.isAdmin ? (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-sm bg-purple-500/10 text-purple-400">
                        Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-sm bg-green-500/10 text-green-400">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button
                      onClick={() => onDeleteUser(user)}
                      disabled={user.isAdmin}
                      className="p-2 text-text/40 hover:text-red-500 hover:bg-red-500/10 rounded-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title={user.isAdmin ? 'Cannot delete admin users' : 'Delete user'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-text/50">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-text/10">
          <p className="text-sm text-text/60">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-2 border border-text/20 rounded-sm hover:bg-text/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4 text-text/60" />
            </button>
            <span className="text-sm text-text/60">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="p-2 border border-text/20 rounded-sm hover:bg-text/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4 text-text/60" />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  )
}
