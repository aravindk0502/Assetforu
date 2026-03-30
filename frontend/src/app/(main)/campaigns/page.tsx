'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore, useUIStore } from '@/store';
import { campaigns } from '@/data/dreamCampaigns';
import { formatCurrency } from '@/lib/currency';
import BackNavigation from '@/components/BackNavigation';

export default function CampaignsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { openSignupModal } = useUIStore();
  const currency = useUIStore((state) => state.currency);

  const handleBuy = (id: string) => {
    if (!user) {
      openSignupModal(() => router.push(`/campaigns/${id}`));
      return;
    }
    router.push(`/campaigns/${id}`);
  };

  return (
    <div className="page-enter mx-auto max-w-7xl px-6 py-10">
      <BackNavigation />
      <h1 className="text-4xl font-black text-slate-900 mb-3">Premium Land Campaigns</h1>
      <p className="text-slate-600 mb-8">Select a campaign and purchase Asset Credits to join automatically.</p>

      <div className="grid gap-6 lg:grid-cols-3">
        {campaigns.map((campaign) => (
          <article key={campaign.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden hover:shadow-lg transition">
            <img src={campaign.imageUrl} alt={campaign.title} className="h-44 w-full object-cover" />
            <div className="p-5">
              <h2 className="text-xl font-bold text-slate-900">{campaign.title}</h2>
              <p className="text-xs uppercase tracking-wide text-slate-500 mt-1">{campaign.location}</p>
              <p className="mt-3 text-sm text-slate-600">{campaign.description}</p>
              <p className="mt-4 text-sm text-slate-500">{formatCurrency(campaign.creditPack, currency)} Asset Credits pack</p>
              <button
                onClick={() => handleBuy(campaign.id)}
                className="mt-5 w-full rounded-xl bg-primary-700 text-white py-3 font-semibold hover:bg-primary-800 transition"
              >
                Buy {formatCurrency(campaign.creditPack, currency)} Credits & Enter a free Land Gifting Campaign
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
