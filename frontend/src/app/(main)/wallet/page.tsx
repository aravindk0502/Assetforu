'use client';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { useAuthStore, useUIStore } from '@/store';
import { formatCurrency } from '@/lib/currency';
import Link from 'next/link';
import BackNavigation from '@/components/BackNavigation';

export default function WalletPage() {
    const user = useAuthStore((state) => state.user);
    const { walletBalance, transactions, currency } = useUIStore();

    if (!user) {
        return (
            <div className="mx-auto max-w-4xl px-6 py-16 text-center">
                <p className="text-xl font-semibold text-slate-700">Sign in to access your wallet.</p>
                <p className="text-slate-500 mt-2">Asset Credits are recorded here after checkout.</p>
                <Link href="/" className="mt-6 inline-block bg-primary-700 text-white px-6 py-3 rounded-xl font-bold">Home</Link>
            </div>
        );
    }

    return (
        <div className="page-enter mx-auto max-w-6xl px-6 py-10">
            <BackNavigation />
            <h1 className="text-3xl font-black text-slate-900 mb-2">My Wallet</h1>
            <p className="text-slate-600 mb-8">Total Asset Credits and transactions.</p>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                    <p className="text-sm text-slate-500 uppercase tracking-wide">Total Credits</p>
                    <p className="text-4xl font-black text-primary-700 mt-2">{formatCurrency(walletBalance, currency)}</p>
                    <p className="text-xs text-slate-500 mt-2">Asset Credits stored in wallet.</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                    <p className="text-sm text-slate-500 uppercase tracking-wide">Buy Asset Credits</p>
                    <p className="mt-2 text-lg font-bold text-slate-900">Use credits for Store products & services</p>
                    <p className="text-xs text-slate-500 mt-2">
                        Credits purchased here are redeemable only in the Asset Store (products and services).
                    </p>
                    <Link
                        href="/wallet/buy"
                        className="mt-4 inline-flex items-center justify-center rounded-xl bg-primary-700 text-white px-4 py-2 text-sm font-bold"
                    >
                        Buy for Store
                    </Link>
                </div>

                <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6">
                    <h2 className="text-xl font-bold text-slate-900 mb-4">Transaction History</h2>
                    {transactions.length === 0 ? (
                        <p className="text-slate-500">No transactions yet. Complete a campaign purchase to add credits.</p>
                    ) : (
                        <div className="space-y-3">
                            {transactions.map((tx) => (
                                <div key={tx.id} className="rounded-xl border border-slate-100 p-3 flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-slate-800">{tx.description}</p>
                                        <p className="text-xs text-slate-500">{new Date(tx.createdAt).toLocaleString()}</p>
                                    </div>
                                    <div className={tx.type === 'credit' ? 'text-green-600 font-black' : 'text-red-500 font-black'}>
                                        {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.credits, currency)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-8 rounded-2xl border border-primary-100 bg-primary-50 p-5 text-sm text-primary-800">
                <p>Credit history updates automatically after successful checkout. All Asset Credits are tracked in this wallet.</p>
            </div>
        </div>
    );
}
