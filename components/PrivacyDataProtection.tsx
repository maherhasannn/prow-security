'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { Shield, Lock, Ban, AlertTriangle } from 'lucide-react'

const features = [
  {
    title: 'No Training on Customer Data',
    critical: true,
    icon: Ban,
    items: [
      'Hard guarantee: no model training on customer data',
      'No cross-tenant learning',
      'Organization-isolated AI workspaces',
    ],
  },
  {
    title: 'High-Trust Audiences',
    icon: Shield,
    items: [
      'SMBs with proprietary data',
      'Journalists and media professionals',
      'PR and communications teams',
      'Executives, analysts, and consultants',
    ],
  },
  {
    title: 'Secure Collaboration',
    icon: Lock,
    items: [
      'Role-based access control (RBAC)',
      'Full audit logging for uploads and AI usage',
      'Policy-aware guardrails for sensitive data',
    ],
  },
]

export default function PrivacyDataProtection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="trust" className="py-32 px-6 md:px-12 bg-background">
      <div className="max-w-[var(--container-max-width)] mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 1, 0.5, 1] }}
            className="relative h-[500px] bg-background-alt rounded-sm overflow-hidden order-2 lg:order-1"
          >
            <PrivacyVisualization />
          </motion.div>

          <motion.div
            ref={ref}
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
            transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
            className="order-1 lg:order-2"
          >
            <span className="inline-block px-4 py-1.5 bg-background-alt text-xs font-heading font-semibold tracking-wider uppercase text-text/70 rounded-sm mb-6">
              Trusted by High-Trust Teams
            </span>
            <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6 text-balance">
              Built for Organizations That Cannot Risk Exposure
            </h2>
            <p className="text-lg text-text/70 mb-8 leading-relaxed">
              Medical-grade security refers to the rigor of the architecture, not a healthcare product claim.
              PROW is designed to protect the most sensitive categories of data across high-trust professional teams.
            </p>

            <div className="space-y-6">
              {features.map((feature, featureIndex) => {
                const IconComponent = feature.icon
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ delay: 0.3 + featureIndex * 0.15, duration: 0.5 }}
                    className="border-l-2 border-accent/30 pl-6"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-background-alt rounded-sm">
                        <IconComponent className="w-5 h-5 text-accent" />
                      </div>
                      <h3 className="text-xl font-heading font-semibold">{feature.title}</h3>
                      {feature.critical && (
                        <span className="px-2 py-0.5 bg-accent/10 text-accent text-xs font-heading font-semibold uppercase tracking-wider rounded-sm flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Critical
                        </span>
                      )}
                    </div>
                    <ul className="space-y-2">
                      {feature.items.map((item, itemIndex) => (
                        <motion.li
                          key={itemIndex}
                          initial={{ opacity: 0, x: -10 }}
                          animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                          transition={{ delay: 0.4 + featureIndex * 0.15 + itemIndex * 0.05, duration: 0.4 }}
                          className="flex items-start gap-3"
                        >
                          <span className="text-accent mt-1 flex-shrink-0">✓</span>
                          <span className="text-text/80 text-sm leading-relaxed">{item}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function PrivacyVisualization() {
  const containers = Array.from({ length: 3 }, (_, i) => ({
    id: i,
    x: 20 + i * 30,
    y: 30 + (i % 2) * 40,
    delay: i * 0.3,
  }))

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        {/* Isolated containers */}
        {containers.map((container, i) => (
          <g key={container.id}>
            {/* Container boundaries */}
            <motion.rect
              x={container.x - 8}
              y={container.y - 8}
              width="16"
              height="16"
              rx="2"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.4"
              className="text-accent/40"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: container.delay }}
            />
            {/* Data points inside container */}
            {[0, 1, 2].map((point) => (
              <motion.circle
                key={point}
                cx={container.x + (point - 1) * 3}
                cy={container.y + (point % 2) * 3}
                r="1"
                fill="currentColor"
                className="text-accent"
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: [0, 1.2, 1],
                  opacity: [0, 1, 1],
                }}
                transition={{
                  duration: 0.5,
                  delay: container.delay + point * 0.1,
                  repeat: Infinity,
                  repeatDelay: 3,
                }}
              />
            ))}
            {/* Pulsing protection ring */}
            <motion.circle
              cx={container.x}
              cy={container.y}
              r="12"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.3"
              className="text-accent/20"
              animate={{
                r: [12, 16, 12],
                opacity: [0.3, 0, 0.3],
              }}
              transition={{
                duration: 2,
                delay: container.delay,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </g>
        ))}

        {/* Barrier lines between containers */}
        {containers.map((container, i) => {
          if (i < containers.length - 1) {
            const nextContainer = containers[i + 1]
            return (
              <motion.line
                key={`barrier-${i}`}
                x1={container.x + 8}
                y1={container.y}
                x2={nextContainer.x - 8}
                y2={nextContainer.y}
                stroke="currentColor"
                strokeWidth="0.5"
                strokeDasharray="2 2"
                className="text-accent/30"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{
                  pathLength: [0, 1, 1, 0],
                  opacity: [0, 0.4, 0.4, 0],
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
          }
          return null
        })}

        {/* Central shield */}
        <motion.g
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <motion.circle
            cx="50"
            cy="50"
            r="8"
            fill="currentColor"
            className="text-accent/10"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.3, 0.2],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.path
            d="M50 42 L46 44 L46 48 C46 52 48 54 50 56 C52 54 54 52 54 48 L54 44 Z"
            fill="currentColor"
            className="text-accent"
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </motion.g>

        {/* Privacy rays */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
          <motion.line
            key={i}
            x1="50"
            y1="50"
            x2={50 + Math.cos((angle * Math.PI) / 180) * 25}
            y2={50 + Math.sin((angle * Math.PI) / 180) * 25}
            stroke="currentColor"
            strokeWidth="0.3"
            className="text-accent/15"
            animate={{
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.1,
              ease: 'easeInOut',
            }}
          />
        ))}
      </svg>
    </div>
  )
}

