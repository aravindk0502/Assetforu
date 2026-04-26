'use client';

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { useAuthStore, useUIStore } from '@/store';
import type { CampaignInfo } from '@/data/dreamCampaigns';
import { campaignAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/currency';
import BackNavigation from '@/components/BackNavigation';
import { parseCampaignMeta } from '@/lib/campaignMeta';
import { parseCampaignImages } from '@/lib/campaignImages';
import { startRazorpayPayment } from '@/lib/razorpayCheckout';

function CampaignCheckoutContent() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const user = useAuthStore((state) => state.user);
    const token = useAuthStore((state) => state.token);
    const { walletBalance, setWalletBalance, addTransaction, addActivity, openSignupModal, currency } = useUIStore();
    const [remainingLimit, setRemainingLimit] = useState<number | null>(null);
    const [limitMessage, setLimitMessage] = useState('');
    const isDevUser = !!user?.id?.startsWith('dev_');
    const [paymentMode, setPaymentMode] = useState<'upi' | 'card'>('upi');
    const [paying, setPaying] = useState(false);
    const [isMobileWeb, setIsMobileWeb] = useState(false);
    const isRazorpayLive = String(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '').startsWith('rzp_live_');

    const campaignId = (params?.id as string) || '';
    const [campaign, setCampaign] = useState<CampaignInfo | null>(null);
    const [isBlobCampaign, setIsBlobCampaign] = useState(false);
    const [maxQty, setMaxQty] = useState(3);
    const qtyFromUrl = Number(searchParams.get('qty') || '1');
    const initialQty = Number.isNaN(qtyFromUrl) || qtyFromUrl < 1 ? 1 : Math.min(20, qtyFromUrl);
    const [currentQty, setCurrentQty] = useState(initialQty);
    const totalCredits = campaign ? campaign.creditPack * currentQty : 0;
    const maxSelectableQty = Math.max(1, Math.min(20, remainingLimit ?? maxQty));

    useEffect(() => {
        setCurrentQty(initialQty);
    }, [initialQty, campaignId]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const media = window.matchMedia('(max-width: 768px)');
        const update = () => setIsMobileWeb(media.matches);
        update();
        media.addEventListener('change', update);
        return () => media.removeEventListener('change', update);
    }, []);

    useEffect(() => {
        if (currentQty > maxSelectableQty) setCurrentQty(maxSelectableQty);
    }, [currentQty, maxSelectableQty]);

    const changeQty = (nextQty: number) => {
        const next = Math.max(1, Math.min(maxSelectableQty, nextQty));
        setCurrentQty(next);
        router.replace(`/campaigns/${encodeURIComponent(String(campaignId))}/checkout?qty=${next}`, { scroll: false });
    };

    useEffect(() => {
        if (!campaignId) return;
        let cancelled = false;

        // Best-effort cache from the campaign detail page to prevent "Campaign not found"
        // if APIs are temporarily unavailable.
        try {
            if (typeof window !== 'undefined') {
                const raw = sessionStorage.getItem(`af_campaign_cache_${campaignId}`);
                if (raw) {
                    const cached = JSON.parse(raw) as Partial<CampaignInfo> & { maxQty?: number; isBlobCampaign?: boolean };
                    if (cached && String((cached as any).id || '') === String(campaignId) && cached.title && typeof cached.creditPack === 'number') {
                        setCampaign((prev) => prev || (cached as CampaignInfo));
                        if (typeof cached.isBlobCampaign === 'boolean') setIsBlobCampaign(cached.isBlobCampaign);
                        if (Number.isFinite(Number(cached.maxQty))) setMaxQty(Math.max(1, Math.min(20, Number(cached.maxQty))));
                    }
                }
            }
        } catch {
            // ignore
        }

        // Do not show static/dummy campaign data to avoid "flash of old campaign" glitches.

        const load = async () => {
            try {
                // Prefer blob-backed campaign (admin-created) first.
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
                setIsBlobCampaign(true);
                setMaxQty(Number.isFinite(meta.maxQty as any) ? Number(meta.maxQty) : 3);
            } catch {
                // Fallback to backend API (legacy)
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
                    setIsBlobCampaign(false);
                    setMaxQty(Number.isFinite(meta.maxQty as any) ? Number(meta.maxQty) : 3);
                } catch {
                    // ignore
                }
            }
        };

        // Only load remote if not found in static list.
        void load();
        return () => { cancelled = true; };
    }, [campaignId]);

    useEffect(() => {
        if (!campaign) return;
        const loadLimit = async () => {
            try {
                if (isDevUser) {
                    const raw = localStorage.getItem('af_dev_campaign_purchases');
                    const map = raw ? JSON.parse(raw) as Record<string, number> : {};
                    const purchased = map[campaign.id] || 0;
                    const cap = Number.isFinite(Number(maxQty)) ? Number(maxQty) : 3;
                    const remaining = Math.max(0, cap - purchased);
                    setRemainingLimit(remaining);
                    if (remaining <= 0) {
                        setLimitMessage('Maximum participation limit reached for this campaign');
                    } else if (remaining < cap) {
                        setLimitMessage(`You can access up to ${remaining} more for this campaign`);
                    } else {
                        setLimitMessage('');
                    }
                    return;
                }
                if (isBlobCampaign) {
                    const bearer = token || (typeof window !== 'undefined' ? localStorage.getItem('af_token') : null);
                    const res = await fetch(`/api/public/campaigns/${encodeURIComponent(String(campaign.id))}/limit`, {
                        headers: bearer ? { authorization: `Bearer ${bearer}` } : undefined,
                        cache: 'no-store',
                    });
                    const json = (await res.json().catch(() => ({}))) as any;
                    const remaining = Number(json?.data?.remaining_limit ?? maxQty);
                    setRemainingLimit(remaining);
                    if (remaining <= 0) {
                        setLimitMessage('Maximum participation limit reached for this campaign');
                    } else if (remaining < maxQty) {
                        setLimitMessage(`You can access up to ${remaining} more for this campaign`);
                    } else {
                        setLimitMessage('');
                    }
                    return;
                }
                const res = await campaignAPI.limit(campaign.id);
                const remaining = Number(res.data?.data?.remaining_limit ?? maxQty);
                setRemainingLimit(remaining);
                if (remaining <= 0) {
                    setLimitMessage('Maximum participation limit reached for this campaign');
                } else if (remaining < maxQty) {
                    setLimitMessage(`You can access up to ${remaining} more for this campaign`);
                } else {
                    setLimitMessage('');
                }
            } catch {
                setRemainingLimit(maxQty);
                setLimitMessage('');
            }
        };
        if (token || user) loadLimit();
        else setRemainingLimit(maxQty);
        const onPurchase = () => loadLimit();
        window.addEventListener('campaign:purchase', onPurchase);
        return () => window.removeEventListener('campaign:purchase', onPurchase);
    }, [campaign, token, user, isDevUser, router, isBlobCampaign, maxQty]);

    if (!campaign) {
        return <div className="mx-auto max-w-4xl px-6 py-16 text-center">Campaign not found.</div>;
    }

    const handlePayment = async () => {
        if (!campaign) return;
        if (remainingLimit !== null && remainingLimit <= 0) return;
        if (remainingLimit !== null && currentQty > remainingLimit) {
            alert(`You can only purchase ${remainingLimit} more for this campaign`);
            return;
        }
        if (!user || !token) {
            openSignupModal(() => router.push(`/campaigns/${params?.id ?? ''}/success?qty=${currentQty}`));
            return;
        }

        setPaying(true);
        try {
            await startRazorpayPayment({
                amountInr: totalCredits,
                title: `Campaign: ${campaign.title}`,
                description: `Buy ${currentQty} credit pack(s)`,
                prefill: { phone: user.phone, name: user.name },
                notes: { purpose: 'campaign_checkout', campaign_id: String(campaign.id), qty: String(currentQty), mode: paymentMode },
                preferredMethod: paymentMode,
            });
        } catch (paymentErr: unknown) {
            const msg = paymentErr instanceof Error ? paymentErr.message : 'Payment failed';
            alert(msg);
            setPaying(false);
            return;
        }

        let allocatedTickets: number[] = [];
        try {
            if (!user.id?.startsWith('dev_') && !isBlobCampaign) {
                const res = await campaignAPI.participate(campaign.id, currentQty);
                allocatedTickets = res?.data?.data?.allocated_tickets || [];
            } else {
                const bearer = token || (typeof window !== 'undefined' ? localStorage.getItem('af_token') : null);
                if (!bearer) throw new Error('Not authenticated');
                const res = await fetch(`/api/public/campaigns/${encodeURIComponent(String(campaign.id))}/purchase`, {
                    method: 'POST',
                    headers: { 'content-type': 'application/json', authorization: `Bearer ${bearer}` },
                    body: JSON.stringify({
                        quantity: currentQty,
                        purchaser: {
                            name: user?.name || '',
                            email: user?.email || '',
                            phone: user?.phone || '',
                        },
                    }),
                });
                const json = (await res.json().catch(() => ({}))) as any;
                if (res.status === 401 && typeof window !== 'undefined') {
                    localStorage.removeItem('af_token');
                    localStorage.removeItem('af_user');
                    window.dispatchEvent(new Event('auth:logout'));
                    throw new Error('Session expired. Please login again and retry purchase.');
                }
                if (!res.ok || json?.success === false) {
                    throw new Error(json?.message || 'Unable to complete purchase');
                }
                // Use server-issued tickets (Blob-backed, persists across devices).
                const tickets = Array.isArray(json?.data?.tickets) ? json.data.tickets : [];
                allocatedTickets = tickets
                    .map((t: any) => Number(t?.ticket_number))
                    .filter((n: number) => Number.isFinite(n));
                const remaining = Number(json?.data?.remaining_limit ?? 0);
                setRemainingLimit(remaining);
                if (remaining <= 0) setLimitMessage('Maximum participation limit reached for this campaign');
                else if (remaining < maxQty) setLimitMessage(`You can access up to ${remaining} more for this campaign`);
                else setLimitMessage('');
                window.dispatchEvent(new Event('campaign:purchase'));
            }
        } catch (err: any) {
            const msg = err?.response?.data?.message || err?.message || 'Unable to complete purchase';
            alert(msg);
            setPaying(false);
            return;
        }

        const newBalance = walletBalance + totalCredits;
        setWalletBalance(newBalance);

        addTransaction({
            type: 'credit',
            description: `Purchased ${currentQty}x ${campaign.creditPack} Asset Credit packs for ${campaign.title}`,
            credits: totalCredits,
        });

        addActivity({
            campaignId: campaign.id,
            campaignName: campaign.title,
            creditsUsed: 0,
            status: 'Active Campaign',
            ticketCount: currentQty,
            ticketNumbers: allocatedTickets.length > 0 ? allocatedTickets : undefined,
        });

        const ticketParam = allocatedTickets.length ? `&tickets=${allocatedTickets.join(',')}` : '';
        router.push(`/campaigns/${campaign.id}/success?qty=${currentQty}${ticketParam}`);
        setPaying(false);
    };

    return (
        <div className="page-enter mx-auto max-w-4xl px-6 py-14">            <BackNavigation />            <h1 className="text-3xl font-black text-slate-900 mb-3">Checkout</h1>
            <p className="text-sm text-slate-600 mb-8">Confirm your Asset Credits order and complete payment.</p>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="grid grid-cols-1 gap-4">
                    <div className="flex justify-between">
                        <span className="text-slate-500">Campaign</span>
                        <span className="font-semibold text-slate-900">{campaign.title}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500">Pack Size</span>
                        <span className="font-semibold text-slate-900">{formatCurrency(campaign.creditPack, currency)} Asset Credits</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500">Quantity</span>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => changeQty(currentQty - 1)}
                                disabled={currentQty <= 1}
                                className="h-8 w-8 rounded-lg border border-slate-200 text-slate-700 disabled:opacity-50"
                            >
                                −
                            </button>
                            <span className="min-w-[48px] text-center font-semibold text-slate-900">x{currentQty}</span>
                            <button
                                type="button"
                                onClick={() => changeQty(currentQty + 1)}
                                disabled={currentQty >= maxSelectableQty}
                                className="h-8 w-8 rounded-lg border border-slate-200 text-slate-700 disabled:opacity-50"
                            >
                                +
                            </button>
                        </div>
                    </div>
                    <div className="flex justify-between border-t border-slate-100 pt-3">
                        <span className="text-slate-500">Total</span>
                        <span className="text-xl font-black text-primary-700">{formatCurrency(totalCredits, currency)}</span>
                    </div>
                </div>

            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-black text-slate-900">Payment Mode</h2>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${isRazorpayLive ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'}`}>
                        {isRazorpayLive ? 'Razorpay Live Mode' : 'Razorpay Test Mode'}
                    </span>
                </div>
                <p className="text-xs text-slate-500 mt-2">Choose UPI or Card. Razorpay checkout opens with your selected method first.</p>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <button
                        type="button"
                        onClick={() => setPaymentMode('upi')}
                        className={`rounded-xl border px-4 py-3 text-left text-sm font-bold ${paymentMode === 'upi' ? 'border-primary-700 bg-primary-50 text-primary-800' : 'border-slate-200 text-slate-700'
                            }`}
                    >
                        UPI
                    </button>
                    <button
                        type="button"
                        onClick={() => setPaymentMode('card')}
                        className={`rounded-xl border px-4 py-3 text-left text-sm font-bold ${paymentMode === 'card' ? 'border-primary-700 bg-primary-50 text-primary-800' : 'border-slate-200 text-slate-700'
                            }`}
                    >
                        Debit / Credit Card
                    </button>
                </div>

                {paymentMode === 'upi' && (
                    <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        {isMobileWeb
                            ? 'UPI selected: Razorpay uses UPI Intent (Google Pay / PhonePe / Paytm apps).'
                            : 'UPI selected: Razorpay shows QR on desktop.'}
                    </p>
                )}
                {paymentMode === 'card' && (
                    <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        Card selected. Razorpay will show saved/new cards first.
                    </p>
                )}

                <button
                    onClick={handlePayment}
                    disabled={paying || (remainingLimit !== null && remainingLimit <= 0)}
                    className="mt-6 w-full rounded-xl bg-primary-700 text-white py-3 font-bold hover:bg-primary-800 transition disabled:opacity-60"
                >
                    {paying ? 'Processing…' : 'Pay Now'}
                </button>
                <p className="mt-3 text-xs text-slate-500">If popup controls are not visible, press `Esc` to close payment.</p>

                <p className="mt-3 text-xs text-slate-500">
                    By proceeding, you agree to our{' '}
                    <a href="/terms" className="text-primary-700 font-semibold hover:underline">Terms &amp; Conditions</a>{' '}
                    and{' '}
                    <a href="/privacy" className="text-primary-700 font-semibold hover:underline">Privacy Policy</a>.
                </p>

                {limitMessage && (
                    <p className="mt-3 text-xs text-amber-600">{limitMessage}</p>
                )}

                <p className="mt-3 text-xs text-slate-500">1 Asset Credit = ₹1. Credits are non-transferable. This transaction only adds Asset Credits.</p>
            </div>
        </div>
    );
}

export default function CampaignCheckoutPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
            <CampaignCheckoutContent />
        </Suspense>
    );
}
