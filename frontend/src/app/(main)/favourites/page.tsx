'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUIStore, useAuthStore } from '@/store';
import { Heart, ArrowLeft } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import Link from 'next/link';

export default function FavoritesPage() {
  const router = useRouter();
  const { favorites, toggleFavorite, currency } = useUIStore();
  const { user, token } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAuthed = !!user || !!token;

  if (!mounted) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center">
          <Heart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Sign In Required</h1>
          <p className="text-slate-600 mb-6">Please sign in to view your favorites.</p>
          <Link href="/" className="inline-block px-6 py-3 bg-primary-700 text-white rounded-lg font-semibold hover:bg-primary-800">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const getNavigationPath = (item: typeof favorites[0]) => {
    if (item.type === 'campaign') {
      return `/campaigns/${item.id}`;
    }
    if (item.type === 'property') {
      return `/land-listings/${item.id}`;
    }
    return `/store/${item.type === 'product' ? 'products' : 'services'}/${item.id}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-6 pb-20 md:pb-6">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-primary-700 font-semibold hover:text-primary-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 flex items-center gap-3">
              <Heart className="w-8 h-8 text-rose-500 fill-rose-500" />
              My Favorites
            </h1>
            <p className="text-slate-600 mt-2" suppressHydrationWarning>
              {favorites.length === 0
                ? 'You haven\'t favorited anything yet'
                : `You have ${favorites.length} favorite item${favorites.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        {/* Empty State */}
        {favorites.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
            <Heart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">No Favorites Yet</h2>
            <p className="text-slate-600 mb-6">Start adding favorites to your collection by clicking the heart icon on campaigns and products.</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/campaigns" className="px-6 py-3 bg-primary-700 text-white rounded-lg font-semibold hover:bg-primary-800">
                Explore Campaigns
              </Link>
              <Link href="/store" className="px-6 py-3 border border-slate-300 text-slate-900 rounded-lg font-semibold hover:bg-slate-50">
                Browse Store
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {favorites.map((item) => (
              <div
                key={item.id}
                className="rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition"
              >
                <div 
                  onClick={() => router.push(getNavigationPath(item))}
                  className="relative h-40 bg-slate-200 cursor-pointer"
                >
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(item);
                    }}
                    className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white shadow-sm z-10 transition-all"
                  >
                    <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                  </button>
                  <span className="absolute top-3 left-3 px-3 py-1 bg-slate-900/80 text-white text-xs font-bold rounded-full capitalize">
                    {item.type}
                  </span>
                </div>

                <div 
                  onClick={() => router.push(getNavigationPath(item))}
                  className="p-4 cursor-pointer"
                >
                  <h3 className="font-bold text-slate-900 mb-1 line-clamp-2">{item.title}</h3>
                  <p className="text-xs text-slate-500 mb-3 line-clamp-2">{item.description}</p>

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs text-slate-400">Cost</p>
                      <p className="font-bold text-slate-900">
                        {formatCurrency(item.credits, currency)}
                      </p>
                    </div>
                    {item.category && (
                      <span className="text-xs text-slate-500 px-2 py-1 bg-slate-100 rounded">
                        {item.category}
                      </span>
                    )}
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(item);
                    }}
                    className="w-full py-2 border-2 border-rose-500 text-rose-500 rounded-lg font-semibold hover:bg-rose-50 transition duration-200 flex items-center justify-center gap-2"
                  >
                    <Heart className="w-4 h-4" fill="currentColor" />
                    Remove from Favorites
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
