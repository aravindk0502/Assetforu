'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { campaigns as dreamCampaigns } from '@/data/dreamCampaigns';
import { AdsBadge } from '@/components/AdsBadge';
import { parseCampaignMeta } from '@/lib/campaignMeta';
import { useLanguage } from '@/components/LanguageProvider';

export default function LandPropertiesCarousel() {
    const router = useRouter();
    const { t } = useLanguage();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [autoScroll, setAutoScroll] = useState(true);
    const [slides, setSlides] = useState<Array<{ id: string; title: string; location: string; description: string; imageUrl: string; isAd: boolean; href?: string; ctaLabel?: string }>>(
        dreamCampaigns.map((c) => ({ id: c.id, title: c.title, location: c.location, description: c.description, imageUrl: c.imageUrl, isAd: false }))
    );

    useEffect(() => {
        if (!autoScroll) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % Math.max(1, slides.length));
        }, 5000); // Auto-scroll every 5 seconds

        return () => clearInterval(interval);
    }, [autoScroll, slides.length]);

    // Load featured properties from admin-created campaigns (Blob-backed)
    useEffect(() => {
        const load = async () => {
            try {
                // 0) Prefer explicit ads/placements for the home carousel when configured.
                const adsRes = await fetch('/api/public/ads?placement=home_carousel&limit=20', { cache: 'no-store' });
                const adsJson = (await adsRes.json().catch(() => ({}))) as { success?: boolean; data?: Array<any> };
                const adsRows = adsRes.ok && adsJson?.success && Array.isArray(adsJson.data) ? adsJson.data : [];
                if (adsRows.length) {
                    // Treat each uploaded image as its own slide so multiple images are visible on live.
                    const adSlides = adsRows
                        .filter((a) => Array.isArray(a.images) && a.images.length)
                        .flatMap((a) => {
                            const images = (a.images as any[]).filter((x) => typeof x === 'string' && x.trim());
                            return images.map((img) => ({
                                id: String(a.id),
                                title: String(a.title || t('home.carousel.sponsored', 'Sponsored')),
                                location: String(
                                  a.property?.city || a.property?.state || a.property?.country || t('home.carousel.sponsored', 'Sponsored')
                                ),
                                description: String(a.property?.description || a.description || ''),
                                imageUrl: String(img),
                                isAd: true,
                                href: typeof a.href === 'string' ? a.href : undefined,
                                ctaLabel: typeof a.cta_label === 'string' ? a.cta_label : undefined,
                            }));
                        })
                        .filter((s) => Boolean(s.imageUrl))
                        .slice(0, 12);
                    if (adSlides.length) {
                        setSlides(adSlides);
                        setCurrentIndex(0);
                        return;
                    }
                }

                const res = await fetch('/api/public/campaigns?status=active&limit=200', { cache: 'no-store' });
                const json = (await res.json().catch(() => ({}))) as { success?: boolean; data?: Array<any> };
                const rows = res.ok && json?.success && Array.isArray(json.data) ? json.data : [];
                if (!rows.length) return;
                const featured = rows.filter((r) => r.is_featured).slice(0, 6);
                const base = (featured.length ? featured : rows.slice(0, 6)).map((r) => {
                    const meta = parseCampaignMeta(r.description, r.image_urls || r.image_url);
                    return {
                        id: String(r.id),
                        title: String(r.title || t('home.carousel.property', 'Property')),
                        location: String(r.location || meta.land?.city || t('home.carousel.defaultLocation', 'India')),
                        description: String(meta.text || r.description || ''),
                        imageUrl: String(meta.images?.[0] || r.image_url || dreamCampaigns[0]?.imageUrl),
                        isAd: meta.isAd ?? false,
                    };
                });
                if (base.length) {
                    setSlides(base);
                    setCurrentIndex(0);
                }
            } catch {
                // ignore
            }
        };
        load();
    }, [t]);

    const goToCampaign = (s: (typeof slides)[number]) => {
        // Ads/placements are independent of campaigns. Never route ads to `/land-listings/:id`,
        // otherwise users hit "Property Not Found" (ad ids aren't campaign ids).
        if (s.isAd) {
            const href = (s.href || '').trim();
            if (href) {
                if (href.startsWith('/')) router.push(href);
                else window.open(href, '_blank', 'noopener,noreferrer');
            } else {
                router.push(`/ads/${encodeURIComponent(s.id)}`);
            }
            return;
        }
        router.push(`/land-listings/${s.id}`);
    };

    const goToPrevious = () => {
        setAutoScroll(false);
        setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    };

    const goToNext = () => {
        setAutoScroll(false);
        setCurrentIndex((prev) => (prev + 1) % slides.length);
    };

    const current = slides[Math.min(currentIndex, Math.max(0, slides.length - 1))];

    return (
        <section className="mx-auto max-w-7xl px-6 lg:px-10 py-8">
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 h-96">
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
                        <p className="text-xs uppercase tracking-[0.25em] text-emerald-400 mb-2">{t('home.carousel.kicker', 'LAND FOR SALE/RENT')}</p>
                        <h3 className="text-4xl md:text-5xl font-black text-white mb-3 leading-tight">
                            {current.title}
                        </h3>
                        <p className="text-lg md:text-xl text-emerald-200 mb-4">{current.location}</p>
                        <p className="text-base text-slate-100 max-w-2xl mb-6">{current.description}</p>

                        <button
                            onClick={() => goToCampaign(current)}
                            className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 font-bold transition transform hover:scale-105"
                        >
                            {current.isAd
                              ? (current.ctaLabel ? `${current.ctaLabel} →` : t('home.carousel.ctaAd', 'See Properties →'))
                              : t('home.carousel.ctaDefault', 'See More Properties →')}
                        </button>
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
                            {slides.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setAutoScroll(false);
                                        setCurrentIndex(idx);
                                    }}
                                    className={`h-2 rounded-full transition-all ${idx === currentIndex
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
                    {currentIndex + 1} / {slides.length}
                </div>

                <AdsBadge show={current?.isAd ?? false} />
            </div>
        </section>
    );
}
