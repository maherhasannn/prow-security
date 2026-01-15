import type { Metadata } from 'next'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'PROW® Platform — Secure AI Workspace',
  description: 'PROW is a secure AI workspace built on a medical-grade security foundation for high-trust professional teams.',
}

export default function ProPage() {
  return (
    <main className="min-h-screen">
      <Navigation />
      <section className="pt-32 pb-20 px-6 md:px-12 bg-background">
        <div className="max-w-[var(--container-max-width)] mx-auto text-center">
          <span className="inline-block px-4 py-1.5 bg-background-alt text-xs font-heading font-semibold tracking-wider uppercase text-text/70 rounded-sm mb-6">
            PROW® Platform
          </span>
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6 text-balance">
            PROW is now a single core platform
          </h1>
          <p className="text-lg text-text/70 mb-8 max-w-2xl mx-auto">
            We have consolidated PROW into one secure AI workspace built for high-trust professional teams.
          </p>
          <a
            href="/product"
            className="inline-flex items-center px-8 py-4 bg-text text-background font-medium rounded-sm hover:bg-accent transition-colors"
          >
            View the Product
          </a>
        </div>
      </section>
      <Footer />
    </main>
  )
}
