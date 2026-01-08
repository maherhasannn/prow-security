'use client'

import { motion } from 'framer-motion'

export default function Footer() {
  return (
    <footer className="py-20 px-6 md:px-12 bg-background-alt border-t border-text/10">
      <div className="max-w-[var(--container-max-width)] mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div>
            <h3 className="font-heading text-xl font-bold mb-4">PROW</h3>
            <p className="text-sm text-text/60 leading-relaxed">
              HIPAA-compliant AI for healthcare teams. Secure, intelligent, and built for clinical workflows.
            </p>
          </div>

          <div>
            <h4 className="font-heading text-sm font-semibold uppercase tracking-wider mb-4 text-text/70">
              Product
            </h4>
            <ul className="space-y-2">
              {['Features', 'Security', 'Integrations', 'Pricing'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-text/60 hover:text-text transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading text-sm font-semibold uppercase tracking-wider mb-4 text-text/70">
              Company
            </h4>
            <ul className="space-y-2">
              {['About', 'Blog', 'Careers', 'Contact'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-text/60 hover:text-text transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading text-sm font-semibold uppercase tracking-wider mb-4 text-text/70">
              Legal
            </h4>
            <ul className="space-y-2">
              {['Privacy', 'Terms', 'Security', 'Compliance'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-text/60 hover:text-text transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-text/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-text/50">
            © {new Date().getFullYear()} Prow. All rights reserved.
          </p>
          <div className="flex gap-6">
            {['Twitter', 'LinkedIn', 'GitHub'].map((social) => (
              <a
                key={social}
                href="#"
                className="text-sm text-text/50 hover:text-text transition-colors"
              >
                {social}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}









