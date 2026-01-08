'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { FileText, Server, ShieldCheck } from 'lucide-react'

const safeguards = [
  {
    category: 'Administrative',
    icon: FileText,
    animationType: 'administrative',
    items: [
      'Ability to sign a Business Associate Agreement (BAA)',
      'Explicit data-handling policies that include AI usage',
      'Incident response + breach notification procedures',
      'Role-based workforce access policies',
    ],
  },
  {
    category: 'Physical',
    icon: Server,
    animationType: 'physical',
    items: [
      'HIPAA-eligible cloud infrastructure',
      'U.S.-based hosting preferred (or configurable data residency)',
    ],
  },
  {
    category: 'Technical',
    icon: ShieldCheck,
    animationType: 'technical',
    items: [
      'Encryption at rest (AES-256) and in transit (TLS 1.2+)',
      'MFA',
      'Role-based access control (RBAC)',
      'Full audit logging (access, uploads, AI usage)',
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
          <div className="w-12 h-16 bg-background border border-text/10 rounded-sm shadow-sm flex items-center justify-center">
            <FileText className="w-6 h-6 text-accent/40" />
          </div>
        </motion.div>
      ))}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="w-20 h-20 border-2 border-accent/20 rounded-full" />
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
              stroke="currentColor"
              strokeWidth="0.3"
              className="text-accent/20"
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
              fill="currentColor"
              className="text-accent/10"
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
                fill="currentColor"
                className="text-accent"
              />
              <rect
                x={server.x - 2}
                y={server.y - 3}
                width="4"
                height="6"
                fill="currentColor"
                className="text-accent"
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
          <Server className="w-16 h-16 text-accent/20" />
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
        <div className="w-32 h-32 border-2 border-accent/20 rounded-full" />
      </motion.div>

      {/* Pulsing middle ring */}
      <motion.div
        className="absolute"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="w-24 h-24 border-2 border-accent/30 rounded-full" />
      </motion.div>

      {/* Central shield */}
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="relative z-10"
      >
        <ShieldCheck className="w-16 h-16 text-accent" />
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
              className="w-2 h-2 bg-accent rounded-full"
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
            stroke="currentColor"
            strokeWidth="1"
            className="text-accent/20"
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

export default function HIPAASafeguards() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="hipaa-safeguards" className="py-32 px-6 md:px-12 bg-background-alt">
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
            <span className="inline-block px-4 py-1.5 bg-background text-xs font-heading font-semibold tracking-wider uppercase text-text/70 rounded-sm mb-6">
              HIPAA Compliance
            </span>
            <h2 className="text-4xl md:text-6xl font-heading font-bold mb-6 text-balance">
              Three Safeguard Categories
            </h2>
            <p className="text-xl text-text/70 max-w-2xl mx-auto">
              All three safeguard categories must be addressed for full HIPAA compliance. 
              Prow ensures comprehensive coverage across administrative, physical, and technical safeguards for healthcare organizations.
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
                  className="bg-background p-8 rounded-sm border border-text/5 hover:border-text/10 transition-all flex flex-col"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-background-alt rounded-sm">
                      <IconComponent className="w-6 h-6 text-accent" />
                    </div>
                    <h3 className="text-2xl font-heading font-semibold">{safeguard.category}</h3>
                  </div>

                  {/* Animation Container */}
                  <div className="h-[200px] mb-6 flex items-center justify-center bg-background-alt rounded-sm overflow-hidden relative">
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
                        <span className="text-accent mt-1 flex-shrink-0">✓</span>
                        <span className="text-text/80 leading-relaxed text-sm">{item}</span>
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

