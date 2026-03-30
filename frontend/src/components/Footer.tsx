import Link from 'next/link';
import { Leaf, Instagram, Facebook, Linkedin, Youtube } from 'lucide-react';

export function Footer() {
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
              AssetForU empowers users to access products, services, and curated land experiences through Asset Credits within a unified digital platform.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h4 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wider">Explore</h4>
            <ul className="space-y-2.5 text-sm text-slate-500">
              {[['/', 'Home'], ['/campaigns', 'Campaigns'], ['/store', 'Asset Store'], ['/wallet', 'My Wallet']].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="hover:text-primary-700 transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wider">Support</h4>
            <ul className="space-y-2.5 text-sm text-slate-500">
              {[['/help', 'Help Center'], ['/contact', 'Contact Us']].map(([href, label]) => (
                <li key={label}>
                  <Link href={href} className="hover:text-primary-700 transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wider">Legal</h4>
            <ul className="space-y-2.5 text-sm text-slate-500">
              {[['/privacy', 'Privacy Policy'], ['/terms', 'Terms & Conditions']].map(([href, label]) => (
                <li key={label}>
                  <Link href={href} className="hover:text-primary-700 transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Disclaimer Section */}
        <div className="mt-10 p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <p className="text-xs text-slate-600 leading-relaxed space-y-2">
            <span className="block">Asset Credits are intended for use within the platform and can be utilized across available products and services.</span>
            <span className="block mt-2">Campaign-related benefits are provided as a complimentary feature and are not the primary purpose of credit purchase.</span>
            <span className="block mt-2">No guaranteed allocation, outcome, or financial return is associated with any campaign or platform activity.</span>
          </p>
        </div>

        {/* Social Media Links */}
        <div className="mt-10 flex items-center justify-center gap-6">
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="h-9 w-9 rounded-lg border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-primary-700 transition-all"
            aria-label="Instagram"
          >
            <Instagram className="w-4 h-4" />
          </a>
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="h-9 w-9 rounded-lg border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-primary-700 transition-all"
            aria-label="Facebook"
          >
            <Facebook className="w-4 h-4" />
          </a>
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            className="h-9 w-9 rounded-lg border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-primary-700 transition-all"
            aria-label="LinkedIn"
          >
            <Linkedin className="w-4 h-4" />
          </a>
          <a
            href="https://youtube.com"
            target="_blank"
            rel="noopener noreferrer"
            className="h-9 w-9 rounded-lg border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-primary-700 transition-all"
            aria-label="YouTube"
          >
            <Youtube className="w-4 h-4" />
          </a>
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
