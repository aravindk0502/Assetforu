'use client';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { servicesCatalog } from '@/data/storeCatalog';
import { useAuthStore, useUIStore } from '@/store';
import { formatCurrency } from '@/lib/currency';
import BackNavigation from '@/components/BackNavigation';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { fetchPublicStoreItem } from '@/lib/publicStore';

export default function ServiceRedeemPage() {
    const params = useParams();
    const router = useRouter();
    const user = useAuthStore((s) => s.user);
    const token = useAuthStore((s) => s.token);
    const { walletBalance, setWalletBalance, addTransaction, addActivity, openSignupModal, currency } = useUIStore();
    const [message, setMessage] = useState('');
    const [showTopUp, setShowTopUp] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [redeemOrderId, setRedeemOrderId] = useState<string | null>(null);
    const [apiLoading, setApiLoading] = useState(false);
    const [apiService, setApiService] = useState<null | { id: string; name: string; credits: number; description: string; image: string; category: string }>(null);

    const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
    const staticService = useMemo(
        () => servicesCatalog.find((item) => item.id === id),
        [id]
    );
    useEffect(() => {
        const itemId = String(id || '');
        if (!itemId) return;
        if (staticService) return;
        setApiLoading(true);
        fetchPublicStoreItem(itemId)
            .then((row) => {
                if (!row || row.type !== 'service') {
                    setApiService(null);
                    return;
                }
                setApiService({
                    id: row.id,
                    name: row.title,
                    credits: Number(row.credit_cost || 0),
                    description: row.description || '',
                    image: row.image_url,
                    category: row.category || 'Store',
                });
            })
            .finally(() => setApiLoading(false));
    }, [id, staticService]);

    const service = staticService
        ? { id: staticService.id, name: staticService.name, credits: staticService.credits, description: staticService.description, image: staticService.image, category: staticService.category || 'Store' }
        : apiService;

    const isAuthed = !!user || !!token;

    if (!service) {
        return (
            <div className="mx-auto max-w-5xl px-6 py-16 text-center">
                <p className="text-slate-500">{apiLoading ? 'Loading service…' : 'Service not found.'}</p>
            </div>
        );
    }

    const handleRedeem = () => {
        if (!isAuthed) {
            openSignupModal(() => router.push(`/store/services/${service.id}/redeem`));
            return;
        }

        if (walletBalance < service.credits) {
            setMessage('Insufficient Asset Credits. Please top up in wallet.');
            setShowTopUp(true);
            return;
        }

        setConfirmOpen(true);
    };

    const handleConfirmRedeem = () => {
        setConfirmOpen(false);
        const fallbackOrderId = redeemOrderId || `ORD-${Date.now().toString(36).toUpperCase()}${Math.random().toString(16).slice(2, 6).toUpperCase()}`;
        const doRedeem = async () => {
            let nextOrderId = fallbackOrderId;
            try {
                const bearer = token || (typeof window !== 'undefined' ? localStorage.getItem('af_token') : null);
                if (bearer) {
                    const res = await fetch('/api/public/store/checkout', {
                        method: 'POST',
                        headers: { 'content-type': 'application/json', authorization: `Bearer ${bearer}` },
                        body: JSON.stringify({
                            items: [{ item_id: service.id, title: service.name, type: 'service', credits: service.credits, quantity: 1 }],
                        }),
                    });
                    const json = (await res.json().catch(() => ({}))) as any;
                    if (res.ok && json?.success && json?.data?.order_id) {
                        nextOrderId = String(json.data.order_id);
                    }
                }
            } catch {
                // ignore server persistence failures; proceed with local flow.
            }

            setRedeemOrderId(nextOrderId);
            setWalletBalance(walletBalance - service.credits);
            addTransaction({ type: 'debit', description: `Redeemed ${service.name} (service)`, credits: service.credits, reference_id: nextOrderId });
            addActivity({ id: nextOrderId, campaignId: service.id, campaignName: service.name, creditsUsed: service.credits, status: 'Completed' });
            router.push(`/store/services/${service.id}/redeem/success?orderId=${encodeURIComponent(nextOrderId)}`);
        };
        void doRedeem();
    };

    return (
        <div className="page-enter mx-auto max-w-6xl px-6 py-10">
            <BackNavigation />
            <h1 className="text-3xl font-black text-slate-900 mb-2">Service Checkout</h1>
            <p className="text-slate-600 mb-8">Confirm your checkout to redeem this service.</p>

            {message && (
                <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
                    {message}
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h2 className="text-lg font-black text-slate-900">Service Details</h2>
                            <p className="text-xs text-slate-500">Review the selected service before redeeming.</p>
                        </div>
                        <span className="text-xs text-primary-700 font-semibold">{service.category}</span>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Service</p>
                            <h3 className="mt-2 text-2xl font-black text-slate-900">{service.name}</h3>
                            <p className="mt-3 text-slate-600">{service.description}</p>
                        </div>
                        <div className="rounded-3xl bg-slate-50 p-4 border border-slate-200">
                            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Redeem cost</p>
                            <div className="mt-2 flex items-center gap-3">
                                <span className="text-3xl font-black text-slate-900">{formatCurrency(service.credits, currency)}</span>
                                <span className="text-xs font-semibold uppercase text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
                                    {service.credits} Credits
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-3">
                        <button
                            onClick={handleRedeem}
                            className="rounded-xl bg-primary-700 text-white px-6 py-3 text-sm font-bold"
                        >
                            Redeem Service
                        </button>
                        <button
                            onClick={() => router.push(`/store/services/${service.id}`)}
                            className="rounded-xl border border-slate-200 text-slate-700 px-6 py-3 text-sm font-bold"
                        >
                            Back to Service
                        </button>
                    </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm h-fit">
                    <h2 className="text-lg font-black text-slate-900 mb-4">Order Summary</h2>
                    <div className="flex items-center gap-3">
                        <img src={service.image} alt={service.name} className="h-16 w-16 rounded-xl object-cover" />
                        <div>
                            <p className="font-bold text-slate-900">{service.name}</p>
                            <p className="text-xs text-slate-500">{service.category}</p>
                        </div>
                    </div>
                    <div className="mt-4 border-t border-slate-100 pt-4 flex items-center justify-between">
                        <span className="text-sm text-slate-500">Total</span>
                        <span className="text-xl font-black text-primary-700">{formatCurrency(service.credits, currency)}</span>
                    </div>
                </div>
            </div>

            {showTopUp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
                    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
                        <h3 className="text-xl font-black text-slate-900">Insufficient Credits</h3>
                        <p className="text-sm text-slate-600 mt-2">
                            You need more credits to redeem this service. Buy additional credits to continue.
                        </p>
                        <div className="mt-6 flex gap-3">
                            <button
                                type="button"
                                onClick={() => router.push('/wallet/buy')}
                                className="flex-1 rounded-xl bg-primary-700 text-white py-3 text-sm font-bold"
                            >
                                Buy More Credits
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowTopUp(false)}
                                className="flex-1 rounded-xl border border-slate-200 text-slate-700 py-3 text-sm font-bold"
                            >
                                Not Now
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDialog
                open={confirmOpen}
                title="Redeem Now?"
                description="Are you sure you want to redeem now? This will deduct credits from your wallet."
                confirmText="Yes, Redeem"
                cancelText="No"
                onConfirm={handleConfirmRedeem}
                onCancel={() => setConfirmOpen(false)}
            />
        </div>
    );
}
