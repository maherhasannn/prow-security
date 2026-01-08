import type { Metadata } from 'next'
import { Space_Grotesk, IBM_Plex_Sans } from 'next/font/google'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-heading',
  weight: ['400', '500', '600', '700'],
})

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600'],
})

export const metadata: Metadata = {
  title: 'Prow — HIPAA-Compliant AI for Healthcare',
  description: 'Secure AI for healthcare teams. HIPAA-compliant, clinically intelligent, and designed for medical workflows.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${ibmPlexSans.variable}`}>
      <body>{children}</body>
    </html>
  )
}









