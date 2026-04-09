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
  end_time: string;
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

export interface AdPlacementBanner {
  id: string;
  title: string;
  description?: string;
  images: string[];
  href?: string;
  cta_label?: string;
  placement: AdPlacement;
  is_active: boolean;
  start_time?: string | null;
  end_time?: string | null;
  priority?: number;
  created_at?: string;
  updated_at?: string;
}
