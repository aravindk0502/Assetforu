'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore, useUIStore } from '@/store';
import { useEffect, useState } from 'react';
import type { CampaignInfo } from '@/data/dreamCampaigns';
import { formatCurrency } from '@/lib/currency';
import BackNavigation from '@/components/BackNavigation';
import { AdsBadge } from '@/components/AdsBadge';
import { campaignAPI } from '@/lib/api';
import { parseCampaignMeta } from '@/lib/campaignMeta';
import { CampaignImageCarousel } from '@/components/CampaignImageCarousel';
import clsx from 'clsx';

type StatusFilter = 'active' | 'upcoming' | 'closed';

export default function CampaignsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { openSignupModal } = useUIStore();
  const currency = useUIStore((state) => state.currency);
  const [list, setList] = useState<CampaignInfo[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState<StatusFilter>('active');
  const [allRows, setAllRows] = useState<any[]>([]);

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
        const blobRes = await fetch('/api/public/campaigns?limit=200', { cache: 'no-store' });
        const blobJson = (await blobRes.json().catch(() => ({}))) as { success?: boolean; data?: unknown[] };
        const blobRows = (blobRes.ok && blobJson?.success && Array.isArray(blobJson.data)) ? blobJson.data : [];

        const apiRows = blobRows.length
          ? []
          : (((await campaignAPI.list({ limit: 200 })).data?.data || []) as unknown[]);

        const rows = (blobRows.length ? blobRows : apiRows) as any[];
        if (!rows.length) {
          setAllRows([]);
          setList([]);
          return;
        }
        setAllRows(rows);
      } catch {
        setAllRows([]);
        setList([]);
      } finally {
        setLoaded(true);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!allRows.length) return;
    const filtered = allRows.filter((r: any) => (r.status || 'active') === status);
    const mapped: CampaignInfo[] = filtered.map((r: any) => {
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
        isAd: meta.isAd ?? true,
        status: (r.status || 'active') as any,
      } as any;
    });
    setList(mapped);
  }, [allRows, status]);

  return (
    <div className="page-enter mx-auto max-w-7xl px-6 py-10">
      <BackNavigation />
      <h1 className="text-4xl font-black text-slate-900 mb-3">Premium Land Campaigns</h1>
      <p className="text-slate-600 mb-8">Select a campaign and purchase Asset Credits to join automatically.</p>

      <div className="mb-6 flex flex-wrap gap-2">
        {(['active', 'upcoming', 'closed'] as StatusFilter[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={clsx(
              'px-4 py-2 rounded-xl text-sm font-extrabold border transition-colors',
              status === s
                ? 'bg-primary-700 text-white border-primary-700'
                : 'bg-white text-slate-700 border-slate-200 hover:border-primary-300'
            )}
          >
            {s.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {!list.length && !loaded ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500 text-sm">
            Loading campaigns…
          </div>
        ) : loaded && !list.length ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600 text-sm lg:col-span-3">
            No campaigns available right now. Please check back later for upcoming campaigns.
          </div>
        ) : (
          list.map((campaign) => (
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
                  <CampaignImageCarousel images={campaign.images} title={campaign.title} showAds={(campaign as any).isAd ?? true} />
                </div>
              ) : (
                <>
                  <img src={campaign.imageUrl} alt={campaign.title} className="h-44 w-full object-cover" />
                  <AdsBadge show={(campaign as any).isAd ?? true} />
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
                disabled={status !== 'active'}
                className="mt-5 w-full rounded-xl bg-primary-700 text-white py-3 font-semibold hover:bg-primary-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {status === 'active'
                  ? `Buy ${formatCurrency(campaign.creditPack, currency)} Credits & Enter a free Land Gifting Campaign`
                  : status === 'upcoming'
                  ? 'Upcoming'
                  : 'Campaign Closed'}
              </button>
            </div>
          </article>
          ))
        )}
      </div>
    </div>
  );
}
