'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useCartStore, useUIStore } from '@/store';
import { formatCurrency } from '@/lib/currency';
import { Leaf, Wallet, LogOut, UserCircle, Activity, ShoppingCart, Bell, Heart } from 'lucide-react';
import { fetchSiteContent } from '@/lib/siteContent';
import { useLanguage } from '@/components/LanguageProvider';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { getNotificationsUpdatedEventName, readClientNotifications, type ClientNotificationItem } from '@/lib/fcm/inbox';
import { registerFcmToken } from '@/lib/fcm/register';
import { addToast } from '@/components/Toast';

const NOTIFICATION_SEEN_AT_KEY = 'af_notifications_seen_at';

function timeAgo(iso: string) {
    const t = new Date(iso).getTime();
    if (!Number.isFinite(t)) return '';
    const diffSec = Math.max(0, Math.floor((Date.now() - t) / 1000));
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    const diffDay = Math.floor(diffHour / 24);
    return `${diffDay}d ago`;
}

export function Header() {
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const token = useAuthStore((state) => state.token);
    const isLoaded = useAuthStore((state) => state.isLoaded);
    const logout = useAuthStore((state) => state.logout);
    const walletBalance = useUIStore((state) => state.walletBalance);
    const currency = useUIStore((state) => state.currency);
    const cartItems = useCartStore((state) => state.items);
    const favorites = useUIStore((state) => state.favorites);
    const { openSignupModal, resetUserData } = useUIStore();
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [registeringPush, setRegisteringPush] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [hasStoredToken, setHasStoredToken] = useState(false);
    const [siteHeader, setSiteHeader] = useState<any | null>(null);
    const [notifications, setNotifications] = useState<ClientNotificationItem[]>([]);
    const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
    const firstNotificationSyncRef = useRef(true);
    const knownNotificationIdsRef = useRef<Set<string>>(new Set());
    const { t } = useLanguage();

    const isAuthed = !!user || !!token || hasStoredToken;

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        fetchSiteContent()
            .then((c) => setSiteHeader(c?.header || null))
            .catch(() => setSiteHeader(null));
    }, []);

    useEffect(() => {
        try {
            setHasStoredToken(!!localStorage.getItem('af_token'));
        } catch {
            setHasStoredToken(false);
        }
    }, [token, isLoaded]);

    const handleLogout = () => {
        logout();
        resetUserData();
        setNotificationsOpen(false);
        setUnreadNotificationsCount(0);
        setProfileDropdownOpen(false);
        if (typeof window !== 'undefined') {
            localStorage.removeItem(NOTIFICATION_SEEN_AT_KEY);
        }
        window.location.assign('/');
    };

    const markNotificationsSeen = () => {
        if (typeof window === 'undefined') return;
        localStorage.setItem(NOTIFICATION_SEEN_AT_KEY, String(Date.now()));
        setUnreadNotificationsCount(0);
    };

    const ensurePushRegistration = async () => {
        if (registeringPush) return;
        if (!isAuthed) return;
        const bearer = token || (typeof window !== 'undefined' ? localStorage.getItem('af_token') : null);
        if (!bearer) return;
        try {
            setRegisteringPush(true);
            const result = await registerFcmToken({ authToken: bearer, promptIfNeeded: true });
            console.log('[FCM] bell-click registration result', result);
        } catch (e) {
            console.error('[FCM] bell-click registration failed', e);
        } finally {
            setRegisteringPush(false);
        }
    };

    const handleNotificationsClick = async () => {
        if (!isAuthed) {
            openSignupModal();
            return;
        }
        await ensurePushRegistration();
        setNotificationsOpen((prev) => {
            const next = !prev;
            if (next) markNotificationsSeen();
            return next;
        });
    };

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const sync = () => {
            const next = readClientNotifications();
            setNotifications(next);

            const seenAtMs = Number.parseInt(localStorage.getItem(NOTIFICATION_SEEN_AT_KEY) || '0', 10) || 0;
            const unread = next.filter((n) => new Date(n.createdAt || 0).getTime() > seenAtMs).length;
            setUnreadNotificationsCount(unread);

            const knownIds = knownNotificationIdsRef.current;
            const currentIds = new Set(next.map((n) => n.id).filter(Boolean));
            let newCount = 0;
            if (!firstNotificationSyncRef.current) {
                currentIds.forEach((id) => {
                    if (!knownIds.has(id)) newCount += 1;
                });
            }
            knownNotificationIdsRef.current = currentIds;
            if (firstNotificationSyncRef.current) {
                firstNotificationSyncRef.current = false;
                return;
            }
            if (newCount > 0) {
                addToast('New notification', 'info', newCount, true);
            }
        };
        sync();
        const eventName = getNotificationsUpdatedEventName();
        window.addEventListener(eventName, sync);
        window.addEventListener('storage', sync);
        return () => {
            window.removeEventListener(eventName, sync);
            window.removeEventListener('storage', sync);
        };
    }, []);

    useEffect(() => {
        if (notificationsOpen) markNotificationsSeen();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [notificationsOpen]);

    return (
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary-700 flex items-center justify-center">
                            <Leaf className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
                        </div>
                        <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 hidden xs:block">
                            {siteHeader?.brand_name || 'AssetForU'}
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center space-x-6 text-sm font-semibold flex-1 mx-12">
                        {(Array.isArray(siteHeader?.nav_links) && siteHeader.nav_links.length
                            ? siteHeader.nav_links
                            : [
                                { label: 'Home', href: '/' },
                                { label: 'Campaigns', href: '/campaigns' },
                                { label: 'Asset Store', href: '/store' },
                                { label: 'Activity', href: '/activity' },
                                { label: 'Wallet', href: '/wallet' },
                              ]).map((l: any) => (
                            <Link key={`${l.label}-${l.href}`} href={String(l.href)} className="text-slate-700 hover:text-primary-700 transition-colors">
                                {String(l.href) === '/'
                                  ? t('nav.home', 'Home')
                                  : String(l.href).includes('/campaign')
                                  ? t('nav.campaigns', 'Campaigns')
                                  : String(l.href).includes('/store')
                                  ? t('nav.store', 'Asset Store')
                                  : String(l.href).includes('/activity')
                                  ? t('nav.activity', 'Activity')
                                  : String(l.href).includes('/wallet')
                                  ? t('nav.wallet', 'Wallet')
                                  : String(l.label)}
                            </Link>
                        ))}

                        {(siteHeader?.show_live ?? true) && (
                            <a
                                href={siteHeader?.live_href || 'https://youtube.com/live'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all font-bold text-xs"
                            >
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-red-400"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                                {siteHeader?.live_label || 'LIVE'}
                            </a>
                        )}
                    </nav>

                    {/* Right Side - Responsive */}
                    <div className="flex items-center gap-1.5 sm:gap-3">
                        {/* Wallet - Desktop */}
                        <Link href="/wallet" className="hidden sm:flex items-center gap-2 bg-primary-50 hover:bg-primary-100 px-3 py-2 rounded-lg transition-colors">
                            <Wallet className="w-4 h-4 text-primary-700" />
                            <span className="font-semibold text-primary-700 text-sm" suppressHydrationWarning>
                                {mounted ? formatCurrency(isAuthed ? walletBalance : 0, currency) : '0'}
                            </span>
                            <span className="text-xs text-primary-600 hidden sm:block">Credits</span>
                        </Link>

                        <div className="hidden sm:block">
                            <LanguageSwitcher />
                        </div>

                        {/* Wallet - Mobile Badge */}
                        <Link href="/wallet" className="sm:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-primary-300 bg-primary-50 hover:bg-primary-100 transition-colors">
                            <Wallet className="w-3.5 h-3.5 text-primary-700" />
                            <span className="font-semibold text-primary-700 text-xs" suppressHydrationWarning>
                                {mounted ? (isAuthed ? formatCurrency(walletBalance, currency) : '₹0') : '₹0'}
                            </span>
                        </Link>

                        {/* Live - Mobile */}
                        <a href="https://youtube.com/live" target="_blank" rel="noopener noreferrer" className="sm:hidden inline-flex items-center justify-center h-8 px-2 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all">
                            <span className="relative flex h-1.5 w-1.5 mr-1">
                                <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-red-400"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-300"></span>
                            </span>
                            <span className="text-[10px] font-bold">LIVE</span>
                        </a>

                        {/* Notifications - Desktop */}
                        <button onClick={handleNotificationsClick} className="relative hidden sm:flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
                            <Bell className="w-4 h-4" />
                            {unreadNotificationsCount > 0 && (
                                <span className="absolute -top-2 -right-2 h-5 min-w-5 px-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                                    {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                                </span>
                            )}
                        </button>

                        {/* Notifications - Mobile */}
                        <button onClick={handleNotificationsClick} className="relative sm:hidden flex items-center justify-center h-8 w-8 rounded-lg text-slate-600 active:bg-slate-100">
                            <Bell className="w-4 h-4" />
                            {unreadNotificationsCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-1 rounded-full bg-emerald-600 text-white text-[9px] font-bold flex items-center justify-center">
                                    {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                                </span>
                            )}
                        </button>

                        <div className="sm:hidden">
                            <LanguageSwitcher compact />
                        </div>

                        {/* Favourites - Desktop */}
                        <Link
                            href="/favourites"
                            className="group relative hidden sm:flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                            aria-label="Favourites"
                            title={t('nav.favorites', 'Favorites')}
                        >
                            <Heart className={`w-4 h-4 ${favorites.length > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
                            {favorites.length > 0 && (
                                <span className="absolute -top-2 -right-2 h-5 min-w-5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                                    {favorites.length}
                                </span>
                            )}
                            <span className="pointer-events-none absolute top-11 right-1/2 translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-[11px] font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                                {t('nav.favorites', 'Favorites')}
                            </span>
                        </Link>

                        {/* Cart */}
                        <Link href="/cart" className="relative flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 sm:px-3 py-2 text-slate-700 hover:bg-slate-50">
                            <ShoppingCart className="w-4 h-4" />
                            <span className="hidden sm:block text-sm font-semibold">{t('nav.cart', 'Cart')}</span>
                            {cartItems.length > 0 && (
                                <span className="absolute -top-2 -right-2 h-5 min-w-5 px-1 rounded-full bg-primary-700 text-white text-[10px] font-bold flex items-center justify-center">
                                    {cartItems.reduce((sum, i) => sum + (i.quantity || 0), 0)}
                                </span>
                            )}
                        </Link>

                        {/* Profile / Auth */}
                        {!isAuthed ? (
                            <button onClick={() => openSignupModal()} className="inline-block px-3 sm:px-5 py-2 bg-primary-700 text-white font-semibold rounded-lg text-xs sm:text-sm hover:bg-primary-800 transition-colors flex-shrink-0">
                                {t('auth.login', 'Sign-Up/Login')}
                            </button>
                        ) : (
                            <div className="relative flex-shrink-0">
                                <button onClick={() => setProfileDropdownOpen(!profileDropdownOpen)} className="flex flex-shrink-0 items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors">
                                    <UserCircle className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
                                </button>
                                {profileDropdownOpen && (
                                    <>
                                        <div className="absolute right-0 top-10 w-48 sm:w-56 rounded-xl border border-slate-200 bg-white shadow-lg z-50 overflow-hidden">
                                            <div className="px-4 py-3 border-b border-slate-100">
                                                <p className="text-xs sm:text-sm font-semibold text-slate-900">{user?.email || 'User'}</p>
                                            </div>
                                            <div className="space-y-1 p-2">
                                                <Link href="/profile" onClick={() => setProfileDropdownOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg">
                                                    <UserCircle className="w-4 h-4" /> My Profile
                                                </Link>
                                                <Link href="/activity" onClick={() => setProfileDropdownOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg">
                                                    <Activity className="w-4 h-4" /> {t('nav.activity', 'Activity')}
                                                </Link>
                                                <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg w-full text-left">
                                                    <LogOut className="w-4 h-4" /> Sign Out
                                                </button>
                                            </div>
                                        </div>
                                        <div className="fixed inset-0 z-30" onClick={() => setProfileDropdownOpen(false)} />
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Notifications Dropdown */}
                {notificationsOpen && isAuthed && (
                    <>
                        <div className="absolute right-4 sm:right-24 top-14 w-72 sm:w-80 rounded-xl border border-slate-200 bg-white shadow-xl z-50 overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                                <p className="text-sm font-bold text-slate-900">Notifications</p>
                                <button onClick={() => setNotificationsOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                            </div>
                            {notifications.length === 0 ? (
                                <div className="px-4 py-6 text-sm text-slate-500">No updates yet.</div>
                            ) : (
                                <div className="max-h-72 overflow-auto">
                                    {notifications.map((n) => (
                                        <button
                                            key={n.id}
                                            onClick={() => {
                                                router.push(n.link || '/activity');
                                                setNotificationsOpen(false);
                                            }}
                                            className="w-full px-4 py-3 border-b border-slate-100 last:border-0 text-left hover:bg-slate-50 transition-colors cursor-pointer"
                                        >
                                            <p className="text-xs uppercase tracking-wide text-primary-600 font-bold">{n.title}</p>
                                            <p className="text-sm text-slate-700 mt-1">{n.message}</p>
                                            <p className="text-xs text-slate-400 mt-2">{timeAgo(n.createdAt)}</p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                    </>
                )}
            </div>
        </header>
    );
}
