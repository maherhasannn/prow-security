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
              Secure AI workspace for high-trust professional teams. Built on a medical-grade security foundation for organizations that cannot risk data exposure.
            </p>
          </div>

          <div>
            <h4 className="font-heading text-sm font-semibold uppercase tracking-wider mb-4 text-text/70">
              Product
            </h4>
            <ul className="space-y-2">
              {[
                { label: 'Product', href: '/product' },
                { label: 'Security', href: '/#security-layer' },
                { label: 'Data Inputs', href: '/#data-inputs' },
                { label: 'Pricing', href: '/pricing' },
              ].map((item) => (
                <li key={item.label}>
                  <a href={item.href} className="text-sm text-text/60 hover:text-text transition-colors">
                    {item.label}
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
              {[
                { label: 'About', href: '/company' },
                { label: 'Blog', href: '/company' },
                { label: 'Careers', href: '/company' },
                { label: 'Contact', href: '/company' },
              ].map((item) => (
                <li key={item.label}>
                  <a href={item.href} className="text-sm text-text/60 hover:text-text transition-colors">
                    {item.label}
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
              {['Privacy', 'Terms', 'Security'].map((item) => (
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









