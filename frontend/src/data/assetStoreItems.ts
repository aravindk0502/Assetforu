import { StoreItem } from '@/types';

export const assetStoreItems: StoreItem[] = [
    {
        id: 'asset-1',
        title: 'Premium Land Analysis Pack',
        description: 'Detailed growth projections for premium land campaigns.',
        image_url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1000',
        type: 'service',
        category: 'Land Advisory',
        credit_cost: 220,
        is_popular: true,
    },
    {
        id: 'asset-2',
        title: 'Smart Farming Kit',
        description: 'IoT sensors and kit for sustainable land use.',
        image_url: 'https://images.unsplash.com/photo-1562569633-6223037af4f1?w=1000',
        type: 'product',
        category: 'Equipment',
        credit_cost: 160,
        is_popular: false,
    },
    {
        id: 'asset-3',
        title: 'Legal & Compliance Advisory',
        description: 'Assistance for legal validity in land transactions.',
        image_url: 'https://images.unsplash.com/photo-1581091012184-c5f2f31d7d0a?w=1000',
        type: 'service',
        category: 'Compliance',
        credit_cost: 280,
        is_popular: true,
    },
];
