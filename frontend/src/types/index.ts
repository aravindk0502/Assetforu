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
  credit_price: number;
  total_slots: number;
  filled_slots: number;
  status: 'active' | 'closed' | 'upcoming';
  end_time: string;
  badge?: string;
  is_featured: boolean;
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
