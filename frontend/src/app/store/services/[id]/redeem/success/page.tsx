'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { formatCurrency } from '@/lib/currency';
import { fetchPublicStoreItem } from '@/lib/publicStore';
import type { StoreItem } from '@/types';

export default function ServiceRedeemSuccessPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
    const orderId = searchParams.get('orderId') || '';
    const [dynamicItem, setDynamicItem] = useState<StoreItem | null>(null);
    const [dynamicLoading, setDynamicLoading] = useState(false);

    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        setDynamicLoading(true);
        fetchPublicStoreItem(String(id))
            .then((row) => {
                if (cancelled) return;
                setDynamicItem(row && row.type === 'service' ? row : null);
            })
            .catch(() => {
                if (cancelled) return;
                setDynamicItem(null);
            })
            .finally(() => {
                if (cancelled) return;
                setDynamicLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [id]);

    const display = dynamicItem
            ? { name: dynamicItem.title, credits: Number(dynamicItem.credit_cost || 0) }
            : null;

    return (
        <div className="page-enter mx-auto max-w-4xl px-6 py-16">
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-10 text-center shadow-sm">
                <div className="mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <span className="text-3xl font-black">✓</span>
                </div>
                <h1 className="text-3xl font-black text-slate-900">Service Redeemed Successfully</h1>
                <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
                    {display ? `${display.name} has been redeemed using your Asset Credits.` : dynamicLoading ? 'Loading order details…' : 'Order placed successfully.'}
                </p>
                {!!orderId && (
                    <p className="mt-2 text-sm text-slate-700">
                        Order ID: <strong>{orderId}</strong>
                    </p>
                )}
                <div className="mt-6 rounded-3xl bg-white border border-slate-200 p-6 text-left">
                    <p className="text-sm text-slate-500 uppercase tracking-[0.25em]">Redeemed Service</p>
                    <h2 className="mt-2 text-xl font-black text-slate-900">{display?.name || 'Service'}</h2>
                    <p className="mt-3 text-slate-600">Our team will contact you within 24 hours to follow up on the next steps.</p>
                    <p className="mt-4 text-sm text-slate-500">
                        Credits redeemed: {formatCurrency(display?.credits || 0, 'INR')} ({display?.credits || 0} credits)
                    </p>
                </div>
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                    {!!orderId && (
                        <button
                            type="button"
                            onClick={() => router.push(`/activity/${encodeURIComponent(orderId)}/order-details?orderNo=${encodeURIComponent(orderId)}`)}
                            className="rounded-full border border-slate-200 bg-white text-slate-900 px-7 py-3 text-sm font-semibold hover:bg-slate-50"
                        >
                            View Order
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => router.push('/store?tab=services')}
                        className="rounded-full bg-primary-700 text-white px-7 py-3 text-sm font-semibold"
                    >
                        View More Services
                    </button>
                    <button
                        type="button"
                        onClick={() => router.push('/')}
                        className="rounded-full border border-slate-200 bg-white text-slate-900 px-7 py-3 text-sm font-semibold"
                    >
                        Return Home
                    </button>
                </div>
            </div>
        </div>
    );
}
