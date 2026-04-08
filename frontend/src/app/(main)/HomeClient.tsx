'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useCartStore, useUIStore } from '@/store';
import { addToast } from '@/components/Toast';
import { campaigns } from '@/data/dreamCampaigns';
import { productCatalog, servicesCatalog } from '@/data/storeCatalog';
import { Sparkles, Ticket, ArrowUpRight, Heart, Wallet, Store, BadgeCheck, Activity, ChevronDown } from 'lucide-react';
import { campaignAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/currency';
import LandPropertiesCarousel from '@/components/LandPropertiesCarousel';
import { CampaignImageCarousel } from '@/components/CampaignImageCarousel';
import { AdsBadge } from '@/components/AdsBadge';

const campaignTags = ['Just Launched', 'Closing Soon', 'Exclusive Series', 'Trending'];

export default function HomePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const { walletBalance, openSignupModal, favorites, toggleFavorite, currency } = useUIStore();
  const { addToCart, items: cartItems } = useCartStore();
  const [limitMap, setLimitMap] = useState<Record<string, number>>({});
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const isDevUser = !!user?.id?.startsWith('dev_');
  const isAuthed = !!user || !!token;

  const loadDevLimits = () => {
    try {
      const raw = localStorage.getItem('af_dev_campaign_purchases');
      const map = raw ? JSON.parse(raw) as Record<string, number> : {};
      const topThreeCampaigns = campaigns.slice(0, 3);
      const entries = topThreeCampaigns.map((c) => [c.id, Math.max(0, 3 - (map[c.id] || 0))] as const);
      setLimitMap(Object.fromEntries(entries));
    } catch (error) {
      // Failed to load dev limits - use defaults
      setLimitMap({});
    }
  };

  useEffect(() => {
    const loadLimits = async () => {
      if (!token && !user) return;
      if (isDevUser) {
        loadDevLimits();
        return;
      }
      try {
        const topThreeCampaigns = campaigns.slice(0, 3);
        const entries = await Promise.all(
          topThreeCampaigns.map(async (c) => {
            try {
              const res = await campaignAPI.limit(c.id);
              const remaining = Number(res.data?.data?.remaining_limit ?? 3);
              return [c.id, remaining] as const;
            } catch (error) {
              // If API fails, use default limit of 3
              return [c.id, 3] as const;
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
  }, [token, user, isDevUser]);

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
            src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1600&q=80&auto=format&fit=crop"
            alt="City skyline"
            className="h-full w-full object-cover brightness-[0.85]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/25 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950/10" />
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10 py-24 md:py-28">
          <div className="max-w-3xl text-white">
            <p className="text-xs uppercase tracking-[0.35em] text-emerald-200/80 mb-4">Digital Platform Experience</p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight">Explore Products and Services Through Asset Credits</h1>
            <p className="mt-6 max-w-2xl text-base sm:text-lg text-slate-100/85 leading-8">Use Asset Credits to access platform services such as legal consultation, land advisory, and related offerings, designed to enhance your overall experience.</p>
            <p className="mt-6 text-sm text-slate-200/70 max-w-xl">As part of the platform experience, users may receive access to promotional campaigns. These benefits are complimentary and not the primary purpose of credit purchase.</p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <button onClick={() => router.push('/campaigns')} className="rounded-full bg-emerald-300 text-slate-950 px-6 py-3 text-sm font-semibold shadow-xl shadow-emerald-500/20 transition hover:bg-emerald-200">Get Started</button>
              <button onClick={() => router.push('/store')} className="rounded-full border border-emerald-200/75 text-white px-6 py-3 text-sm font-semibold transition hover:bg-white/10">Explore Store</button>
            </div>
          </div>
          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {[
              { label: 'Wallet Balance', value: `${formatCurrency(isAuthed ? walletBalance : 0, currency)}` },
              { label: 'Active Campaigns', value: `3` },
              { label: 'Items in Cart', value: `${cartItems.length}` },
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
            <p className="text-xs uppercase tracking-[0.25em] text-emerald-600">Active Platform Campaigns</p>
            <h2 className="text-3xl font-black text-slate-900 mt-2">Featured Campaigns</h2>
            <p className="text-slate-500 mt-2">Explore available campaigns as part of your platform experience with Asset Credits.</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
          <div className="rounded-3xl bg-white p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-black text-slate-900">Why AssetForU?</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-2"><Sparkles className="w-4 h-4 text-emerald-500" /> Verified campaigns with transparent pricing.</li>
              <li className="flex items-start gap-2"><Ticket className="w-4 h-4 text-emerald-500" /> Automatic entry on credit purchase.</li>
              <li className="flex items-start gap-2"><ArrowUpRight className="w-4 h-4 text-emerald-500" /> Dedicated advisory support.</li>
            </ul>
            <button onClick={() => router.push('/campaigns')} className="mt-6 w-full rounded-xl bg-primary-700 text-white py-2 text-sm font-bold flex items-center justify-center gap-2">View All Campaigns <ChevronDown className="w-4 h-4" /></button>
          </div>

          <div className="space-y-5">
            {campaigns.slice(0, 3).map((campaign, idx) => (
              <div key={campaign.id} className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
                <div className="grid md:grid-cols-[250px_1fr] gap-0">
                  {/* Carousel/Image Section */}
                  <div className="relative h-48 md:h-64 bg-slate-200 overflow-hidden">
                    {campaign.images && campaign.images.length > 0 ? (
                      <CampaignImageCarousel images={campaign.images} title={campaign.title} />
                    ) : (
                      <>
                        <img src={campaign.imageUrl} alt={campaign.title} className="w-full h-full object-cover" />
                        <AdsBadge />
                      </>
                    )}
                    {/* Campaign Tag */}
                    <span className="absolute top-3 left-3 rounded-full bg-emerald-600 text-white px-3 py-1 text-xs font-bold z-10">
                      {campaignTags[idx % campaignTags.length]}
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
                        <p className="text-xs text-slate-400">Entry Pack</p>
                        <p className="text-lg font-black text-slate-900">{formatCurrency(campaign.creditPack, currency)} Credits</p>
                        {typeof limitMap[campaign.id] === 'number' && limitMap[campaign.id] > 0 && (
                          <p className="text-xs text-emerald-600 mt-1">
                            You can access up to {limitMap[campaign.id]} more
                          </p>
                        )}
                        {limitMap[campaign.id] === 0 && (
                          <p className="text-xs text-rose-600 mt-1">Limit reached for this campaign</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
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
                          onClick={() => handleBuy(campaign.id)}
                          disabled={limitMap[campaign.id] === 0}
                          className="rounded-xl bg-primary-700 text-white px-4 py-2 text-sm font-bold disabled:opacity-60"
                        >
                          {limitMap[campaign.id] === 0
                            ? 'Limit Reached'
                            : `Buy ${formatCurrency(campaign.creditPack, currency)} Credits & Enter a free Land Gifting Campaign${limitMap[campaign.id] ? ` (${limitMap[campaign.id]} left)` : ''}`}
                        </button>
                        <button
                          onClick={() => {
                            if (!isAuthed) {
                              openSignupModal(() => goToCampaign(campaign.id));
                              return;
                            }
                            if (limitMap[campaign.id] === 0) return;
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
                          disabled={limitMap[campaign.id] === 0}
                          className="rounded-xl border border-primary-700 text-primary-700 px-4 py-2 text-sm font-bold disabled:opacity-50"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {!isAuthed && (
        <section className="mx-auto max-w-7xl px-6 lg:px-10 py-8">
          <div className="rounded-3xl bg-slate-900 text-white p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-emerald-300">Join Now</p>
              <h2 className="text-3xl font-black mt-2">Ready to Get Started?</h2>
              <p className="text-slate-200 mt-2">Create your account today and start exploring amazing opportunities with Asset Credits.</p>
            </div>
            <button
              onClick={() => openSignupModal()}
              className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 text-sm font-bold whitespace-nowrap transition"
            >
              Create Account
            </button>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-6 lg:px-10 py-8">
        <div className="rounded-3xl bg-gradient-to-r from-emerald-500 to-emerald-600 p-8 md:p-10 text-white">
          <h3 className="text-2xl md:text-3xl font-black mb-4">Explore Products & Services</h3>
          <ul className="space-y-2 mb-6 text-sm md:text-base">
            <li className="flex items-center gap-2"><span className="text-emerald-200">✓</span> Premium products curated for quality</li>
            <li className="flex items-center gap-2"><span className="text-emerald-200">✓</span> Expert services available instantly</li>
            <li className="flex items-center gap-2"><span className="text-emerald-200">✓</span> Use your Asset Credits to purchase</li>
          </ul>
          <button onClick={() => router.push('/store')} className="rounded-full bg-white text-emerald-600 px-6 py-3 text-sm font-bold hover:bg-emerald-50 transition">
            Shop Now →
          </button>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 lg:px-10 py-12">
        <div className="flex items-end justify-between gap-6 mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-emerald-600">How It Works</p>
            <h2 className="text-3xl font-black text-slate-900 mt-2">How AssetForU Works</h2>
            <p className="text-slate-500 mt-2">A clear, transparent flow designed for confidence.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: 'Add Credits',
              text: 'Choose a campaign and purchase Asset Credits',
              icon: Wallet,
            },
            {
              title: 'Complete Quick Check',
              text: 'Answer a simple question to continue',
              icon: Activity,
            },
            {
              title: 'Secure Credits',
              text: 'Your credits are added to your wallet after payment',
              icon: Store,
            },
            {
              title: 'Access Campaigns',
              text: 'You become eligible for platform campaigns and can explore more opportunities',
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
            <p className="text-xs uppercase tracking-[0.25em] text-emerald-600">FAQ</p>
            <h2 className="text-3xl font-black text-slate-900 mt-2">Frequently Asked Questions</h2>
          </div>
        </div>

        <div className="space-y-3">
          {[
            {
              q: 'What are Asset Credits?',
              a: 'Asset Credits are prepaid value that can be used across products and services on the platform.',
            },
            {
              q: 'Why is there a quiz step?',
              a: 'The quiz is mandatory to enter a free land gifting campaign.',
            },
            {
              q: 'Can I use my credits anytime?',
              a: 'Yes, credits can be used anytime in the Asset Store.',
            },
            {
              q: 'Is participation guaranteed?',
              a: 'No, campaign-related benefits are optional and subject to platform terms. No guaranteed allocation is provided.',
            },
            {
              q: 'How many times can I access a campaign?',
              a: 'Each campaign has a limited number of accesses per user.',
            },
            {
              q: 'Can I withdraw my credits?',
              a: 'No, credits are non-withdrawable and intended for use within the platform.',
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
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 overflow-hidden shadow-2xl">
          <div className="relative p-8 md:p-12">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-cyan-400 blur-3xl" />
            </div>
            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-[0.3em] text-emerald-300 font-bold mb-3">Unlock Exclusive Benefits</p>
                  <h2 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight">
                    Your Asset Credits Await
                  </h2>
                  <p className="text-lg text-slate-200 mb-3">
                    Access premium products, expert services, and exclusive campaign opportunities with every credit you purchase.
                  </p>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center gap-3 text-slate-100">
                      <span className="text-emerald-400 font-bold">✓</span> Instant account credit allocation
                    </li>
                    <li className="flex items-center gap-3 text-slate-100">
                      <span className="text-emerald-400 font-bold">✓</span> Use across all platform services
                    </li>
                    <li className="flex items-center gap-3 text-slate-100">
                      <span className="text-emerald-400 font-bold">✓</span> Transparent, zero hidden charges
                    </li>
                  </ul>
                  <button
                    onClick={() => router.push('/store')}
                    className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 text-sm font-bold transition shadow-lg hover:shadow-emerald-500/50"
                  >
                    Explore Now →
                  </button>
                </div>
                <div className="flex-1 text-center">
                  <div className="inline-block">
                    <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-emerald-400/20 p-8 shadow-xl">
                      <div className="text-5xl font-black text-emerald-400 mb-2">∞</div>
                      <p className="text-white font-bold text-sm">Unlimited Opportunities</p>
                      <p className="text-slate-300 text-xs mt-1">Credits never expire</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 lg:px-10 py-12">
        <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-8">
          <p className="text-xs uppercase tracking-[0.25em] text-emerald-700">Platform Information</p>
          <h2 className="text-3xl font-black text-slate-900 mt-2">Platform Information</h2>
          <div className="mt-4 text-sm text-emerald-900/90 space-y-3">
            <p>AssetForU is a platform where users purchase Asset Credits to access products and services.</p>
            <p>A simple knowledge step is included as part of the platform experience before completing a transaction.</p>
            <p>Campaign-related benefits are provided as a complimentary feature and are not the primary purpose of purchase.</p>
            <p>Credits hold value within the platform and can be used across available products and services.</p>
            <p>No guaranteed allocation or outcome is associated with any campaign.</p>
            <p>Users are encouraged to review all terms and conditions before purchasing credits.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 lg:px-10 pb-14">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-emerald-600">Asset Store</p>
            <button
              onClick={() => router.push('/store')}
              className="mt-2 text-left text-3xl font-black text-slate-900 hover:text-primary-700 underline-offset-4 hover:underline"
            >
              Products & Services
            </button>
            <p className="text-slate-500 mt-2">Premium lifestyle products and land services in one place.</p>
          </div>
        </div>

        <div className="space-y-10">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-slate-900">Products</h3>
              <button
                onClick={() => router.push('/store')}
                className="text-xs font-bold text-primary-700"
              >
                View All
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {productCatalog.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => router.push(`/store/products/${item.id}`)}
                  className="min-w-[240px] text-left rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-sm hover:-translate-y-0.5 transition"
                >
                  <img src={item.image} alt={item.name} className="h-40 w-full object-cover" />
                  <div className="p-4">
                    <h3 className="text-sm font-bold text-slate-900">{item.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">{formatCurrency(item.credits, currency)} · {item.credits} Credits</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-slate-900">Services</h3>
              <button
                onClick={() => router.push('/store')}
                className="text-xs font-bold text-primary-700"
              >
                View All
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {servicesCatalog.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => router.push(`/store/services/${item.id}`)}
                  className="min-w-[240px] text-left rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-sm hover:-translate-y-0.5 transition"
                >
                  <img src={item.image} alt={item.name} className="h-40 w-full object-cover" />
                  <div className="p-4">
                    <h3 className="text-sm font-bold text-slate-900">{item.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">{formatCurrency(item.credits, currency)} · {item.credits} Credits</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 lg:px-10 pb-12">
        <div className="rounded-2xl border border-primary-200 bg-primary-50 p-5 text-sm text-primary-800">
          <p><strong>Note:</strong> No lottery language. No ticket/winner/gamble terms. This is a regulated asset credit program with campaign eligibility and benefits.</p>
        </div>
      </section>
    </div>
  );
}
