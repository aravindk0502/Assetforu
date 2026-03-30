'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { campaigns } from '@/data/dreamCampaigns';
import { ChevronLeft, ChevronRight, Heart, Phone, Eye, X } from 'lucide-react';
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
  const [revealedNumbers, setRevealedNumbers] = useState<Set<string>>(new Set());
  const [contactModal, setContactModal] = useState<string | null>(null);

  const toggleRevealNumber = (id: string) => {
    const newSet = new Set(revealedNumbers);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setRevealedNumbers(newSet);
  };

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
                    <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-200">
                      <p className="text-xs uppercase tracking-widest text-slate-400 mb-3">Dealer Information</p>
                      <div>
                        <p className="font-bold text-slate-900">{dealerData[campaign.id]?.name || 'Property Owner'}</p>
                        <p className="text-sm text-slate-600">{dealerData[campaign.id]?.company || 'Verified Dealer'}</p>
                        {revealedNumbers.has(campaign.id) ? (
                          <p className="text-sm font-bold text-emerald-600 mt-2">{dealerData[campaign.id]?.phone || '+91 XXXX XXXX XX'}</p>
                        ) : (
                          <p className="text-sm text-slate-500 mt-2">Phone number hidden</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contact Section */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => toggleRevealNumber(campaign.id)}
                      className="flex-1 rounded-xl border-2 border-emerald-600 text-emerald-600 px-6 py-3 font-bold hover:bg-emerald-50 transition"
                    >
                      <Eye className="w-4 h-4 inline mr-2" />
                      {revealedNumbers.has(campaign.id) ? 'Hide Number' : 'View Number'}
                    </button>
                    <button
                      onClick={() => setContactModal(campaign.id)}
                      className="flex-1 rounded-xl bg-emerald-600 text-white px-6 py-3 font-bold hover:bg-emerald-700 transition"
                    >
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

      {/* Contact Modal */}
      {contactModal && dealerData[contactModal] && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-2xl font-black text-slate-900">Contact Property Owner</h3>
              <button
                onClick={() => setContactModal(null)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-200">
                <p className="text-xs uppercase tracking-wider text-emerald-600 mb-3">Owner Details</p>
                <h4 className="text-xl font-black text-slate-900 mb-1">{dealerData[contactModal].name}</h4>
                <p className="text-sm text-slate-600 mb-4">{dealerData[contactModal].company}</p>
                <div className="space-y-3">
                  <a
                    href={`tel:${dealerData[contactModal].phone}`}
                    className="flex items-center gap-3 p-3 bg-white rounded-xl hover:bg-emerald-100 transition"
                  >
                    <Phone className="w-5 h-5 text-emerald-600" />
                    <span className="font-bold text-slate-900">{dealerData[contactModal].phone}</span>
                  </a>
                  <a
                    href={`mailto:${dealerData[contactModal].email}`}
                    className="flex items-center gap-3 p-3 bg-white rounded-xl hover:bg-emerald-100 transition text-left"
                  >
                    <span className="text-emerald-600 font-bold">@</span>
                    <span className="text-sm text-slate-700 break-all">{dealerData[contactModal].email}</span>
                  </a>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    window.location.href = `tel:${dealerData[contactModal].phone}`;
                  }}
                  className="w-full rounded-xl bg-emerald-600 text-white px-6 py-3 font-bold hover:bg-emerald-700 transition flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  Call Now
                </button>
                <button
                  onClick={() => setContactModal(null)}
                  className="w-full rounded-xl border-2 border-slate-200 text-slate-900 px-6 py-3 font-bold hover:bg-slate-50 transition"
                >
                  Close
                </button>
              </div>

              <div className="text-xs text-center text-slate-500">
                <p>By contacting, you agree to our Terms of Service</p>
                <p>Your information is safe and secure</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
