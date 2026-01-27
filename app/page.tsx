import Navigation from '@/components/Navigation'
import Hero from '@/components/Hero'
import SecurityLayer from '@/components/SecurityLayer'
import PrivacyDataProtection from '@/components/PrivacyDataProtection'
import ChatIntegration from '@/components/ChatIntegration'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      <Hero />
      <PrivacyDataProtection />
      <SecurityLayer />
      <ChatIntegration />
      <Footer />
    </main>
  )
}








