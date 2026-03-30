'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { campaigns } from '@/data/dreamCampaigns';
import { useUIStore, useAuthStore } from '@/store';
import { Heart, Phone, MapPin, Copy, ArrowLeft, MessageCircle } from 'lucide-react';
import { addToast } from '@/components/Toast';

// Property pricing data
const propertyPrices: Record<string, string> = {
  'premium-metro-alliance': '₹2.5 Crore',
  'heritage-orchard-land': '₹45 Lac',
  'coastal-boulevard-project': '₹1.2 Crore',
};

// Mock dealer data
const dealerData: Record<string, { name: string; phone: string; company: string; email: string }> = {
  'premium-metro-alliance': { name: 'Rajesh Kumar', phone: '+91 98765 43210', company: 'Prime Properties', email: 'rajesh@primeproperties.com' },
  'heritage-orchard-land': { name: 'Priya Singh', phone: '+91 97654 32109', company: 'Heritage Estates', email: 'priya@heritageestates.com' },
  'coastal-boulevard-project': { name: 'Amit Patel', phone: '+91 96543 21098', company: 'Coastal Investments', email: 'amit@coastalinvest.com' },
};

export default function PropertyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id as string;
  const { favorites, toggleFavorite } = useUIStore();
  const { user, token } = useAuthStore();
  const [isMobile, setIsMobile] = useState(false);

  // Detect if device is mobile
  useEffect(() => {
    const isMobileDevice = () => {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    };
    setIsMobile(isMobileDevice());
  }, []);

  // Find the property from campaigns
  const property = campaigns.find((c) => c.id === propertyId);

  if (!property) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Property Not Found</h1>
          <p className="text-slate-600 mb-6">Sorry, we couldn&apos;t find this property.</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-primary-700 text-white rounded-lg font-semibold hover:bg-primary-800 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isFavorited = favorites.some((f) => f.id === propertyId);
  const dealer = dealerData[propertyId];
  const price = propertyPrices[propertyId] || '₹On Request';

  const handleFavorite = () => {
    toggleFavorite({
      id: property.id,
      title: property.title,
      description: property.description,
      image_url: property.imageUrl,
      type: 'property',
      category: property.location,
      credits: 0,
    });
    addToast(
      isFavorited ? `${property.title} removed from favorites` : `${property.title} added to favorites`,
      'success',
      1,
      !isFavorited
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-10">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-primary-700 font-semibold hover:text-primary-800"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-xl font-black text-slate-900">Property Details</h1>
          <div className="w-8" />
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 lg:px-10 py-8">
        {/* Image Gallery */}
        <div className="relative rounded-3xl overflow-hidden bg-slate-200 h-96 mb-8">
          <img
            src={property.imageUrl}
            alt={property.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 left-4 rounded-full bg-emerald-600 text-white px-4 py-2 text-xs font-bold">
            FOR SALE
          </div>
          <button
            onClick={handleFavorite}
            className="absolute top-4 right-4 rounded-full bg-white p-3 hover:bg-slate-100 transition shadow-lg"
          >
            <Heart
              className={`w-6 h-6 ${
                isFavorited ? 'text-rose-500 fill-rose-500' : 'text-slate-600'
              }`}
            />
          </button>
        </div>

        {/* Property Header */}
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400 mb-2">{property.location}</p>
          <h2 className="text-4xl font-black text-slate-900 mb-3">{property.title}</h2>
          <p className="text-lg text-slate-600 mb-6">{property.description}</p>

          {/* Key Details */}
          <div className="grid md:grid-cols-3 gap-6 py-6 border-y border-slate-200">
            <div>
              <p className="text-xs text-slate-400 mb-1">PRICE</p>
              <p className="text-3xl font-black text-emerald-600">{price}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">LOCATION</p>
              <p className="text-lg font-bold text-slate-900">{property.location}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">TYPE</p>
              <p className="text-lg font-bold text-slate-900">Land Plot</p>
            </div>
          </div>
        </div>

        {/* Property Details Section */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 mb-8">
          <h3 className="text-2xl font-black text-slate-900 mb-6">About This Property</h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-bold text-slate-900 mb-4">Highlights</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-600">Premium commercial location</span>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-600">Strategic position for asset growth</span>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-600">Verified and transparent pricing</span>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-600">Legal documentation verified</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-4">Features</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-600 rounded-full" />
                  <span className="text-slate-600">Clear Title & Legal</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-600 rounded-full" />
                  <span className="text-slate-600">Well-Connected Location</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-600 rounded-full" />
                  <span className="text-slate-600">Growth Potential</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-600 rounded-full" />
                  <span className="text-slate-600">Expert Advisory</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Dealer Contact Section */}
        {dealer && (
          <div className="bg-gradient-to-r from-emerald-50 to-emerald-100/50 rounded-3xl p-8 border border-emerald-200 mb-8">
            <h3 className="text-2xl font-black text-slate-900 mb-6">Contact Property Owner</h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-bold text-slate-900 mb-4">Owner Details</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">NAME</p>
                    <p className="text-lg font-bold text-slate-900">{dealer.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">COMPANY</p>
                    <p className="text-lg font-bold text-slate-900">{dealer.company}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <a
                  href={`tel:${dealer.phone}`}
                  className="flex items-center gap-3 p-4 bg-white rounded-xl hover:bg-slate-50 border border-emerald-200 transition"
                >
                  <Phone className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="text-xs text-slate-500">PHONE</p>
                    <p className="font-bold text-slate-900">{dealer.phone}</p>
                  </div>
                </a>
                <a
                  href={`mailto:${dealer.email}`}
                  className="flex items-center gap-3 p-4 bg-white rounded-xl hover:bg-slate-50 border border-emerald-200 transition"
                >
                  <span className="text-emerald-600 font-bold">@</span>
                  <div>
                    <p className="text-xs text-slate-500">EMAIL</p>
                    <p className="font-bold text-slate-900 truncate">{dealer.email}</p>
                  </div>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Call to Action - Prominent Phone Display */}
        <div className="mb-8">
          {dealer && (
            <div className="bg-emerald-50 border-2 border-emerald-600 rounded-2xl p-8">
              <p className="text-xs uppercase tracking-wider text-emerald-600 mb-4 font-bold">Contact Owner</p>
              <p className="text-sm text-slate-600 mb-6">{dealer.name} from {dealer.company}</p>
              
              <div className="mb-8">
                <p className="text-xs text-slate-500 mb-3">PHONE NUMBER</p>
                <p className="text-4xl font-black text-emerald-600 tracking-wider mb-4 break-all">{dealer.phone}</p>
                <p className="text-xs text-slate-600 mb-6">
                  {isMobile ? '👈 Tap below to call directly' : '👇 Choose your preferred contact method'}
                </p>
              </div>

              {/* Mobile: Direct Call Button */}
              {isMobile ? (
                <>
                  <a
                    href={`tel:${dealer.phone}`}
                    className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition flex items-center justify-center gap-2 shadow-lg hover:shadow-xl mb-4"
                  >
                    <Phone className="w-5 h-5" />
                    Call {dealer.phone}
                  </a>
                  
                  <a
                    href={`https://wa.me/${dealer.phone.replace(/\D/g, '')}?text=Hi, I'm interested in the property listing. Can you provide more details?`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-4 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Message on WhatsApp
                  </a>
                </>
              ) : (
                /* Desktop: Call + WhatsApp Buttons */
                <div className="grid grid-cols-2 gap-4">
                  <a
                    href={`tel:${dealer.phone}`}
                    className="py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    <Phone className="w-5 h-5" />
                    Call
                  </a>
                  
                  <a
                    href={`https://wa.me/${dealer.phone.replace(/\D/g, '')}?text=Hi, I'm interested in the property listing. Can you provide more details?`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-4 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    <MessageCircle className="w-5 h-5" />
                    WhatsApp
                  </a>
                </div>
              )}

              <p className="text-xs text-slate-500 text-center mt-4">
                {isMobile ? 'Direct call from your device' : 'Call or message via WhatsApp'}
              </p>
            </div>
          )}
        </div>

        {/* Terms */}
        <div className="mt-8 text-center text-xs text-slate-500">
          <p>By contacting, you agree to our Terms of Service & Privacy Policy</p>
        </div>
      </div>
    </div>
  );
}
