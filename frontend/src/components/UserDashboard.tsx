'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store';
import { campaignAPI, walletAPI } from '@/lib/api';
import { Campaign, WalletData } from '@/types';
import { CampaignCard } from './CampaignCard';
import { Wallet, TrendingUp, ShoppingBag, ArrowRight, Clock, Zap } from 'lucide-react';
import clsx from 'clsx';

export function UserDashboard() {
    const { user } = useAuthStore();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [wallet, setWallet] = useState<WalletData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const [campRes, walRes] = await Promise.all([
                    campaignAPI.list({ status: 'active', limit: 4 }),
                    walletAPI.get(),
                ]);
                setCampaigns(campRes.data.data);
                setWallet(walRes.data);
            } catch (e) {
                console.error('Failed to load dashboard data:', e);
                setCampaigns([]);
                setWallet({
                    balance: user?.balance || 1000,
                    transactions: [
                        {
                            id: '1',
                            type: 'credit',
                            amount: 500,
                            credits: 500,
                            direction: 'credit' as const,
                            description: 'Initial credit (dev mode)',
                            status: 'completed',
                            created_at: new Date().toISOString(),
                        },
                    ],
                });
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [user]);

    if (!user) return null;

    return (
        <div className="page-enter">
            {/* Welcome Header */}
            <section className="px-6 lg:px-10 pt-8 pb-6">
                <div className="mx-auto max-w-7xl">
                    <div className="flex items-start justify-between gap-6">
                        <div>
                            <p className="text-sm font-bold uppercase tracking-widest text-primary-700 mb-2">Welcome Back</p>
                            <h1 className="text-4xl font-black text-slate-900">
                                Hey, {user.name || user.phone.slice(-4)}! 👋
                            </h1>
                            <p className="text-slate-500 mt-2">Manage your campaigns and credits from your personal dashboard</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Wallet Card */}
            <section className="px-6 lg:px-10 py-4">
                <div className="mx-auto max-w-7xl">
                    <div className="rounded-3xl bg-gradient-to-br from-primary-700 to-primary-600 p-8 text-white shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-primary-100 text-sm font-semibold mb-1">Available Credits</p>
                                <h2 className="text-5xl font-black">
                                    {wallet?.balance ?? user.balance ?? 0}
                                </h2>
                                <p className="text-primary-100 text-sm mt-2">Use credits to access campaigns & store</p>
                            </div>
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                                <Wallet className="w-10 h-10" />
                            </div>
                        </div>

                        <div className="mt-6 flex gap-3 flex-wrap">
                            <Link
                                href="/wallet"
                                className="inline-flex items-center gap-2 rounded-xl bg-white text-primary-700 px-5 py-2.5 font-bold hover:bg-primary-50 transition-colors"
                            >
                                <Zap className="w-4 h-4" /> Add Credits
                            </Link>
                            <Link
                                href="/wallet"
                                className="inline-flex items-center gap-2 rounded-xl border border-white/30 text-white px-5 py-2.5 font-bold hover:bg-white/10 transition-colors"
                            >
                                View History
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Quick Actions */}
            <section className="px-6 lg:px-10 py-6">
                <div className="mx-auto max-w-7xl">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Link
                            href="/campaigns"
                            className="group rounded-2xl border border-slate-200 bg-white p-6 hover:border-primary-700 hover:shadow-lg transition-all"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold uppercase text-slate-500 mb-1">Explore</p>
                                    <p className="text-lg font-black text-slate-900">View Campaigns</p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 group-hover:bg-primary-700 group-hover:text-white transition-colors">
                                    <TrendingUp className="w-6 h-6" />
                                </div>
                            </div>
                        </Link>

                        <Link
                            href="/store"
                            className="group rounded-2xl border border-slate-200 bg-white p-6 hover:border-primary-700 hover:shadow-lg transition-all"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold uppercase text-slate-500 mb-1">Shop</p>
                                    <p className="text-lg font-black text-slate-900">Asset Store</p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 group-hover:bg-primary-700 group-hover:text-white transition-colors">
                                    <ShoppingBag className="w-6 h-6" />
                                </div>
                            </div>
                        </Link>

                        <Link
                            href="/profile"
                            className="group rounded-2xl border border-slate-200 bg-white p-6 hover:border-primary-700 hover:shadow-lg transition-all"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold uppercase text-slate-500 mb-1">Profile</p>
                                    <p className="text-lg font-black text-slate-900">My Account</p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 group-hover:bg-primary-700 group-hover:text-white transition-colors">
                                    <ArrowRight className="w-6 h-6" />
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Active Campaigns */}
            <section className="px-6 lg:px-10 py-12">
                <div className="mx-auto max-w-7xl">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="section-title">Available Campaigns</h2>
                            <p className="text-slate-500 mt-1">Allocations closing soon</p>
                        </div>
                        <Link href="/campaigns" className="flex items-center gap-1.5 text-sm font-bold text-primary-700 hover:underline">
                            View all <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="rounded-2xl overflow-hidden">
                                    <div className="skeleton h-48 w-full" />
                                    <div className="p-4 space-y-3">
                                        <div className="skeleton h-5 w-3/4 rounded" />
                                        <div className="skeleton h-4 w-1/2 rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : campaigns.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>No active campaigns at the moment. Check back soon!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {campaigns.map((c) => (
                                <CampaignCard key={c.id} campaign={c} />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Recent Transactions */}
            {wallet?.transactions && wallet.transactions.length > 0 && (
                <section className="px-6 lg:px-10 py-12 bg-slate-50">
                    <div className="mx-auto max-w-7xl">
                        <h2 className="section-title mb-6">Recent Transactions</h2>

                        <div className="space-y-2">
                            {wallet.transactions.slice(0, 5).map((tx) => (
                                <div
                                    key={tx.id}
                                    className="flex items-center justify-between rounded-lg bg-white p-4 border border-slate-100 hover:shadow-sm transition-shadow"
                                >
                                    <div>
                                        <p className="font-semibold text-slate-900">{tx.description}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">{new Date(tx.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <div className={clsx('font-bold', tx.direction === 'credit' ? 'text-green-600' : 'text-red-600')}>
                                        {tx.direction === 'credit' ? '+' : '-'}{tx.credits} credits
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Link href="/wallet" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary-700 hover:underline">
                            View all transactions <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </section>
            )}
        </div>
    );
}
