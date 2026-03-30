'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Megaphone, ShoppingBag, Activity, Heart } from 'lucide-react';
import clsx from 'clsx';

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/campaigns', label: 'Campaigns', icon: Megaphone },
    { href: '/store', label: 'Store', icon: ShoppingBag },
    { href: '/activity', label: 'Activity', icon: Activity },
    { href: '/favourites', label: 'Favorites', icon: Heart },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-slate-200 shadow-lg">
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex flex-col items-center justify-center w-full h-full gap-1 text-xs font-semibold transition-colors',
                isActive
                  ? 'text-primary-700 bg-primary-50'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
