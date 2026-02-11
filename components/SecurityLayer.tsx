'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { FileText, Server, ShieldCheck } from 'lucide-react'

const safeguards = [
  {
    category: 'Data Isolation',
    icon: FileText,
    animationType: 'administrative',
    items: [
      'No training on customer data — hard guarantee',
      'No cross-tenant learning',
      'Private, organization-isolated workspaces',
    ],
  },
  {
    category: 'Access & Audit',
    icon: Server,
    animationType: 'physical',
    items: [
      'Role-based access control (RBAC)',
      'Full audit logging (uploads, access, AI usage)',
      'Policy-aware access controls for sensitive data',
    ],
  },
  {
    category: 'Encryption & Guardrails',
    icon: ShieldCheck,
    animationType: 'technical',
    items: [
      'AES-256 at rest and TLS 1.2+ in transit',
      'End-to-end encryption for stored and in-flight data',
      'Policy-aware AI guardrails for sensitive data',
    ],
  },
]

// Data Isolation Animation - Separate tenant containers
function AdministrativeAnimation() {
  const tenants = [
    { label: 'A', x: 15, color: '#3A6A7B' },
    { label: 'B', x: 50, color: '#5A8A9B' },
    { label: 'C', x: 85, color: '#4A7A8B' },
  ]

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        {/* Dividing walls between tenants */}
        {[33, 66].map((x, i) => (
          <motion.line
            key={i}
            x1={x}
            y1="15"
            x2={x}
            y2="85"
            stroke="#3A6A7B"
            strokeWidth="2"
            strokeDasharray="4 2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: i * 0.2 }}
          />
        ))}

        {/* Tenant containers with documents */}
        {tenants.map((tenant, i) => (
          <g key={i}>
            {/* Container box */}
            <motion.rect
              x={tenant.x - 12}
              y={25}
              width="24"
              height="50"
              fill={tenant.color}
              fillOpacity="0.1"
              stroke={tenant.color}
              strokeWidth="1"
              strokeOpacity="0.3"
              rx="2"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
            />

            {/* Tenant label */}
            <motion.text
              x={tenant.x}
              y={35}
              textAnchor="middle"
              fontSize="8"
              fill={tenant.color}
              fontWeight="bold"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.15 }}
            >
              Org {tenant.label}
            </motion.text>

            {/* Documents inside container - bouncing within bounds */}
            {[0, 1].map((_, j) => (
              <motion.rect
                key={j}
                x={tenant.x - 6}
                y={45 + j * 15}
                width="12"
                height="10"
                fill={tenant.color}
                fillOpacity="0.4"
                rx="1"
                animate={{
                  x: [tenant.x - 6, tenant.x - 4, tenant.x - 8, tenant.x - 6],
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.3 + j * 0.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            ))}

            {/* Lock icon on container */}
            <motion.g
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
            >
              <circle cx={tenant.x} cy={80} r="5" fill={tenant.color} fillOpacity="0.2" />
              <rect x={tenant.x - 2} y={78} width="4" height="4" fill={tenant.color} rx="0.5" />
              <path
                d={`M${tenant.x - 1.5} 78 L${tenant.x - 1.5} 76 A1.5 1.5 0 0 1 ${tenant.x + 1.5} 76 L${tenant.x + 1.5} 78`}
                fill="none"
                stroke={tenant.color}
                strokeWidth="0.8"
              />
            </motion.g>
          </g>
        ))}
      </svg>
    </div>
  )
}

// Access & Audit Animation - Audit log with entries appearing
function PhysicalAnimation() {
  const logEntries = [
    { action: 'Login', user: 'admin', status: 'success' },
    { action: 'View', user: 'user1', status: 'success' },
    { action: 'Edit', user: 'user2', status: 'success' },
    { action: 'Access', user: 'user3', status: 'denied' },
  ]

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Audit log container */}
      <div className="w-full max-w-[180px] px-2">
        {/* Log header */}
        <motion.div
          className="flex items-center gap-2 mb-3 pb-2 border-b border-[#3A6A7B]/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Server className="w-4 h-4 text-[#3A6A7B]" />
          <span className="text-[10px] font-semibold text-[#3A6A7B] uppercase tracking-wider">Audit Log</span>
        </motion.div>

        {/* Log entries */}
        <div className="space-y-2">
          {logEntries.map((entry, i) => (
            <motion.div
              key={i}
              className="flex items-center gap-2 text-[9px]"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: [0, 1, 1, 0], x: [-20, 0, 0, 0] }}
              transition={{
                duration: 3,
                delay: i * 0.8,
                repeat: Infinity,
                repeatDelay: logEntries.length * 0.8,
              }}
            >
              {/* Timestamp */}
              <span className="text-[#3A6A7B]/50 font-mono w-12 flex-shrink-0">
                {`${10 + i}:${String(i * 15).padStart(2, '0')}`}
              </span>

              {/* Action badge */}
              <span className="px-1.5 py-0.5 bg-[#3A6A7B]/10 text-[#3A6A7B] rounded text-[8px] font-medium w-10 text-center">
                {entry.action}
              </span>

              {/* User */}
              <span className="text-[#5A6470] flex-1 truncate">{entry.user}</span>

              {/* Status indicator */}
              <motion.div
                className={`w-4 h-4 rounded-full flex items-center justify-center ${
                  entry.status === 'success' ? 'bg-green-100' : 'bg-red-100'
                }`}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, delay: i * 0.8 + 0.3 }}
              >
                {entry.status === 'success' ? (
                  <span className="text-green-600 text-[8px]">✓</span>
                ) : (
                  <span className="text-red-500 text-[8px]">✕</span>
                )}
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Scanning line effect */}
        <motion.div
          className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#3A6A7B]/30 to-transparent"
          animate={{ top: ['20%', '90%', '20%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    </div>
  )
}

// Technical Animation - Encryption visualization with scrambling text
function TechnicalAnimation() {
  const plainText = 'SECURE'
  const encryptedChars = '▓░█▒◆●'

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Data transformation visualization */}
      <div className="flex flex-col items-center gap-4">
        {/* Plain text row */}
        <motion.div
          className="flex gap-1"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {plainText.split('').map((char, i) => (
            <motion.span
              key={`plain-${i}`}
              className="w-6 h-8 bg-white border border-[#3A6A7B]/30 rounded flex items-center justify-center text-sm font-mono text-[#3A6A7B] font-semibold"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, delay: i * 0.1, repeat: Infinity }}
            >
              {char}
            </motion.span>
          ))}
        </motion.div>

        {/* Arrow with lock icon */}
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ y: [0, 3, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <svg width="20" height="24" viewBox="0 0 20 24" fill="none">
              <motion.path
                d="M10 0 L10 18 M4 12 L10 18 L16 12"
                stroke="#3A6A7B"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            </svg>
          </motion.div>
          <motion.div
            className="p-1.5 bg-[#3A6A7B]/10 rounded"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ShieldCheck className="w-4 h-4 text-[#3A6A7B]" />
          </motion.div>
          <span className="text-[9px] text-[#3A6A7B]/60 font-medium">AES-256</span>
        </div>

        {/* Encrypted text row */}
        <motion.div
          className="flex gap-1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {plainText.split('').map((_, i) => (
            <motion.span
              key={`enc-${i}`}
              className="w-6 h-8 bg-[#3A6A7B]/10 border border-[#3A6A7B]/30 rounded flex items-center justify-center text-sm font-mono text-[#3A6A7B]"
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{ duration: 0.5, delay: i * 0.15, repeat: Infinity }}
            >
              <motion.span
                animate={{
                  opacity: [1, 0, 1],
                }}
                transition={{
                  duration: 0.3,
                  delay: i * 0.15,
                  repeat: Infinity,
                  repeatDelay: 2,
                }}
              >
                {encryptedChars[i % encryptedChars.length]}
              </motion.span>
            </motion.span>
          ))}
        </motion.div>

        {/* Encryption label */}
        <motion.div
          className="flex items-center gap-1 mt-1"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <span className="text-[9px] text-[#5A6470]">End-to-end encrypted</span>
        </motion.div>
      </div>

      {/* Background encryption particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-[8px] font-mono text-[#3A6A7B]/20"
            style={{
              left: `${10 + (i % 4) * 25}%`,
              top: `${15 + Math.floor(i / 4) * 70}%`,
            }}
            animate={{
              opacity: [0, 0.3, 0],
              y: [0, -10, 0],
            }}
            transition={{
              duration: 3,
              delay: i * 0.4,
              repeat: Infinity,
            }}
          >
            {['01', '10', '11', '00'][i % 4]}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default function SecurityLayer() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="security-layer" className="py-32 px-6 md:px-12 bg-gradient-to-b from-[#EDF5F5] to-white">
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
        >
          <motion.div
            variants={{
              hidden: { y: 30, opacity: 0 },
              visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: [0.25, 1, 0.5, 1] } },
            }}
            className="text-center mb-20"
          >
            <span className="inline-block px-4 py-1.5 bg-[#3A6A7B]/10 text-xs font-heading font-semibold tracking-wider uppercase text-[#3A6A7B] rounded-full border border-[#3A6A7B]/20 mb-6">
              The PROW Security Layer
            </span>
            <h2 className="text-4xl md:text-6xl font-heading font-bold mb-6 text-balance text-[#3A6A7B]">
              Medical-Grade Security, Built to the Highest Standard
            </h2>
            <p className="text-xl text-[#5A6470] max-w-2xl mx-auto">
              Security is not a feature of PROW — it is the foundation. If a system protects the most sensitive
              data categories, it is secure enough for high-trust professional use cases.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {safeguards.map((safeguard, index) => {
              const IconComponent = safeguard.icon
              return (
                <motion.div
                  key={safeguard.category}
                  variants={{
                    hidden: { y: 40, opacity: 0 },
                    visible: {
                      y: 0,
                      opacity: 1,
                      transition: { duration: 0.6, ease: [0.25, 1, 0.5, 1] },
                    },
                  }}
                  whileHover={{ y: -8 }}
                  className="bg-white p-8 rounded-sm border border-[#3A6A7B]/10 hover:border-[#3A6A7B]/30 hover:shadow-lg hover:shadow-[#3A6A7B]/5 transition-all flex flex-col"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-[#3A6A7B]/10 rounded-sm">
                      <IconComponent className="w-6 h-6 text-[#3A6A7B]" />
                    </div>
                    <h3 className="text-2xl font-heading font-semibold text-[#3A6A7B]">{safeguard.category}</h3>
                  </div>

                  {/* Animation Container */}
                  <div className="h-[200px] mb-6 flex items-center justify-center bg-gradient-to-br from-[#3A6A7B]/5 to-[#3A6A7B]/5 rounded-sm overflow-hidden relative">
                    {safeguard.animationType === 'administrative' && <AdministrativeAnimation />}
                    {safeguard.animationType === 'physical' && <PhysicalAnimation />}
                    {safeguard.animationType === 'technical' && <TechnicalAnimation />}
                  </div>

                  <ul className="space-y-3 flex-grow">
                    {safeguard.items.map((item, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                        transition={{ delay: 0.4 + index * 0.1 + i * 0.05, duration: 0.4 }}
                        className="flex items-start gap-3"
                      >
                        <span className="text-[#3A6A7B] mt-1 flex-shrink-0">✓</span>
                        <span className="text-[#5A6470] leading-relaxed text-sm">{item}</span>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
