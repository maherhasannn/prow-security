'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'

export default function ChatIntegration() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="data-inputs" className="py-32 px-6 md:px-12 bg-background">
      <div className="max-w-[var(--container-max-width)] mx-auto">
        <motion.div
          ref={ref}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
          className="text-center mb-20"
        >
          <motion.div
            variants={{
              hidden: { y: 30, opacity: 0 },
              visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: [0.25, 1, 0.5, 1] } },
            }}
          >
            <span className="inline-block px-4 py-1.5 bg-background-alt text-xs font-heading font-semibold tracking-wider uppercase text-text/70 rounded-sm mb-6">
              Secure Data Inputs
            </span>
            <h2 className="text-4xl md:text-6xl font-heading font-bold mb-6 text-balance">
              Bring Your Data Into a Private AI Workspace
            </h2>
            <p className="text-xl text-text/70 max-w-2xl mx-auto">
              Start with Excel/CSV, PDFs, and QuickBooks. Ask questions across files and surface insights
              without exporting or exposing sensitive data.
            </p>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 1, 0.5, 1] }}
          className="relative max-w-5xl mx-auto"
        >
          <ChatInterface />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 flex flex-wrap justify-center gap-8"
        >
          {['Excel/CSV', 'PDFs', 'QuickBooks (read-only)'].map((platform, i) => (
            <motion.div
              key={platform}
              whileHover={{ scale: 1.05, y: -2 }}
              className="px-6 py-3 bg-background-alt border border-text/10 rounded-sm hover:border-text/20 transition-colors"
            >
              <span className="text-sm font-medium">{platform}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function ChatInterface() {
  return (
    <div className="bg-background-alt rounded-sm border border-text/10 overflow-hidden">
      {/* Mock Chat Interface */}
      <div className="p-6 border-b border-text/10 bg-background">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-text/10" />
          <div>
            <div className="h-4 w-32 bg-text/20 rounded mb-2" />
            <div className="h-3 w-24 bg-text/10 rounded" />
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Chat Messages Area */}
        <div className="flex-1 p-6 space-y-4 min-w-0">
          {[
            { text: 'What were last quarter’s largest expense categories from QuickBooks?', side: 'right' },
            { text: 'From your QuickBooks reports, the top categories were payroll, vendor services, and cloud infrastructure. I can break down totals by month if helpful.', side: 'left', isProw: true },
            { text: 'Summarize the key risks noted in the Q4 board memo PDF.', side: 'right' },
          ].map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: msg.side === 'right' ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + i * 0.3, duration: 0.5 }}
              className={`flex ${msg.side === 'right' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] p-4 rounded-sm ${
                  msg.side === 'right'
                    ? 'bg-text/5 text-text'
                    : msg.isProw
                    ? 'bg-accent/10 text-text border-l-2 border-accent'
                    : 'bg-background text-text'
                }`}
              >
                {msg.isProw && (
                  <div className="text-xs font-heading font-semibold text-accent mb-1 uppercase tracking-wider">
                    Prow
                  </div>
                )}
                <p className="text-sm leading-relaxed">{msg.text}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Prow Sidebar */}
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
          className="w-64 flex-shrink-0 bg-accent/5 border-l border-accent/20 p-4"
        >
          <div className="mb-6">
            <div className="text-xs font-heading font-semibold text-accent uppercase tracking-wider mb-3">
              Context
            </div>
            <div className="space-y-2">
              <div className="h-2 w-full bg-accent/20 rounded" />
              <div className="h-2 w-3/4 bg-accent/20 rounded" />
              <div className="h-2 w-5/6 bg-accent/20 rounded" />
            </div>
          </div>
          <div>
            <div className="text-xs font-heading font-semibold text-accent uppercase tracking-wider mb-3">
              Sources
            </div>
            <div className="space-y-2">
              {['Q4 Board Memo.pdf', 'QuickBooks Q4 Report.csv'].map((source, i) => (
                <motion.div
                  key={source}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.7 + i * 0.1 }}
                  className="text-xs text-text/60 break-words"
                >
                  {source}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}









