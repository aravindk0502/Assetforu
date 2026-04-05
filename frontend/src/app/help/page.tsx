'use client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, MessageCircle } from 'lucide-react';
import BackNavigation from '@/components/BackNavigation';

const categories = [
    {
        id: 'account',
        title: 'Account & Login',
        icon: '👤',
        description: 'Manage your account, password, and profile settings',
        href: '/profile',
    },
    {
        id: 'payments',
        title: 'Payments & Credits',
        icon: '💳',
        description: 'Questions about Asset Credits and transactions',
        href: '/wallet',
    },
    {
        id: 'campaigns',
        title: 'Campaign Access',
        icon: '📊',
        description: 'Learn how campaigns work and participation',
        href: '/campaigns',
    },
    {
        id: 'store',
        title: 'Asset Store',
        icon: '🛍️',
        description: 'Products and services available on the platform',
        href: '/store',
    },
    {
        id: 'general',
        title: 'General Questions',
        icon: '❓',
        description: 'Everything else you need to know',
        href: '/contact',
    },
];

const faqs = [
    {
        question: 'What are Asset Credits?',
        answer:
            'Asset Credits are digital credits used within the AssetForU platform to access products, services, and curated land experiences. They are purchased and managed through your wallet for platform usage.',
    },
    {
        question: 'How do I use credits?',
        answer:
            'You can use Asset Credits to purchase products from the Asset Store, access services, or participate in platform campaigns. Simply add items to your cart and proceed to checkout using your available credits.',
    },
    {
        question: 'Are credits refundable?',
        answer:
            'Asset Credits are intended for platform usage and are non-refundable. Please refer to our Terms & Conditions for complete details on credit policies.',
    },
    {
        question: 'How do campaigns work?',
        answer:
            'Campaigns are curated opportunities within the platform. You can explore available campaigns, allocate credits to participate, and access complimentary benefits as part of your participation. Campaign details and benefits are displayed on each campaign page.',
    },
    {
        question: 'Is participation guaranteed?',
        answer:
            'Campaign participation depends on meeting eligibility criteria and allocating the required credits. There is no guaranteed outcome or allocation from any campaign. Benefits provided are complimentary features of the platform.',
    },
    {
        question: 'Why is there a quiz step?',
        answer:
            'The quiz ensures users understand platform guidelines and participation requirements before accessing certain features. This helps maintain a compliant and informed user community.',
    },
];

export default function HelpPage() {
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

    return (
        <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
            <BackNavigation />

            {/* Hero Section */}
            <div className="bg-white border-b border-slate-100">
                <div className="mx-auto max-w-4xl px-6 lg:px-10 py-12">
                    <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Help Center</h1>
                    <p className="text-lg text-slate-600">
                        Find answers to your questions and learn how to get the most out of AssetForU.
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="mx-auto max-w-4xl px-6 lg:px-10 py-12">
                {/* Categories Grid */}
                <div className="mb-16">
                    <h2 className="text-2xl font-bold text-slate-900 mb-8">Browse by Category</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {categories.map((category) => (
                            <Link key={category.id} href={category.href}>
                                <div className="p-6 bg-white border border-slate-200 rounded-xl hover:shadow-lg hover:border-primary-200 transition-all cursor-pointer group h-full">
                                    <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{category.icon}</div>
                                    <h3 className="font-bold text-slate-900 mb-2 text-lg">{category.title}</h3>
                                    <p className="text-sm text-slate-500">{category.description}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="mb-16">
                    <h2 className="text-2xl font-bold text-slate-900 mb-8">Frequently Asked Questions</h2>
                    <div className="space-y-4">
                        {faqs.map((faq, index) => (
                            <div
                                key={index}
                                className="border border-slate-200 rounded-xl overflow-hidden bg-white hover:border-primary-300 transition-colors"
                            >
                                <button
                                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                                >
                                    <span className="font-semibold text-slate-900 text-left">{faq.question}</span>
                                    <ChevronDown
                                        className={`w-5 h-5 text-primary-700 flex-shrink-0 transition-transform ${expandedFaq === index ? 'rotate-180' : ''
                                            }`}
                                    />
                                </button>
                                {expandedFaq === index && (
                                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
                                        <p className="text-slate-600 leading-relaxed">{faq.answer}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA Section */}
                <div className="bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-xl p-8 text-center">
                    <h3 className="text-2xl font-bold text-slate-900 mb-3">Still need help?</h3>
                    <p className="text-slate-600 mb-6">
                        Our support team is here to assist you with any questions or issues.
                    </p>
                    <Link
                        href="/contact"
                        className="inline-block px-8 py-3 bg-primary-700 text-white font-semibold rounded-lg hover:bg-primary-800 transition-colors"
                    >
                        <MessageCircle className="w-4 h-4 inline-block mr-2" />
                        Contact Support
                    </Link>
                </div>
            </div>
        </div>
    );
}
