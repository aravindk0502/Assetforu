'use client';
import Image from 'next/image';
import { StoreItem } from '@/types';
import { useProtectedAction } from '@/lib/useProtectedAction';
import { storeAPI } from '@/lib/api';
import { useCartStore } from '@/store';
import { useState } from 'react';
import { ShoppingCart, Loader2, CheckCircle, Star } from 'lucide-react';
import clsx from 'clsx';

interface Props {
  item: StoreItem;
  compact?: boolean;
}

export function StoreItemCard({ item, compact }: Props) {
  const protect = useProtectedAction();
  const { setCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    protect(async () => {
      setLoading(true);
      try {
        await storeAPI.addToCart(item.id);
        const cartRes = await storeAPI.getCart();
        setCart(cartRes.data.data.items, cartRes.data.data.total_credits);
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
      } catch (e: unknown) {
        const err = e as { response?: { data?: { message?: string } } };
        alert(err.response?.data?.message || 'Failed to add to cart');
      } finally {
        setLoading(false);
      }
    });
  };

  if (compact) {
    return (
      <div className="group card p-4 flex flex-col gap-3">
        <div className="relative h-36 rounded-xl overflow-hidden bg-slate-50">
          <Image src={item.image_url} alt={item.title} fill className="object-cover transition-transform duration-300 group-hover:scale-110" sizes="240px" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">{item.category?.replace('_', ' ')}</p>
          <h3 className="font-bold text-slate-900 text-sm mt-0.5 leading-snug">{item.title}</h3>
        </div>
        <div className="flex items-center justify-between mt-auto">
          <span className="text-lg font-black text-primary-700 credit-number">₹{item.credit_cost}</span>
          <button
            onClick={handleAddToCart}
            disabled={loading || added}
            className={clsx(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all',
              added ? 'bg-green-500 text-white' : 'bg-slate-900 text-white hover:bg-primary-700'
            )}
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : added ? <CheckCircle className="w-3.5 h-3.5" /> : <ShoppingCart className="w-3.5 h-3.5" />}
            {added ? 'Added!' : 'Use Credits'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group card overflow-hidden flex flex-col">
      <div className="relative h-48 overflow-hidden">
        <Image src={item.image_url} alt={item.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 33vw" />
        {item.is_popular && (
          <span className="absolute top-3 right-3 badge bg-amber-400 text-amber-900 flex items-center gap-1">
            <Star className="w-3 h-3 fill-amber-900" /> Popular
          </span>
        )}
        <div className="absolute top-3 left-3 badge bg-white/90 text-slate-700 capitalize">
          {item.type}
        </div>
      </div>

      <div className="flex flex-col flex-1 p-5 gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase text-primary-700 tracking-wider">{item.category?.replace('_', ' ')}</p>
          <h3 className="text-lg font-bold text-slate-900 mt-0.5 leading-snug group-hover:text-primary-700 transition-colors">
            {item.title}
          </h3>
          <p className="text-sm text-slate-500 mt-1.5 line-clamp-2">{item.description}</p>
        </div>

        <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-50">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Price</p>
            <p className="text-xl font-black text-primary-700 credit-number">₹{item.credit_cost} <span className="text-xs font-normal text-slate-500">credits</span></p>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={loading || added}
            className={clsx(
              'flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all shadow-sm',
              added
                ? 'bg-green-500 text-white'
                : 'bg-primary-700 text-white hover:bg-primary-800 shadow-primary active:scale-[0.98]'
            )}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : added ? <CheckCircle className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
            {added ? 'Added to Cart!' : 'Use Credits'}
          </button>
        </div>
      </div>
    </div>
  );
}
