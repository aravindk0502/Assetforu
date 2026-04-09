'use client';

import { useEffect, useMemo, useState } from 'react';
import BackNavigation from '@/components/BackNavigation';
import { useAuthStore } from '@/store';
import { CheckCircle, Loader2, Save, X } from 'lucide-react';
import clsx from 'clsx';
import type { SiteContent, SiteFooterContent, SiteHeaderContent, SiteHeroContent, SiteNavLink, SiteStoreContent } from '@/types';

type Section = 'header' | 'hero' | 'footer' | 'store';

function normalizeLinks(input: string): SiteNavLink[] {
  // One per line: Label|/path
  const lines = input
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const links: SiteNavLink[] = [];
  for (const line of lines) {
    const [labelRaw, hrefRaw] = line.split('|').map((x) => (x || '').trim());
    if (!labelRaw || !hrefRaw) continue;
    links.push({ label: labelRaw, href: hrefRaw });
  }
  return links;
}

function linksToText(links?: SiteNavLink[]) {
  return (links || []).map((l) => `${l.label}|${l.href}`).join('\n');
}

function linesToText(lines?: string[]) {
  return (lines || []).join('\n');
}

function textToLines(text: string): string[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

export default function AdminSiteContentPage() {
  const token = useAuthStore((s) => s.token);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [content, setContent] = useState<SiteContent | null>(null);

  const [openSection, setOpenSection] = useState<Section | null>(null);

  const [headerDraft, setHeaderDraft] = useState<SiteHeaderContent>({});
  const [heroDraft, setHeroDraft] = useState<SiteHeroContent>({});
  const [footerDraft, setFooterDraft] = useState<SiteFooterContent>({});
  const [storeDraft, setStoreDraft] = useState<SiteStoreContent>({});

  const [headerLinksText, setHeaderLinksText] = useState('');
  const [footerExploreText, setFooterExploreText] = useState('');
  const [footerSupportText, setFooterSupportText] = useState('');
  const [footerLegalText, setFooterLegalText] = useState('');
  const [footerDisclaimerText, setFooterDisclaimerText] = useState('');
  const [socialInstagram, setSocialInstagram] = useState('');
  const [socialFacebook, setSocialFacebook] = useState('');
  const [socialLinkedIn, setSocialLinkedIn] = useState('');
  const [socialYouTube, setSocialYouTube] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const bearer = token || (typeof window !== 'undefined' ? localStorage.getItem('af_token') : null);
      if (!bearer) {
        setContent(null);
        return;
      }
      const res = await fetch('/api/admin/site-content', { headers: { authorization: `Bearer ${bearer}` }, cache: 'no-store' });
      const json = (await res.json().catch(() => ({}))) as { success?: boolean; data?: SiteContent | null; message?: string };
      if (!res.ok || json?.success === false) throw new Error(json?.message || `HTTP ${res.status}`);
      setContent(json.data || null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load';
      setError(msg);
      setContent(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openEditor = (section: Section) => {
    setError('');
    const c = content || {};
    if (section === 'header') {
      setHeaderDraft({ ...(c.header || {}) });
      setHeaderLinksText(linksToText(c.header?.nav_links));
    }
    if (section === 'hero') {
      setHeroDraft({ ...(c.hero || {}) });
    }
    if (section === 'footer') {
	      setFooterDraft({ ...(c.footer || {}) });
	      setFooterExploreText(linksToText(c.footer?.explore_links));
	      setFooterSupportText(linksToText(c.footer?.support_links));
	      setFooterLegalText(linksToText(c.footer?.legal_links));
	      setFooterDisclaimerText(linesToText(c.footer?.disclaimer_lines));
	      const socials = Array.isArray(c.footer?.social_links) ? c.footer?.social_links : [];
	      const getHref = (label: string) =>
	        String(socials.find((s: any) => String(s?.label || '').toLowerCase() === label.toLowerCase())?.href || '');
	      setSocialInstagram(getHref('Instagram'));
	      setSocialFacebook(getHref('Facebook'));
	      setSocialLinkedIn(getHref('LinkedIn'));
	      setSocialYouTube(getHref('YouTube'));
    }
    if (section === 'store') {
      setStoreDraft({ ...(c.store || {}) });
    }
    setOpenSection(section);
  };

  const title = useMemo(() => {
    if (openSection === 'header') return 'Edit Header';
    if (openSection === 'hero') return 'Edit Hero';
    if (openSection === 'footer') return 'Edit Footer';
    if (openSection === 'store') return 'Edit Store Page';
    return '';
  }, [openSection]);

  const saveSection = async () => {
    if (!openSection) return;
    setSaving(true);
    setError('');
    try {
      const bearer = token || (typeof window !== 'undefined' ? localStorage.getItem('af_token') : null);
      if (!bearer) throw new Error('Not authenticated');

      let patch: Partial<SiteContent> = {};
      if (openSection === 'header') {
        patch = {
          header: {
            ...headerDraft,
            nav_links: normalizeLinks(headerLinksText),
          },
        };
      }
      if (openSection === 'hero') {
        patch = { hero: { ...heroDraft } };
      }
      if (openSection === 'footer') {
	        const socialLinks = [
	          { label: 'Instagram', href: socialInstagram.trim() },
	          { label: 'Facebook', href: socialFacebook.trim() },
	          { label: 'LinkedIn', href: socialLinkedIn.trim() },
	          { label: 'YouTube', href: socialYouTube.trim() },
	        ].filter((l) => Boolean(l.href));
	        patch = {
	          footer: {
	            ...footerDraft,
	            explore_links: normalizeLinks(footerExploreText),
	            support_links: normalizeLinks(footerSupportText),
	            legal_links: normalizeLinks(footerLegalText),
	            disclaimer_lines: textToLines(footerDisclaimerText),
	            social_links: socialLinks,
	          },
	        };
      }
      if (openSection === 'store') {
        patch = { store: { ...storeDraft } };
      }

      const res = await fetch('/api/admin/site-content', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${bearer}` },
        body: JSON.stringify(patch),
      });
      const json = (await res.json().catch(() => ({}))) as { success?: boolean; data?: SiteContent; message?: string };
      if (!res.ok || json?.success === false) throw new Error(json?.message || `HTTP ${res.status}`);

      setContent(json.data || null);
      setSuccess('Saved!');
      setOpenSection(null);
      setTimeout(() => setSuccess(''), 2000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Save failed';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <BackNavigation />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white">Site Content</h1>
          <p className="text-slate-400 mt-1">Manage Header, Hero, and Footer text/links.</p>
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-2 bg-green-900/50 border border-green-800 text-green-400 rounded-xl px-4 py-3 mb-5 text-sm font-medium">
          <CheckCircle className="w-4 h-4" /> {success}
        </div>
      )}
      {error && (
        <div className="bg-rose-900/40 border border-rose-800 text-rose-200 rounded-xl px-4 py-3 mb-5 text-sm font-semibold">
          {error}
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-800 border-b border-slate-700">
            <tr>
              {['Section', 'Status', 'Updated', 'Actions'].map((h) => (
                <th key={h} className="px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={4} className="text-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary-400 mx-auto" />
                </td>
              </tr>
            ) : (
	              ([
	                { key: 'header', label: 'Header' },
	                { key: 'hero', label: 'Home Hero' },
	                { key: 'store', label: 'Store Page' },
	                { key: 'footer', label: 'Footer' },
	              ] as Array<{ key: Section; label: string }>).map((row) => (
                <tr key={row.key} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-5 py-4 text-white font-semibold">{row.label}</td>
                  <td className="px-5 py-4 text-slate-300 text-sm">{(content as any)?.[row.key] ? 'Configured' : 'Default'}</td>
                  <td className="px-5 py-4 text-slate-400 text-sm">{content?.updated_at ? new Date(content.updated_at).toLocaleString() : '—'}</td>
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => openEditor(row.key)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-700 transition-colors"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {openSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">{title}</h2>
              <button onClick={() => setOpenSection(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {openSection === 'header' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Brand name</label>
                    <input
                      value={headerDraft.brand_name || ''}
                      onChange={(e) => setHeaderDraft((h) => ({ ...h, brand_name: e.target.value }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
                    />
                  </div>
                  <div className="flex items-end gap-3">
                    <label className="flex items-center gap-2 text-sm text-slate-300 font-medium">
                      <input
                        type="checkbox"
                        checked={headerDraft.show_live ?? true}
                        onChange={(e) => setHeaderDraft((h) => ({ ...h, show_live: e.target.checked }))}
                        className="accent-primary-700 w-4 h-4"
                      />
                      Show LIVE
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">LIVE label</label>
                    <input
                      value={headerDraft.live_label || ''}
                      onChange={(e) => setHeaderDraft((h) => ({ ...h, live_label: e.target.value }))}
                      placeholder="LIVE"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">LIVE link</label>
                    <input
                      value={headerDraft.live_href || ''}
                      onChange={(e) => setHeaderDraft((h) => ({ ...h, live_href: e.target.value }))}
                      placeholder="https://…"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nav links (one per line: Label|/path)</label>
                  <textarea
                    rows={6}
                    value={headerLinksText}
                    onChange={(e) => setHeaderLinksText(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none resize-none"
                  />
                </div>
              </div>
            )}

            {openSection === 'hero' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Heading</label>
                  <input
                    value={heroDraft.heading || ''}
                    onChange={(e) => setHeroDraft((h) => ({ ...h, heading: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Subheading</label>
                  <textarea
                    rows={3}
                    value={heroDraft.subheading || ''}
                    onChange={(e) => setHeroDraft((h) => ({ ...h, subheading: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Note</label>
                  <input
                    value={heroDraft.note || ''}
                    onChange={(e) => setHeroDraft((h) => ({ ...h, note: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Background image URL</label>
                  <input
                    value={heroDraft.background_image_url || ''}
                    onChange={(e) => setHeroDraft((h) => ({ ...h, background_image_url: e.target.value }))}
                    placeholder="https://…"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Primary CTA label</label>
                    <input
                      value={heroDraft.primary_cta_label || ''}
                      onChange={(e) => setHeroDraft((h) => ({ ...h, primary_cta_label: e.target.value }))}
                      placeholder="Get Started"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Primary CTA link</label>
                    <input
                      value={heroDraft.primary_cta_href || ''}
                      onChange={(e) => setHeroDraft((h) => ({ ...h, primary_cta_href: e.target.value }))}
                      placeholder="/campaigns"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Secondary CTA label</label>
                    <input
                      value={heroDraft.secondary_cta_label || ''}
                      onChange={(e) => setHeroDraft((h) => ({ ...h, secondary_cta_label: e.target.value }))}
                      placeholder="Explore Store"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Secondary CTA link</label>
                    <input
                      value={heroDraft.secondary_cta_href || ''}
                      onChange={(e) => setHeroDraft((h) => ({ ...h, secondary_cta_href: e.target.value }))}
                      placeholder="/store"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {openSection === 'store' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Hero kicker</label>
                  <input
                    value={storeDraft.hero_kicker || ''}
                    onChange={(e) => setStoreDraft((s) => ({ ...s, hero_kicker: e.target.value }))}
                    placeholder="AssetForU Store"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Hero heading</label>
                  <textarea
                    rows={2}
                    value={storeDraft.hero_heading || ''}
                    onChange={(e) => setStoreDraft((s) => ({ ...s, hero_heading: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Hero subheading</label>
                  <textarea
                    rows={2}
                    value={storeDraft.hero_subheading || ''}
                    onChange={(e) => setStoreDraft((s) => ({ ...s, hero_subheading: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Products CTA label</label>
                    <input
                      value={storeDraft.products_cta_label || ''}
                      onChange={(e) => setStoreDraft((s) => ({ ...s, products_cta_label: e.target.value }))}
                      placeholder="Explore Products"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Services CTA label</label>
                    <input
                      value={storeDraft.services_cta_label || ''}
                      onChange={(e) => setStoreDraft((s) => ({ ...s, services_cta_label: e.target.value }))}
                      placeholder="View Services"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Section title</label>
                  <input
                    value={storeDraft.section_title || ''}
                    onChange={(e) => setStoreDraft((s) => ({ ...s, section_title: e.target.value }))}
                    placeholder="Asset Store"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Section subtitle</label>
                  <textarea
                    rows={2}
                    value={storeDraft.section_subtitle || ''}
                    onChange={(e) => setStoreDraft((s) => ({ ...s, section_subtitle: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none resize-none"
                  />
                </div>
              </div>
            )}

            {openSection === 'footer' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Brand description</label>
                  <textarea
                    rows={3}
                    value={footerDraft.brand_description || ''}
                    onChange={(e) => setFooterDraft((f) => ({ ...f, brand_description: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none resize-none"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Explore links</label>
                    <textarea
                      rows={6}
                      value={footerExploreText}
                      onChange={(e) => setFooterExploreText(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Support links</label>
                    <textarea
                      rows={6}
                      value={footerSupportText}
                      onChange={(e) => setFooterSupportText(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Legal links</label>
                    <textarea
                      rows={6}
                      value={footerLegalText}
                      onChange={(e) => setFooterLegalText(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none resize-none"
                    />
                  </div>
                </div>
	                <div>
	                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Disclaimer lines (one per line)</label>
	                  <textarea
	                    rows={4}
	                    value={footerDisclaimerText}
	                    onChange={(e) => setFooterDisclaimerText(e.target.value)}
	                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none resize-none"
	                  />
	                </div>
	                <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-4">
	                  <p className="text-xs font-black text-slate-300 uppercase tracking-wider mb-3">Social Links</p>
	                  <div className="grid grid-cols-1 gap-3">
	                    <div>
	                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Instagram</label>
	                      <input
	                        value={socialInstagram}
	                        onChange={(e) => setSocialInstagram(e.target.value)}
	                        placeholder="https://instagram.com/…"
	                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
	                      />
	                    </div>
	                    <div>
	                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Facebook</label>
	                      <input
	                        value={socialFacebook}
	                        onChange={(e) => setSocialFacebook(e.target.value)}
	                        placeholder="https://facebook.com/…"
	                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
	                      />
	                    </div>
	                    <div>
	                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">LinkedIn</label>
	                      <input
	                        value={socialLinkedIn}
	                        onChange={(e) => setSocialLinkedIn(e.target.value)}
	                        placeholder="https://linkedin.com/…"
	                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
	                      />
	                    </div>
	                    <div>
	                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">YouTube</label>
	                      <input
	                        value={socialYouTube}
	                        onChange={(e) => setSocialYouTube(e.target.value)}
	                        placeholder="https://youtube.com/…"
	                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
	                      />
	                    </div>
	                  </div>
	                </div>
	              </div>
	            )}

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setOpenSection(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm font-semibold hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void saveSection()}
                disabled={saving}
                className={clsx(
                  'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-700 text-white text-sm font-bold hover:bg-primary-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed',
                )}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
