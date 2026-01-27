import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | Prow®',
  description: 'Terms of Service for Prow® - The terms and conditions governing your use of our services.',
}

export default function TermsOfServicePage() {
  return (
    <div className="py-16 px-6 md:px-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">Terms of Service</h1>
        <p className="text-text/60 mb-12">Effective Date: August 1, 2025</p>

        <div className="prose prose-lg max-w-none prose-headings:font-heading prose-headings:font-semibold prose-p:text-text/80 prose-li:text-text/80">
          <section className="mb-12">
            <h2 className="text-2xl mb-4">1. Acceptance of Terms</h2>
            <p>
              Welcome to Prow®. These Terms of Service (&quot;Terms&quot;) govern your access to and use of the services, software, and websites (collectively, the &quot;Services&quot;) provided by Prow Co. (&quot;Prow,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;).
            </p>
            <p>
              By accessing or using our Services, you agree to be bound by these Terms. If you do not agree to these Terms, you may not access or use the Services.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl mb-4">2. Description of Services</h2>
            <p>
              Prow® provides a secure AI workspace platform designed for high-trust professional teams. Our Services include:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Secure document analysis and AI-powered insights</li>
              <li>Private, organization-isolated workspaces</li>
              <li>Data integration capabilities</li>
              <li>ProwPay™ payment processing services (where available)</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl mb-4">3. Account Registration</h2>
            <p>
              To access certain features of our Services, you must create an account. You agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain and promptly update your account information</li>
              <li>Keep your password secure and confidential</li>
              <li>Be responsible for all activities that occur under your account</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl mb-4">4. Acceptable Use</h2>
            <p>You agree not to use the Services to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Violate any applicable law, regulation, or third-party rights</li>
              <li>Upload or transmit viruses, malware, or other harmful code</li>
              <li>Attempt to gain unauthorized access to our systems or networks</li>
              <li>Interfere with or disrupt the integrity or performance of the Services</li>
              <li>Engage in any activity that could damage, disable, or impair the Services</li>
              <li>Use the Services for any illegal or unauthorized purpose</li>
              <li>Reverse engineer, decompile, or disassemble any aspect of the Services</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl mb-4">5. Your Content</h2>
            <p>
              You retain ownership of all content you upload, submit, or transmit through the Services (&quot;Your Content&quot;). By uploading Your Content, you grant us a limited license to process Your Content solely for the purpose of providing the Services to you.
            </p>
            <p className="mt-4 font-semibold">
              We do NOT use Your Content to train our AI models. Your data remains private and isolated within your organization&apos;s workspace.
            </p>
            <p className="mt-4">
              You are solely responsible for Your Content and represent that you have all necessary rights to upload and use it with our Services.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl mb-4">6. Intellectual Property</h2>
            <p>
              The Services and all associated intellectual property rights are and shall remain the exclusive property of Prow Co. and its licensors. These Terms do not grant you any rights to use our trademarks, logos, or brand features without prior written consent.
            </p>
            <p className="mt-4">
              Prow® and ProwPay™ are trademarks of Prow Co. All rights reserved.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl mb-4">7. Subscription and Payment</h2>
            <p>
              Certain features of our Services require a paid subscription. By subscribing, you agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Pay all applicable fees as described at the time of purchase</li>
              <li>Provide accurate billing information</li>
              <li>Authorize us to charge your payment method for recurring fees</li>
            </ul>
            <p className="mt-4">
              Subscription fees are non-refundable except as expressly stated in these Terms or required by law.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl mb-4">8. Disclaimers</h2>
            <p>
              THE SERVICES ARE PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
            <p className="mt-4">
              We do not warrant that the Services will be uninterrupted, secure, or error-free, or that any defects will be corrected.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl mb-4">9. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, PROW CO. SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
            </p>
            <p className="mt-4">
              OUR TOTAL LIABILITY FOR ALL CLAIMS ARISING FROM OR RELATING TO THESE TERMS OR THE SERVICES SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl mb-4">10. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless Prow Co. and its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses arising out of or in any way connected with:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your access to or use of the Services</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any third-party rights</li>
              <li>Your Content</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl mb-4">11. Termination</h2>
            <p>
              We may terminate or suspend your access to the Services immediately, without prior notice or liability, for any reason, including if you breach these Terms.
            </p>
            <p className="mt-4">
              Upon termination, your right to use the Services will cease immediately. You may request export of Your Content prior to termination.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl mb-4">12. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the State of California, United States, without regard to its conflict of law provisions.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl mb-4">13. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will provide notice of material changes by posting the updated Terms on our website and updating the &quot;Effective Date&quot; above.
            </p>
            <p className="mt-4">
              Your continued use of the Services after any changes indicates your acceptance of the updated Terms.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl mb-4">14. Contact Us</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <p className="mt-4">
              <strong>Email:</strong> <a href="mailto:info@prowco.ai" className="text-[#0066CC] hover:underline">info@prowco.ai</a><br />
              <strong>Address:</strong> Prow Co., Los Angeles, USA
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
