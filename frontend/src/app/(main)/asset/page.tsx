'use client';

import BackNavigation from '@/components/BackNavigation';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { campaignAPI } from '@/lib/api';
import { Campaign } from '@/types';
import { useAuthStore, useUIStore } from '@/store';
import { Wallet, CreditCard, Package, Loader2, Gift, MapPin, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

export default function AssetPage() {
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const { openSignupModal, walletBalance } = useUIStore();
    const [assets, setAssets] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);

    const loadAssets = useCallback(async () => {
        setLoading(true);
        try {
            const res = await campaignAPI.list({ status: 'active', limit: 9 });
            setAssets(res.data.data);
        } catch (e) {
            setAssets([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadAssets(); }, [loadAssets]);


    const handleEntry = (campaignId: string) => {
        router.push(`/campaigns/${campaignId}`);
    };

    return (
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-10 page-enter">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8">
                <div>
                    <h1 className="section-title">Asset Marketplace</h1>
                    <p className="text-slate-500 mt-1">Purchase asset credits and enter qualified land campaigns.</p>
                </div>
                <div className="rounded-2xl border border-primary-100 bg-primary-50 p-4 flex items-center gap-3">
                    <Wallet className="w-5 h-5 text-primary-700" />
                    <div>
                        <p className="text-xs uppercase font-bold tracking-wider text-primary-700">Your Asset Credits</p>
                        <p className="text-xl font-black text-slate-900">₹{Number(walletBalance).toFixed(0)}</p>
                    </div>
                    <Link href="/wallet" className="ml-auto text-sm font-bold text-primary-700 hover:text-primary-900">Top Up</Link>
                </div>
                <div className="mt-2 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600">
                    You can browse products and services without sign in. Sign in to perform purchases and join land gift campaigns.
                </div>
            </div>

            <div className="rounded-2xl overflow-hidden border border-slate-100 mb-8">
                <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8 p-4 bg-gradient-to-r from-primary-700 to-primary-600 text-white">
                    <div className="flex items-center gap-3">
                        <Gift className="w-5 h-5" />
                        <div>
                            <p className="text-sm font-semibold">Land Gift Campaign</p>
                            <p className="text-xs text-white/80">Every campaign entry increases your draw chance.</p>
                        </div>
                    </div>
                    <button onClick={() => router.push('/campaigns')} className="btn-primary bg-white text-primary-700 hover:bg-slate-100 px-5 py-2 rounded-xl font-bold">
                        Participate Now
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="rounded-2xl p-4 bg-slate-100 animate-pulse h-56" />
                    ))}
                </div>
            ) : assets.length === 0 ? (
                <div className="text-center py-20 text-slate-500">
                    <Package className="w-16 h-16 mx-auto mb-3" />
                    <p>No assets available right now.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {assets.map((asset) => {
                        const rate = Math.ceil(asset.credit_price || 0);
                        return (
                            <div key={asset.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-lg transition-all overflow-hidden">
                                <div className="relative h-44 bg-slate-100">
                                    <img
                                        src={asset.image_url || 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800'}
                                        alt={asset.title}
                                        className="h-full w-full object-cover"
                                    />
                                    <div className="absolute top-3 left-3 bg-yellow-400 text-slate-800 text-xs font-bold px-3 py-1 rounded-full shadow">{asset.location || 'India'}</div>
                                </div>
                                <div className="p-4 space-y-3">
                                    <h2 className="font-bold text-lg text-slate-900">{asset.title}</h2>
                                    <p className="text-xs text-slate-400 uppercase tracking-widest">Land Opportunity</p>
                                    <div className="flex items-center gap-2 text-slate-500 text-xs">
                                        <MapPin className="w-4 h-4" />
                                        <span>{asset.location || 'Unknown location'}</span>
                                    </div>
                                    {asset.end_time && (
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <Clock className="w-4 h-4" />
                                            <span>Closes {formatDistanceToNow(new Date(asset.end_time), { addSuffix: true })}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                        <div>
                                            <p className="text-sm text-slate-400">Entry Cost</p>
                                            <p className="text-xl font-black text-primary-700">₹{rate} credits</p>
                                        </div>
                                        <button
                                            onClick={() => handleEntry(asset.id)}
                                            className="btn-primary bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-bold"
                                        >
                                            Buy & Enter
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
