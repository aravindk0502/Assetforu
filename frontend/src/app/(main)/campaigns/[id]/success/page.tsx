'use client';

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { useUIStore } from '@/store';
import { type CampaignInfo } from '@/data/dreamCampaigns';
import { formatCurrency } from '@/lib/currency';
import BackNavigation from '@/components/BackNavigation';
import { campaignAPI } from '@/lib/api';
import { parseCampaignMeta } from '@/lib/campaignMeta';
import { parseCampaignImages } from '@/lib/campaignImages';

function CampaignSuccessContent() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const { walletBalance, currency } = useUIStore();

    const campaignId = (params?.id as string) || '';
    const [campaign, setCampaign] = useState<CampaignInfo | null>(null);
    const qty = Number(searchParams.get('qty') || '1');
    const currentQty = Number.isNaN(qty) || qty < 1 ? 1 : Math.min(10, qty);
    const ticketsRaw = searchParams.get('tickets') || '';
    const tickets = ticketsRaw
        .split(',')
        .map((t) => Number(t))
        .filter((t) => !Number.isNaN(t) && t > 0);

    useEffect(() => {
        if (!campaignId) return;
        // Avoid static/dummy campaign flashes.
        let cancelled = false;
        const load = async () => {
            try {
                const res = await fetch(`/api/public/campaigns/${campaignId}`, { cache: 'no-store' });
                const json = (await res.json().catch(() => ({}))) as any;
                const row = (res.ok && json?.success && json?.data) ? json.data : null;
                if (!row) throw new Error('not-found');
                const meta = parseCampaignMeta(row.description, row.image_urls || row.image_url);
                const images = meta.images.length ? meta.images : parseCampaignImages(row.image_urls || row.image_url);
                const imageUrl = images[0] || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200';
                const mapped: CampaignInfo = {
                    id: row.id,
                    title: row.title,
                    location: row.location || 'India',
                    city: meta.land?.city || row.location || 'India',
                    state: meta.land?.state || 'India',
                    country: meta.land?.country || 'India',
                    priceLabel: meta.land?.priceLabel || '—',
                    contactPhone: meta.land?.contactPhone || '+91 90000 00000',
                    whatsappNumber: meta.land?.whatsappNumber || '919000000000',
                    mapUrl: meta.land?.mapUrl,
                    imageUrl,
                    images,
                    description: meta.text || row.description,
                    creditPack: Number(row.credit_price || 0),
                };
                if (cancelled) return;
                setCampaign(mapped);
            } catch {
                try {
                    const res = await campaignAPI.get(campaignId);
                    const row = res?.data?.data;
                    if (!row) return;
                    const meta = parseCampaignMeta(row.description, row.image_urls || row.image_url);
                    const images = meta.images.length ? meta.images : parseCampaignImages(row.image_urls || row.image_url);
                    const imageUrl = images[0] || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200';
                    const mapped: CampaignInfo = {
                        id: row.id,
                        title: row.title,
                        location: row.location || 'India',
                        city: meta.land?.city || row.location || 'India',
                        state: meta.land?.state || 'India',
                        country: meta.land?.country || 'India',
                        priceLabel: meta.land?.priceLabel || '—',
                        contactPhone: meta.land?.contactPhone || '+91 90000 00000',
                        whatsappNumber: meta.land?.whatsappNumber || '919000000000',
                        mapUrl: meta.land?.mapUrl,
                        imageUrl,
                        images,
                        description: meta.text || row.description,
                        creditPack: Number(row.credit_price || 0),
                    };
                    if (cancelled) return;
                    setCampaign(mapped);
                } catch {
                    // ignore
                }
            }
        };
        void load();
        return () => { cancelled = true; };
    }, [campaignId]);

    if (!campaign) {
        return <div className="mx-auto max-w-4xl px-6 py-16 text-center">Campaign not found.</div>;
    }

    const totalCredits = campaign.creditPack * currentQty;

    return (
        <div className="page-enter mx-auto max-w-4xl px-6 py-14">
            <BackNavigation />
            <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
                <h1 className="text-3xl font-black text-green-800">Asset Credits Added Successfully</h1>
                <p className="mt-3 text-slate-700">You now have {formatCurrency(walletBalance, currency)} Asset Credits</p>
                <p className="mt-2 text-sm text-slate-600">You have purchased {formatCurrency(totalCredits, currency)} credits. You can now purchase products and services from the Asset Store.</p>
                <p className="mt-2 text-sm text-slate-600">
                    As a complimentary benefit, you are entering the land gifting campaign: <strong>{campaign.title}</strong>.
                </p>

                <div className="mt-6">
                    <p className="text-sm text-slate-500">Purchased: {currentQty} × {formatCurrency(campaign.creditPack, currency)} credits = {formatCurrency(totalCredits, currency)}</p>
                </div>

                {tickets.length > 0 && (
                    <div className="mt-5">
                        <p className="text-xs uppercase tracking-wide text-slate-500">Ticket Numbers</p>
                        <div className="mt-2 flex flex-wrap justify-center gap-2">
                            {tickets.map((ticket) => (
                                <span key={ticket} className="rounded-full bg-white border border-green-200 px-3 py-1 text-xs font-bold text-green-700">
                                    #{ticket}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                <button
                    onClick={() => router.push('/wallet')}
                    className="mt-6 rounded-xl bg-primary-700 text-white py-2 px-6 font-bold hover:bg-primary-800 transition"
                >
                    Go to Wallet
                </button>
            </div>
        </div>
    );
}

export default function CampaignSuccessPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
            <CampaignSuccessContent />
        </Suspense>
    );
}
