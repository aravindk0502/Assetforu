import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import AppChrome from './AppChrome';

// Force all pages to be dynamic - this cascades to all routes
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'AssetForU – Premium Land Access Platform',
  description:
    'Discover exclusive real estate opportunities. Purchase Asset Credits, access campaigns, and redeem services on AssetForU.',
  keywords: ['real estate', 'land', 'asset credits', 'property', 'India'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-display antialiased bg-[#f6f8f7] text-slate-900 min-h-screen">
        <Providers>
          <AppChrome>{children}</AppChrome>
        </Providers>
      </body>
    </html>
  );
}
