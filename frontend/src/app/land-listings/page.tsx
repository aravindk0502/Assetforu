'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { campaigns } from '@/data/dreamCampaigns';
import { ChevronLeft, ChevronRight, Heart, Phone, MessageCircle, Mail } from 'lucide-react';
import { useUIStore } from '@/store';
import { addToast } from '@/components/Toast';
import BackNavigation from '@/components/BackNavigation';

// Mock dealer data
const dealerData: Record<string, { name: string; phone: string; company: string; email: string }> = {
  'premium-metro-alliance': { name: 'Rajesh Kumar', phone: '+91 98765 43210', company: 'Prime Properties', email: 'rajesh@primeproperties.com' },
  'heritage-orchard-land': { name: 'Priya Singh', phone: '+91 97654 32109', company: 'Heritage Estates', email: 'priya@heritageestates.com' },
  'coastal-boulevard-project': { name: 'Amit Patel', phone: '+91 96543 21098', company: 'Coastal Investments', email: 'amit@coastalinvest.com' },
};

// Property pricing data
const propertyPrices: Record<string, string> = {
  'premium-metro-alliance': '₹2.5 Crore',
  'heritage-orchard-land': '₹45 Lac',
  'coastal-boulevard-project': '₹1.2 Crore',
};

export default function LandListingsPage() {
  const router = useRouter();
  const { favorites, toggleFavorite } = useUIStore();

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
          {campaigns.map((campaign, idx) => (
            <div key={campaign.id} className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
              <div className="grid md:grid-cols-[400px_1fr] gap-6 p-6">
                {/* Left: Image */}
                <div className="relative rounded-2xl overflow-hidden bg-slate-100 h-80">
                  <img
                    src={campaign.imageUrl}
                    alt={campaign.title}
                    className="h-full w-full object-cover"
                  />
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
                        image_url: campaign.imageUrl,
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
                      className={`w-5 h-5 ${
                        favorites.some((f) => f.id === campaign.id) 
                          ? 'fill-rose-500 text-rose-500' 
                          : ''
                      }`} 
                    />
                  </button>
                  {/* Carousel dots */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <button
                        key={i}
                        className={`h-2 rounded-full transition-all ${
                          i === 0 ? 'bg-white w-8' : 'bg-white/40 w-2 hover:bg-white/60'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="absolute bottom-4 right-4 bg-slate-900/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold">
                    1/6
                  </div>
                </div>

                {/* Right: Details */}
                <div className="flex flex-col justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">{campaign.location}</p>
                    <h2 className="text-3xl font-black text-slate-900 mb-2">{campaign.title}</h2>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6 py-4 border-y border-slate-200">
                      <div>
                        <p className="text-xs text-slate-400 mb-1">PRICE</p>
                        <p className="text-2xl font-black text-emerald-600">{propertyPrices[campaign.id] || '₹On Request'}</p>
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

                    {/* Dealer Info */}
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl p-6 mb-6 border border-emerald-200 shadow-sm">
                      <p className="text-xs uppercase tracking-widest text-emerald-700 font-bold mb-4">Contact Property Owner</p>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="font-black text-lg text-slate-900">{dealerData[campaign.id]?.name || 'Property Owner'}</p>
                          <p className="text-sm text-slate-600">{dealerData[campaign.id]?.company || 'Verified Dealer'}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <a
                          href={`tel:${dealerData[campaign.id]?.phone}`}
                          className="flex items-center gap-3 p-3 bg-white rounded-xl hover:bg-emerald-100 transition group"
                        >
                          <Phone className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition" />
                          <span className="font-bold text-slate-900">{dealerData[campaign.id]?.phone || '+91 XXXX XXXX XX'}</span>
                        </a>
                        <a
                          href={`mailto:${dealerData[campaign.id]?.email}`}
                          className="flex items-center gap-3 p-3 bg-white rounded-xl hover:bg-emerald-100 transition group text-left"
                        >
                          <Mail className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition" />
                          <span className="text-sm text-slate-700 break-all">{dealerData[campaign.id]?.email || 'email@example.com'}</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Contact Section */}
                  <div className="flex gap-3">
                    <a
                      href={`tel:${dealerData[campaign.id]?.phone || ''}`}
                      className="flex-1 rounded-xl border-2 border-emerald-600 text-emerald-600 px-6 py-3 font-bold hover:bg-emerald-50 transition text-center flex items-center justify-center gap-2"
                    >
                      <Phone className="w-4 h-4" />
                      Call Now
                    </a>
                    <a
                      href={`https://wa.me/${dealerData[campaign.id]?.phone?.replace(/\D/g, '') || ''}?text=Hi, I'm interested in ${campaign.title}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 rounded-xl bg-emerald-600 text-white px-6 py-3 font-bold hover:bg-emerald-700 transition text-center flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp
                    </a>
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
