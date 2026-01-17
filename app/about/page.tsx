'use client'

import { motion } from 'framer-motion'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { y: 50, opacity: 0, scale: 0.95 },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.8,
      ease: [0.25, 1, 0.5, 1],
    },
  },
}

// Word-by-word animation component
const AnimatedText = ({ text, className = '' }: { text: string; className?: string }) => {
  const words = text.split(' ')
  
  return (
    <span className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            delay: i * 0.05,
            ease: [0.25, 1, 0.5, 1],
          }}
          className="inline-block mr-2"
        >
          {word}
        </motion.span>
      ))}
    </span>
  )
}

// Slide in from different directions
const slideInVariants = {
  hiddenLeft: { x: -100, opacity: 0 },
  hiddenRight: { x: 100, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.8,
      ease: [0.25, 1, 0.5, 1],
    },
  },
}

const scaleInVariants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: [0.34, 1.56, 0.64, 1],
    },
  },
}

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 md:px-12 bg-background overflow-hidden">
        <div className="max-w-[var(--container-max-width)] mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center max-w-4xl mx-auto"
          >
            <motion.h1
              variants={itemVariants}
              className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold mb-8 text-balance leading-[1.1] tracking-tight"
            >
              <AnimatedText text="A courageous company—built to give small businesses the advantages once reserved for giants." />
            </motion.h1>
          </motion.div>
        </div>
      </section>

      {/* Story Section 1: Operators First */}
      <section className="py-20 px-6 md:px-12 bg-background-alt overflow-hidden">
        <div className="max-w-[var(--container-max-width)] mx-auto">
          <div className="max-w-3xl">
            <motion.div
              initial="hiddenLeft"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={slideInVariants}
              className="prose prose-lg max-w-none"
            >
              <motion.p 
                className="text-lg md:text-xl text-text/80 leading-relaxed mb-6"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.3 }}
              >
                For years, we were operators first—building, defending, and repairing real businesses in the real world. We learned the hard way where systems break, where data leaks, and where small companies are left exposed while larger enterprises pull further ahead.
              </motion.p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Story Section 2: Journey Tested */}
      <section className="py-20 px-6 md:px-12 bg-background overflow-hidden">
        <div className="max-w-[var(--container-max-width)] mx-auto">
          <div className="max-w-3xl">
            <motion.div
              initial="hiddenRight"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={slideInVariants}
              className="prose prose-lg max-w-none"
            >
              <motion.p 
                className="text-lg md:text-xl text-text/80 leading-relaxed mb-6"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.3, staggerChildren: 0.1 }}
              >
                Our own journey was tested. A thriving retail business was disrupted by COVID and blocked from online growth. Decades of hard-won intellectual property were lost to wildfire. Like most entrepreneurs, we faced setbacks that would have ended the story for many—but we kept going.
              </motion.p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Story Section 3: Deep into Fundamentals */}
      <section className="py-20 px-6 md:px-12 bg-background-alt overflow-hidden">
        <div className="max-w-[var(--container-max-width)] mx-auto">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 50, rotateX: -15 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
              className="prose prose-lg max-w-none"
              style={{ perspective: 1000 }}
            >
              <motion.p 
                className="text-lg md:text-xl text-text/80 leading-relaxed mb-6"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, delay: 0.4 }}
              >
                That path took us deep into the fundamentals. We returned to school at <motion.span 
                  className="font-semibold"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
                >UC Berkeley Hass</motion.span> and <motion.span 
                  className="font-semibold"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.9, type: "spring", stiffness: 200 }}
                >MIT Sloan</motion.span> to relearn how modern systems should be built—how to architect software correctly, how blockchain can protect ownership and trust, and how AI can amplify decision-making without compromising security.
              </motion.p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Story Section 4: Unexpected Realization */}
      <section className="py-20 px-6 md:px-12 bg-background overflow-hidden">
        <div className="max-w-[var(--container-max-width)] mx-auto">
          <div className="max-w-3xl">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={scaleInVariants}
              className="prose prose-lg max-w-none"
            >
              <motion.p 
                className="text-lg md:text-xl text-text/80 leading-relaxed mb-6"
                initial={{ opacity: 0, clipPath: 'inset(0 100% 0 0)' }}
                whileInView={{ opacity: 1, clipPath: 'inset(0 0% 0 0)' }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1], delay: 0.2 }}
              >
                Over time, something unexpected happened. In solving our own problems, we realized we had built something more powerful than we intended.
              </motion.p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* PROW Was Born Section */}
      <section className="py-20 px-6 md:px-12 bg-background-alt overflow-hidden">
        <div className="max-w-[var(--container-max-width)] mx-auto">
          <div className="max-w-3xl">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={scaleInVariants}
              className="prose prose-lg max-w-none"
            >
              <motion.h2 
                className="text-3xl md:text-4xl font-heading font-bold mb-6 text-balance"
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ 
                  duration: 0.8, 
                  ease: [0.34, 1.56, 0.64, 1],
                  delay: 0.2
                }}
              >
                <motion.span
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                  className="text-accent"
                >
                  PROW
                </motion.span>{' '}
                <motion.span
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 }}
                >
                  was born from that realization.
                </motion.span>
              </motion.h2>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Closing Statement Section */}
      <section className="py-20 px-6 md:px-12 bg-background overflow-hidden">
        <div className="max-w-[var(--container-max-width)] mx-auto">
          <div className="max-w-3xl">
            <motion.div
              initial="hiddenLeft"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={slideInVariants}
              className="prose prose-lg max-w-none"
            >
              <motion.p 
                className="text-lg md:text-xl text-text/80 leading-relaxed"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, delay: 0.3 }}
              >
                These are the tools small businesses actually need—not to tread water, not to fall further behind—but to grow with <motion.span 
                  className="font-semibold"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.8, type: "spring" }}
                >leverage</motion.span>, <motion.span 
                  className="font-semibold"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.9, type: "spring" }}
                >clarity</motion.span>, and <motion.span 
                  className="font-semibold"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 1.0, type: "spring" }}
                >protection</motion.span>. Capabilities that were once available only to large enterprises are now within reach—securely, responsibly, and by design.
              </motion.p>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}

