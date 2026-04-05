'use client';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { useParams } from 'next/navigation';
import { useUIStore } from '@/store';
import { campaigns } from '@/data/dreamCampaigns';
import BackNavigation from '@/components/BackNavigation';
import { CheckCircle2, Ticket as TicketIcon } from 'lucide-react';

export default function TicketDetailsPage() {
    const params = useParams();
    const { activity } = useUIStore();

    const campaignId = params?.id as string;

    // Find the ticket in activity
    const ticketEntry = activity.find(
        (a) => a.campaignId === campaignId && a.ticketNumber !== undefined
    );

    const campaign = campaigns.find((item) => item.id === campaignId);

    if (!campaign) {
        return (
            <div className="mx-auto max-w-4xl px-6 py-16 text-center">
                <p className="text-slate-500">Campaign not found.</p>
            </div>
        );
    }

    if (!ticketEntry || ticketEntry.ticketNumber === undefined) {
        return (
            <div className="mx-auto max-w-4xl px-6 py-16 text-center">
                <p className="text-slate-500">Ticket not found.</p>
            </div>
        );
    }

    const purchaseDate = new Date(ticketEntry.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <div className="page-enter mx-auto max-w-4xl px-6 py-14">
            <BackNavigation />

            <div className="mt-6 rounded-3xl border border-green-200 bg-green-50 p-8">
                {/* Success Header */}
                <div className="text-center mb-8">
                    <div className="inline-block">
                        <CheckCircle2 className="w-16 h-16 text-green-600" />
                    </div>
                    <h1 className="mt-4 text-3xl font-black text-green-800">Ticket Confirmed</h1>
                    <p className="mt-2 text-slate-700">Your campaign entry is confirmed</p>
                </div>

                {/* Ticket Card */}
                <div className="mt-8 rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">{campaign.title}</h2>
                            <p className="text-sm text-slate-500 mt-1">{campaign.description}</p>
                        </div>
                        <div className="text-right">
                            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                                <TicketIcon className="w-4 h-4" />
                                Ticket #{ticketEntry.ticketNumber}
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 border-t border-slate-200 pt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-xs uppercase text-slate-500 font-semibold">Ticket Number</p>
                            <p className="mt-1 text-xl font-bold text-slate-900">#{ticketEntry.ticketNumber}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase text-slate-500 font-semibold">Status</p>
                            <p className="mt-1 text-sm font-bold text-green-700">{ticketEntry.status}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase text-slate-500 font-semibold">Purchase Date</p>
                            <p className="mt-1 text-sm font-bold text-slate-900">{purchaseDate}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase text-slate-500 font-semibold">Credits Used</p>
                            <p className="mt-1 text-sm font-bold text-slate-900">{ticketEntry.creditsUsed}</p>
                        </div>
                    </div>
                </div>

                {/* Campaign Info */}
                <div className="mt-6 bg-white rounded-2xl border border-slate-200 p-6">
                    <h3 className="font-bold text-slate-900 mb-4">Campaign Details</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-600">Location:</span>
                            <span className="font-semibold text-slate-900">{campaign.location}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-600">Credit Pack Value:</span>
                            <span className="font-semibold text-slate-900">{campaign.creditPack} Credits</span>
                        </div>
                    </div>
                </div>

                {/* Message */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-center">
                    <p className="text-sm text-blue-800">
                        Keep this ticket number safe. You&apos;ll need it for the upcoming draw results.
                    </p>
                </div>

                {/* Actions */}
                <div className="mt-8 flex gap-3 justify-center">
                    <button
                        onClick={() => window.history.back()}
                        className="rounded-xl border border-slate-300 text-slate-700 py-2 px-6 font-bold hover:bg-slate-50 transition"
                    >
                        Back
                    </button>
                </div>
            </div>
        </div>
    );
}
