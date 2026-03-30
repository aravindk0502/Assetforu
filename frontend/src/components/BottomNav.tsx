'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Home, Megaphone, ShoppingBag, Activity, Heart } from 'lucide-react';
import clsx from 'clsx';
import { useUIStore } from '@/store';

export function BottomNav() {
    const pathname = usePathname();
    const favorites = useUIStore((state) => state.favorites);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

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
                    const isFavoritesLink = href === '/favourites';
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={clsx(
                                'relative flex flex-col items-center justify-center w-full h-full gap-1 text-xs font-semibold transition-colors',
                                isActive
                                    ? 'text-primary-700 bg-primary-50'
                                    : 'text-slate-500 hover:text-slate-700'
                            )}
                        >
                            <div className="relative flex items-center justify-center">
                                <Icon className="w-5 h-5" />
                                {mounted && isFavoritesLink && favorites.length > 0 && (
                                    <span className="absolute -top-2 -right-2 h-5 min-w-5 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center shadow-md">
                                        {favorites.length}
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px]">{label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
