'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

const LinkedInIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="text-[#0A66C2] hover:text-[#004182] transition-colors"
  >
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
)

const TeamMemberImage = ({ src, alt, initials }: { src: string; alt: string; initials: string }) => {
  const [imageError, setImageError] = useState(false)

  if (imageError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#3A6A7B] text-white text-2xl font-heading font-semibold">
        {initials}
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover"
      onError={() => setImageError(true)}
    />
  )
}

const leadershipTeam = [
  {
    name: 'Sir Steven',
    initials: 'SS',
    image: '/images/team/steven.jpg',
    linkedin: 'https://www.linkedin.com/in/sir-steven-saxton-ba849b35/',
  },
  {
    name: 'Katherine',
    initials: 'K',
    image: '/images/team/katherine.jpg',
    linkedin: 'https://www.linkedin.com/in/katherine-guevara-saxton-a26a7877/',
  },
  {
    name: 'Professor Nelson',
    initials: 'PN',
    image: '/images/team/nelson.jpg',
    linkedin: 'https://www.linkedin.com/in/nelson-granados-64a3393/',
  },
  {
    name: 'Lee',
    initials: 'L',
    image: '/images/team/lee.jpg',
    linkedin: null,
  },
  {
    name: 'Sarah',
    initials: 'S',
    image: '/images/team/sarah.jpg',
    linkedin: 'https://www.linkedin.com/in/sarahrobarts1/',
  },
  {
    name: 'Dr. Samir',
    initials: 'DS',
    image: '/images/team/samir.jpg',
    linkedin: 'https://www.linkedin.com/in/drsamir/',
  },
]

const secondarySections = [
  {
    title: 'Blog',
    description: 'Insights on secure AI, data protection, and trusted AI systems',
  },
  {
    title: 'Careers',
    description: 'We\'re selectively building a team that cares deeply about security and trust',
  },
  {
    title: 'Contact',
    description: 'Partnerships, early access, and high-trust deployments',
  },
]

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

const beliefs = [
  'Security must be architectural, not bolted on',
  'AI should never train on customer data',
  'Sensitive work requires controlled environments, not public tools',
  'Trust is earned through design, not promises',
]

export default function CompanyPage() {
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
            className="text-center max-w-3xl mx-auto"
          >
            <motion.span
              variants={itemVariants}
              className="inline-block px-4 py-1.5 bg-background-alt text-xs font-heading font-semibold tracking-wider uppercase text-text/70 rounded-sm mb-6"
            >
              Company
            </motion.span>
            <motion.h1
              variants={itemVariants}
              className="text-5xl md:text-6xl font-heading font-bold mb-6 text-balance"
            >
              Built for Trust
            </motion.h1>
            <motion.p
              variants={itemVariants}
              className="text-lg text-text/70 leading-relaxed mb-6"
            >
              PROW is a secure AI workspace designed for organizations and professionals who need absolute confidence in data protection.
            </motion.p>
            <motion.p
              variants={itemVariants}
              className="text-lg text-text/70 leading-relaxed"
            >
              We are building AI infrastructure for high-stakes work — where security is the foundation, not a feature, and data exposure is not an option.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* What We Believe Section */}
      <section className="py-20 px-6 md:px-12 bg-background-alt overflow-hidden">
        <div className="max-w-[var(--container-max-width)] mx-auto">
          <div className="max-w-3xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-3xl md:text-4xl font-heading font-bold mb-8 text-center"
            >
              What We Believe
            </motion.h2>
            <ul className="space-y-4">
              {beliefs.map((belief, index) => (
                <motion.li
                  key={belief}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex items-start gap-4 text-lg text-text/80"
                >
                  <span className="text-accent mt-1">✓</span>
                  <span>{belief}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Story Section 1: Operators First */}
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
      <section className="py-20 px-6 md:px-12 bg-background-alt overflow-hidden">
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
      <section className="py-20 px-6 md:px-12 bg-background overflow-hidden">
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
                >UC Berkeley Haas</motion.span> and <motion.span
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

      {/* Leadership Section */}
      <section className="py-20 px-6 md:px-12 bg-background overflow-hidden">
        <div className="max-w-[var(--container-max-width)] mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl font-heading font-bold mb-12 text-center"
          >
            Leadership
          </motion.h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {leadershipTeam.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex flex-col items-center text-center"
              >
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden bg-background-alt mb-4 relative">
                  <TeamMemberImage
                    src={member.image}
                    alt={member.name}
                    initials={member.initials}
                  />
                </div>
                <h3 className="font-heading font-semibold text-sm md:text-base mb-2">{member.name}</h3>
                {member.linkedin && (
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${member.name}'s LinkedIn profile`}
                  >
                    <LinkedInIcon />
                  </a>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Secondary Sections */}
      <section className="py-20 px-6 md:px-12 bg-background-alt">
        <div className="max-w-[var(--container-max-width)] mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {secondarySections.map((section) => (
              <div
                key={section.title}
                className="bg-background p-8 rounded-sm border border-text/5 hover:border-text/10 transition-all"
              >
                <h3 className="text-xl font-heading font-semibold mb-3">{section.title}</h3>
                <p className="text-text/70 leading-relaxed">{section.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 px-6 md:px-12 bg-background">
        <div className="max-w-[var(--container-max-width)] mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
            Want to connect?
          </h2>
          <p className="text-lg text-text/70 mb-8">
            Send a note and we will get back to you with next steps.
          </p>
          <a
            href="mailto:info@prowco.ai"
            className="inline-flex items-center px-8 py-4 bg-text text-background font-medium rounded-sm hover:bg-accent transition-colors"
          >
            Contact Us
          </a>
        </div>
      </section>

      <Footer />
    </main>
  )
}
