'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-background/80 backdrop-blur-md border-b border-black/5' : 'bg-transparent'
      }`}
    >
      <div className="max-w-[var(--container-max-width)] mx-auto px-6 md:px-12 py-6">
        <div className="flex items-center justify-between">
          <Link href="/">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="cursor-pointer"
            >
              <span className="font-heading text-2xl font-bold tracking-tight">PROW</span>
            </motion.div>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm font-medium text-text hover:text-accent transition-colors">
              Home
            </Link>
            <Link href="/product" className="text-sm font-medium text-text hover:text-accent transition-colors">
              Product
            </Link>
            <Link href="/pricing" className="text-sm font-medium text-text hover:text-accent transition-colors">
              Pricing
            </Link>
            <Link href="/company" className="text-sm font-medium text-text hover:text-accent transition-colors">
              Company
            </Link>
          </div>

          <Link href="/#waitlist">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-2.5 bg-text text-background text-sm font-medium rounded-sm hover:bg-accent transition-colors"
            >
              Join the Beta
            </motion.button>
          </Link>
        </div>
      </div>
    </motion.nav>
  )
}








