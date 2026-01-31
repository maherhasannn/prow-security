'use client'

import Link from 'next/link'
import { Linkedin, Instagram } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="py-16 px-6 md:px-12 bg-[#3A6A7B] text-white">
      <div className="max-w-[var(--container-max-width)] mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div>
            <h3 className="font-heading text-2xl font-bold mb-4">
              Prow<sup className="text-xs">®</sup>
            </h3>
            <p className="text-sm text-white/70 leading-relaxed">
              Secure AI workspace for high-trust professional teams. Built on a medical-grade security foundation for organizations that cannot risk data exposure.
            </p>
          </div>

          <div>
            <h4 className="font-heading text-sm font-semibold uppercase tracking-wider mb-4 text-white/80">
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
                  <Link href={item.href} className="text-sm text-white/60 hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading text-sm font-semibold uppercase tracking-wider mb-4 text-white/80">
              Company
            </h4>
            <ul className="space-y-2">
              {[
                
                { label: 'Blog', href: '/company' },
                { label: 'Careers', href: '/company' },
                { label: 'Contact', href: '/company' },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-sm text-white/60 hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading text-sm font-semibold uppercase tracking-wider mb-4 text-white/80">
              Legal
            </h4>
            <ul className="space-y-2">
              {[
                { label: 'Privacy Policy', href: '/legal/privacy' },
                { label: 'Terms of Service', href: '/legal/terms' },
                { label: 'Legal Disclaimer', href: '/legal/disclaimer' },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-sm text-white/60 hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <p className="text-sm text-white/60">
              © {new Date().getFullYear()} Prow<sup>®</sup>, Los Angeles, USA. All rights reserved.
            </p>
            <p className="text-xs text-white/40 mt-1">
              Prow<sup>®</sup>, ProwPay™, and Green Stable Coin<sup>®</sup> are trademarks of Prow Co.
            </p>
          </div>
          <div className="flex gap-4">
            <a
              href="https://www.linkedin.com/company/gorilla-tech-ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-sm transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-5 h-5" />
            </a>
            <a
              href="https://www.instagram.com/theprowco/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-sm transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
