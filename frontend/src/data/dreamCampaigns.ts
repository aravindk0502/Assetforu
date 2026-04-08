export interface CampaignInfo {
    id: string;
    title: string;
    location: string;
    city: string;
    state: string;
    country: string;
    priceLabel: string;
    contactPhone: string;
    whatsappNumber: string;
    mapUrl?: string;
    imageUrl: string;
    images?: string[];
    description: string;
    creditPack: number;
}

export const campaigns: CampaignInfo[] = [
    {
        id: 'dxb-1',
        title: 'Ocean View Land Parcel',
        location: 'Goa, India',
        city: 'Panaji',
        state: 'Goa',
        country: 'India',
        priceLabel: '₹48 Lakhs',
        contactPhone: '+91 90000 00001',
        whatsappNumber: '919000000001',
        mapUrl: 'https://maps.google.com/?q=Goa%2C%20India',
        imageUrl: 'https://images.unsplash.com/photo-1499346030926-9a72daac6c63?w=1200',
        images: [
            'https://images.unsplash.com/photo-1499346030926-9a72daac6c63?w=1200',
            'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200',
            'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=1200',
            'https://images.unsplash.com/photo-1439853949127-fa647821eba0?w=1200',
            'https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=1200',
        ],
        description: 'Premium coastal land with region growth potential.',
        creditPack: 300,
    },
    {
        id: 'dxb-2',
        title: 'Heritage Orchard Land',
        location: 'Maharashtra, India',
        city: 'Nashik',
        state: 'Maharashtra',
        country: 'India',
        priceLabel: '₹32 Lakhs',
        contactPhone: '+91 90000 00002',
        whatsappNumber: '919000000002',
        mapUrl: 'https://maps.google.com/?q=Nashik%2C%20Maharashtra%2C%20India',
        imageUrl: 'https://images.unsplash.com/photo-1535914254981-b5012eebbd15?w=1200',
        images: [
            'https://images.unsplash.com/photo-1535914254981-b5012eebbd15?w=1200',
            'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=1200',
            'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200',
            'https://images.unsplash.com/photo-1434725039106-f3cab2f81064?w=1200',
            'https://images.unsplash.com/photo-1500382017468-7049fae79eba?w=1200',
        ],
        description: 'Serene farm land close to highways.',
        creditPack: 300,
    },
    {
        id: 'dxb-3',
        title: 'Emerging City Plot',
        location: 'Hyderabad, India',
        city: 'Hyderabad',
        state: 'Telangana',
        country: 'India',
        priceLabel: '₹28 Lakhs',
        contactPhone: '+91 90000 00003',
        whatsappNumber: '919000000003',
        mapUrl: 'https://maps.google.com/?q=Hyderabad%2C%20Telangana%2C%20India',
        imageUrl: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200',
        images: [
            'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200',
            'https://images.unsplash.com/photo-1469022563149-aa64dbd37dae?w=1200',
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200',
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200',
            'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=1200',
        ],
        description: 'Strategic urban land for asset growth.',
        creditPack: 300,
    },
];
