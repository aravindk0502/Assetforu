'use client';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { useAuthStore, useUIStore } from '@/store';
import { campaigns } from '@/data/dreamCampaigns';
import { campaignAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/currency';
import BackNavigation from '@/components/BackNavigation';

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
    const [cardName, setCardName] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvv, setCardCvv] = useState('');

    const campaign = campaigns.find((item) => item.id === params?.id);
    const qty = Number(searchParams.get('qty') || '1');
    const currentQty = Number.isNaN(qty) || qty < 1 ? 1 : Math.min(10, qty);
    const totalCredits = campaign ? campaign.creditPack * currentQty : 0;

    useEffect(() => {
        if (!campaign) return;
        const quizToken = sessionStorage.getItem(`af_quiz_token_${campaign.id}`) === '1';
        if (!quizToken) {
            router.replace(`/campaigns/${campaign.id}`);
            return;
        }
        const loadLimit = async () => {
            try {
                if (isDevUser) {
                    const raw = localStorage.getItem('af_dev_campaign_purchases');
                    const map = raw ? JSON.parse(raw) as Record<string, number> : {};
                    const purchased = map[campaign.id] || 0;
                    const remaining = Math.max(0, 3 - purchased);
                    setRemainingLimit(remaining);
                    if (remaining <= 0) {
                        setLimitMessage('Maximum participation limit reached for this campaign');
                    } else if (remaining < 3) {
                        setLimitMessage(`You can access up to ${remaining} more for this campaign`);
                    } else {
                        setLimitMessage('');
                    }
                    return;
                }
                const res = await campaignAPI.limit(campaign.id);
                const remaining = Number(res.data?.data?.remaining_limit ?? 3);
                setRemainingLimit(remaining);
                if (remaining <= 0) {
                    setLimitMessage('Maximum participation limit reached for this campaign');
                } else if (remaining < 3) {
                    setLimitMessage(`You can access up to ${remaining} more for this campaign`);
                } else {
                    setLimitMessage('');
                }
            } catch {
                setRemainingLimit(3);
                setLimitMessage('');
            }
        };
        if (token || user) loadLimit();
        else setRemainingLimit(3);
        const onPurchase = () => loadLimit();
        window.addEventListener('campaign:purchase', onPurchase);
        return () => window.removeEventListener('campaign:purchase', onPurchase);
    }, [campaign, token, user, isDevUser, router]);

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
        if (!user) {
            openSignupModal(() => router.push(`/campaigns/${params?.id ?? ''}/success?qty=${currentQty}`));
            return;
        }

        let allocatedTickets: number[] = [];
        try {
            if (!user.id?.startsWith('dev_')) {
                const res = await campaignAPI.participate(campaign.id, currentQty);
                allocatedTickets = res?.data?.data?.allocated_tickets || [];
            } else {
                const raw = localStorage.getItem('af_dev_campaign_purchases');
                const map = raw ? JSON.parse(raw) as Record<string, number> : {};
                const soldRaw = localStorage.getItem('af_dev_campaign_sold');
                const soldMap = soldRaw ? JSON.parse(soldRaw) as Record<string, number> : {};
                const alreadySold = soldMap[campaign.id] || 0;
                allocatedTickets = Array.from({ length: currentQty }, (_, i) => alreadySold + i + 1);
                const nextPurchased = (map[campaign.id] || 0) + currentQty;
                map[campaign.id] = nextPurchased;
                localStorage.setItem('af_dev_campaign_purchases', JSON.stringify(map));
                soldMap[campaign.id] = alreadySold + currentQty;
                localStorage.setItem('af_dev_campaign_sold', JSON.stringify(soldMap));
                const remaining = Math.max(0, 3 - nextPurchased);
                setRemainingLimit(remaining);
                if (remaining <= 0) {
                    setLimitMessage('Maximum participation limit reached for this campaign');
                } else if (remaining < 3) {
                    setLimitMessage(`You can access up to ${remaining} more for this campaign`);
                } else {
                    setLimitMessage('');
                }
                window.dispatchEvent(new Event('campaign:purchase'));
            }
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'Unable to complete purchase';
            alert(msg);
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

        sessionStorage.removeItem(`af_quiz_token_${campaign.id}`);
        const ticketParam = allocatedTickets.length ? `&tickets=${allocatedTickets.join(',')}` : '';
        router.push(`/campaigns/${campaign.id}/success?qty=${currentQty}${ticketParam}`);
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
                        <span className="font-semibold text-slate-900">x{currentQty}</span>
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
                    <span className="rounded-full bg-slate-900 text-white px-3 py-1 text-xs font-bold">Razorpay Test Mode</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">Choose your payment method for the Razorpay test checkout.</p>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <button
                        type="button"
                        onClick={() => setPaymentMode('upi')}
                        className={`rounded-xl border px-4 py-3 text-left text-sm font-bold ${paymentMode === 'upi' ? 'border-primary-700 bg-primary-50 text-primary-800' : 'border-slate-200 text-slate-700'
                            }`}
                    >
                        UPI (Razorpay)
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

                {paymentMode === 'card' && (
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <input
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value)}
                            placeholder="Name on card"
                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        />
                        <input
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value.replace(/[^0-9]/g, '').slice(0, 16))}
                            placeholder="Card number"
                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        />
                        <input
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            placeholder="MM/YY"
                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        />
                        <input
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                            placeholder="CVV"
                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        />
                    </div>
                )}

                <button
                    onClick={handlePayment}
                    disabled={remainingLimit !== null && remainingLimit <= 0}
                    className="mt-6 w-full rounded-xl bg-primary-700 text-white py-3 font-bold hover:bg-primary-800 transition disabled:opacity-60"
                >
                    Pay Now
                </button>

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
