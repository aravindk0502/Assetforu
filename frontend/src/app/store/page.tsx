'use client';

import { Suspense } from 'react';
import { useMemo, useState, useEffect } from 'react';
import { useAuthStore, useCartStore, useUIStore } from '@/store';
import { useRouter, useSearchParams } from 'next/navigation';
import { BadgeCheck, Sparkles, Shield, Briefcase, Landmark, Leaf, Heart } from 'lucide-react';
import { productCatalog, servicesCatalog } from '@/data/storeCatalog';
import { formatCurrency } from '@/lib/currency';
import { addToast } from '@/components/Toast';


const serviceIconMap = {
    Shield,
    Briefcase,
    Landmark,
    Leaf,
};

const adCards = [
    {
        title: 'Premium Land Opportunities',
        text: 'Curated opportunities across growth corridors, verified and ready to close.',
        cta: 'Explore Deals',
    },
    {
        title: 'Exclusive Advisor Hours',
        text: 'Book a slot with senior advisors for strategic land planning.',
        cta: 'Book Now',
    },
];

function StoreContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const user = useAuthStore((state) => state.user);
    const token = useAuthStore((state) => state.token);
    const { walletBalance, setWalletBalance, addTransaction, addActivity, openSignupModal, favorites, toggleFavorite, currency } = useUIStore();
    const { addToCart } = useCartStore();
    const [message, setMessage] = useState('');
    const [activeTab, setActiveTab] = useState<'products' | 'services'>('products');
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('All');
    const [visibleCount, setVisibleCount] = useState(9);

    // Read tab from URL params on mount
    useEffect(() => {
        const tabParam = searchParams.get('tab');
        if (tabParam === 'services' || tabParam === 'products') {
            setActiveTab(tabParam);
        }
    }, [searchParams]);

    // For search - combine both products and services
    const allItems = useMemo(() => [...productCatalog, ...servicesCatalog], []);

    // For tab display - use only active tab items
    const items = useMemo(() => (activeTab === 'products' ? productCatalog : servicesCatalog), [activeTab]);

    // Categories based on active tab
    const categories = useMemo(() => {
        const cats = Array.from(new Set(items.map((i) => i.category || 'Other')));
        return ['All', ...cats];
    }, [items]);

    // Search across ALL items (products and services combined)
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();

        // If search query is empty, show items from active tab
        if (!q) {
            return items.filter((item) => {
                const inCategory = category === 'All' || item.category === category;
                return inCategory;
            });
        }

        // If search query exists, search across ALL items
        return allItems.filter((item) => {
            const matchesSearch =
                item.name.toLowerCase().includes(q) ||
                item.description.toLowerCase().includes(q);
            const inCategory = category === 'All' || item.category === category;
            return matchesSearch && inCategory;
        });
    }, [query, category, items, allItems]);

    const visibleItems = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);

    const isAuthed = !!user || !!token;

    const handleUseCredits = (item: { id: string; name: string; credits: number }, type: 'product' | 'service') => {
        if (!isAuthed) {
            openSignupModal(() => router.push('/store'));
            return;
        }
        if (type === 'product') {
            router.push(`/store/products/${item.id}/redeem?tab=products`);
            return;
        }
        if (type === 'service') {
            router.push(`/store/services/${item.id}/redeem?tab=services`);
            return;
        }
    };

    const handleAddToCart = (item: typeof productCatalog[number] | typeof servicesCatalog[number]) => {
        if (!isAuthed) {
            openSignupModal(() => router.push('/store'));
            return;
        }
        addToCart({
            id: `${item.id}-cart`,
            item_id: item.id,
            title: item.name,
            description: item.description,
            image_url: item.image,
            type: activeTab === 'products' ? 'product' : 'service',
            category: 'Store',
            credit_cost: item.credits,
            quantity: 1,
            subtotal: item.credits,
        });
    };

    return (
        <div className="page-enter">
            <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 text-white">
                <div
                    className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage:
                            'radial-gradient(circle at top left, rgba(16,185,129,0.4), transparent 55%), radial-gradient(circle at 80% 20%, rgba(59,130,246,0.4), transparent 40%)',
                    }}
                />
                <div className="mx-auto max-w-7xl px-6 lg:px-10 py-14 relative">
                    <div className="max-w-2xl">
                        <p className="text-xs uppercase tracking-[0.25em] text-emerald-200 mb-3">AssetForU Store</p>
                        <h1 className="text-4xl md:text-5xl font-black leading-tight">Premium products & services for land investors</h1>
                        <p className="mt-4 text-slate-200">Redeem Asset Credits for verified land solutions, advisory services, and premium access packs.</p>
                        <div className="mt-6 flex flex-wrap gap-3">
                            <button
                                className={`rounded-full px-6 py-2 text-sm font-bold transition ${activeTab === 'products'
                                        ? 'bg-white text-slate-900'
                                        : 'border border-white/40 text-white hover:bg-white hover:text-slate-900'
                                    }`}
                                type="button"
                                onClick={() => {
                                    setActiveTab('products');
                                    setCategory('All');
                                    setQuery('');
                                    setVisibleCount(9);
                                    window.scrollTo({ top: 520, behavior: 'smooth' });
                                }}
                            >
                                Explore Products
                            </button>
                            <button
                                className={`rounded-full px-6 py-2 text-sm font-bold transition ${activeTab === 'services'
                                        ? 'bg-white text-slate-900'
                                        : 'border border-white/40 text-white hover:bg-white hover:text-slate-900'
                                    }`}
                                type="button"
                                onClick={() => {
                                    setActiveTab('services');
                                    setCategory('All');
                                    setQuery('');
                                    setVisibleCount(9);
                                    window.scrollTo({ top: 520, behavior: 'smooth' });
                                }}
                            >
                                View Services
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <div className="mx-auto max-w-7xl px-6 lg:px-10 py-10">
                {message && (
                    <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
                        {message}
                    </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900">Asset Store</h2>
                        <p className="text-slate-500">Choose from curated products and services aligned with land wealth strategy.</p>
                    </div>
                    <div className="flex gap-2">
                        {(['products', 'services'] as const).map((tab) => (
                            <button
                                key={tab}
                                type="button"
                                onClick={() => setActiveTab(tab)}
                                className={`rounded-full px-5 py-2 text-sm font-bold transition ${activeTab === tab
                                        ? 'bg-primary-700 text-white'
                                        : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                {tab === 'products' ? 'Products' : 'Services'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-8">
                    <div className="space-y-4">
                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                            <input
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value);
                                    setVisibleCount(9);
                                }}
                                placeholder="Search products and services..."
                                className="w-full bg-transparent text-sm outline-none"
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => {
                                        setCategory(cat);
                                        setVisibleCount(9);
                                    }}
                                    className={`rounded-full px-4 py-2 text-xs font-bold whitespace-nowrap ${category === cat
                                            ? 'bg-slate-900 text-white'
                                            : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                        <div className="text-xs text-slate-500">
                            {filtered.length === 0 ? 'No results found matching your search or filter.' : `Showing ${Math.min(filtered.length, visibleCount)} of ${filtered.length} items`}
                        </div>
                    </div>
                </div>

                {activeTab === 'products' && !query && (
                    <section className="mb-10">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-black text-slate-900">New Arrivals</h3>
                            <button
                                className="text-sm font-bold text-primary-700"
                                type="button"
                                onClick={() => {
                                    setActiveTab('products');
                                    setCategory('All');
                                    setQuery('');
                                    setVisibleCount(9);
                                    const target = document.getElementById('store-list');
                                    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }}
                            >
                                Show All
                            </button>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-2">
                            {productCatalog.slice(0, 6).map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => router.push(`/store/products/${item.id}`)}
                                    className="min-w-[220px] text-left rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden hover:-translate-y-0.5 transition"
                                >
                                    <img src={item.image} alt={item.name} className="h-40 w-full object-cover" />
                                    <div className="p-4">
                                        <p className="text-sm font-bold text-slate-900">{item.name}</p>
                                        <p className="text-xs text-slate-500 mt-1">{formatCurrency(item.credits, currency)} · {item.credits} Credits</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </section>
                )}

                {!query && (
                    <div className="grid gap-6 lg:grid-cols-[2fr_1fr] mb-10">
                        <div className="rounded-3xl bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 p-8 text-white relative overflow-hidden">
                            <div className="absolute right-6 top-6 w-24 h-24 rounded-full bg-white/20" />
                            <p className="text-xs uppercase tracking-[0.3em] mb-3">Exclusive Pack</p>
                            <h3 className="text-2xl font-black">Land Gift Campaign Boost</h3>
                            <p className="mt-2 text-white/90">Increase your campaign eligibility with premium credits and advisory support.</p>
                            <button className="mt-6 rounded-full bg-white text-slate-900 px-5 py-2 text-sm font-bold">Upgrade Now</button>
                        </div>
                        <div className="grid gap-4">
                            {adCards.map((card) => (
                                <div key={card.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                                    <h4 className="text-lg font-black text-slate-900">{card.title}</h4>
                                    <p className="text-sm text-slate-500 mt-2">{card.text}</p>
                                    <button className="mt-4 text-sm font-bold text-primary-700">{card.cta}</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Mobile Quick Switch */}
                <div className="lg:hidden flex gap-2 mb-6">
                    <button
                        onClick={() => {
                            if (activeTab !== 'products') {
                                setActiveTab('products');
                                setCategory('All');
                                setQuery('');
                                setVisibleCount(9);
                            }
                        }}
                        className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold transition ${activeTab === 'products'
                            ? 'bg-primary-700 text-white'
                            : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                        📦 Products
                    </button>
                    <button
                        onClick={() => {
                            if (activeTab !== 'services') {
                                setActiveTab('services');
                                setCategory('All');
                                setQuery('');
                                setVisibleCount(9);
                            }
                        }}
                        className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold transition ${activeTab === 'services'
                            ? 'bg-primary-700 text-white'
                            : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                        🛎️ Services
                    </button>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1fr_250px]">
                    {/* Main Content */}
                    <div id="store-list">
                        {visibleItems.length === 0 ? (
                            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
                                <p className="text-xl font-bold text-slate-700">No results found</p>
                                <p className="text-slate-500 mt-2">Try adjusting your search or filter to find what you&apos;re looking for.</p>
                                {query && (
                                    <button
                                        onClick={() => {
                                            setQuery('');
                                            setVisibleCount(9);
                                        }}
                                        className="mt-4 text-sm font-bold text-primary-700 hover:underline"
                                    >
                                        Clear search
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {visibleItems.map((item) => {
                                    const isService = 'icon' in item;
                                    const itemPath = isService ? 'services' : 'products';
                                return (
                                    <div
                                        key={item.id}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => router.push(`/store/${itemPath}/${item.id}?tab=${itemPath}`)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                router.push(`/store/${itemPath}/${item.id}?tab=${itemPath}`);
                                            }
                                        }}
                                        className="group cursor-pointer rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    >
                                        <div className="relative h-44">
                                            <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                                            <div className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-700">
                                                <Sparkles className="w-3 h-3" />
                                                {isService ? 'Service' : 'Product'}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const isFavorited = favorites.some((f) => f.id === item.id);
                                                    toggleFavorite({
                                                        id: item.id,
                                                        title: item.name,
                                                        description: item.description,
                                                        image_url: item.image,
                                                        type: isService ? 'service' : 'product',
                                                        category: item.category || 'Store',
                                                        credits: item.credits,
                                                    });
                                                    addToast(
                                                        isFavorited ? `${item.name} removed from favorites` : `${item.name} added to favorites`,
                                                        'success',
                                                        1,
                                                        !isFavorited
                                                    );
                                                }}
                                                className="absolute top-3 right-3 h-9 w-9 rounded-full bg-white/90 flex items-center justify-center text-slate-600 hover:text-red-500 transition z-10"
                                            >
                                                <Heart
                                                    className={`w-4 h-4 ${favorites.some((f) => f.id === item.id) ? 'fill-red-500 text-red-500' : ''
                                                        }`}
                                                />
                                            </button>
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition pointer-events-none" />
                                        </div>
                                        <div className="p-5 flex-1 flex flex-col">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-black text-slate-900 truncate">{item.name}</h3>
                                                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                                                </div>
                                                {isService && 'icon' in item && item.icon ? (
                                                    <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
                                                        {(() => {
                                                            const Icon = serviceIconMap[item.icon as keyof typeof serviceIconMap];
                                                            return Icon ? <Icon className="w-5 h-5" /> : null;
                                                        })()}
                                                    </div>
                                                ) : null}
                                            </div>
                                            <div className="mt-4 flex items-center gap-2">
                                                <span className="text-2xl font-black text-slate-900">{formatCurrency(item.credits, currency)}</span>
                                                <span className="text-xs font-bold uppercase text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">{item.credits} Credits</span>
                                            </div>
                                            <div className="mt-4 grid grid-cols-2 gap-2">
                                                <button
                                                    className="rounded-xl bg-primary-700 text-white py-2 text-sm font-bold hover:bg-primary-800 transition"
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (isService) {
                                                            router.push(`/store/services/${item.id}/redeem?tab=services`);
                                                        } else {
                                                            router.push(`/store/products/${item.id}/redeem?tab=products`);
                                                        }
                                                    }}
                                                >
                                                    Redeem
                                                </button>
                                                <button
                                                    className="rounded-xl border border-primary-700 text-primary-700 py-2 text-sm font-bold"
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleAddToCart(item);
                                                    }}
                                                >
                                                    Add to Cart
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            </div>
                        )}
                    </div>

                    {/* Sidebar - Switch between Products & Services */}
                    <aside className="hidden lg:block">
                        <div className="sticky top-20 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <p className="text-xs uppercase font-bold tracking-wider text-slate-500 mb-4">Quick Switch</p>
                            <div className="space-y-2">
                                <button
                                    onClick={() => {
                                        if (activeTab !== 'products') {
                                            setActiveTab('products');
                                            setCategory('All');
                                            setQuery('');
                                            setVisibleCount(9);
                                        }
                                    }}
                                    className={`w-full rounded-xl px-4 py-3 text-sm font-bold transition ${activeTab === 'products'
                                        ? 'bg-primary-700 text-white'
                                        : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    📦 All Products
                                </button>
                                <button
                                    onClick={() => {
                                        if (activeTab !== 'services') {
                                            setActiveTab('services');
                                            setCategory('All');
                                            setQuery('');
                                            setVisibleCount(9);
                                        }
                                    }}
                                    className={`w-full rounded-xl px-4 py-3 text-sm font-bold transition ${activeTab === 'services'
                                        ? 'bg-primary-700 text-white'
                                        : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    🛎️ All Services
                                </button>
                            </div>

                            <div className="mt-6 pt-4 border-t border-slate-100">
                                <p className="text-xs uppercase font-bold tracking-wider text-slate-500 mb-3">Viewing</p>
                                <div className="space-y-2 text-xs">
                                    <div className="rounded-lg bg-slate-50 p-3">
                                        <p className="font-bold text-slate-900">{activeTab === 'products' ? 'Products' : 'Services'}</p>
                                        <p className="text-slate-500 mt-1">{filtered.length} item{filtered.length !== 1 ? 's' : ''} available</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>

                {filtered.length > visibleCount && (
                    <div className="mt-8 flex justify-center">
                        <button
                            onClick={() => setVisibleCount((c) => c + 6)}
                            className="rounded-full border border-slate-300 px-6 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                        >
                            Load More
                        </button>
                    </div>
                )}

                <div className="mt-12 rounded-3xl bg-slate-900 text-white p-8 grid gap-6 lg:grid-cols-3">
                    {[
                        { title: 'Verified Listings', text: 'All offerings undergo legal and compliance checks.' },
                        { title: 'Advisor Access', text: 'Get guidance from seasoned land specialists.' },
                        { title: 'Secure Credits', text: 'Every credit is traceable and protected.' },
                    ].map((item) => (
                        <div key={item.title} className="flex items-start gap-3">
                            <BadgeCheck className="w-6 h-6 text-emerald-400" />
                            <div>
                                <p className="text-lg font-black">{item.title}</p>
                                <p className="text-sm text-white/70">{item.text}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function StorePage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading Store...</div>}>
            <StoreContent />
        </Suspense>
    );
}
