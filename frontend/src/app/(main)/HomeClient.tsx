'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useCartStore, useUIStore } from '@/store';
import { addToast } from '@/components/Toast';
import type { CampaignInfo } from '@/data/dreamCampaigns';
import { Sparkles, Ticket, ArrowUpRight, Heart, Wallet, BadgeCheck, ChevronDown } from 'lucide-react';
import { campaignAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/currency';
import LandPropertiesCarousel from '@/components/LandPropertiesCarousel';
import { CampaignImageCarousel } from '@/components/CampaignImageCarousel';
import { AdsBadge } from '@/components/AdsBadge';
import { parseCampaignMeta } from '@/lib/campaignMeta';
import { fetchSiteContent } from '@/lib/siteContent';
import { useLanguage } from '@/components/LanguageProvider';

const campaignTagKeys = [
  { key: 'campaign.tag.justLaunched', fallback: 'Just Launched' },
  { key: 'campaign.tag.closingSoon', fallback: 'Closing Soon' },
  { key: 'campaign.tag.exclusive', fallback: 'Exclusive Series' },
  { key: 'campaign.tag.trending', fallback: 'Trending' },
];

type HomeCampaign = CampaignInfo & { source?: 'static' | 'api' };
type HomeCampaignWithFlags = HomeCampaign & {
  isAd?: boolean;
  maxQty?: number;
  totalSlots?: number;
  filledSlots?: number;
  status?: 'active' | 'upcoming' | 'closed';
  soldOutAnnouncement?: string;
};

export default function HomePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const { walletBalance, openSignupModal, favorites, toggleFavorite, currency } = useUIStore();
  const { addToCart, items: cartItems } = useCartStore();
  const [limitMap, setLimitMap] = useState<Record<string, number>>({});
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [homeCampaigns, setHomeCampaigns] = useState<HomeCampaign[]>([]);
  const [campaignsLoaded, setCampaignsLoaded] = useState(false);
  const [campaignsReloadNonce, setCampaignsReloadNonce] = useState(0);
  const [siteHero, setSiteHero] = useState<any | null>(null);
  const [activeCampaignCount, setActiveCampaignCount] = useState<number | null>(null);
  const { t } = useLanguage();
  const activeCountLabel =
    activeCampaignCount != null
      ? activeCampaignCount
      : campaignsLoaded
        ? homeCampaigns.length
        : 0;

  const isDevUser = !!user?.id?.startsWith('dev_');
  const isAuthed = !!user || !!token;

  const loadDevLimits = () => {
    try {
      const raw = localStorage.getItem('af_dev_campaign_purchases');
      const map = raw ? JSON.parse(raw) as Record<string, number> : {};
      const topThreeCampaigns = homeCampaigns.slice(0, 3);
      const entries = topThreeCampaigns.map((c: any) => {
        const cap = Number.isFinite(Number(c.maxQty)) ? Number(c.maxQty) : 3;
        return [c.id, Math.max(0, cap - (map[c.id] || 0))] as const;
      });
      setLimitMap(Object.fromEntries(entries));
    } catch (error) {
      // Failed to load dev limits - use defaults
      setLimitMap({});
    }
  };

  // Load campaigns from API (admin-created), fallback to static list.
  useEffect(() => {
    const load = async () => {
      try {
        // 1) Prefer Blob-backed campaigns (same-origin, no CORS)
        const blobRes = await fetch('/api/public/campaigns?limit=200', { cache: 'no-store' });
        const blobJson = (await blobRes.json().catch(() => ({}))) as { success?: boolean; data?: unknown[] };
        const blobRows = (blobRes.ok && blobJson?.success && Array.isArray(blobJson.data)) ? blobJson.data : [];

        // 2) Fallback to backend API
        const apiRows = blobRows.length
          ? []
          : (((await campaignAPI.list({ limit: 200 })).data?.data || []) as unknown[]);

        const rows = (blobRows.length ? blobRows : apiRows) as Array<{
          id: string;
          title: string;
          description: string;
          location: string;
          credit_price: number;
          total_slots?: number;
          filled_slots?: number;
          status?: 'active' | 'upcoming' | 'closed';
          max_qty?: number;
          sold_out_announcement?: string;
          is_featured?: boolean;
          created_at?: string;
          image_url?: string;
          image_urls?: string[];
        }>;
        setActiveCampaignCount(rows.filter((r) => (r.status || 'active') === 'active').length);
        if (!rows.length) {
          // No campaigns available (admin deleted everything): show an empty state (no dummy fallback).
          setActiveCampaignCount(0);
          setHomeCampaigns([]);
          return;
        }

        const statusRank: Record<string, number> = { active: 0, upcoming: 1, closed: 2 };
        const sorted = rows
          .slice()
          .sort((a, b) => {
            const ar = statusRank[a.status || 'active'] ?? 9;
            const br = statusRank[b.status || 'active'] ?? 9;
            if (ar !== br) return ar - br;
            // Featured first
            const af = a.is_featured ? 0 : 1;
            const bf = b.is_featured ? 0 : 1;
            if (af !== bf) return af - bf;
            // Newest first
            const at = a.created_at ? new Date(a.created_at).getTime() : 0;
            const bt = b.created_at ? new Date(b.created_at).getTime() : 0;
            return bt - at;
          });
        const visible = sorted.slice(0, 3);

        const mapped: HomeCampaignWithFlags[] = visible.map((r) => {
          const meta = parseCampaignMeta(r.description, r.image_urls || r.image_url);
          const imageUrl = meta.images[0] || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200';
          return {
            id: r.id,
            title: r.title,
            location: r.location || 'India',
            city: meta.land?.city || r.location || 'India',
            state: meta.land?.state || 'India',
            country: meta.land?.country || 'India',
            priceLabel: meta.land?.priceLabel || '—',
            contactPhone: meta.land?.contactPhone || '+91 90000 00000',
            whatsappNumber: meta.land?.whatsappNumber || '919000000000',
            mapUrl: meta.land?.mapUrl,
            imageUrl,
            images: meta.images,
            description: meta.text || r.description,
            creditPack: Number(r.credit_price || 0),
            source: 'api',
            // Campaign rows are not ad placements; do not bypass closed/upcoming logic.
            isAd: false,
            maxQty: (Number.isFinite(Number((r as any).max_qty)) ? Number((r as any).max_qty) : undefined) ?? (meta.maxQty ?? 3),
            totalSlots: Number.isFinite(Number((r as any).total_slots)) ? Number((r as any).total_slots) : undefined,
            filledSlots: Number.isFinite(Number((r as any).filled_slots)) ? Number((r as any).filled_slots) : undefined,
            status: (r.status as any) || 'active',
            soldOutAnnouncement: String((r as any).sold_out_announcement || '').trim() || undefined,
          };
        });
        setHomeCampaigns(mapped as any);
      } catch {
        // If we can't load campaigns, prefer showing an empty state over dummy data
        setActiveCampaignCount(0);
        setHomeCampaigns([]);
      } finally {
        setCampaignsLoaded(true);
      }
    };
    load();
  }, [campaignsReloadNonce]);

  // Refresh campaigns after purchases / tab focus so closed/upcoming states reflect immediately.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const refresh = () => setCampaignsReloadNonce((n) => n + 1);
    window.addEventListener('focus', refresh);
    window.addEventListener('campaign:purchase', refresh);
    const id = window.setInterval(refresh, 30_000);
    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener('campaign:purchase', refresh);
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    fetchSiteContent()
      .then((c) => setSiteHero(c?.hero || null))
      .catch(() => setSiteHero(null));
  }, []);

  useEffect(() => {
    const loadLimits = async () => {
      if (!token && !user) return;
      if (isDevUser) {
        loadDevLimits();
        return;
      }
      try {
        const topThreeCampaigns = homeCampaigns.slice(0, 3);
        const entries = await Promise.all(
          topThreeCampaigns.map(async (c: any) => {
            const cap = Number.isFinite(Number(c.maxQty)) ? Number(c.maxQty) : 3;
            // For blob/admin campaigns, enforce cap via same-origin API (works across devices).
            if (c.source === 'api') {
              try {
                const bearer = token || (typeof window !== 'undefined' ? localStorage.getItem('af_token') : null);
                const res = await fetch(`/api/public/campaigns/${encodeURIComponent(String(c.id))}/limit`, {
                  headers: bearer ? { authorization: `Bearer ${bearer}` } : undefined,
                  cache: 'no-store',
                });
                const json = (await res.json().catch(() => ({}))) as any;
                const remaining = Number(json?.data?.remaining_limit ?? cap);
                return [c.id, remaining] as const;
              } catch {
                return [c.id, cap] as const;
              }
            }
            try {
              const res = await campaignAPI.limit(c.id);
              const remaining = Number(res.data?.data?.remaining_limit ?? cap);
              return [c.id, remaining] as const;
            } catch (error) {
              return [c.id, cap] as const;
            }
          })
        );
        setLimitMap(Object.fromEntries(entries));
      } catch (error) {
        // Failed to load campaign limits - use defaults
        setLimitMap({});
      }
    };
    loadLimits();
    const onFocus = () => loadLimits();
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', onFocus);
      window.addEventListener('campaign:purchase', onFocus);
      return () => {
        window.removeEventListener('focus', onFocus);
        window.removeEventListener('campaign:purchase', onFocus);
      };
    }
  }, [token, user, isDevUser, homeCampaigns]);

  const goToCampaign = (id: string) => router.push(`/campaigns/${id}`);

  const handleBuy = (id: string) => {
    if (!user) {
      openSignupModal(() => goToCampaign(id));
      return;
    }
    goToCampaign(id);
  };

  return (
    <div className="page-enter bg-[#f4f5f6]">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={siteHero?.background_image_url || "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1600&q=80&auto=format&fit=crop"}
            alt="City skyline"
            className="h-full w-full object-cover brightness-[0.85]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/25 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950/10" />
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10 py-24 md:py-28">
          <div className="max-w-3xl text-white">
            <p className="text-xs uppercase tracking-[0.35em] text-emerald-200/80 mb-4">{t('home.hero.kicker', 'Digital Platform Experience')}</p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight">{siteHero?.heading || t('home.hero.heading', 'Explore Premium Land Opportunities with Asset Credits')}</h1>
            <p className="mt-6 max-w-2xl text-base sm:text-lg text-slate-100/85 leading-8">{siteHero?.subheading || t('home.hero.subheading', 'Access curated land campaigns, view property details, and enter complimentary benefits when you purchase Asset Credits.')}</p>
            <p className="mt-6 text-sm text-slate-200/70 max-w-xl">{siteHero?.note || t('home.hero.note', 'Campaign-related benefits are complimentary platform features and not the primary purpose of credit purchase.')}</p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <button onClick={() => router.push(siteHero?.primary_cta_href || '/campaigns')} className="rounded-full bg-emerald-300 text-slate-950 px-6 py-3 text-sm font-semibold shadow-xl shadow-emerald-500/20 transition hover:bg-emerald-200">
                {siteHero?.primary_cta_label || t('home.hero.ctaPrimary', 'Get Started')}
              </button>
              <button onClick={() => router.push(siteHero?.secondary_cta_href || '/store')} className="rounded-full border border-emerald-200/75 text-white px-6 py-3 text-sm font-semibold transition hover:bg-white/10">
                {siteHero?.secondary_cta_label || t('home.hero.ctaSecondary', 'Explore Store')}
              </button>
            </div>
          </div>
          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {[
              { label: t('home.stats.wallet', 'Wallet Balance'), value: `${formatCurrency(isAuthed ? walletBalance : 0, currency)}` },
              { label: t('home.stats.active', 'Active Campaigns'), value: `${activeCountLabel}` },
              { label: t('home.stats.cart', 'Items in Cart'), value: `${cartItems.length}` },
            ].map((stat) => (
              <div key={stat.label} className="rounded-[28px] bg-slate-900/70 border border-white/10 px-5 py-4 text-white backdrop-blur-sm shadow-xl shadow-slate-950/20">
                <p className="text-[11px] uppercase tracking-[0.3em] text-slate-300">{stat.label}</p>
                <p className="mt-2 text-2xl font-bold">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 lg:px-10 py-12">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-emerald-600">{t('home.featured.kicker', 'Platform Campaigns')}</p>
            <h2 className="text-3xl font-black text-slate-900 mt-2">{t('home.featured.title', 'Featured Campaigns')}</h2>
            <p className="text-slate-500 mt-2">{t('home.featured.subtitle', 'Explore available campaigns as part of your platform experience with Asset Credits.')}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
          <div className="rounded-3xl bg-white p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-black text-slate-900">{t('home.why.title', 'Why AssetForU?')}</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-2"><Sparkles className="w-4 h-4 text-emerald-500" /> {t('home.why.one', 'Verified campaigns with transparent pricing.')}</li>
              <li className="flex items-start gap-2"><Ticket className="w-4 h-4 text-emerald-500" /> {t('home.why.two', 'Automatic entry on credit purchase.')}</li>
              <li className="flex items-start gap-2"><ArrowUpRight className="w-4 h-4 text-emerald-500" /> {t('home.why.three', 'Dedicated advisory support.')}</li>
            </ul>
            <button onClick={() => router.push('/campaigns')} className="mt-6 w-full rounded-xl bg-primary-700 text-white py-2 text-sm font-bold flex items-center justify-center gap-2">{t('home.viewAll', 'View All Campaigns')} <ChevronDown className="w-4 h-4" /></button>
          </div>

          <div className="space-y-5">
            {!homeCampaigns.length && !campaignsLoaded ? (
              <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-6 text-slate-500 text-sm">
                {t('home.loadingCampaigns', 'Loading campaigns…')}
              </div>
            ) : campaignsLoaded && !homeCampaigns.length ? (
              <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-6">
                <p className="text-sm font-extrabold text-slate-900">{t('home.noCampaigns.title', 'No campaigns available right now')}</p>
                <p className="mt-2 text-sm text-slate-600">
                  {t('home.noCampaigns.text', 'Asset Credits purchases are not available at the moment. Please check back later for upcoming campaigns.')}
                </p>
              </div>
            ) : (
              homeCampaigns.slice(0, 3).map((campaign, idx) => {
                const c = campaign as any as HomeCampaignWithFlags;
                const status = (c.status || 'active') as 'active' | 'upcoming' | 'closed';
                const isSlotSoldOut =
                  typeof c.totalSlots === 'number' &&
                  typeof c.filledSlots === 'number' &&
                  c.totalSlots > 0 &&
                  c.filledSlots >= c.totalSlots;
                const isClosed = !c.isAd && (status === 'closed' || isSlotSoldOut);
                const isUpcoming = !c.isAd && status === 'upcoming' && !isClosed;
                const limitReached = limitMap[campaign.id] === 0;
                const disableActions = isClosed || isUpcoming || limitReached;

                return (
              <div
                key={campaign.id}
                role="button"
                tabIndex={0}
                onClick={() => goToCampaign(campaign.id)}
                onKeyDown={(e) => e.key === 'Enter' && goToCampaign(campaign.id)}
                className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition"
              >
                <div className="grid md:grid-cols-[250px_1fr] gap-0">
                  {/* Carousel/Image Section */}
                  <div className="relative h-48 md:h-64 bg-slate-200 overflow-hidden">
                    {campaign.images && campaign.images.length > 0 ? (
                      <CampaignImageCarousel images={campaign.images} title={campaign.title} showAds />
                    ) : (
                      <>
                        <img src={campaign.imageUrl} alt={campaign.title} className="w-full h-full object-cover" />
                        <AdsBadge show />
                      </>
                    )}
                    {/* Campaign Tag */}
                    <span className="absolute top-3 left-3 rounded-full bg-emerald-600 text-white px-3 py-1 text-xs font-bold z-10">
                      {isClosed
                        ? t('campaign.closed', 'Closed')
                        : isUpcoming
                          ? t('campaign.upcoming', 'Upcoming')
                          : t(campaignTagKeys[idx % campaignTagKeys.length].key, campaignTagKeys[idx % campaignTagKeys.length].fallback)}
                    </span>
                  </div>

                  {/* Content Section */}
                  <div className="p-5 flex flex-col gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">{campaign.location}</p>
                      <h3 className="text-xl font-black text-slate-900">{campaign.title}</h3>
                      <p className="text-sm text-slate-600 mt-2">{campaign.description}</p>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs text-slate-400">{t('campaign.entryPack', 'Entry Pack')}</p>
                        <p className="text-lg font-black text-slate-900">{formatCurrency(campaign.creditPack, currency)} Credits</p>
                        {!isClosed && !isUpcoming && typeof limitMap[campaign.id] === 'number' && limitMap[campaign.id] > 0 && (
                          <p className="text-xs text-emerald-600 mt-1">
                            {t('campaign.limitLeft', 'You can access up to {count} more', { count: limitMap[campaign.id] })}
                          </p>
                        )}
                        {isClosed ? (
                          <p className="text-xs text-rose-600 mt-1">{c.soldOutAnnouncement || t('campaign.closedAnnouncement', 'Campaign closed — will announce live event soon.')}</p>
                        ) : isUpcoming ? (
                          <p className="text-xs text-amber-600 mt-1">{t('campaign.upcomingAnnouncement', 'Upcoming campaign — check back soon.')}</p>
                        ) : limitReached ? (
                          <p className="text-xs text-rose-600 mt-1">{t('campaign.limitReached', 'Limit reached for this campaign')}</p>
                        ) : null}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const isFavorited = favorites.some((f) => f.id === campaign.id);
                            toggleFavorite({
                              id: campaign.id,
                              title: campaign.title,
                              description: campaign.description,
                              image_url: campaign.imageUrl,
                              type: 'campaign',
                              category: campaign.location,
                              credits: campaign.creditPack,
                            });
                            addToast(
                              isFavorited ? `${campaign.title} removed from favorites` : `${campaign.title} added to favorites`,
                              'success',
                              1,
                              !isFavorited
                            );
                          }}
                          className="rounded-xl border border-slate-200 text-slate-600 px-3 py-2 text-sm font-bold hover:text-rose-500"
                        >
                          <Heart
                            className={`w-4 h-4 ${favorites.some((f) => f.id === campaign.id) ? 'fill-rose-500 text-rose-500' : ''
                              }`}
                          />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleBuy(campaign.id); }}
                          disabled={disableActions}
                          className="rounded-xl bg-primary-700 text-white px-4 py-2 text-sm font-bold disabled:opacity-60"
                        >
                          {isClosed
                            ? t('campaign.state.closed', 'Campaign Closed')
                            : isUpcoming
                            ? t('campaign.upcoming', 'Upcoming')
                            : limitReached
                            ? t('campaign.state.limit', 'Limit Reached')
                            : limitMap[campaign.id]
                            ? t('campaign.buyCta', 'Buy {amount} Credits & Enter a free Land Gifting Campaign ({count} left)', {
                                amount: formatCurrency(campaign.creditPack, currency),
                                count: limitMap[campaign.id],
                              })
                            : t('campaign.buyCtaNoCount', 'Buy {amount} Credits & Enter a free Land Gifting Campaign', {
                                amount: formatCurrency(campaign.creditPack, currency),
                              })}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isAuthed) {
                              openSignupModal(() => goToCampaign(campaign.id));
                              return;
                            }
                            if (disableActions) return;
                            addToCart({
                              id: `${campaign.id}-camp`,
                              item_id: campaign.id,
                              title: campaign.title,
                              description: campaign.description,
                              image_url: campaign.imageUrl,
                              type: 'campaign',
                              category: campaign.location,
                              credit_cost: campaign.creditPack,
                              quantity: 1,
                              subtotal: campaign.creditPack,
                            });
                          }}
                          disabled={disableActions}
                          className="rounded-xl border border-primary-700 text-primary-700 px-4 py-2 text-sm font-bold disabled:opacity-50"
                        >
                          {t('campaign.addToCart', 'Add to Cart')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {!isAuthed && (
        <section className="mx-auto max-w-7xl px-6 lg:px-10 py-8">
          <div className="rounded-3xl bg-slate-900 text-white p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-emerald-300">{t('home.join.kicker', 'Join Now')}</p>
              <h2 className="text-3xl font-black mt-2">{t('home.join.title', 'Ready to Get Started?')}</h2>
              <p className="text-slate-200 mt-2">{t('home.join.text', 'Create your account today and start exploring amazing opportunities with Asset Credits.')}</p>
            </div>
            <button
              onClick={() => openSignupModal()}
              className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 text-sm font-bold whitespace-nowrap transition"
            >
              {t('home.join.button', 'Create Account')}
            </button>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-6 lg:px-10 py-12">
        <div className="flex items-end justify-between gap-6 mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-emerald-600">{t('home.how.kicker', 'How It Works')}</p>
            <h2 className="text-3xl font-black text-slate-900 mt-2">{t('home.how.title', 'How AssetForU Works')}</h2>
            <p className="text-slate-500 mt-2">{t('home.how.subtitle', 'A clear, transparent flow designed for confidence.')}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: t('home.how.step1.title', 'Add Credits'),
              text: t('home.how.step1.text', 'Choose a campaign and purchase Asset Credits'),
              icon: Wallet,
            },
            {
              title: t('home.how.step2.title', 'Secure Credits'),
              text: t('home.how.step2.text', 'Your credits are added to your wallet after payment'),
              icon: BadgeCheck,
            },
            {
              title: t('home.how.step3.title', 'Access Campaigns'),
              text: t('home.how.step3.text', 'You become eligible for platform campaigns and can explore more opportunities'),
              icon: BadgeCheck,
            },
          ].map((step) => (
            <div key={step.title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="h-11 w-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <step.icon className="w-5 h-5" />
              </div>
              <h3 className="mt-4 text-lg font-black text-slate-900">{step.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <LandPropertiesCarousel />

      <section className="mx-auto max-w-7xl px-6 lg:px-10 py-12">
        <div className="flex items-end justify-between gap-6 mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-emerald-600">{t('home.faq.kicker', 'FAQ')}</p>
            <h2 className="text-3xl font-black text-slate-900 mt-2">{t('home.faq.title', 'Frequently Asked Questions')}</h2>
          </div>
        </div>

        <div className="space-y-3">
          {[
            {
              q: t('home.faq.q1.q', 'What are Asset Credits?'),
              a: t('home.faq.q1.a', 'Asset Credits are prepaid value that can be used across products and services on the platform.'),
            },
            {
              q: t('home.faq.q2.q', 'Can I use my credits anytime?'),
              a: t('home.faq.q2.a', 'Yes, credits can be used anytime in the Asset Store.'),
            },
            {
              q: t('home.faq.q3.q', 'Is participation guaranteed?'),
              a: t(
                'home.faq.q3.a',
                'No, campaign-related benefits are optional and subject to platform terms. No guaranteed allocation is provided.'
              ),
            },
            {
              q: t('home.faq.q4.q', 'How many times can I access a campaign?'),
              a: t('home.faq.q4.a', 'Each campaign has a limited number of accesses per user.'),
            },
            {
              q: t('home.faq.q5.q', 'Can I withdraw my credits?'),
              a: t('home.faq.q5.a', 'No, credits are non-withdrawable and intended for use within the platform.'),
            },
          ].map((item, index) => (
            <div key={item.q} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
              >
                <span className="text-sm font-bold text-slate-900">{item.q}</span>
                <span className={`text-xl font-bold text-emerald-600 transition ${openFaq === index ? 'rotate-45' : ''}`}>+</span>
              </button>
              {openFaq === index && (
                <div className="px-5 pb-4 text-sm text-slate-600">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 lg:px-10 py-12">
        <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-8">
          <p className="text-xs uppercase tracking-[0.25em] text-emerald-700">{t('home.info.kicker', 'Platform Information')}</p>
          <h2 className="text-3xl font-black text-slate-900 mt-2">{t('home.info.title', 'Platform Information')}</h2>
          <div className="mt-4 text-sm text-emerald-900/90 space-y-3">
            <p>{t('home.info.p1', 'AssetForU is a platform where users purchase Asset Credits to access curated experiences and platform benefits.')}</p>
            <p>{t('home.info.p2', 'Campaign-related benefits are provided as a complimentary feature and are not the primary purpose of purchase.')}</p>
            <p>{t('home.info.p3', 'Credits hold value within the platform and can be used across available platform experiences.')}</p>
            <p>{t('home.info.p4', 'No guaranteed allocation or outcome is associated with any campaign.')}</p>
            <p>{t('home.info.p5', 'Users are encouraged to review all terms and conditions before purchasing credits.')}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 lg:px-10 pb-12">
        <div className="rounded-2xl border border-primary-200 bg-primary-50 p-5 text-sm text-primary-800">
          <p>
            <strong>{t('home.note.label', 'Note:')}</strong>{' '}
            {t(
              'home.note.text',
              'No lottery language. No ticket/winner/gamble terms. This is a regulated asset credit program with campaign eligibility and benefits.'
            )}
          </p>
        </div>
      </section>
    </div>
  );
}
