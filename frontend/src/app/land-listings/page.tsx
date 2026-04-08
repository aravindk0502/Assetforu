'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { campaigns as dreamCampaigns } from '@/data/dreamCampaigns';
import { Heart, Phone, MessageCircle, MapPin } from 'lucide-react';
import { useUIStore } from '@/store';
import { addToast } from '@/components/Toast';
import BackNavigation from '@/components/BackNavigation';
import { parseCampaignMeta } from '@/lib/campaignMeta';
import { CampaignImageCarousel } from '@/components/CampaignImageCarousel';
import { AdsBadge } from '@/components/AdsBadge';

type Listing = {
  id: string;
  title: string;
  location: string;
  description: string;
  images: string[];
  priceLabel: string;
  contactPhone?: string;
  whatsappNumber?: string;
  mapUrl?: string;
};

export default function LandListingsPage() {
  const router = useRouter();
  const { favorites, toggleFavorite } = useUIStore();
  const [list, setList] = useState<Listing[]>(
    dreamCampaigns.map((c) => ({
      id: c.id,
      title: c.title,
      location: c.location,
      description: c.description,
      images: c.images || [c.imageUrl],
      priceLabel: c.priceLabel || '₹On Request',
      contactPhone: c.contactPhone,
      whatsappNumber: c.whatsappNumber,
      mapUrl: c.mapUrl,
    }))
  );

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/public/campaigns?status=active&limit=200', { cache: 'no-store' });
        const json = (await res.json().catch(() => ({}))) as { success?: boolean; data?: Array<any> };
        const rows = res.ok && json?.success && Array.isArray(json.data) ? json.data : [];
        if (!rows.length) return;
        const mapped: Listing[] = rows.map((r) => {
          const meta = parseCampaignMeta(r.description, r.image_urls || r.image_url);
          return {
            id: String(r.id),
            title: String(r.title || 'Property'),
            location: String(r.location || `${meta.land?.city || ''}${meta.land?.state ? `, ${meta.land.state}` : ''}${meta.land?.country ? `, ${meta.land.country}` : ''}` || 'India'),
            description: String(meta.text || r.description || ''),
            images: meta.images?.length ? meta.images : [String(r.image_url || '')].filter(Boolean),
            priceLabel: String(meta.land?.priceLabel || '₹On Request'),
            contactPhone: meta.land?.contactPhone,
            whatsappNumber: meta.land?.whatsappNumber,
            mapUrl: meta.land?.mapUrl,
          };
        });
        setList(mapped);
      } catch {
        // ignore
      }
    };
    load();
  }, []);

  return (
    <div className="page-enter bg-[#f4f5f6] min-h-screen">
      <BackNavigation />

      <section className="mx-auto max-w-7xl px-6 lg:px-10 py-12">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.25em] text-emerald-600">Browse Properties</p>
          <h1 className="text-4xl font-black text-slate-900 mt-2">Land for Sale & Rent</h1>
          <p className="text-slate-500 mt-2">Explore verified land properties across India with transparent pricing.</p>
        </div>

        <div className="grid gap-8">
          {list.map((campaign, idx) => (
            <div key={campaign.id} className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
              <div className="grid md:grid-cols-[400px_1fr] gap-6 p-6">
                {/* Left: Image */}
                <div className="relative rounded-2xl overflow-hidden bg-slate-100 h-80">
                  {campaign.images.length > 1 ? (
                    <CampaignImageCarousel images={campaign.images} title={campaign.title} />
                  ) : (
                    <>
                      <img
                        src={campaign.images[0]}
                        alt={campaign.title}
                        className="h-full w-full object-cover"
                      />
                      <AdsBadge />
                    </>
                  )}
                  <div className="absolute top-4 left-4 rounded-full bg-emerald-600 text-white px-4 py-2 text-xs font-bold">
                    {idx % 2 === 0 ? 'FOR SALE' : 'FOR RENT'}
                  </div>
                  <button
                    onClick={() => {
                      const isFavorited = favorites.some((f) => f.id === campaign.id);
                      toggleFavorite({
                        id: campaign.id,
                        title: campaign.title,
                        description: campaign.description,
                        image_url: campaign.images[0],
                        type: 'property',
                        category: campaign.location,
                        credits: 0,
                      });
                      addToast(
                        isFavorited ? `${campaign.title} removed from favorites` : `${campaign.title} added to favorites`,
                        'success',
                        1,
                        !isFavorited
                      );
                    }}
                    className="absolute top-4 right-4 rounded-full bg-white text-slate-600 p-3 hover:text-rose-500 transition"
                  >
                    <Heart
                      className={`w-5 h-5 ${favorites.some((f) => f.id === campaign.id)
                          ? 'fill-rose-500 text-rose-500'
                          : ''
                        }`}
                    />
                  </button>
                </div>

                {/* Right: Details */}
                <div className="flex flex-col justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">{campaign.location}</p>
                    <h2 className="text-3xl font-black text-slate-900 mb-2">{campaign.title}</h2>

                    <div className="grid grid-cols-2 gap-4 mb-6 py-4 border-y border-slate-200">
                      <div>
                        <p className="text-xs text-slate-400 mb-1">PRICE</p>
                        <p className="text-2xl font-black text-emerald-600">{campaign.priceLabel || '₹On Request'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">LOCATION</p>
                        <p className="text-lg font-bold text-slate-900">{campaign.location}</p>
                      </div>
                    </div>

                    <p className="text-slate-700 leading-relaxed mb-6">{campaign.description}</p>

                    <div className="mb-6">
                      <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">Property Details</p>
                      <div className="space-y-2 text-sm text-slate-600">
                        <p>• Premium {idx % 2 === 0 ? 'commercial' : 'residential'} location</p>
                        <p>• Strategic position for asset growth</p>
                        <p>• Verified and transparent pricing</p>
                        <p>• Dedicated advisory support available</p>
                      </div>
                    </div>

                  </div>

                  {/* Contact Section */}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => router.push(`/land-listings/${campaign.id}`)}
                      className="flex-1 rounded-xl border-2 border-slate-200 text-slate-800 px-6 py-3 font-bold hover:bg-slate-50 transition text-center flex items-center justify-center gap-2"
                    >
                      View Details
                    </button>
                    {campaign.contactPhone && (
                      <a
                        href={`tel:${campaign.contactPhone.replace(/\s/g, '')}`}
                      className="flex-1 rounded-xl border-2 border-emerald-600 text-emerald-600 px-6 py-3 font-bold hover:bg-emerald-50 transition text-center flex items-center justify-center gap-2"
                      >
                        <Phone className="w-4 h-4" />
                        Call
                      </a>
                    )}
                    {campaign.whatsappNumber && (
                      <a
                        href={`https://wa.me/${campaign.whatsappNumber.replace(/\D/g, '')}?text=Hi, I'm interested in ${encodeURIComponent(campaign.title)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 rounded-xl bg-emerald-600 text-white px-6 py-3 font-bold hover:bg-emerald-700 transition text-center flex items-center justify-center gap-2"
                      >
                        <MessageCircle className="w-4 h-4" />
                        WhatsApp
                      </a>
                    )}
                    {campaign.mapUrl && (
                      <a
                        href={campaign.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 rounded-xl border-2 border-slate-200 text-slate-800 px-6 py-3 font-bold hover:bg-slate-50 transition text-center flex items-center justify-center gap-2"
                      >
                        <MapPin className="w-4 h-4" />
                        Map
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
