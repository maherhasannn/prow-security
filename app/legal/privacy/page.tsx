import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Prow®',
  description: 'Privacy Policy for Prow® - Learn how we collect, use, and protect your personal information.',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="py-16 px-6 md:px-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">Privacy Policy</h1>
        <p className="text-text/60 mb-12">Effective Date: August 1, 2025</p>

        <div className="prose prose-lg max-w-none prose-headings:font-heading prose-headings:font-semibold prose-p:text-text/80 prose-li:text-text/80">
          <section className="mb-12">
            <h2 className="text-2xl mb-4">1. Introduction</h2>
            <p>
              Prow Co. (&quot;Prow,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website prowco.ai, use our products and services including Prow® and ProwPay™, or interact with us through email, social media, or other communications.
            </p>
            <p>
              Please read this Privacy Policy carefully. By using our Services, you agree to the collection and use of information in accordance with this policy.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl mb-4">2. Scope</h2>
            <p>
              This Privacy Policy applies to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Our website at prowco.ai and all associated subdomains</li>
              <li>Our products and services, including Prow® and ProwPay™</li>
              <li>Email and other electronic communications with us</li>
              <li>Social media interactions</li>
            </ul>
            <p className="mt-4">
              This policy does <strong>not</strong> apply to third-party websites, products, or services linked from our Services, even if they feature our name or branding.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl mb-4">3. Information We Collect</h2>

            <h3 className="text-xl mt-6 mb-3">Information You Provide</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account Information:</strong> Name, email address, password, and contact details when you create an account</li>
              <li><strong>Payment Information:</strong> Credit card details, billing address, and transaction history processed through secure third-party payment processors</li>
              <li><strong>Uploaded Content:</strong> Documents, files, and data you upload to our platform for analysis</li>
              <li><strong>Communications:</strong> Information you provide when contacting customer support or participating in surveys</li>
            </ul>

            <h3 className="text-xl mt-6 mb-3">Information Collected Automatically</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Device Information:</strong> IP address, browser type, operating system, and device identifiers</li>
              <li><strong>Usage Data:</strong> Pages visited, features used, time spent on pages, and navigation patterns</li>
              <li><strong>Log Data:</strong> Server logs including access times, error logs, and referring URLs</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl mb-4">4. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide, maintain, and improve our Services</li>
              <li>Process transactions and send related information</li>
              <li>Send administrative communications about your account or our Services</li>
              <li>Respond to your comments, questions, and customer service requests</li>
              <li>Monitor and analyze trends, usage, and activities</li>
              <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities</li>
              <li>Personalize your experience and deliver content relevant to your interests</li>
              <li>Send marketing communications (with your consent where required)</li>
            </ul>
            <p className="mt-4 font-semibold">
              Important: We do NOT use customer data to train our AI models. Your uploaded content remains private and isolated within your organization&apos;s workspace.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl mb-4">5. Cookies and Tracking Technologies</h2>
            <p>We use cookies and similar tracking technologies to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Essential Cookies:</strong> Required for the operation of our Services</li>
              <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with our Services</li>
              <li><strong>Marketing Cookies:</strong> Used to deliver relevant advertisements (with consent)</li>
            </ul>
            <p className="mt-4">
              You can control cookie preferences through your browser settings or our cookie consent tool.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl mb-4">6. Information Sharing and Disclosure</h2>
            <p>We may share your information with:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Service Providers:</strong> Third parties who perform services on our behalf (hosting, payment processing, analytics)</li>
              <li><strong>Business Partners:</strong> With your consent, for joint offerings or promotions</li>
              <li><strong>Legal Requirements:</strong> When required by law, regulation, legal process, or governmental request</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            </ul>
            <p className="mt-4 font-semibold">
              We do NOT sell your personal information to third parties.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl mb-4">7. Data Retention and Security</h2>
            <p>
              We retain your information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law.
            </p>
            <p className="mt-4">
              We implement appropriate technical and organizational security measures, including:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>AES-256 encryption for data at rest</li>
              <li>TLS 1.2+ encryption for data in transit</li>
              <li>Role-based access controls</li>
              <li>Regular security audits and assessments</li>
            </ul>
            <p className="mt-4">
              While we strive to protect your information, no method of transmission over the Internet or electronic storage is completely secure.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl mb-4">8. Your Rights and Choices</h2>
            <p>Depending on your location, you may have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your personal information</li>
              <li>Object to or restrict certain processing activities</li>
              <li>Data portability (receive your data in a structured format)</li>
              <li>Withdraw consent where processing is based on consent</li>
            </ul>
            <p className="mt-4">
              To exercise these rights, please contact us at <a href="mailto:info@prowco.ai" className="text-[#3A6A7B] hover:underline">info@prowco.ai</a>.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl mb-4">9. Children&apos;s Privacy</h2>
            <p>
              Our Services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl mb-4">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the &quot;Effective Date&quot; above. Your continued use of our Services after any changes indicates your acceptance of the updated policy.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl mb-4">11. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy or our privacy practices, please contact our Privacy Officer:
            </p>
            <p className="mt-4">
              <strong>Email:</strong> <a href="mailto:info@prowco.ai" className="text-[#3A6A7B] hover:underline">info@prowco.ai</a><br />
              <strong>Address:</strong> Prow Co., Los Angeles, USA
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
