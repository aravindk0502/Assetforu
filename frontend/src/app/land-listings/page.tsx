'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { campaigns } from '@/data/dreamCampaigns';
import { ChevronLeft, ChevronRight, Heart, Phone, Eye } from 'lucide-react';
import BackNavigation from '@/components/BackNavigation';

export default function LandListingsPage() {
  const router = useRouter();

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
                  <button className="absolute top-4 right-4 rounded-full bg-white text-slate-600 p-3 hover:text-rose-500 transition">
                    <Heart className="w-5 h-5" />
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
                        <p className="text-xs text-slate-400 mb-1">INVESTMENT REQUIRED</p>
                        <p className="text-2xl font-black text-emerald-600">₹{campaign.creditPack} Credits</p>
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
                    <button className="flex-1 rounded-xl border-2 border-emerald-600 text-emerald-600 px-6 py-3 font-bold hover:bg-emerald-50 transition">
                      <Eye className="w-4 h-4 inline mr-2" />
                      View Number
                    </button>
                    <button className="flex-1 rounded-xl bg-emerald-600 text-white px-6 py-3 font-bold hover:bg-emerald-700 transition">
                      <Phone className="w-4 h-4 inline mr-2" />
                      Contact Owner
                    </button>
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
