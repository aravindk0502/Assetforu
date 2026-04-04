'use client';

import { Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { productCatalog } from '@/data/storeCatalog';
import { formatCurrency } from '@/lib/currency';
import { useUIStore } from '@/store';

function ProductRedeemSuccessContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { currency } = useUIStore();

  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const product = useMemo(() => productCatalog.find((item) => item.id === id), [id]);

  const etaRaw = searchParams.get('eta');
  const etaDate = etaRaw ? new Date(etaRaw) : null;
  const etaLabel = etaDate && !Number.isNaN(etaDate.getTime()) ? etaDate.toLocaleDateString() : 'within 5 business days';

  if (!product) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-16 text-center">
        <p className="text-slate-500">Order placed successfully.</p>
      </div>
    );
  }

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

        <div className="mt-6 flex items-center justify-center gap-4">
          <img src={product.image} alt={product.name} className="h-16 w-16 rounded-xl object-cover" />
          <div className="text-left">
            <p className="text-sm font-bold text-slate-900">{product.name}</p>
            <p className="text-xs text-slate-500">{formatCurrency(product.credits, currency)} · {product.credits} Credits</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
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
