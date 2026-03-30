'use client';

import { useAuthStore, useUIStore } from '@/store';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import BackNavigation from '@/components/BackNavigation';

export default function ActivityPage() {
    const user = useAuthStore((state) => state.user);
    const { activity } = useUIStore();
    const [activeTab, setActiveTab] = useState<'tickets' | 'purchases' | 'all'>('tickets');

    const { tickets, purchases } = useMemo(() => {
        const tickets = activity.filter((item) => typeof item.ticketNumber === 'number');
        const purchases = activity.filter((item) => typeof item.ticketNumber !== 'number');
        return { tickets, purchases };
    }, [activity]);

    const visible = activeTab === 'tickets' ? tickets : activeTab === 'purchases' ? purchases : activity;

    if (!user) {
        return (
            <div className="mx-auto max-w-4xl px-6 py-20 text-center">
                <p className="text-xl font-semibold text-slate-700">Sign in to view your activity</p>
                <p className="text-slate-500 mt-2">Participation records are stored after you buy credits.</p>
                <Link href="/" className="mt-6 inline-block bg-primary-700 text-white px-6 py-3 rounded-xl font-bold">Go to Home</Link>
            </div>
        );
    }

    return (
        <div className="page-enter mx-auto max-w-6xl px-6 py-10">            <BackNavigation />            <h1 className="text-3xl font-black text-slate-900 mb-3">My Activity</h1>
            <p className="text-sm text-slate-600 mb-6">Campaigns you participated in and credits allocated</p>

            {activity.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
                    <p className="text-slate-500">No activity yet. Purchase Asset Credits to participate in campaigns.</p>
                    <Link href="/" className="mt-4 inline-block text-primary-700 font-bold hover:underline">Explore Campaigns</Link>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                        {([
                            { id: 'tickets', label: `Tickets (${tickets.length})` },
                            { id: 'purchases', label: `Asset Purchases (${purchases.length})` },
                            { id: 'all', label: `All (${activity.length})` },
                        ] as const).map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`rounded-xl px-4 py-2 text-sm font-bold ${activeTab === tab.id
                                        ? 'bg-primary-700 text-white'
                                        : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {visible.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-slate-500">
                            {activeTab === 'tickets'
                                ? 'No tickets yet. Participate in a land gift campaign to generate tickets.'
                                : activeTab === 'purchases'
                                    ? 'No asset purchases yet.'
                                    : 'No activity yet.'}
                        </div>
                    ) : (
                        visible.map((item) => {
                            const isTicket = typeof item.ticketNumber === 'number';
                            const orderNumber = `ORD-${new Date(item.createdAt).getTime().toString().slice(-8)}`;
                            return (
                                <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-4 grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                                    <div>
                                        <p className="font-semibold text-slate-800">{item.campaignName}</p>
                                        <p className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
                                        {isTicket && (
                                            <p className="text-xs font-semibold text-primary-700">Ticket #{item.ticketNumber}</p>
                                        )}
                                        {!isTicket && (
                                            <p className="text-xs font-semibold text-emerald-700">Order # {orderNumber}</p>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-700">
                                            Credits used: ₹{isTicket ? 0 : item.creditsUsed}
                                        </p>
                                        <p className="text-sm text-slate-700">Status: {item.status}</p>
                                    </div>
                                    <div className="text-right md:text-left">
                                        {isTicket ? (
                                            <Link href={`/activity/${item.id}/ticket-details?ticketNo=Ticket #${item.ticketNumber}`} className="text-primary-700 font-semibold hover:underline">View Campaign</Link>
                                        ) : (
                                            <Link href={`/activity/${item.id}/order-details?orderNo=${orderNumber}`} className="text-primary-700 font-semibold hover:underline">Order Details</Link>
                                        )}
                                    </div>
                                </div>
                            );
                        }))}
                </div>
            )}
        </div>
    );
}
