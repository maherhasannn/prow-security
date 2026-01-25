import type { Metadata } from 'next'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'PROW® Pricing — Simple, Transparent SaaS',
  description: 'Simple, transparent per-seat pricing with usage-based expansion. No vertical-specific pricing at launch.',
}

const pricingNotes = [
  'Per-seat pricing for teams and organizations',
  'Usage-based expansion as your workloads scale',
  'No vertical-specific pricing at launch',
  'Security baseline included in every plan',
]

export default function PricingPage() {
  return (
    <main className="min-h-screen">
      <Navigation />
      <section className="pt-32 pb-20 px-6 md:px-12 bg-background">
        <div className="max-w-[var(--container-max-width)] mx-auto text-center">
          <span className="inline-block px-4 py-1.5 bg-background-alt text-xs font-heading font-semibold tracking-wider uppercase text-text/70 rounded-sm mb-6">
            Pricing
          </span>
          <h1 className="text-5xl md:text-6xl font-heading font-bold mb-6 text-balance">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-text/70 max-w-2xl mx-auto">
            PROW is a single core platform at launch — designed for high-trust professional teams.
            Pricing is clear, scalable, and aligned to how your team uses the platform.
          </p>
        </div>
      </section>

      <section className="py-20 px-6 md:px-12 bg-background-alt">
        <div className="max-w-[var(--container-max-width)] mx-auto grid lg:grid-cols-2 gap-12 items-start">
          <div className="bg-background p-10 rounded-sm border border-text/10">
            <div className="text-sm font-heading font-semibold uppercase tracking-wider text-text/60 mb-3">
              Core Platform
            </div>
            <div className="text-4xl font-heading font-bold mb-4">Per-seat pricing</div>
            <p className="text-text/70 mb-8">
              Start with the team seats you need today and expand based on usage.
              All seats include the medical-grade security foundation and core data inputs.
            </p>
            <a
              href="/#waitlist"
              className="inline-flex items-center px-6 py-3 bg-text text-background font-medium rounded-sm hover:bg-accent transition-colors"
            >
              Join the Beta
            </a>
          </div>
          <div className="space-y-4">
            {pricingNotes.map((note) => (
              <div
                key={note}
                className="flex items-start gap-3 p-5 bg-background border border-text/5 rounded-sm"
              >
                <span className="text-accent mt-1">✓</span>
                <span className="text-text/80">{note}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 md:px-12 bg-background">
        <div className="max-w-[var(--container-max-width)] mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
            Interested in early access?
          </h2>
          <p className="text-lg text-text/70 mb-8">
            Join the beta to get pricing details and onboarding updates as we expand access.
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



