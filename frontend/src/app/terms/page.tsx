'use client';

export const dynamic = 'force-dynamic';

import BackNavigation from '@/components/BackNavigation';

export default function TermsPage() {
  return (
    <div className="page-enter mx-auto max-w-4xl px-6 py-12">      <BackNavigation />      <h1 className="text-3xl font-black text-slate-900">Terms &amp; Conditions – AssetForU</h1>
      <p className="text-sm text-slate-500 mt-2">Effective Date: [Add Date]</p>

      <div className="mt-8 space-y-6 text-sm text-slate-700 leading-relaxed">
        <p>Welcome to AssetForU. By accessing or using this platform, you agree to the following terms:</p>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">1. Platform Overview</h2>
          <p>AssetForU is a digital platform where users purchase Asset Credits to access products and services available within the platform.</p>
          <p>The platform may provide access to promotional campaigns as a complimentary feature. These campaigns are not the primary purpose of purchase.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">2. Asset Credits</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Asset Credits are prepaid digital value.</li>
            <li>Credits can be used only within the platform.</li>
            <li>Credits are non-transferable and non-withdrawable.</li>
            <li>Credits once used cannot be reversed.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">3. Purchases</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Users purchase Asset Credits for platform usage only.</li>
            <li>No guaranteed outcome is associated with any campaign.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">4. Campaign Access</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Campaign access is provided as a complimentary benefit.</li>
            <li>Participation is subject to platform rules.</li>
            <li>Each campaign may have user limits.</li>
            <li>No guaranteed allocation or outcome.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">5. Knowledge Step (Quiz)</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Users may be required to complete a simple quiz.</li>
            <li>This is part of platform engagement.</li>
            <li>Correct completion is required to proceed.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">6. User Responsibilities</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Provide accurate details.</li>
            <li>Maintain account security.</li>
            <li>Avoid misuse.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">7. Payments</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Payments are processed via third-party gateways.</li>
            <li>Credits are added only after successful payment.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">8. Refund Policy</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Credits are generally non-refundable.</li>
            <li>Exceptions at platform discretion.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">9. Platform Rights</h2>
          <p>AssetForU may:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Modify services.</li>
            <li>Update campaigns.</li>
            <li>Change terms.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">10. Limitation of Liability</h2>
          <p>AssetForU does not guarantee outcomes from any campaign.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">11. Governing Law</h2>
          <p>Laws of India apply. Jurisdiction: [Your City]</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">12. Acceptance</h2>
          <p>By using the platform, you agree to these terms.</p>
        </section>
      </div>
    </div>
  );
}
