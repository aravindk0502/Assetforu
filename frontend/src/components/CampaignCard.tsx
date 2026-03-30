'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Campaign } from '@/types';
import { useProtectedAction } from '@/lib/useProtectedAction';
import { campaignAPI } from '@/lib/api';
import { useUIStore } from '@/store';
import { useState } from 'react';
import { MapPin, Clock, Loader2, CheckCircle } from 'lucide-react';
import clsx from 'clsx';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  campaign: Campaign;
  onParticipated?: () => void;
}

export function CampaignCard({ campaign, onParticipated }: Props) {
  const protect = useProtectedAction();
  const router = useRouter();
  const { setWalletBalance } = useUIStore();
  const [loading, setLoading] = useState(false);

  const isParticipated = !!campaign.userParticipation;
  const isClosed = campaign.status !== 'active';
  const fillPct = Math.min(100, Math.round((campaign.filled_slots / campaign.total_slots) * 100));

  const handleAccess = () => {
    protect(async () => {
      setLoading(true);
      try {
        await campaignAPI.participate(campaign.id);
        // Refresh wallet balance
        const { walletAPI } = await import('@/lib/api');
        const w = await walletAPI.get();
        setWalletBalance(w.data.data.balance);
        onParticipated?.();
        router.refresh();
      } catch (e: unknown) {
        const err = e as { response?: { data?: { message?: string } } };
        alert(err.response?.data?.message || 'Failed to access campaign');
      } finally {
        setLoading(false);
      }
    });
  };

  return (
    <div className="group bg-white rounded-2xl border border-slate-200 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col">
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <Image
          src={campaign.image_url || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800'}
          alt={campaign.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {campaign.badge && (
          <span className="absolute top-4 left-4 bg-yellow-500 text-slate-900 text-xs font-bold px-3 py-1 rounded-full shadow-lg">
            {campaign.badge}
          </span>
        )}
        {isParticipated && (
          <span className="absolute top-4 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Eligible
          </span>
        )}

        {/* Price badge overlay */}
        <div className="absolute bottom-4 right-4 bg-yellow-500 text-slate-900 font-black text-lg px-3 py-1 rounded-lg shadow-lg">
          ₹{campaign.credit_price}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-6 gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 leading-tight mb-2 group-hover:text-primary-700 transition-colors">
            {campaign.title}
          </h3>

          {campaign.location && (
            <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
              <MapPin className="w-4 h-4 text-primary-600" />
              <span>{campaign.location}</span>
            </div>
          )}

          {campaign.end_time && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Ends {formatDistanceToNow(new Date(campaign.end_time), { addSuffix: true })}</span>
            </div>
          )}
        </div>

        {/* Fill bar */}
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="flex justify-between text-xs text-slate-600 mb-2">
            <span>{campaign.filled_slots} participants</span>
            <span>{fillPct}% filled</span>
          </div>
          <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary-600 to-primary-700 transition-all duration-500"
              style={{ width: `${fillPct}%` }}
            />
          </div>
        </div>

        {/* CTA */}
        <div className="mt-auto">
          <div className="rounded-xl bg-slate-100 p-3 mb-3 text-sm text-slate-700">
            <span className="font-semibold">Chance to enter land gift campaign:</span> Participate now and increase your draw probability.
          </div>
          {isParticipated ? (
            <Link
              href={`/campaigns/${campaign.id}`}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              View Campaign Details
            </Link>
          ) : (
            <button
              onClick={handleAccess}
              disabled={loading || isClosed}
              className={clsx(
                'w-full font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2',
                isClosed
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg hover:shadow-xl'
              )}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {isClosed ? 'Campaign Closed' : `Enter with ${campaign.credit_price} credits`}
            </button>
          )}
        </div>

        <p className="text-xs text-slate-500 text-center italic">
          Each entry = Asset Credits used. No guaranteed allocation.
        </p>
      </div>
    </div>
  );
}
