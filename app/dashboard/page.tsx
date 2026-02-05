'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { toast } from 'sonner'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { StatsOverview } from '@/components/admin/StatsOverview'
import { SignupChart } from '@/components/admin/SignupChart'
import { TopConsumers } from '@/components/admin/TopConsumers'
import { UserTable, FilterState } from '@/components/admin/UserTable'
import { DeleteUserModal } from '@/components/admin/DeleteUserModal'

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
})

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

export default function AdminDashboard() {
  // User table state
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filters, setFilters] = useState<FilterState>({})

  // Delete modal state
  const [deleteUser, setDeleteUser] = useState<User | null>(null)

  // Build users URL with params
  const usersParams = new URLSearchParams({
    page: page.toString(),
    limit: '20',
    sortBy,
    sortOrder,
    ...(search && { search }),
    ...(filters.minTokens && { minTokens: filters.minTokens }),
    ...(filters.maxTokens && { maxTokens: filters.maxTokens }),
    ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
    ...(filters.dateTo && { dateTo: filters.dateTo }),
  })

  // SWR hooks for data fetching
  const { data: statsData, error: statsError, isLoading: statsLoading } = useSWR(
    '/api/admin/stats',
    fetcher,
    { refreshInterval: 30000 }
  )

  const { data: signupsData, error: signupsError, isLoading: signupsLoading } = useSWR(
    '/api/admin/analytics/signups?period=30',
    fetcher,
    { refreshInterval: 60000 }
  )

  const { data: tokensData, error: tokensError, isLoading: tokensLoading } = useSWR(
    '/api/admin/analytics/tokens?top=5',
    fetcher,
    { refreshInterval: 60000 }
  )

  const { data: usersData, error: usersError, isLoading: usersLoading, mutate: mutateUsers } = useSWR(
    `/api/admin/users?${usersParams.toString()}`,
    fetcher,
    { refreshInterval: 30000 }
  )

  // Handle errors
  if (statsError || signupsError || tokensError || usersError) {
    const error = statsError || signupsError || tokensError || usersError
    if (error.message?.includes('403') || error.message?.includes('Admin')) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-text mb-2">Access Denied</h1>
            <p className="text-text/60">You do not have admin access to this dashboard.</p>
          </div>
        </div>
      )
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete user')
      }

      toast.success('User deleted successfully')
      mutateUsers() // Refresh the users list
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete user')
      throw error
    }
  }

  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleSort = (newSortBy: string, newSortOrder: 'asc' | 'desc') => {
    setSortBy(newSortBy)
    setSortOrder(newSortOrder)
  }

  const handleFilter = (newFilters: FilterState) => {
    setFilters(newFilters)
    setPage(1)
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-heading font-bold text-text">Dashboard Overview</h1>
            <p className="text-text/60 mt-1">Monitor user growth, engagement, and system usage</p>
          </div>

          {/* Stats Overview */}
          <StatsOverview stats={statsData} isLoading={statsLoading} />

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SignupChart data={signupsData?.signups} isLoading={signupsLoading} />
            <TopConsumers consumers={tokensData?.topConsumers} isLoading={tokensLoading} />
          </div>

          {/* User Table */}
          <UserTable
            users={usersData?.users}
            pagination={usersData?.pagination}
            isLoading={usersLoading}
            onPageChange={setPage}
            onSearch={handleSearch}
            onSort={handleSort}
            onFilter={handleFilter}
            onDeleteUser={setDeleteUser}
            currentSort={{ sortBy, sortOrder }}
            currentFilters={filters}
          />
        </div>
      </main>

      {/* Delete User Modal */}
      <DeleteUserModal
        user={deleteUser}
        isOpen={deleteUser !== null}
        onClose={() => setDeleteUser(null)}
        onConfirm={handleDeleteUser}
      />
    </div>
  )
}
