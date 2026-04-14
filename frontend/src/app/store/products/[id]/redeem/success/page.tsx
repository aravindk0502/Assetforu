'use client';
import { Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { formatCurrency } from '@/lib/currency';
import { useUIStore } from '@/store';
import { fetchPublicStoreItem } from '@/lib/publicStore';
import type { StoreItem } from '@/types';

function ProductRedeemSuccessContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { currency } = useUIStore();

  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [dynamicItem, setDynamicItem] = useState<StoreItem | null>(null);
  const [dynamicLoading, setDynamicLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setDynamicLoading(true);
    fetchPublicStoreItem(String(id))
      .then((row) => {
        if (cancelled) return;
        setDynamicItem(row && row.type === 'product' ? row : null);
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

  const etaRaw = searchParams.get('eta');
  const orderId = searchParams.get('orderId') || '';
  const etaDate = etaRaw ? new Date(etaRaw) : null;
  const etaLabel = etaDate && !Number.isNaN(etaDate.getTime()) ? etaDate.toLocaleDateString() : 'within 5 business days';

  const display = dynamicItem
      ? { name: dynamicItem.title, image: dynamicItem.image_url, credits: Number(dynamicItem.credit_cost || 0) }
      : null;

  return (
    <div className="page-enter mx-auto max-w-4xl px-6 py-12">
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <h1 className="text-3xl font-black text-emerald-800">Order Placed</h1>
        <p className="mt-3 text-slate-700">
          You will receive a confirmation and delivery date shortly.
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Expected delivery: <strong>{etaLabel}</strong>
        </p>
        {!!orderId && (
          <p className="mt-2 text-sm text-slate-700">
            Order ID: <strong>{orderId}</strong>
          </p>
        )}

        {display ? (
          <div className="mt-6 flex items-center justify-center gap-4">
            <img src={display.image} alt={display.name} className="h-16 w-16 rounded-xl object-cover" />
            <div className="text-left">
              <p className="text-sm font-bold text-slate-900">{display.name}</p>
              <p className="text-xs text-slate-500">{formatCurrency(display.credits, currency)} · {display.credits} Credits</p>
            </div>
          </div>
        ) : (
          <div className="mt-6 text-sm text-slate-600">
            {dynamicLoading ? 'Loading order details…' : 'Order placed successfully.'}
          </div>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {!!orderId && (
            <button
              onClick={() => router.push(`/activity/${encodeURIComponent(orderId)}/order-details?orderNo=${encodeURIComponent(orderId)}`)}
              className="rounded-xl border border-slate-200 bg-white text-slate-900 px-5 py-2 text-sm font-bold hover:bg-slate-50"
            >
              View Order
            </button>
          )}
          <button
            onClick={() => router.push('/store')}
            className="rounded-xl bg-primary-700 text-white px-5 py-2 text-sm font-bold"
          >
            Back to Store
          </button>
          <button
            onClick={() => router.push('/wallet')}
            className="rounded-xl border border-primary-700 text-primary-700 px-5 py-2 text-sm font-bold"
          >
            View Wallet
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProductRedeemSuccessPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <ProductRedeemSuccessContent />
    </Suspense>
  );
}
