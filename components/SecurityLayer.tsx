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

// Administrative Animation - Document flow
function AdministrativeAnimation() {
  const documents = Array.from({ length: 5 }, (_, i) => i)

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {documents.map((doc, i) => (
        <motion.div
          key={doc}
          className="absolute"
          initial={{ opacity: 0, y: 20, rotate: -5 }}
          animate={{
            opacity: [0, 1, 1, 0],
            y: [20, -10, -10, -40],
            rotate: [-5, 0, 0, 5],
            x: [-20 + i * 10, 0, 0, 20 - i * 10],
          }}
          transition={{
            duration: 3,
            delay: i * 0.3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <div className="w-12 h-16 bg-white border border-[#3A6A7B]/20 rounded-sm shadow-sm flex items-center justify-center">
            <FileText className="w-6 h-6 text-[#3A6A7B]/40" />
          </div>
        </motion.div>
      ))}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="w-20 h-20 border-2 border-[#3A6A7B]/20 rounded-full" />
      </motion.div>
    </div>
  )
}

// Physical Animation - Server/Cloud infrastructure
function PhysicalAnimation() {
  const servers = [
    { x: 30, y: 25, delay: 0 },
    { x: 70, y: 25, delay: 0.2 },
    { x: 50, y: 50, delay: 0.4 },
    { x: 30, y: 75, delay: 0.6 },
    { x: 70, y: 75, delay: 0.8 },
  ]

  const connections = [
    [0, 1], [0, 2], [1, 2], [2, 3], [2, 4], [3, 4],
  ]

  return (
    <div className="relative w-full h-full">
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        {/* Connection lines */}
        {connections.map(([start, end], i) => {
          const startServer = servers[start]
          const endServer = servers[end]
          return (
            <motion.line
              key={`line-${start}-${end}`}
              x1={startServer.x}
              y1={startServer.y}
              x2={endServer.x}
              y2={endServer.y}
              stroke="#3A6A7B"
              strokeWidth="0.3"
              strokeOpacity="0.2"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: [0, 1, 1, 0],
                opacity: [0, 0.3, 0.3, 0],
              }}
              transition={{
                duration: 2,
                delay: i * 0.2,
                repeat: Infinity,
                repeatDelay: 1,
                ease: 'easeInOut',
              }}
            />
          )
        })}

        {/* Server nodes */}
        {servers.map((server, i) => (
          <g key={i}>
            {/* Pulsing circle */}
            <motion.circle
              cx={server.x}
              cy={server.y}
              r="4"
              fill="#3A6A7B"
              fillOpacity="0.1"
              animate={{
                r: [4, 8, 4],
                opacity: [0.3, 0, 0.3],
              }}
              transition={{
                duration: 2,
                delay: server.delay,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            {/* Server icon */}
            <motion.g
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: [0, 1.2, 1],
                opacity: [0, 1, 1],
              }}
              transition={{
                duration: 0.6,
                delay: server.delay,
                repeat: Infinity,
                repeatDelay: 3,
              }}
            >
              <circle
                cx={server.x}
                cy={server.y}
                r="3"
                fill="#3A6A7B"
              />
              <rect
                x={server.x - 2}
                y={server.y - 3}
                width="4"
                height="6"
                fill="#3A6A7B"
                opacity="0.8"
              />
            </motion.g>
          </g>
        ))}
      </svg>

      {/* Central cloud/server icon */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Server className="w-16 h-16 text-[#3A6A7B]/20" />
        </motion.div>
      </div>
    </div>
  )
}

// Technical Animation - Shield with encryption layers
function TechnicalAnimation() {
  const particles = Array.from({ length: 6 }, (_, i) => i)

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Rotating outer ring */}
      <motion.div
        className="absolute"
        animate={{ rotate: 360 }}
        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
      >
        <div className="w-32 h-32 border-2 border-[#3A6A7B]/20 rounded-full" />
      </motion.div>

      {/* Pulsing middle ring */}
      <motion.div
        className="absolute"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="w-24 h-24 border-2 border-[#3A6A7B]/30 rounded-full" />
      </motion.div>

      {/* Central shield */}
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="relative z-10"
      >
        <ShieldCheck className="w-16 h-16 text-[#3A6A7B]" />
      </motion.div>

      {/* Orbiting particles */}
      {particles.map((particle, i) => {
        const angle = (i / particles.length) * 360
        const radius = 35

        return (
          <motion.div
            key={particle}
            className="absolute"
            style={{
              left: '50%',
              top: '50%',
            }}
            animate={{
              rotate: angle + 360,
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'linear',
              delay: i * 0.15,
            }}
          >
            <motion.div
              className="w-2 h-2 bg-[#3A6A7B] rounded-full"
              style={{
                transform: `translate(${radius}px, -50%)`,
              }}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.1,
              }}
            />
          </motion.div>
        )
      })}

      {/* Encryption lines radiating from center */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet">
        {[0, 60, 120, 180].map((angle, i) => (
          <motion.line
            key={i}
            x1="100"
            y1="100"
            x2={100 + Math.cos((angle * Math.PI) / 180) * 50}
            y2={100 + Math.sin((angle * Math.PI) / 180) * 50}
            stroke="#3A6A7B"
            strokeWidth="1"
            strokeOpacity="0.2"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{
              pathLength: [0, 1, 0],
              opacity: [0, 0.4, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.3,
              ease: 'easeInOut',
            }}
          />
        ))}
      </svg>
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
