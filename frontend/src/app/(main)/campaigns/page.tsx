'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore, useUIStore } from '@/store';
import { useEffect, useState } from 'react';
import { campaigns as dreamCampaigns, type CampaignInfo } from '@/data/dreamCampaigns';
import { formatCurrency } from '@/lib/currency';
import BackNavigation from '@/components/BackNavigation';
import { AdsBadge } from '@/components/AdsBadge';
import { campaignAPI } from '@/lib/api';
import { parseCampaignMeta } from '@/lib/campaignMeta';
import { CampaignImageCarousel } from '@/components/CampaignImageCarousel';

export default function CampaignsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { openSignupModal } = useUIStore();
  const currency = useUIStore((state) => state.currency);
  const [list, setList] = useState<CampaignInfo[]>(dreamCampaigns);

  const handleBuy = (id: string) => {
    if (!user) {
      openSignupModal(() => router.push(`/campaigns/${id}`));
      return;
    }
    router.push(`/campaigns/${id}`);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await campaignAPI.list({ status: 'active', limit: 50 });
        const rows = (res.data?.data || []) as Array<{
          id: string;
          title: string;
          description: string;
          location: string;
          credit_price: number;
          image_url?: string;
          image_urls?: string[];
        }>;
        if (!rows.length) return;
        const mapped: CampaignInfo[] = rows.map((r) => {
          const meta = parseCampaignMeta(r.description, r.image_urls || r.image_url);
          const imageUrl = meta.images[0] || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200';
          return {
            id: r.id,
            title: r.title,
            location: r.location || 'India',
            city: meta.land?.city || r.location || 'India',
            state: meta.land?.state || 'India',
            country: meta.land?.country || 'India',
            priceLabel: meta.land?.priceLabel || '—',
            contactPhone: meta.land?.contactPhone || '+91 90000 00000',
            whatsappNumber: meta.land?.whatsappNumber || '919000000000',
            mapUrl: meta.land?.mapUrl,
            imageUrl,
            images: meta.images,
            description: meta.text || r.description,
            creditPack: Number(r.credit_price || 0),
          };
        });
        setList(mapped);
      } catch {
        // ignore
      }
    };
    load();
  }, []);

  return (
    <div className="page-enter mx-auto max-w-7xl px-6 py-10">
      <BackNavigation />
      <h1 className="text-4xl font-black text-slate-900 mb-3">Premium Land Campaigns</h1>
      <p className="text-slate-600 mb-8">Select a campaign and purchase Asset Credits to join automatically.</p>

      <div className="grid gap-6 lg:grid-cols-3">
        {list.map((campaign) => (
          <article
            key={campaign.id}
            role="button"
            tabIndex={0}
            onClick={() => router.push(`/campaigns/${campaign.id}`)}
            onKeyDown={(e) => e.key === 'Enter' && router.push(`/campaigns/${campaign.id}`)}
            className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden hover:shadow-lg transition cursor-pointer"
          >
            <div className="relative">
              {campaign.images && campaign.images.length > 1 ? (
                <div className="h-44">
                  <CampaignImageCarousel images={campaign.images} title={campaign.title} />
                </div>
              ) : (
                <>
                  <img src={campaign.imageUrl} alt={campaign.title} className="h-44 w-full object-cover" />
                  <AdsBadge />
                </>
              )}
            </div>
            <div className="p-5">
              <h2 className="text-xl font-bold text-slate-900">{campaign.title}</h2>
              <p className="text-xs uppercase tracking-wide text-slate-500 mt-1">{campaign.location}</p>
              <p className="mt-3 text-sm text-slate-600">{campaign.description}</p>
              <p className="mt-4 text-sm text-slate-500">{formatCurrency(campaign.creditPack, currency)} Asset Credits pack</p>
              <button
                onClick={(e) => { e.stopPropagation(); handleBuy(campaign.id); }}
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
