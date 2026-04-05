'use client';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { Suspense } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { useUIStore } from '@/store';
import { campaigns } from '@/data/dreamCampaigns';
import { formatCurrency } from '@/lib/currency';
import BackNavigation from '@/components/BackNavigation';

function CampaignSuccessContent() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const { walletBalance, currency } = useUIStore();

    const campaign = campaigns.find((item) => item.id === params?.id);
    const qty = Number(searchParams.get('qty') || '1');
    const currentQty = Number.isNaN(qty) || qty < 1 ? 1 : Math.min(10, qty);
    const ticketsRaw = searchParams.get('tickets') || '';
    const tickets = ticketsRaw
        .split(',')
        .map((t) => Number(t))
        .filter((t) => !Number.isNaN(t) && t > 0);

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
