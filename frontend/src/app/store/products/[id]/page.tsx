'use client';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { productCatalog, servicesCatalog } from '@/data/storeCatalog';
import { useAuthStore, useCartStore, useUIStore } from '@/store';
import { formatCurrency } from '@/lib/currency';
import { Heart } from 'lucide-react';
import BackNavigation from '@/components/BackNavigation';
import { fetchPublicStoreItem } from '@/lib/publicStore';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const { walletBalance, setWalletBalance, addTransaction, addActivity, openSignupModal, currency, favorites, toggleFavorite } = useUIStore();
  const { addToCart } = useCartStore();
  const [message, setMessage] = useState('');
  const [apiLoading, setApiLoading] = useState(false);
  const [apiProduct, setApiProduct] = useState<null | {
    id: string;
    name: string;
    credits: number;
    description: string;
    image: string;
    category: string;
  }>(null);

  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const staticProduct = useMemo(
    () => productCatalog.find((item) => item.id === id),
    [id]
  );

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
          image: row.image_url,
          category: row.category || 'Other',
        });
      })
      .finally(() => setApiLoading(false));
  }, [id, staticProduct]);

  const product = staticProduct
    ? {
      id: staticProduct.id,
      name: staticProduct.name,
      credits: staticProduct.credits,
      description: staticProduct.description,
      image: staticProduct.image,
      category: staticProduct.category || 'Store',
    }
    : apiProduct;

  const similarProducts = useMemo(() => {
    if (!product || !staticProduct) return [];
    const sameCategory = productCatalog.filter((item) => item.category === staticProduct.category && item.id !== staticProduct.id);
    const fallback = productCatalog.filter((item) => item.id !== product.id);
    return (sameCategory.length ? sameCategory : fallback).slice(0, 3);
  }, [product, staticProduct]);

  const recommendedServices = useMemo(() => servicesCatalog.slice(0, 4), []);

  const isAuthed = !!user || !!token;

  const handleUseCredits = () => {
    if (!product) return;
    if (!isAuthed) {
      openSignupModal(() => router.push(`/store/products/${product.id}`));
      return;
    }
    router.push(`/store/products/${product.id}/redeem`);
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (!isAuthed) {
      openSignupModal(() => router.push(`/store/products/${product.id}`));
      return;
    }
    addToCart({
      id: `${product.id}-cart`,
      item_id: product.id,
      title: product.name,
      description: product.description,
      image_url: product.image,
      type: 'product',
      category: product.category || 'Store',
      credit_cost: product.credits,
      quantity: 1,
      subtotal: product.credits,
    });
  };

  if (!product) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-16 text-center">
        <p className="text-slate-500">{apiLoading ? 'Loading product…' : 'Product not found.'}</p>
      </div>
    );
  }

  return (
    <div className="page-enter mx-auto max-w-6xl px-6 py-12">
      <BackNavigation />
      {message && (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
          {message}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div>
          <div className="relative">
            <img src={product.image} alt={product.name} className="h-80 w-full rounded-3xl object-cover border border-slate-200" />
            <button
              type="button"
              onClick={() =>
                toggleFavorite({
                  id: product.id,
                  title: product.name,
                  description: product.description,
                  image_url: product.image,
                  type: 'product',
                  category: product.category || 'Store',
                  credits: product.credits,
                })
              }
              className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/90 flex items-center justify-center text-slate-600 hover:text-rose-500"
            >
              <Heart className={`w-5 h-5 ${favorites.some((f) => f.id === product.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>
          </div>
          <div className="mt-6">
            <p className="text-xs uppercase tracking-[0.25em] text-emerald-600">{product.category}</p>
            <h1 className="mt-2 text-3xl font-black text-slate-900">{product.name}</h1>
            <p className="mt-3 text-slate-600">{product.description}</p>
            <div className="mt-5 flex items-center gap-3">
              <span className="text-3xl font-black text-slate-900">{formatCurrency(product.credits, currency)}</span>
              <span className="text-xs font-bold uppercase text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
                {product.credits} Credits
              </span>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={handleUseCredits}
                className="rounded-xl bg-primary-700 text-white px-6 py-3 text-sm font-bold"
              >
                Redeem with Credits
              </button>
              <button
                onClick={handleAddToCart}
                className="rounded-xl border border-primary-700 text-primary-700 px-6 py-3 text-sm font-bold"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>

        <aside className="rounded-3xl border border-slate-200 bg-white p-5 h-fit">
          <h2 className="text-lg font-black text-slate-900">Similar Products</h2>
          <div className="mt-4 space-y-3">
            {similarProducts.map((item) => (
              <button
                key={item.id}
                onClick={() => router.push(`/store/products/${item.id}`)}
                className="w-full text-left rounded-2xl border border-slate-200 overflow-hidden hover:-translate-y-0.5 transition"
              >
                <div className="flex gap-3 items-center p-3">
                  <img src={item.image} alt={item.name} className="h-14 w-14 rounded-xl object-cover" />
                  <div>
                    <p className="text-sm font-bold text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">{formatCurrency(item.credits, currency)} · {item.credits} Credits</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </aside>
      </div>

      <section className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black text-slate-900">Recommended Services</h2>
          <button onClick={() => router.push('/store')} className="text-xs font-bold text-primary-700">View All</button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {recommendedServices.map((service) => (
            <button
              key={service.id}
              onClick={() => router.push(`/store/services/${service.id}`)}
              className="min-w-[240px] text-left rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-sm hover:-translate-y-0.5 transition"
            >
              <img src={service.image} alt={service.name} className="h-36 w-full object-cover" />
              <div className="p-4">
                <h3 className="text-sm font-bold text-slate-900">{service.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{formatCurrency(service.credits, currency)} · {service.credits} Credits</p>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
