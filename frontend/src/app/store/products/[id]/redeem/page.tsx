'use client';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { productCatalog } from '@/data/storeCatalog';
import { useAuthStore, useUIStore } from '@/store';
import { formatCurrency } from '@/lib/currency';
import BackNavigation from '@/components/BackNavigation';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { fetchPublicStoreItem } from '@/lib/publicStore';

type DeliveryAddress = {
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
};

const loadAddress = (): DeliveryAddress => {
  if (typeof window === 'undefined') {
    return { name: '', phone: '', address: '', city: '', state: '', pincode: '' };
  }
  try {
    const raw = localStorage.getItem('af_delivery_address');
    return raw ? JSON.parse(raw) as DeliveryAddress : { name: '', phone: '', address: '', city: '', state: '', pincode: '' };
  } catch {
    return { name: '', phone: '', address: '', city: '', state: '', pincode: '' };
  }
};

export default function ProductRedeemPage() {
  const params = useParams();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const { walletBalance, setWalletBalance, addTransaction, addActivity, openSignupModal, currency } = useUIStore();
  const [address, setAddress] = useState<DeliveryAddress>(loadAddress());
  const [message, setMessage] = useState('');
  const [showTopUp, setShowTopUp] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiProduct, setApiProduct] = useState<null | { id: string; name: string; credits: number; description: string; image: string }>(null);
  const [redeemOrderId, setRedeemOrderId] = useState<string | null>(null);

  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const staticProduct = useMemo(() => productCatalog.find((item) => item.id === id), [id]);

  useEffect(() => {
    const itemId = String(id || '');
    if (!itemId) return;
    if (staticProduct) return;
    setApiLoading(true);
    fetchPublicStoreItem(itemId)
      .then((row) => {
        if (!row || row.type !== 'product') {
          setApiProduct(null);
          return;
        }
        setApiProduct({
          id: row.id,
          name: row.title,
          credits: Number(row.credit_cost || 0),
          description: row.description || '',
          image: (Array.isArray(row.image_urls) && row.image_urls[0]) || row.image_url,
        });
      })
      .finally(() => setApiLoading(false));
  }, [id, staticProduct]);

  const product = staticProduct
    ? { id: staticProduct.id, name: staticProduct.name, credits: staticProduct.credits, description: staticProduct.description, image: staticProduct.image }
    : apiProduct;
  const totalCredits = (product?.credits || 0) * quantity;

  const isAuthed = !!user || !!token;

  if (!product) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-16 text-center">
        <p className="text-slate-500">{apiLoading ? 'Loading product…' : 'Product not found.'}</p>
      </div>
    );
  }

  const handlePay = () => {
    if (!isAuthed) {
      openSignupModal(() => router.push(`/store/products/${product.id}/redeem`));
      return;
    }
    if (!address.name || !address.phone || !address.address || !address.city || !address.state || !address.pincode) {
      setMessage('Please fill all delivery details.');
      return;
    }
    if (walletBalance < totalCredits) {
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
              items: [{ item_id: product.id, title: product.name, type: 'product', credits: product.credits, quantity }],
              delivery_address: address,
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
      localStorage.setItem('af_delivery_address', JSON.stringify(address));
      setWalletBalance(walletBalance - totalCredits);
      addTransaction({ type: 'debit', description: `Redeemed ${quantity}x ${product.name} (product)`, credits: totalCredits, reference_id: nextOrderId });
      addActivity({ id: nextOrderId, campaignId: product.id, campaignName: product.name, creditsUsed: totalCredits, status: 'Completed' });
      const eta = new Date();
      const pin = address.pincode.trim();
      const days = pin.startsWith('6') ? 4 : pin ? 6 : 5;
      eta.setDate(eta.getDate() + days);
      router.push(`/store/products/${product.id}/redeem/success?eta=${encodeURIComponent(eta.toISOString())}&orderId=${encodeURIComponent(nextOrderId)}`);
    };
    void doRedeem();
  };

  return (
    <div className="page-enter mx-auto max-w-6xl px-6 py-10">
      <BackNavigation />
      <h1 className="text-3xl font-black text-slate-900 mb-2">Product Checkout</h1>
      <p className="text-slate-600 mb-8">Enter delivery details to redeem your product.</p>

      {message && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
          {message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-black text-slate-900">Delivery Address</h2>
              <p className="text-xs text-slate-500">Change or confirm your delivery details.</p>
            </div>
            <span className="text-xs text-primary-700 font-semibold">Change</span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-xs font-bold uppercase text-slate-500">Full Name</label>
              <input
                value={address.name}
                onChange={(e) => setAddress({ ...address, name: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-slate-500">Phone Number</label>
              <input
                value={address.phone}
                onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                placeholder="Phone number"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-slate-500">Pincode</label>
              <input
                value={address.pincode}
                onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                placeholder="Pincode"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold uppercase text-slate-500">Address</label>
              <input
                value={address.address}
                onChange={(e) => setAddress({ ...address, address: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                placeholder="Street address, locality"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-slate-500">City</label>
              <input
                value={address.city}
                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                placeholder="City"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-slate-500">State</label>
              <input
                value={address.state}
                onChange={(e) => setAddress({ ...address, state: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                placeholder="State"
              />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm h-fit">
          <h2 className="text-lg font-black text-slate-900 mb-4">Order Summary</h2>
          <div className="flex items-center gap-3">
            <img src={product.image} alt={product.name} className="h-16 w-16 rounded-xl object-cover" />
            <div>
              <p className="font-bold text-slate-900">{product.name}</p>
              <p className="text-xs text-slate-500">{formatCurrency(product.credits, currency)} · {product.credits} Credits</p>
            </div>
          </div>
          <div className="mt-4 border-t border-slate-100 pt-4 flex items-center justify-between">
            <span className="text-sm text-slate-500">Total</span>
            <span className="text-xl font-black text-primary-700">{formatCurrency(totalCredits, currency)}</span>
          </div>
          <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
            <span className="text-sm text-slate-500">Quantity</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="h-8 w-8 rounded-lg border border-slate-200 text-slate-700 disabled:opacity-50"
              >
                −
              </button>
              <span className="min-w-[40px] text-center font-semibold text-slate-900">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                disabled={quantity >= 20}
                className="h-8 w-8 rounded-lg border border-slate-200 text-slate-700 disabled:opacity-50"
              >
                +
              </button>
            </div>
          </div>
          <button
            onClick={handlePay}
            className="mt-5 w-full rounded-xl bg-primary-700 text-white py-3 font-bold"
          >
            Redeem Now
          </button>
          <p className="mt-3 text-xs text-slate-500">Delivery details are required only for products.</p>
        </div>
      </div>

      {showTopUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <h3 className="text-xl font-black text-slate-900">Insufficient Credits</h3>
            <p className="text-sm text-slate-600 mt-2">
              You need more credits to redeem this product. Buy additional credits to continue.
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
