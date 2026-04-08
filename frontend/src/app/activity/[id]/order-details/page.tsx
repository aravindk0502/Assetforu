'use client';

import { Suspense } from 'react';
import { useAuthStore, useUIStore } from '@/store';
import { useParams, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import BackNavigation from '@/components/BackNavigation';

function OrderDetailsContent() {
    const params = useParams();
    const searchParams = useSearchParams();
    const user = useAuthStore((state) => state.user);
    const { activity, transactions } = useUIStore();

    const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
    const orderNo = searchParams.get('orderNo') || '';

    const activityOrder = useMemo(() => {
        if (!id) return null;
        return activity.find((item) => item.id === id && typeof item.ticketNumber !== 'number') || null;
    }, [id, activity]);

    const transaction = useMemo(() => {
        if (!id) return null;
        return (transactions as any[]).find((t) => t.id === id || t.reference_id === id) || null;
    }, [id, transactions]);

    if (!user) {
        return (
            <div className="mx-auto max-w-4xl px-6 py-20 text-center">
                <p className="text-xl font-semibold text-slate-700">Sign in to view order details</p>
                <Link href="/" className="mt-6 inline-block bg-primary-700 text-white px-6 py-3 rounded-xl font-bold">Go to Home</Link>
            </div>
        );
    }

    if (!activityOrder && !transaction) {
        return (
            <div className="mx-auto max-w-4xl px-6 py-20 text-center">
                <p className="text-xl font-semibold text-slate-700">Order not found</p>
                <Link href="/activity" className="mt-6 inline-block bg-primary-700 text-white px-6 py-3 rounded-xl font-bold">Back to Activity</Link>
            </div>
        );
    }

    const createdAtRaw = activityOrder?.createdAt || transaction?.createdAt;
    const createdAt = createdAtRaw ? new Date(createdAtRaw) : null;
    const title = activityOrder?.campaignName || transaction?.description || 'Order';
    const credits = typeof activityOrder?.creditsUsed === 'number'
        ? activityOrder.creditsUsed
        : Number(transaction?.credits ?? 0);
    const status = activityOrder?.status || 'Completed';

    return (
        <div className="page-enter mx-auto max-w-4xl px-6 py-10">
            <BackNavigation />

            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8 shadow-sm">
                <div className="flex items-center justify-center mb-6">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        <CheckCircle2 className="w-8 h-8" />
                    </div>
                </div>

                <h1 className="text-center text-3xl font-black text-slate-900 mb-2">Order Confirmed</h1>
                <p className="text-center text-slate-600 mb-8">Your order has been placed successfully</p>

                <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <div>
                            <p className="text-xs uppercase tracking-[0.25em] text-slate-500 mb-2">Order Number</p>
                            <p className="text-2xl font-black text-slate-900">{orderNo || id}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.25em] text-slate-500 mb-2">Order Date</p>
                            <p className="text-lg font-semibold text-slate-900">{createdAt ? createdAt.toLocaleDateString() : '-'}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
                    <h2 className="text-lg font-black text-slate-900 mb-4">Order Details</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                            <div>
                                <p className="font-semibold text-slate-900">{title}</p>
                                {createdAt && (
                                    <p className="text-sm text-slate-500 mt-1">Order Time: {createdAt.toLocaleTimeString()}</p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                            <p className="text-slate-600">{transaction?.type === 'debit' ? 'Credits Debited' : 'Credits'}</p>
                            <p className="text-xl font-black text-slate-900">₹{credits}</p>
                        </div>
                        <div className="flex items-center justify-between">
                            <p className="text-slate-600">Status</p>
                            <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                                {status}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
                    <p className="text-sm text-blue-900">
                        <span className="font-semibold">Next Steps:</span> Our team will process your order within 24 hours. You will receive an email confirmation shortly.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <Link href="/activity" className="flex-1 text-center rounded-xl bg-primary-700 text-white px-6 py-3 text-sm font-bold hover:bg-primary-800 transition">
                        Back to Activity
                    </Link>
                    <Link href="/store" className="flex-1 text-center rounded-xl border border-slate-200 bg-white text-slate-900 px-6 py-3 text-sm font-bold hover:bg-slate-50 transition">
                        Continue Shopping
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function OrderDetailsPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
            <OrderDetailsContent />
        </Suspense>
    );
}
