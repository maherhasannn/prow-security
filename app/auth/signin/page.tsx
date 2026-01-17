'use client'

import { useState, useEffect, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'

function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setSuccess('Account created successfully! Please sign in.')
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
        setLoading(false)
        return
      }

      // Check if sign-in was successful
      if (result?.ok || result?.url) {
        // Use full page reload to ensure session is properly established
        // This ensures cookies are set and session is available
        window.location.href = '/app'
      } else {
        // If result is not ok and no error, something went wrong
        console.error('Sign in result:', result)
        setError('Sign in failed. Please try again.')
        setLoading(false)
      }
    } catch (err) {
      console.error('Sign in error:', err)
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-20 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/">
            <h1 className="text-4xl font-heading font-bold mb-2">PROW</h1>
          </Link>
          <p className="text-text/70">Sign in to your secure AI workspace</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="bg-background-alt border border-text/10 rounded-sm p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-sm text-sm">
                {success}
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-sm text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-background border border-text/20 rounded-sm text-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-background border border-text/20 rounded-sm text-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full px-6 py-3 bg-text text-background font-medium rounded-sm hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-text/60">
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="text-accent hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </motion.div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-text/60 hover:text-text transition-colors">
            ← Back to home
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center px-6 py-20 bg-background">
        <div className="w-full max-w-md text-center">
          <h1 className="text-4xl font-heading font-bold mb-2">PROW</h1>
          <p className="text-text/70">Loading...</p>
        </div>
      </div>
    }>
      <SignInForm />
    </Suspense>
  )
}

