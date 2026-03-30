'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { campaigns } from '@/data/dreamCampaigns';

export default function LandPropertiesCarousel() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (!autoScroll) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % campaigns.length);
    }, 5000); // Auto-scroll every 5 seconds

    return () => clearInterval(interval);
  }, [autoScroll]);

  const goToCampaign = (campaignId: string) => {
    router.push(`/land-listings`);
  };

  const handleBannerClick = () => {
    router.push(`/land-listings`);
  };

  const goToPrevious = () => {
    setAutoScroll(false);
    setCurrentIndex((prev) => (prev - 1 + campaigns.length) % campaigns.length);
  };

  const goToNext = () => {
    setAutoScroll(false);
    setCurrentIndex((prev) => (prev + 1) % campaigns.length);
  };

  const current = campaigns[currentIndex];

  return (
    <section className="mx-auto max-w-7xl px-6 lg:px-10 py-8">
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 h-96 cursor-pointer" onClick={handleBannerClick}>
        {/* Background Image */}
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{
            backgroundImage: `url(${current.imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.4,
          }}
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-900/40" />

        {/* Content */}
        <div className="relative h-full flex flex-col justify-between p-8 md:p-12">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-emerald-400 mb-2">LAND FOR SALE/RENT</p>
            <h3 className="text-4xl md:text-5xl font-black text-white mb-3 leading-tight">
              {current.title}
            </h3>
            <p className="text-lg md:text-xl text-emerald-200 mb-4">{current.location}</p>
            <p className="text-base text-slate-100 max-w-2xl mb-6">{current.description}</p>

            <div className="flex items-center gap-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToCampaign(current.id);
                }}
                className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 font-bold transition transform hover:scale-105"
              >
                Buy Now →
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToCampaign(current.id);
                }}
                className="rounded-full border-2 border-emerald-400 text-emerald-400 hover:bg-emerald-400 hover:text-white px-8 py-3 font-bold transition transform hover:scale-105"
              >
                Rent Now →
              </button>
            </div>
          </div>

          {/* Carousel Controls */}
          <div className="flex items-center justify-between">
            <button
              onClick={goToPrevious}
              onMouseEnter={() => setAutoScroll(false)}
              className="rounded-full bg-white/20 hover:bg-white/30 text-white p-3 transition backdrop-blur-sm"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Indicators */}
            <div className="flex gap-2">
              {campaigns.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setAutoScroll(false);
                    setCurrentIndex(idx);
                  }}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentIndex
                      ? 'bg-emerald-400 w-8'
                      : 'bg-white/30 w-2 hover:bg-white/50'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={goToNext}
              onMouseEnter={() => setAutoScroll(false)}
              className="rounded-full bg-white/20 hover:bg-white/30 text-white p-3 transition backdrop-blur-sm"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Slide Counter */}
        <div className="absolute top-6 right-6 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-bold">
          {currentIndex + 1} / {campaigns.length}
        </div>
      </div>
    </section>
  );
}
