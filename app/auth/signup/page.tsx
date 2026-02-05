'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

type CompanySize = '1' | '2-10' | '10-100' | '100+'

export default function SignUpPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)

  // Step 1 fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Step 2 fields (optional)
  const [orgName, setOrgName] = useState('')
  const [roleTitle, setRoleTitle] = useState('')
  const [companySize, setCompanySize] = useState<CompanySize | ''>('')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setStep(2)
  }

  const handleFinalSubmit = async (skip: boolean = false) => {
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          // Only include optional fields if not skipping and they have values
          ...((!skip && orgName) && { orgName }),
          ...((!skip && roleTitle) && { roleTitle }),
          ...((!skip && companySize) && { companySize }),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Sign up failed. Please try again.')
        setLoading(false)
        return
      }

      // Sign up successful - redirect to sign in
      router.push('/auth/signin?registered=true')
    } catch (err) {
      console.error('Sign up error:', err)
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  const companySizeOptions: { value: CompanySize; label: string }[] = [
    { value: '1', label: 'Just me' },
    { value: '2-10', label: '2-10 employees' },
    { value: '10-100', label: '10-100 employees' },
    { value: '100+', label: '100+ employees' },
  ]

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
          <p className="text-text/70">
            {step === 1 ? 'Create your secure AI workspace' : 'Tell us about your organization'}
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex justify-center mb-6 gap-2">
          <div className={`h-2 w-16 rounded-full transition-colors ${step >= 1 ? 'bg-accent' : 'bg-text/20'}`} />
          <div className={`h-2 w-16 rounded-full transition-colors ${step >= 2 ? 'bg-accent' : 'bg-text/20'}`} />
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-background-alt border border-text/10 rounded-sm p-8"
            >
              <form onSubmit={handleStep1Submit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-sm text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-text mb-2">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-background border border-text/20 rounded-sm text-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                    placeholder="John Doe"
                  />
                </div>

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
                    minLength={8}
                    className="w-full px-4 py-3 bg-background border border-text/20 rounded-sm text-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                    placeholder="••••••••"
                  />
                  <p className="text-xs text-text/50 mt-1">Must be at least 8 characters</p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-text mb-2">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full px-4 py-3 bg-background border border-text/20 rounded-sm text-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                    placeholder="••••••••"
                  />
                </div>

                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-6 py-3 bg-text text-background font-medium rounded-sm hover:bg-accent transition-colors"
                >
                  Continue
                </motion.button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-text/60">
                  Already have an account?{' '}
                  <Link href="/auth/signin" className="text-accent hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="bg-background-alt border border-text/10 rounded-sm p-8"
            >
              <div className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-sm text-sm">
                    {error}
                  </div>
                )}

                <p className="text-sm text-text/60 text-center">
                  Help us personalize your experience. This is optional.
                </p>

                <div>
                  <label htmlFor="orgName" className="block text-sm font-medium text-text mb-2">
                    Organization Name
                  </label>
                  <input
                    id="orgName"
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-text/20 rounded-sm text-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                    placeholder="Acme Inc."
                  />
                </div>

                <div>
                  <label htmlFor="roleTitle" className="block text-sm font-medium text-text mb-2">
                    Your Role
                  </label>
                  <input
                    id="roleTitle"
                    type="text"
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-text/20 rounded-sm text-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                    placeholder="e.g. CEO, Manager, Analyst"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    Company Size
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {companySizeOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setCompanySize(option.value)}
                        className={`px-4 py-3 border rounded-sm text-sm font-medium transition-all ${
                          companySize === option.value
                            ? 'border-accent bg-accent/10 text-accent'
                            : 'border-text/20 text-text/70 hover:border-text/40'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <motion.button
                    type="button"
                    onClick={() => setStep(1)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 px-6 py-3 border border-text/20 text-text font-medium rounded-sm hover:bg-text/5 transition-colors"
                  >
                    Back
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => handleFinalSubmit(true)}
                    disabled={loading}
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                    className="flex-1 px-6 py-3 border border-text/20 text-text/70 font-medium rounded-sm hover:bg-text/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Skip
                  </motion.button>
                </div>

                <motion.button
                  type="button"
                  onClick={() => handleFinalSubmit(false)}
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  className="w-full px-6 py-3 bg-text text-background font-medium rounded-sm hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating account...' : 'Complete Sign Up'}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-text/60 hover:text-text transition-colors">
            &larr; Back to home
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
