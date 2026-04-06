'use client';

import { Suspense } from 'react';
import { useAuthStore, useUIStore } from '@/store';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import BackNavigation from '@/components/BackNavigation';
import { useMemo } from 'react';
import { campaigns } from '@/data/dreamCampaigns';

function TicketDetailsContent({ params }: { params: { id: string } }) {
    const { id } = params;
    const user = useAuthStore((state) => state.user);
    const { activity } = useUIStore();
    const searchParams = useSearchParams();
    const ticketNo = searchParams.get('ticketNo') || '';

    const ticketActivity = useMemo(() => {
        return activity.find((item) => item.id === id && typeof item.ticketNumber === 'number');
    }, [id, activity]);

    const campaignDetails = useMemo(() => {
        if (!ticketActivity) return null;
        return campaigns.find((c) => c.id === ticketActivity.campaignId);
    }, [ticketActivity]);

    if (!user) {
        return (
            <div className="mx-auto max-w-4xl px-6 py-20 text-center">
                <p className="text-xl font-semibold text-slate-700">Sign in to view ticket details</p>
                <Link href="/" className="mt-6 inline-block bg-primary-700 text-white px-6 py-3 rounded-xl font-bold">
                    Go to Home
                </Link>
            </div>
        );
    }

    if (!ticketActivity || !campaignDetails) {
        return (
            <div className="mx-auto max-w-4xl px-6 py-20 text-center">
                <p className="text-xl font-semibold text-slate-700">Ticket not found</p>
                <Link href="/activity" className="mt-6 inline-block bg-primary-700 text-white px-6 py-3 rounded-xl font-bold">
                    Back to Activity
                </Link>
            </div>
        );
    }

    const purchaseDate = new Date(ticketActivity.createdAt);

    return (
        <div className="page-enter mx-auto max-w-4xl px-6 py-10">
            <BackNavigation />

            <div className="mt-6">
                <h1 className="text-3xl font-black text-slate-900 mb-2">Campaign Participation</h1>
                <p className="text-slate-600 mb-8">View your campaign participation details and ticket information</p>

                {/* Ticket Header */}
                <div className="rounded-3xl bg-gradient-to-r from-primary-50 to-emerald-50 border border-primary-200 p-8 mb-8">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <p className="text-xs uppercase tracking-widest text-primary-600 font-bold mb-2">Participation ID</p>
                            <p className="text-4xl font-black text-slate-900">Ticket #{ticketActivity.ticketNumber}</p>
                            <p className="text-sm text-slate-600 mt-3">Unique identification for your participation</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-2">Status</p>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                <p className="text-lg font-bold text-emerald-700">{ticketActivity.status}</p>
                            </div>
                            <p className="text-sm text-slate-600 mt-3">Your participation is active and valid</p>
                        </div>
                    </div>
                </div>

                {/* Campaign Details */}
                <div className="rounded-3xl border border-slate-200 bg-white p-8 mb-8">
                    <h2 className="text-2xl font-black text-slate-900 mb-6">Campaign Details</h2>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <img
                                src={campaignDetails.imageUrl}
                                alt={campaignDetails.title}
                                className="rounded-2xl w-full h-64 object-cover"
                            />
                        </div>

                        <div className="space-y-5">
                            <div>
                                <p className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-1">Campaign Name</p>
                                <p className="text-2xl font-bold text-slate-900">{campaignDetails.title}</p>
                            </div>

                            <div>
                                <p className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-1">Location</p>
                                <p className="text-lg text-slate-700">{campaignDetails.location}</p>
                            </div>

                            <div>
                                <p className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-1">Description</p>
                                <p className="text-slate-700">{campaignDetails.description}</p>
                            </div>

                            <div>
                                <p className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-1">Entry Investment</p>
                                <p className="text-2xl font-black text-primary-700">₹{campaignDetails.creditPack} Credits</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Transaction Details */}
                <div className="rounded-3xl border border-slate-200 bg-white p-8 mb-8">
                    <h2 className="text-2xl font-black text-slate-900 mb-6">Participation Details</h2>

                    <div className="grid md:grid-cols-3 gap-6">
                        <div>
                            <p className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-2">Participation Date</p>
                            <p className="text-lg font-semibold text-slate-900">{purchaseDate.toLocaleDateString()}</p>
                            <p className="text-sm text-slate-600">{purchaseDate.toLocaleTimeString()}</p>
                        </div>

                        <div>
                            <p className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-2">Credits Used</p>
                            <p className="text-lg font-semibold text-slate-900">₹{campaignDetails.creditPack}</p>
                            <p className="text-sm text-slate-600">Deducted from wallet</p>
                        </div>

                        <div>
                            <p className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-2">Campaign Status</p>
                            <p className="text-lg font-semibold text-emerald-700">Active</p>
                            <p className="text-sm text-slate-600">Campaign ongoing</p>
                        </div>
                    </div>
                </div>

                {/* Summary */}
                <div className="rounded-2xl bg-blue-50 border border-blue-200 p-6 mb-8">
                    <p className="text-sm text-blue-950">
                        <span className="font-bold">Ticket #{ticketActivity.ticketNumber}</span> represents your confirmed participation in the <span className="font-bold">{campaignDetails.title}</span> campaign.
                        Keep this ticket safe as it&apos;s your proof of participation. You can view this ticket anytime from your Activity page.
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                        href="/activity"
                        className="flex-1 text-center rounded-xl bg-primary-700 text-white px-6 py-3 text-sm font-bold hover:bg-primary-800 transition"
                    >
                        Back to Activity
                    </Link>
                    <Link
                        href="/campaigns"
                        className="flex-1 text-center rounded-xl border-2 border-primary-700 text-primary-700 px-6 py-3 text-sm font-bold hover:bg-primary-50 transition"
                    >
                        View All Campaigns
                    </Link>
                </div>
            </div>
        </div>
    );
}
