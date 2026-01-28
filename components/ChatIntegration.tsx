'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'

export default function ChatIntegration() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="data-inputs" className="py-32 px-6 md:px-12 bg-white">
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
            <span className="inline-block px-4 py-1.5 bg-[#3A6A7B]/10 text-xs font-heading font-semibold tracking-wider uppercase text-[#3A6A7B] rounded-full border border-[#3A6A7B]/20 mb-6">
              Secure Data Inputs
            </span>
            <h2 className="text-4xl md:text-6xl font-heading font-bold mb-6 text-balance text-[#3A6A7B]">
              Bring Your Data Into a Private AI Workspace
            </h2>
            <p className="text-xl text-[#5A6470] max-w-2xl mx-auto">
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
          className="mt-16 flex flex-wrap justify-center gap-4"
        >
          {['Excel/CSV', 'PDFs', 'QuickBooks (read-only)'].map((platform, i) => (
            <motion.div
              key={platform}
              whileHover={{ scale: 1.05, y: -2 }}
              className="px-6 py-3 bg-[#3A6A7B]/5 border border-[#3A6A7B]/20 rounded-full hover:border-[#3A6A7B]/40 hover:bg-[#3A6A7B]/10 transition-all cursor-default"
            >
              <span className="text-sm font-medium text-[#3A6A7B]">{platform}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function ChatInterface() {
  return (
    <div className="bg-white rounded-sm border border-[#3A6A7B]/10 overflow-hidden shadow-xl shadow-[#3A6A7B]/5">
      {/* Mock Chat Interface */}
      <div className="p-6 border-b border-[#3A6A7B]/10 bg-gradient-to-r from-[#3A6A7B]/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#3A6A7B]/20 flex items-center justify-center">
            <span className="text-[#3A6A7B] font-heading font-bold text-sm">P</span>
          </div>
          <div>
            <div className="font-heading font-semibold text-[#3A6A7B]">PROW Workspace</div>
            <div className="text-xs text-[#5A6470]">Secure AI Session</div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Chat Messages Area */}
        <div className="flex-1 p-6 space-y-4 min-w-0 bg-[#fafbfc]">
          {[
            { text: "What were last quarter's largest expense categories from QuickBooks?", side: 'right' },
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
                    ? 'bg-white text-[#3A6A7B] border border-[#3A6A7B]/10'
                    : msg.isProw
                    ? 'bg-[#3A6A7B]/10 text-[#3A6A7B] border-l-2 border-[#3A6A7B]'
                    : 'bg-white text-[#3A6A7B]'
                }`}
              >
                {msg.isProw && (
                  <div className="text-xs font-heading font-semibold text-[#3A6A7B] mb-1 uppercase tracking-wider">
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
          className="w-64 flex-shrink-0 bg-[#3A6A7B]/5 border-l border-[#3A6A7B]/20 p-4"
        >
          <div className="mb-6">
            <div className="text-xs font-heading font-semibold text-[#3A6A7B] uppercase tracking-wider mb-3">
              Context
            </div>
            <div className="space-y-2">
              <div className="h-2 w-full bg-[#3A6A7B]/20 rounded" />
              <div className="h-2 w-3/4 bg-[#3A6A7B]/20 rounded" />
              <div className="h-2 w-5/6 bg-[#3A6A7B]/20 rounded" />
            </div>
          </div>
          <div>
            <div className="text-xs font-heading font-semibold text-[#3A6A7B] uppercase tracking-wider mb-3">
              Sources
            </div>
            <div className="space-y-2">
              {['Q4 Board Memo.pdf', 'QuickBooks Q4 Report.csv'].map((source, i) => (
                <motion.div
                  key={source}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.7 + i * 0.1 }}
                  className="text-xs text-[#5A6470] break-words bg-white px-2 py-1 rounded border border-[#3A6A7B]/10"
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
