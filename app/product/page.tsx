import type { Metadata } from 'next'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'PROW® Product — Secure AI Workspace',
  description: 'PROW is a secure AI workspace for sensitive and proprietary data. Built on a medical-grade security foundation with private, organization-isolated AI workspaces.',
}

const capabilities = [
  {
    title: 'Secure AI Workspace',
    description: 'Bring data into a private AI workspace and reason across documents safely.',
  },
  {
    title: 'Secure Data Intelligence',
    description: 'Ask questions across documents and data sources inside governed AI sessions.',
  },
  {
    title: 'Decision-Ready Insights',
    description: 'Surface insights without exporting or exposing sensitive information.',
  },
  {
    title: 'Controlled Collaboration',
    description: 'Collaborate with auditability, access control, and trust built in.',
  },
]

const securityBaseline = [
  'No training on customer data — by design',
  'No cross-tenant learning',
  'Private, organization-isolated AI workspaces',
  'Role-based access control (RBAC)',
  'Full audit logging (uploads, access, AI usage)',
  'End-to-end encryption: AES-256 at rest, TLS 1.2+ in transit',
  'Policy-aware AI guardrails for sensitive data',
]

export default function ProductPage() {
  return (
    <main className="min-h-screen">
      <Navigation />
      <section className="pt-32 pb-20 px-6 md:px-12 bg-background">
        <div className="max-w-[var(--container-max-width)] mx-auto">
          <div className="max-w-3xl">
            <span className="inline-block px-4 py-1.5 bg-background-alt text-xs font-heading font-semibold tracking-wider uppercase text-text/70 rounded-sm mb-6">
              PROW® Platform
            </span>
            <h1 className="text-5xl md:text-6xl font-heading font-bold mb-6 text-balance">
              Secure AI for Sensitive Work
            </h1>
            <p className="text-lg text-text/70 leading-relaxed">
              PROW is a secure AI workspace that enables teams to think and talk with their data safely.
              Built on a medical-grade security foundation for organizations that cannot risk data exposure.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 md:px-12 bg-background-alt">
        <div className="max-w-[var(--container-max-width)] mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {capabilities.map((capability) => (
              <div
                key={capability.title}
                className="bg-background p-8 rounded-sm border border-text/5 hover:border-text/10 transition-all"
              >
                <h3 className="text-2xl font-heading font-semibold mb-3">{capability.title}</h3>
                <p className="text-text/70 leading-relaxed">{capability.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 md:px-12 bg-background">
        <div className="max-w-[var(--container-max-width)] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4 text-balance">
              Two Secure AI Modes. One PROW® Platform.
            </h2>
            <p className="text-lg text-text/70 leading-relaxed max-w-2xl mx-auto">
              Choose the level of protection your work requires — without changing tools.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-background-alt p-8 rounded-sm border border-text/10">
              <h3 className="text-2xl font-heading font-semibold mb-2">Prow Secure™</h3>
              <p className="text-accent text-sm font-medium mb-6">Best-in-class AI with enterprise controls</p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-3">
                  <span className="text-accent mt-1">✓</span>
                  <span className="text-text/80">Best-in-class AI models</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-accent mt-1">✓</span>
                  <span className="text-text/80">No training on customer data — enforced by design</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-accent mt-1">✓</span>
                  <span className="text-text/80">Guardrails, auditability, and governed collaboration</span>
                </li>
              </ul>
              <p className="text-sm text-text/60 italic">
                Best for teams that want powerful AI with strong, policy-driven protections.
              </p>
            </div>
            <div className="bg-background-alt p-8 rounded-sm border border-text/10">
              <h3 className="text-2xl font-heading font-semibold mb-2">Prow Core™</h3>
              <p className="text-accent text-sm font-medium mb-6">Fully private AI. Absolute isolation.</p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-3">
                  <span className="text-accent mt-1">✓</span>
                  <span className="text-text/80">Private AI environment</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-accent mt-1">✓</span>
                  <span className="text-text/80">Nothing leaves the platform</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-accent mt-1">✓</span>
                  <span className="text-text/80">Isolation by design</span>
                </li>
              </ul>
              <p className="text-sm text-text/60 italic">
                Best for zero-tolerance, high-sensitivity work.
              </p>
            </div>
          </div>
          <div className="text-center mt-12">
            <h3 className="text-2xl font-heading font-semibold mb-2">Same Platform. Different Security Postures.</h3>
            <p className="text-text/70">You decide how protected your AI needs to be.</p>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 md:px-12 bg-background-alt">
        <div className="max-w-[var(--container-max-width)] mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <span className="inline-block px-4 py-1.5 bg-background-alt text-xs font-heading font-semibold tracking-wider uppercase text-text/70 rounded-sm mb-6">
                Data Inputs
              </span>
              <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6 text-balance">
                Start with the Data You Already Have
              </h2>
              <p className="text-lg text-text/70 leading-relaxed mb-6">
                Phase 1 supports Excel/CSV, PDFs, and QuickBooks for read-only, analysis-focused workflows.
                Additional integrations arrive in Phase 2+.
              </p>
              <div className="flex flex-wrap gap-3">
                {['Excel / CSV', 'PDF Documents', 'QuickBooks (read-only)'].map((item) => (
                  <span
                    key={item}
                    className="px-4 py-2 bg-background-alt border border-text/10 rounded-sm text-sm text-text/70"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <span className="inline-block px-4 py-1.5 bg-background-alt text-xs font-heading font-semibold tracking-wider uppercase text-text/70 rounded-sm mb-6">
                Security Baseline
              </span>
              <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6 text-balance">
                Security Is the Foundation
              </h2>
              <ul className="space-y-3">
                {securityBaseline.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="text-accent mt-1">✓</span>
                    <span className="text-text/80">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 md:px-12 bg-background-alt">
        <div className="max-w-[var(--container-max-width)] mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
            Ready for a secure AI workspace?
          </h2>
          <p className="text-lg text-text/70 mb-8">
            Join the beta and start working with your data inside a private AI environment.
          </p>
          <a
            href="/#waitlist"
            className="inline-flex items-center px-8 py-4 bg-text text-background font-medium rounded-sm hover:bg-accent transition-colors"
          >
            Join the Beta
          </a>
        </div>
      </section>
      <Footer />
    </main>
  )
}



