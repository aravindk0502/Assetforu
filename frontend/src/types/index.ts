export interface User {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  role: 'user' | 'admin';
  kyc_status: 'pending' | 'verified' | 'rejected';
  balance?: number;
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  location: string;
  image_url: string;
  // For backwards/forwards compatibility: some APIs may provide separate list field,
  // or we may store a JSON-stringified array into `image_url`.
  image_urls?: string[];
  credit_price: number;
  total_slots: number;
  filled_slots: number;
  status: 'active' | 'closed' | 'upcoming';
  end_time: string | null;
  badge?: string;
  is_featured: boolean;
  created_at?: string;
  userParticipation?: Participation | null;
}

export interface Participation {
  id: string;
  user_id: string;
  campaign_id: string;
  credits_used: number;
  created_at: string;
}

export interface StoreItem {
  id: string;
  title: string;
  description: string;
  image_url: string;
  type: 'service' | 'product';
  category: string;
  credit_cost: number;
  is_popular: boolean;
}

export interface CartItem {
  id: string;
  quantity: number;
  item_id: string;
  title: string;
  description: string;
  image_url: string;
  type: string;
  category: string;
  credit_cost: number;
  subtotal: number;
}

export interface Transaction {
  id: string;
  type: string;
  amount: number;
  credits: number;
  direction: 'credit' | 'debit';
  description: string;
  reference_id?: string;
  status: string;
  created_at: string;
}

export interface WalletData {
  balance: number;
  transactions: Transaction[];
}

export type AdPlacement = 'home_hero' | 'home_carousel' | 'campaign_cards';

export type AdPropertyType = 'sale' | 'rent';

export type AdPropertyDetails = {
  type?: AdPropertyType;
  city?: string;
  state?: string;
  country?: string;
  square_feet?: number;
  price_label?: string;
  call_phone?: string;
  whatsapp?: string;
  map_url?: string;
  description?: string;
};

export interface AdPlacementBanner {
  id: string;
  title: string;
  description?: string;
  images: string[];
  href?: string;
  cta_label?: string;
  placement: AdPlacement;
  property?: AdPropertyDetails;
  is_active: boolean;
  start_time?: string | null;
  end_time?: string | null;
  priority?: number;
  created_at?: string;
  updated_at?: string;
}

export type SiteNavLink = { label: string; href: string };

export type SiteHeaderContent = {
  brand_name?: string;
  nav_links?: SiteNavLink[];
  show_live?: boolean;
  live_href?: string;
  live_label?: string;
};

export type SiteHeroContent = {
  heading?: string;
  subheading?: string;
  note?: string;
  background_image_url?: string;
  primary_cta_label?: string;
  primary_cta_href?: string;
  secondary_cta_label?: string;
  secondary_cta_href?: string;
};

export type SiteFooterContent = {
  brand_description?: string;
  explore_links?: SiteNavLink[];
  support_links?: SiteNavLink[];
  legal_links?: SiteNavLink[];
  disclaimer_lines?: string[];
  social_links?: Array<{ label: string; href: string }>;
};

export type SiteStoreContent = {
  hero_kicker?: string;
  hero_heading?: string;
  hero_subheading?: string;
  products_cta_label?: string;
  services_cta_label?: string;
  section_title?: string;
  section_subtitle?: string;
};

export type SiteContent = {
  header?: SiteHeaderContent;
  hero?: SiteHeroContent;
  footer?: SiteFooterContent;
  store?: SiteStoreContent;
  updated_at?: string;
};
