'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';

interface BackNavigationProps {
    href?: string;
}

export default function BackNavigation({ href }: BackNavigationProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { t } = useLanguage();

    // Determine the destination based on current path
    const getDefaultHref = () => {
        // Service pages go to store with tab=services
        if (pathname.includes('/store/services/')) {
            return '/store?tab=services';
        }
        // Product pages go to store with tab=products
        if (pathname.includes('/store/products/')) {
            return '/store?tab=products';
        }
        // Campaign pages go to campaigns
        if (pathname.includes('/campaigns/')) {
            return '/campaigns';
        }
        // Admin pages navigate accordingly
        if (pathname.includes('/admin/campaigns/')) {
            return '/admin';
        }
        if (pathname.includes('/admin/store/')) {
            return '/admin';
        }
        if (pathname.includes('/admin/transactions/')) {
            return '/admin';
        }
        if (pathname.includes('/admin/users/')) {
            return '/admin';
        }
        // Activity order details go back to activity
        if (pathname.includes('/activity/')) {
            return '/activity';
        }
        // Terms, Privacy, Help pages go to home
        if (pathname.includes('/terms') || pathname.includes('/privacy') || pathname.includes('/help')) {
            return '/';
        }
        // Use browser back as fallback
        return null;
    };

    const destination = href || getDefaultHref();

    const handleClick = () => {
        if (destination) {
            router.push(destination);
        } else {
            router.back();
        }
    };

    return (
        <button
            onClick={handleClick}
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary-700 hover:text-primary-800 hover:underline transition-colors mb-6"
            title={t('back.previous', 'Back to Previous Page')}
        >
            <ArrowLeft className="w-4 h-4" />
            {t('back.previous', 'Back to Previous Page')}
        </button>
    );
}
