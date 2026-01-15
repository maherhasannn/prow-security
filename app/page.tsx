import Navigation from '@/components/Navigation'
import Hero from '@/components/Hero'
import Features from '@/components/Features'
import SecurityLayer from '@/components/SecurityLayer'
import PrivacyDataProtection from '@/components/PrivacyDataProtection'
import ChatIntegration from '@/components/ChatIntegration'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navigation />
      <Hero />
      <PrivacyDataProtection />
      <Features />
      <SecurityLayer />
      <ChatIntegration />
      <Footer />
    </main>
  )
}








