'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: [0.25, 1, 0.5, 1],
    },
  },
}

export default function Hero() {
  return (
    <section id="waitlist" className="min-h-screen flex items-center justify-center px-6 md:px-12 pt-32 pb-20 bg-gradient-to-b from-white via-white to-[#f0f4f8]">
      <div className="max-w-[var(--container-max-width)] mx-auto w-full">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center max-w-4xl mx-auto"
        >
          <motion.div
            variants={itemVariants}
            className="mb-6"
          >
            <span className="inline-block px-4 py-1.5 bg-[#0066CC]/10 text-xs font-heading font-semibold tracking-wider uppercase text-[#0066CC] rounded-full border border-[#0066CC]/20">
              Secure AI for Sensitive Work
            </span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-5xl md:text-7xl lg:text-8xl font-heading font-bold mb-8 text-balance leading-[1.1] tracking-tight"
          >
            <span className="text-[#1e3a5f]">Secure AI Workspace</span><br />
            <span className="bg-gradient-to-r from-[#0066CC] to-[#0052A3] bg-clip-text text-transparent">for Sensitive Work</span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-xl md:text-2xl text-[#5A6470] mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            PROW is a secure AI workspace that enables teams to think and talk with their data safely.
            Built on a medical-grade security foundation for organizations that cannot risk data exposure.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link href="/auth/signup">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-[#0066CC] text-white font-medium rounded-sm hover:bg-[#0052A3] transition-all shadow-lg shadow-[#0066CC]/25"
              >
                Join the Beta
              </motion.button>
            </Link>
            <Link href="/product">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-transparent border-2 border-[#0066CC]/30 text-[#0066CC] font-medium rounded-sm hover:border-[#0066CC] hover:bg-[#0066CC]/5 transition-all"
              >
                View Product
              </motion.button>
            </Link>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="mt-20 pt-12 border-t border-[#0066CC]/10"
          >
            <p className="text-sm text-[#5A6470] mb-6 uppercase tracking-wider font-heading">
              Trusted by organizations that cannot risk data exposure
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8">
              {[
                'SMBs with proprietary data',
                'Journalists & media teams',
                'PR & communications',
                'Executives & consultants',
              ].map((company, i) => (
                <motion.div
                  key={company}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 + i * 0.1 }}
                  className="text-lg font-heading font-medium text-[#1e3a5f]/50"
                >
                  {company}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
