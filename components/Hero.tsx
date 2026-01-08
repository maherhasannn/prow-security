'use client'

import { motion } from 'framer-motion'
import { useRef } from 'react'

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
    <section className="min-h-screen flex items-center justify-center px-6 md:px-12 pt-32 pb-20">
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
            <span className="inline-block px-4 py-1.5 bg-background-alt text-xs font-heading font-semibold tracking-wider uppercase text-text/70 rounded-sm">
              HIPAA-Compliant Healthcare AI
            </span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-5xl md:text-7xl lg:text-8xl font-heading font-bold mb-8 text-balance leading-[1.1] tracking-tight"
          >
            Secure AI for<br />
            <span className="text-text/60">Healthcare Teams.</span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-xl md:text-2xl text-text/70 mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            Prow delivers HIPAA-compliant AI that helps healthcare providers make faster, more informed decisions. 
            Built for medical teams who demand security, accuracy, and compliance.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-text text-background font-medium rounded-sm hover:bg-accent transition-colors shadow-lg"
            >
              Start Free Trial
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-transparent border-2 border-text/20 text-text font-medium rounded-sm hover:border-text/40 transition-colors"
            >
              Schedule Demo
            </motion.button>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="mt-20 pt-12 border-t border-text/10"
          >
            <p className="text-sm text-text/50 mb-6 uppercase tracking-wider font-heading">
              Trusted by leading healthcare organizations
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-40">
              {['Regional Health System', 'Community Hospital', 'Medical Group', 'Health Network'].map((company, i) => (
                <motion.div
                  key={company}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.4 }}
                  transition={{ delay: 0.8 + i * 0.1 }}
                  className="text-lg font-heading font-medium"
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









