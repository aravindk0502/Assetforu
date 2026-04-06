'use client';

import BackNavigation from '@/components/BackNavigation';


export default function PrivacyPage() {
  return (
    <div className="page-enter mx-auto max-w-4xl px-6 py-12">
      <BackNavigation />
      <h1 className="text-3xl font-black text-slate-900">Privacy Policy – AssetForU</h1>
      <p className="text-sm text-slate-500 mt-2">Effective Date: [Add Date]</p>

      <div className="mt-8 space-y-6 text-sm text-slate-700 leading-relaxed">
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">1. Information We Collect</h2>
          <p>We may collect:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Phone number</li>
            <li>Account details</li>
            <li>Transaction data</li>
            <li>Usage activity</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">2. How We Use Information</h2>
          <p>We use your data to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Provide platform services</li>
            <li>Process payments</li>
            <li>Improve user experience</li>
            <li>Communicate updates</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">3. Data Protection</h2>
          <p>We implement reasonable security measures to protect your data.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">4. Sharing of Information</h2>
          <p>We do NOT sell user data.</p>
          <p>We may share data with:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Payment providers</li>
            <li>Legal authorities (if required)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">5. Cookies</h2>
          <p>We may use cookies to enhance user experience.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">6. User Rights</h2>
          <p>You may:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Request account deletion</li>
            <li>Update your information</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">7. Third-Party Services</h2>
          <p>Payments and OTP may be handled by third-party providers.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">8. Updates</h2>
          <p>Policy may be updated periodically.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">9. Contact</h2>
          <p>For queries: [your email]</p>
        </section>
      </div>
    </div>
  );
}
