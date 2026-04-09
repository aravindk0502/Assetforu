'use client';

import { Suspense } from 'react';
import { useAuthStore, useUIStore } from '@/store';
import Link from 'next/link';
import BackNavigation from '@/components/BackNavigation';
import { useEffect, useMemo, useState } from 'react';
import { campaigns, type CampaignInfo } from '@/data/dreamCampaigns';
import { parseCampaignMeta } from '@/lib/campaignMeta';
import { parseCampaignImages } from '@/lib/campaignImages';
import { campaignAPI } from '@/lib/api';

function TicketDetailsContent({ params }: { params: { id: string } }) {
    const { id } = params;
    const user = useAuthStore((state) => state.user);
    const { activity } = useUIStore();

    const ticketActivity = useMemo(() => {
        return activity.find((item) => item.id === id && typeof item.ticketNumber === 'number');
    }, [id, activity]);

    const [ticketActivityFallback, setTicketActivityFallback] = useState<any | null>(null);

    useEffect(() => {
        if (ticketActivity) {
            setTicketActivityFallback(null);
            return;
        }
        if (typeof window === 'undefined') return;
        try {
            const raw = localStorage.getItem('af_activity');
            const parsed = raw ? (JSON.parse(raw) as any[]) : [];
            const found = Array.isArray(parsed)
                ? parsed.find((item) => item && item.id === id && typeof item.ticketNumber === 'number')
                : null;
            setTicketActivityFallback(found || null);
        } catch {
            setTicketActivityFallback(null);
        }
    }, [id, ticketActivity]);

    const effectiveTicketActivity = (ticketActivity as any) || ticketActivityFallback;

    const [campaignDetails, setCampaignDetails] = useState<CampaignInfo | null>(() => {
        if (!effectiveTicketActivity) return null;
        return campaigns.find((c) => c.id === effectiveTicketActivity.campaignId) || null;
    });

    useEffect(() => {
        if (!effectiveTicketActivity?.campaignId) return;
        const local = campaigns.find((c) => c.id === effectiveTicketActivity.campaignId) || null;
        if (local) {
            setCampaignDetails(local);
            return;
        }
        let cancelled = false;
        const load = async () => {
            try {
                const blobRes = await fetch(`/api/public/campaigns/${effectiveTicketActivity.campaignId}`, { cache: 'no-store' });
                const blobJson = (await blobRes.json().catch(() => ({}))) as any;
                const row = (blobRes.ok && blobJson?.success && blobJson?.data) ? blobJson.data : null;
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
                setCampaignDetails(mapped);
                return;
            } catch {
                // ignore
            }
            try {
                const res = await campaignAPI.get(effectiveTicketActivity.campaignId);
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
                setCampaignDetails(mapped);
            } catch {
                // ignore
            }
        };
        void load();
        return () => { cancelled = true; };
    }, [effectiveTicketActivity?.campaignId]);

    if (!user) {
        return (
            <div className="mx-auto max-w-4xl px-6 py-20 text-center">
                <p className="text-xl font-semibold text-slate-700">Sign in to view ticket details</p>
                <Link href="/" className="mt-6 inline-block bg-primary-700 text-white px-6 py-3 rounded-xl font-bold">
                    Go to Home
                </Link>
            </div>
        );
    }

    if (!effectiveTicketActivity) {
        return (
            <div className="mx-auto max-w-4xl px-6 py-20 text-center">
                <p className="text-xl font-semibold text-slate-700">Ticket not found</p>
                <Link href="/activity" className="mt-6 inline-block bg-primary-700 text-white px-6 py-3 rounded-xl font-bold">
                    Back to Activity
                </Link>
            </div>
        );
    }

    const purchaseDate = new Date(effectiveTicketActivity.createdAt);
    const fallbackCampaign: CampaignInfo = {
        id: effectiveTicketActivity.campaignId,
        title: effectiveTicketActivity.campaignName || 'Campaign',
        location: 'India',
        city: '',
        state: '',
        country: 'India',
        priceLabel: '',
        contactPhone: '',
        whatsappNumber: '',
        imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200',
        images: [],
        description: '',
        creditPack: 0,
    };
    const effectiveCampaign = campaignDetails || fallbackCampaign;

    return (
        <div className="page-enter mx-auto max-w-4xl px-6 py-10">
            <BackNavigation />

            <div className="mt-6">
                <h1 className="text-3xl font-black text-slate-900 mb-2">Campaign Participation</h1>
                <p className="text-slate-600 mb-8">View your campaign participation details and ticket information</p>

                {/* Ticket Header */}
                <div className="rounded-3xl bg-gradient-to-r from-primary-50 to-emerald-50 border border-primary-200 p-8 mb-8">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <p className="text-xs uppercase tracking-widest text-primary-600 font-bold mb-2">Participation ID</p>
                            <p className="text-4xl font-black text-slate-900">Ticket #{effectiveTicketActivity.ticketNumber}</p>
                            <p className="text-sm text-slate-600 mt-3">Unique identification for your participation</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-2">Status</p>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                <p className="text-lg font-bold text-emerald-700">{effectiveTicketActivity.status}</p>
                            </div>
                            <p className="text-sm text-slate-600 mt-3">Your participation is active and valid</p>
                        </div>
                    </div>
                </div>

                {/* Campaign Details */}
                <div className="rounded-3xl border border-slate-200 bg-white p-8 mb-8">
                    <h2 className="text-2xl font-black text-slate-900 mb-6">Campaign Details</h2>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <img
                                src={effectiveCampaign.imageUrl}
                                alt={effectiveCampaign.title}
                                className="rounded-2xl w-full h-64 object-cover"
                            />
                        </div>

                        <div className="space-y-5">
                            <div>
                                <p className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-1">Campaign Name</p>
                                <p className="text-2xl font-bold text-slate-900">{effectiveCampaign.title}</p>
                            </div>

                            <div>
                                <p className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-1">Location</p>
                                <p className="text-lg text-slate-700">{effectiveCampaign.location}</p>
                            </div>

                            <div>
                                <p className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-1">Description</p>
                                <p className="text-slate-700">{effectiveCampaign.description || '—'}</p>
                            </div>

                            <div>
                                <p className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-1">Entry Investment</p>
                                <p className="text-2xl font-black text-primary-700">₹{effectiveCampaign.creditPack} Credits</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Transaction Details */}
                <div className="rounded-3xl border border-slate-200 bg-white p-8 mb-8">
                    <h2 className="text-2xl font-black text-slate-900 mb-6">Participation Details</h2>

                    <div className="grid md:grid-cols-3 gap-6">
                        <div>
                            <p className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-2">Participation Date</p>
                            <p className="text-lg font-semibold text-slate-900">{purchaseDate.toLocaleDateString()}</p>
                            <p className="text-sm text-slate-600">{purchaseDate.toLocaleTimeString()}</p>
                        </div>

                        <div>
                            <p className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-2">Credits Used</p>
                            <p className="text-lg font-semibold text-slate-900">₹{effectiveCampaign.creditPack}</p>
                            <p className="text-sm text-slate-600">Deducted from wallet</p>
                        </div>

                        <div>
                            <p className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-2">Campaign Status</p>
                            <p className="text-lg font-semibold text-emerald-700">Active</p>
                            <p className="text-sm text-slate-600">Campaign ongoing</p>
                        </div>
                    </div>
                </div>

                {/* Summary */}
                <div className="rounded-2xl bg-blue-50 border border-blue-200 p-6 mb-8">
                    <p className="text-sm text-blue-950">
                        <span className="font-bold">Ticket #{effectiveTicketActivity.ticketNumber}</span> represents your confirmed participation in the <span className="font-bold">{effectiveCampaign.title}</span> campaign.
                        Keep this ticket safe as it&apos;s your proof of participation. You can view this ticket anytime from your Activity page.
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                        href="/activity"
                        className="flex-1 text-center rounded-xl bg-primary-700 text-white px-6 py-3 text-sm font-bold hover:bg-primary-800 transition"
                    >
                        Back to Activity
                    </Link>
                    <Link
                        href="/campaigns"
                        className="flex-1 text-center rounded-xl border-2 border-primary-700 text-primary-700 px-6 py-3 text-sm font-bold hover:bg-primary-50 transition"
                    >
                        View All Campaigns
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function TicketDetailsPage({ params }: { params: { id: string } }) {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
            <TicketDetailsContent params={params} />
        </Suspense>
    );
}
