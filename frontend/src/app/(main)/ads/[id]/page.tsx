import BackNavigation from '@/components/BackNavigation';
import { CampaignImageCarousel } from '@/components/CampaignImageCarousel';
import { AdsBadge } from '@/components/AdsBadge';
import type { AdPlacementBanner } from '@/types';
import { loadAds } from '@/app/api/_utils/blobAds';
import { MapPin, MessageCircle, Phone, Ruler } from 'lucide-react';

function isActiveNow(ad: AdPlacementBanner, now = Date.now()) {
  if (!ad.is_active) return false;
  const start = ad.start_time ? new Date(String(ad.start_time)).getTime() : NaN;
  const end = ad.end_time ? new Date(String(ad.end_time)).getTime() : NaN;
  if (!Number.isNaN(start) && now < start) return false;
  if (!Number.isNaN(end) && now > end) return false;
  return true;
}

function cleanPhone(raw: string) {
  return raw.replace(/[^\d+]/g, '');
}

export default async function AdDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ads = await loadAds();
  const ad = ads.find((a) => String(a.id) === String(id)) || null;

  if (!ad || !isActiveNow(ad)) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-16 text-center">
        <p className="text-slate-500">Property Not Found</p>
      </div>
    );
  }

  const images = Array.isArray(ad.images) ? ad.images.filter(Boolean).slice(0, 5) : [];
  const property = ad.property || {};
  const title = ad.title || 'Sponsored';
  const description = property.description || ad.description || '';
  const city = property.city || '';
  const state = property.state || '';
  const country = property.country || 'India';
  const locationLabel = [city, state, country].filter(Boolean).join(', ') || 'India';

  const priceLabel = property.price_label || '—';
  const sqft = typeof property.square_feet === 'number' && property.square_feet > 0 ? `${property.square_feet.toLocaleString()} sq ft` : '';
  const typeLabel = property.type ? (property.type === 'rent' ? 'For Rent' : 'For Sale') : '';
  const callPhone = property.call_phone ? cleanPhone(property.call_phone) : '';
  const whatsapp = property.whatsapp ? cleanPhone(property.whatsapp) : '';
  const mapUrl = property.map_url || '';

  const ctaLabel = (ad.cta_label || '').trim() || 'See Properties';
  const href = (ad.href || '').trim();

  return (
    <div className="page-enter mx-auto max-w-6xl px-6 py-10">
      <BackNavigation />

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <div className="relative">
            {images.length > 1 ? (
              <div className="w-full h-80 rounded-2xl overflow-hidden border border-slate-200">
                <CampaignImageCarousel images={images} title={title} showAds />
              </div>
            ) : (
              <>
                <img
                  src={images[0] || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200'}
                  alt={title}
                  className="w-full h-80 rounded-2xl object-cover border border-slate-200"
                />
                <AdsBadge show />
              </>
            )}
          </div>

          <h1 className="mt-6 text-3xl font-black text-slate-900">{title}</h1>
          <p className="mt-2 text-sm text-slate-600 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-500" />
            {locationLabel}
          </p>
          {description && <p className="mt-4 text-slate-600">{description}</p>}

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-black text-slate-900 mb-4">Land Details</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                <p className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-1">Location</p>
                <p className="text-sm font-semibold text-slate-900">{locationLabel}</p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                <p className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-1">Price</p>
                <p className="text-sm font-semibold text-slate-900">{priceLabel}</p>
              </div>
              {(sqft || typeLabel) && (
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 sm:col-span-2">
                  <div className="flex flex-wrap gap-3 items-center text-sm text-slate-800 font-semibold">
                    {typeLabel && <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-emerald-800">{typeLabel}</span>}
                    {sqft && (
                      <span className="inline-flex items-center gap-2 text-slate-700">
                        <Ruler className="w-4 h-4" /> {sqft}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              {callPhone && (
                <a
                  href={`tel:${encodeURIComponent(callPhone)}`}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-900 hover:bg-slate-50 inline-flex items-center gap-2"
                >
                  <Phone className="w-4 h-4" /> Call
                </a>
              )}
              {whatsapp && (
                <a
                  href={`https://wa.me/${encodeURIComponent(whatsapp)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 inline-flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </a>
              )}
              {mapUrl && (
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-900 hover:bg-slate-50 inline-flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4" /> View Map
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 h-fit">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500 font-bold">Sponsored Placement</p>
          <h2 className="mt-3 text-3xl font-black text-primary-800">{ctaLabel}</h2>
          <p className="mt-3 text-slate-600">This listing is an advertisement placement and may not be part of campaign entry.</p>

          <div className="mt-6">
            {href ? (
              <a
                href={href}
                target={href.startsWith('/') ? undefined : '_blank'}
                rel={href.startsWith('/') ? undefined : 'noreferrer'}
                className="w-full inline-flex justify-center rounded-xl bg-primary-700 text-white px-6 py-3 text-sm font-bold hover:bg-primary-800"
              >
                {ctaLabel}
              </a>
            ) : (
              <a
                href="/campaigns"
                className="w-full inline-flex justify-center rounded-xl bg-primary-700 text-white px-6 py-3 text-sm font-bold hover:bg-primary-800"
              >
                Browse Campaigns
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

