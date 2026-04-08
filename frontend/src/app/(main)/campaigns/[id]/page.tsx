'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore, useUIStore } from '@/store';
import { campaigns } from '@/data/dreamCampaigns';
import { campaignAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/currency';
import BackNavigation from '@/components/BackNavigation';
import { AdsBadge } from '@/components/AdsBadge';
import { MapPin, MessageCircle, Phone } from 'lucide-react';
import { parseCampaignImages } from '@/lib/campaignImages';
import { CampaignImageCarousel } from '@/components/CampaignImageCarousel';

export default function CampaignDetailPage() {
  const router = useRouter();
  const params = useParams();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const { openSignupModal, currency } = useUIStore();
  const [quantity, setQuantity] = useState(1);
  const [remainingLimit, setRemainingLimit] = useState<number | null>(null);
  const [limitMessage, setLimitMessage] = useState('');
  const [apiCampaign, setApiCampaign] = useState<null | {
    id: string;
    title: string;
    description: string;
    location: string;
    credit_price: number;
    image_url?: string;
    image_urls?: string[];
  }>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const isDevUser = !!user?.id?.startsWith('dev_');

  const campaign = useMemo(() => campaigns.find((item) => item.id === params?.id), [params?.id]);

  useEffect(() => {
    if (campaign) return;
    const id = String(params?.id || '');
    if (!id) return;
    setApiLoading(true);
    campaignAPI
      .get(id)
      .then((res) => setApiCampaign(res.data?.data || null))
      .catch(() => setApiCampaign(null))
      .finally(() => setApiLoading(false));
  }, [campaign, params?.id]);

  useEffect(() => {
    const campaignId = campaign?.id || apiCampaign?.id;
    if (!campaignId) return;
    const loadLimit = async () => {
      if (isDevUser) {
        try {
          const raw = localStorage.getItem('af_dev_campaign_purchases');
          const map = raw ? JSON.parse(raw) as Record<string, number> : {};
          const purchased = map[campaignId] || 0;
          const remaining = Math.max(0, 3 - purchased);
          setRemainingLimit(remaining);
          if (remaining <= 0) {
            setLimitMessage('Maximum participation limit reached for this campaign');
          } else if (remaining < 3) {
            setLimitMessage(`You can access up to ${remaining} more for this campaign`);
          } else {
            setLimitMessage('');
          }
        } catch {
          setRemainingLimit(3);
          setLimitMessage('');
        }
        return;
      }
      try {
        const res = await campaignAPI.limit(campaignId);
        const remaining = Number(res.data?.data?.remaining_limit ?? 3);
        setRemainingLimit(remaining);
        if (remaining <= 0) {
          setLimitMessage('Maximum participation limit reached for this campaign');
        } else if (remaining < 3) {
          setLimitMessage(`You can access up to ${remaining} more for this campaign`);
        } else {
          setLimitMessage('');
        }
      } catch {
        setRemainingLimit(3);
        setLimitMessage('');
      }
    };
    if (token || user) loadLimit();
    else setRemainingLimit(3);
    const onPurchase = () => loadLimit();
    window.addEventListener('campaign:purchase', onPurchase);
    return () => {
      window.removeEventListener('campaign:purchase', onPurchase);
    };
  }, [campaign?.id, apiCampaign?.id, token, user, isDevUser]);

  useEffect(() => {
    if (remainingLimit === null) return;
    if (remainingLimit <= 0) return;
    if (quantity > remainingLimit) setQuantity(remainingLimit);
  }, [remainingLimit, quantity]);

  if (!campaign && apiLoading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16 text-center">
        <p className="text-slate-500">Loading campaign…</p>
      </div>
    );
  }

  if (!campaign && !apiCampaign) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16 text-center">
        <p className="text-slate-500">Campaign not found.</p>
      </div>
    );
  }

  const effective = campaign
    ? {
      id: campaign.id,
      title: campaign.title,
      description: campaign.description,
      location: campaign.location,
      images: campaign.images || [campaign.imageUrl],
      imageUrl: campaign.imageUrl,
      creditPack: campaign.creditPack,
      contactPhone: campaign.contactPhone,
      whatsappNumber: campaign.whatsappNumber,
      mapUrl: campaign.mapUrl,
      city: campaign.city,
      state: campaign.state,
      country: campaign.country,
      priceLabel: campaign.priceLabel,
      rich: true as const,
    }
    : (() => {
      const images = parseCampaignImages(apiCampaign?.image_urls || apiCampaign?.image_url);
      const imageUrl = images[0] || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200';
      return {
        id: apiCampaign!.id,
        title: apiCampaign!.title,
        description: apiCampaign!.description,
        location: apiCampaign!.location || 'India',
        images,
        imageUrl,
        creditPack: Number(apiCampaign!.credit_price || 0),
        contactPhone: '',
        whatsappNumber: '',
        mapUrl: undefined,
        city: apiCampaign!.location || 'India',
        state: 'India',
        country: 'India',
        priceLabel: '—',
        rich: false as const,
      };
    })();

  const totalAmount = effective.creditPack * quantity;
  const maxSelectable = remainingLimit === null ? 10 : Math.min(10, remainingLimit);

  const onProceed = () => {
    if (remainingLimit !== null && remainingLimit <= 0) return;
    if (!user) {
      openSignupModal(() => router.push(`/campaigns/${effective.id}/checkout?qty=${quantity}`));
      return;
    }
    router.push(`/campaigns/${effective.id}/checkout?qty=${quantity}`);
  };

  return (
    <div className="page-enter mx-auto max-w-6xl px-6 py-10">
      <BackNavigation />

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <div className="relative">
            {effective.images.length > 1 ? (
              <div className="w-full h-80 rounded-2xl overflow-hidden border border-slate-200">
                <CampaignImageCarousel images={effective.images} title={effective.title} />
              </div>
            ) : (
              <>
                <img src={effective.imageUrl} alt={effective.title} className="w-full h-80 rounded-2xl object-cover border border-slate-200" />
                <AdsBadge />
              </>
            )}
          </div>
          <h1 className="mt-6 text-3xl font-black text-slate-900">{effective.title}</h1>
          <p className="text-xs uppercase tracking-wide text-primary-700 font-semibold mt-2">Featured Land Opportunity</p>
          <p className="text-sm text-slate-600 mt-2">{effective.city}, {effective.state}, {effective.country}</p>
          <p className="mt-4 text-slate-600">{effective.description}</p>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-black text-slate-900">Land Details</h2>
            <div className="mt-4 grid gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Location</span>
                <span className="font-semibold text-slate-900">{effective.city}, {effective.state}, {effective.country}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Price</span>
                <span className="font-extrabold text-slate-900">{effective.priceLabel}</span>
              </div>
              {effective.rich && (
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <a
                    href={`tel:${effective.contactPhone.replace(/\\s/g, '')}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50"
                  >
                    <Phone className="h-4 w-4" /> Call
                  </a>
                  <a
                    href={`https://wa.me/${effective.whatsappNumber}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
                  >
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </a>
                  {effective.mapUrl && (
                    <a
                      href={effective.mapUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50"
                    >
                      <MapPin className="h-4 w-4" /> View Map
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-500">Credit Pack</p>
          <h2 className="text-3xl font-black text-primary-700 mt-1">{formatCurrency(effective.creditPack, currency)} Asset Credits</h2>

          <p className="text-sm text-slate-500 mt-5">Select number of credit packs</p>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {Array.from({ length: maxSelectable }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setQuantity(n)}
                className={`rounded-lg py-2 text-sm font-bold ${n === quantity ? 'bg-primary-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >{n}</button>
            ))}
          </div>

          {limitMessage && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              {limitMessage}
            </div>
          )}

          <div className="mt-6 border-t border-slate-100 pt-4">
            <p className="text-sm text-slate-600">Total</p>
            <p className="text-3xl font-black text-slate-900">{formatCurrency(totalAmount, currency)}</p>
          </div>

          <button
            onClick={onProceed}
            disabled={remainingLimit !== null && remainingLimit <= 0}
            className="mt-5 w-full rounded-xl bg-primary-700 text-white py-3 font-bold hover:bg-primary-800 transition disabled:opacity-60"
          >
            Buy {formatCurrency(effective.creditPack, currency)} Credits & Enter a free Land Gifting Campaign
          </button>

          <p className="mt-4 text-xs text-slate-500">You are purchasing Asset Credits. Campaign benefits are complimentary.</p>
        </div>
      </div>

      <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Entry Pack</p>
            <p className="mt-1 text-2xl font-black text-slate-900">{formatCurrency(effective.creditPack, currency)} Credits</p>
            <p className="mt-1 text-sm text-slate-600">Open this land’s details, then buy credits to enter the complimentary campaign.</p>
          </div>
          <button
            onClick={onProceed}
            disabled={remainingLimit !== null && remainingLimit <= 0}
            className="rounded-full bg-primary-700 text-white px-8 py-3 text-sm font-bold hover:bg-primary-800 transition disabled:opacity-60"
          >
            Buy {formatCurrency(effective.creditPack, currency)} Credits
          </button>
        </div>
      </div>

    </div>
  );
}
