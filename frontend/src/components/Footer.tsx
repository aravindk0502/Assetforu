 'use client';

import Link from 'next/link';
import { Leaf, Instagram, Facebook, Linkedin, Youtube } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { fetchSiteContent } from '@/lib/siteContent';

export function Footer() {
  const [siteFooter, setSiteFooter] = useState<any | null>(null);
  useEffect(() => {
    fetchSiteContent()
      .then((c) => setSiteFooter(c?.footer || null))
      .catch(() => setSiteFooter(null));
  }, []);

  const exploreLinks = useMemo(
    () =>
      (Array.isArray(siteFooter?.explore_links) && siteFooter.explore_links.length
        ? siteFooter.explore_links
        : [
            { href: '/', label: 'Home' },
            { href: '/campaigns', label: 'Campaigns' },
            { href: '/store', label: 'Asset Store' },
            { href: '/wallet', label: 'My Wallet' },
          ]) as Array<{ href: string; label: string }>,
    [siteFooter]
  );
  const supportLinks = useMemo(
    () =>
      (Array.isArray(siteFooter?.support_links) && siteFooter.support_links.length
        ? siteFooter.support_links
        : [
            { href: '/help', label: 'Help Center' },
            { href: '/contact', label: 'Contact Us' },
          ]) as Array<{ href: string; label: string }>,
    [siteFooter]
  );
  const legalLinks = useMemo(
    () =>
      (Array.isArray(siteFooter?.legal_links) && siteFooter.legal_links.length
        ? siteFooter.legal_links
        : [
            { href: '/privacy', label: 'Privacy Policy' },
            { href: '/terms', label: 'Terms & Conditions' },
          ]) as Array<{ href: string; label: string }>,
    [siteFooter]
  );
  const disclaimerLines = useMemo(
    () =>
      (Array.isArray(siteFooter?.disclaimer_lines) && siteFooter.disclaimer_lines.length
        ? siteFooter.disclaimer_lines
        : [
            'Asset Credits are intended for use within the platform and can be utilized across available products and services.',
            'Campaign-related benefits are provided as a complimentary feature and are not the primary purpose of credit purchase.',
            'No guaranteed allocation, outcome, or financial return is associated with any campaign or platform activity.',
          ]) as string[],
    [siteFooter]
  );
  const socialLinks = useMemo(() => {
    const raw = Array.isArray(siteFooter?.social_links) ? siteFooter.social_links : null;
    return raw && raw.length
      ? (raw as Array<{ label: string; href: string }>)
      : [
          { label: 'Instagram', href: 'https://instagram.com' },
          { label: 'Facebook', href: 'https://facebook.com' },
          { label: 'LinkedIn', href: 'https://linkedin.com' },
          { label: 'YouTube', href: 'https://youtube.com' },
        ];
  }, [siteFooter]);

  return (
    <footer className="bg-white border-t border-slate-100 mt-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary-700 flex items-center justify-center">
                <Leaf className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-extrabold text-lg text-primary-700 tracking-tight">AssetForU</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              {siteFooter?.brand_description ||
                'AssetForU empowers users to access products, services, and curated land experiences through Asset Credits within a unified digital platform.'}
            </p>
          </div>

          {/* Explore */}
          <div>
            <h4 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wider">Explore</h4>
            <ul className="space-y-2.5 text-sm text-slate-500">
              {exploreLinks.map((l) => (
                <li key={`${l.href}-${l.label}`}>
                  <Link href={l.href} className="hover:text-primary-700 transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wider">Support</h4>
            <ul className="space-y-2.5 text-sm text-slate-500">
              {supportLinks.map((l) => (
                <li key={`${l.href}-${l.label}`}>
                  <Link href={l.href} className="hover:text-primary-700 transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wider">Legal</h4>
            <ul className="space-y-2.5 text-sm text-slate-500">
              {legalLinks.map((l) => (
                <li key={`${l.href}-${l.label}`}>
                  <Link href={l.href} className="hover:text-primary-700 transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Disclaimer Section */}
        <div className="mt-10 p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <p className="text-xs text-slate-600 leading-relaxed space-y-2">
            {disclaimerLines.map((line) => (
              <span key={line} className="block mt-2 first:mt-0">{line}</span>
            ))}
          </p>
        </div>

        {/* Social Media Links */}
        <div className="mt-10 flex items-center justify-center gap-6">
          {socialLinks.map((l) => {
            const label = String(l.label || '');
            const href = String(l.href || '#');
            const icon =
              label.toLowerCase() === 'instagram'
                ? Instagram
                : label.toLowerCase() === 'facebook'
                  ? Facebook
                  : label.toLowerCase() === 'linkedin'
                    ? Linkedin
                    : Youtube;
            const Icon = icon;
            return (
              <a
                key={`${label}-${href}`}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 w-9 rounded-lg border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-primary-700 transition-all"
                aria-label={label}
              >
                <Icon className="w-4 h-4" />
              </a>
            );
          })}
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-slate-100 mt-10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} AssetForU Technologies. All rights reserved.</p>
          <p className="text-xs text-slate-400">You are purchasing Asset Credits for platform usage. Credits are usable across products and services within AssetForU.</p>
        </div>
      </div>
    </footer>
  );
}
