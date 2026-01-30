import type { Metadata } from 'next'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'PROW® Pricing — Simple, Transparent SaaS',
  description: 'Simple, transparent per-seat pricing with usage-based expansion. No vertical-specific pricing at launch.',
}

const whatsIncluded = [
  'Per-seat pricing for teams and organizations',
  'Access to Prow Secure™ and Prow Core™ configurations (as available during beta)',
  'Usage-based expansion as workloads scale',
  'No vertical-specific pricing at launch',
  'Security baseline included in every plan',
]

export default function PricingPage() {
  return (
    <main className="min-h-screen">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 md:px-12 bg-background">
        <div className="max-w-[var(--container-max-width)] mx-auto text-center">
          <span className="inline-block px-4 py-1.5 bg-background-alt text-xs font-heading font-semibold tracking-wider uppercase text-text/70 rounded-sm mb-6">
            Pricing
          </span>
          <h1 className="text-5xl md:text-6xl font-heading font-bold mb-6 text-balance">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-text/70 max-w-3xl mx-auto leading-relaxed">
            PROW is a single secure AI platform — built for high-trust professional teams.
            Pricing is straightforward, scalable, and aligned with how teams actually use the platform.
          </p>
        </div>
      </section>

      {/* Platform Access Section */}
      <section className="py-20 px-6 md:px-12 bg-background-alt">
        <div className="max-w-[var(--container-max-width)] mx-auto">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-12 text-center">
            PROW® Platform Access
          </h2>
          <div className="max-w-2xl mx-auto">
            <div className="bg-background p-10 rounded-sm border border-text/10 text-center">
              <div className="text-4xl md:text-5xl font-heading font-bold mb-4">Per-seat pricing</div>
              <p className="text-text/70 leading-relaxed">
                Start with the seats you need today and expand as your usage grows.
                Every seat includes PROW's medical-grade security foundation and access to supported data inputs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What's Included Section */}
      <section className="py-20 px-6 md:px-12 bg-background">
        <div className="max-w-[var(--container-max-width)] mx-auto">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-12 text-center">
            What's Included
          </h2>
          <div className="max-w-2xl mx-auto space-y-4">
            {whatsIncluded.map((item) => (
              <div
                key={item}
                className="flex items-start gap-4 p-5 bg-background-alt border border-text/5 rounded-sm"
              >
                <span className="text-accent mt-0.5">✓</span>
                <span className="text-text/80">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Early Access Section */}
      <section className="py-20 px-6 md:px-12 bg-background-alt">
        <div className="max-w-[var(--container-max-width)] mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
            Early Access
          </h2>
          <p className="text-lg text-text/70 mb-4">
            PROW is currently onboarding teams through a limited beta.
          </p>
          <p className="text-lg text-text/70 mb-8 max-w-2xl mx-auto">
            Join the beta to receive pricing details, onboarding access, and platform updates as availability expands.
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
