import type { Metadata } from 'next'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'PROW® Company — About, Blog, Careers, Contact',
  description: 'Learn about PROW, read the blog, explore careers, or get in touch.',
}

const companySections = [
  {
    title: 'About',
    description:
      'PROW is building a secure AI workspace for organizations that cannot risk data exposure. Security is the foundation, not a feature.',
  },
  {
    title: 'Blog',
    description:
      'Insights on secure AI, data protection, and building trusted AI systems for high-stakes professional work.',
  },
  {
    title: 'Careers',
    description:
      'We are looking for engineers, designers, and product builders who care about security and trust.',
  },
  {
    title: 'Contact',
    description:
      'Reach out to discuss partnerships, early access, or high-trust deployments.',
  },
]

export default function CompanyPage() {
  return (
    <main className="min-h-screen">
      <Navigation />
      <section className="pt-32 pb-20 px-6 md:px-12 bg-background">
        <div className="max-w-[var(--container-max-width)] mx-auto text-center">
          <span className="inline-block px-4 py-1.5 bg-background-alt text-xs font-heading font-semibold tracking-wider uppercase text-text/70 rounded-sm mb-6">
            Company
          </span>
          <h1 className="text-5xl md:text-6xl font-heading font-bold mb-6 text-balance">
            Built for Trust
          </h1>
          <p className="text-lg text-text/70 max-w-2xl mx-auto">
            PROW is a secure AI workspace designed for organizations and professionals who need absolute confidence in data protection.
          </p>
        </div>
      </section>

      <section className="py-20 px-6 md:px-12 bg-background-alt">
        <div className="max-w-[var(--container-max-width)] mx-auto grid md:grid-cols-2 gap-8">
          {companySections.map((section) => (
            <div
              key={section.title}
              className="bg-background p-8 rounded-sm border border-text/5 hover:border-text/10 transition-all"
            >
              <h2 className="text-2xl font-heading font-semibold mb-3">{section.title}</h2>
              <p className="text-text/70 leading-relaxed">{section.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 px-6 md:px-12 bg-background">
        <div className="max-w-[var(--container-max-width)] mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
            Want to connect?
          </h2>
          <p className="text-lg text-text/70 mb-8">
            Send a note and we will get back to you with next steps.
          </p>
          <a
            href="mailto:hello@prow.ai"
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

