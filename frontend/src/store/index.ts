import { create } from 'zustand';
import type { User, CartItem } from '@/types';

// ── Auth Store ────────────────────────────────────────────────
interface AuthState {
  user: User | null;
  token: string | null;
  isLoaded: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  loadFromStorage: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoaded: false,

  loadFromStorage: () => {
    if (typeof window === 'undefined') return;
    try {
      const token = localStorage.getItem('af_token');
      const raw = localStorage.getItem('af_user');
      const user = raw ? JSON.parse(raw) : null;
      set({ user, token, isLoaded: true });
    } catch {
      set({ isLoaded: true });
    }
  },

  setAuth: (user, token) => {
    const overridesRaw = localStorage.getItem('af_profile_overrides');
    const overrides = overridesRaw ? JSON.parse(overridesRaw) as Record<string, Partial<User>> : {};
    const lastPhone = localStorage.getItem('af_last_phone') || '';
    const key = user?.phone || lastPhone || user?.id || 'default';
    const merged = overrides[key] ? { ...user, ...overrides[key] } : user;
    localStorage.setItem('af_token', token);
    localStorage.setItem('af_user', JSON.stringify(merged));
    set({ user: merged, token, isLoaded: true });
  },

  logout: () => {
    localStorage.removeItem('af_token');
    localStorage.removeItem('af_user');
    // Clear user-specific data on logout
    localStorage.removeItem('af_favorites');
    localStorage.removeItem('af_activity');
    localStorage.removeItem('af_transactions');
    localStorage.removeItem('af_wallet_balance');
    localStorage.removeItem('af_delivery_address');
    set({ user: null, token: null });
  },

  updateUser: (updates) =>
    set((s) => {
      const updated = s.user ? { ...s.user, ...updates } : null;
      if (updated) {
        localStorage.setItem('af_user', JSON.stringify(updated));
        const overridesRaw = localStorage.getItem('af_profile_overrides');
        const overrides = overridesRaw ? JSON.parse(overridesRaw) as Record<string, Partial<User>> : {};
        const lastPhone = localStorage.getItem('af_last_phone') || '';
        const key = updated.phone || lastPhone || updated.id || 'default';
        overrides[key] = { ...(overrides[key] || {}), ...updates };
        if (updated.phone) {
          overrides[updated.phone] = { ...(overrides[updated.phone] || {}), ...updates };
        }
        if (updated.id) {
          overrides[updated.id] = { ...(overrides[updated.id] || {}), ...updates };
        }
        localStorage.setItem('af_profile_overrides', JSON.stringify(overrides));
      }
      return { user: updated };
    }),
}));

// ── UI Store (modals, wallet, history) ─────────────────────────
interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  description: string;
  credits: number;
  createdAt: string;
}

interface ActivityEntry {
  id: string;
  campaignId: string;
  campaignName: string;
  creditsUsed: number;
  status: 'Active Campaign' | 'Completed';
  createdAt: string;
  ticketNumber?: number;
}

interface FavoriteItem {
  id: string;
  title: string;
  description: string;
  image_url: string;
  type: 'product' | 'service' | 'campaign' | 'store' | 'property';
  category: string;
  credits: number;
}

type ActivityInput = Omit<ActivityEntry, 'id' | 'createdAt' | 'ticketNumber'> & {
  ticketCount?: number;
  ticketNumbers?: number[];
};

interface UIState {
  signupModalOpen: boolean;
  signupModalCallback: (() => void) | null;
  openSignupModal: (callback?: () => void) => void;
  closeSignupModal: () => void;
  currency: 'INR' | 'USD' | 'AED';
  setCurrency: (c: 'INR' | 'USD' | 'AED') => void;
  walletBalance: number;
  setWalletBalance: (b: number) => void;
  transactions: Transaction[];
  addTransaction: (t: Omit<Transaction, 'id' | 'createdAt'>) => void;
  activity: ActivityEntry[];
  addActivity: (a: ActivityInput) => void;
  favorites: FavoriteItem[];
  toggleFavorite: (item: FavoriteItem) => void;
  resetUserData: () => void;
}

const loadWalletBalance = () => {
  if (typeof window === 'undefined') return 0;
  const stored = localStorage.getItem('af_wallet_balance');
  return stored ? Number(stored) : 0;
};

const loadCurrency = (): 'INR' | 'USD' | 'AED' => {
  if (typeof window === 'undefined') return 'INR';
  const stored = localStorage.getItem('af_currency');
  if (stored === 'USD' || stored === 'AED' || stored === 'INR') return stored;
  return 'INR';
};

const loadTransactions = (): Transaction[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('af_transactions');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const loadActivity = (): ActivityEntry[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('af_activity');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const loadFavorites = (): FavoriteItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('af_favorites');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const loadTicketSequence = (campaignId: string) => {
  if (typeof window === 'undefined') return 1;
  const raw = localStorage.getItem(`af_ticket_seq_${campaignId}`);
  const parsed = raw ? Number(raw) : 1;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
};

const saveWalletBalance = (b: number) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('af_wallet_balance', String(b));
};

const saveTransactions = (transactions: Transaction[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('af_transactions', JSON.stringify(transactions));
};

const saveActivity = (activity: ActivityEntry[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('af_activity', JSON.stringify(activity));
};

const saveFavorites = (favorites: FavoriteItem[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('af_favorites', JSON.stringify(favorites));
};

const saveTicketSequence = (campaignId: string, nextNumber: number) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`af_ticket_seq_${campaignId}`, String(nextNumber));
};

export const useUIStore = create<UIState>((set, get) => ({
  signupModalOpen: false,
  signupModalCallback: null,
  openSignupModal: (callback) => set({ signupModalOpen: true, signupModalCallback: callback || null }),
  closeSignupModal: () => set({ signupModalOpen: false, signupModalCallback: null }),
  currency: loadCurrency(),
  setCurrency: (c) => {
    if (typeof window !== 'undefined') localStorage.setItem('af_currency', c);
    set({ currency: c });
  },
  walletBalance: loadWalletBalance(),
  setWalletBalance: (b) => {
    saveWalletBalance(b);
    set({ walletBalance: b });
  },
  transactions: loadTransactions(),
  addTransaction: (t) => {
    const now = new Date().toISOString();
    const newTransaction: Transaction = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      createdAt: now,
      ...t,
    };
    const updated = [newTransaction, ...get().transactions];
    saveTransactions(updated);
    set({ transactions: updated });
  },
  activity: loadActivity(),
  addActivity: (a) => {
    const now = new Date().toISOString();
    const { ticketCount, ticketNumbers, ...activityBase } = a;
    if (ticketNumbers && ticketNumbers.length > 0) {
      const newEntries: ActivityEntry[] = ticketNumbers.map((num) => ({
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}-${num}`,
        createdAt: now,
        ticketNumber: num,
        ...activityBase,
      }));
      const updated = [...newEntries, ...get().activity];
      saveActivity(updated);
      set({ activity: updated });
      return;
    }
    if (ticketCount && ticketCount > 0) {
      const campaignId = activityBase.campaignId;
      const start = loadTicketSequence(campaignId);
      const count = Math.max(1, Math.floor(ticketCount));
      const newEntries: ActivityEntry[] = Array.from({ length: count }, (_, idx) => ({
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}-${start + idx}`,
        createdAt: now,
        ticketNumber: start + idx,
        ...activityBase,
      }));
      const updated = [...newEntries, ...get().activity];
      saveActivity(updated);
      saveTicketSequence(campaignId, start + count);
      set({ activity: updated });
      return;
    }

    const newActivity: ActivityEntry = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      createdAt: now,
      ...activityBase,
    };
    const updated = [newActivity, ...get().activity];
    saveActivity(updated);
    set({ activity: updated });
  },
  favorites: loadFavorites(),
  toggleFavorite: (item) => {
    const existing = get().favorites;
    const exists = existing.some((f) => f.id === item.id);
    const updated = exists ? existing.filter((f) => f.id !== item.id) : [item, ...existing];
    saveFavorites(updated);
    set({ favorites: updated });
  },
  resetUserData: () => {
    saveWalletBalance(0);
    saveTransactions([]);
    saveActivity([]);
    saveFavorites([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('af_delivery_address');
    }
    set({ walletBalance: 0, transactions: [], activity: [], favorites: [] });
  },
}));

// ── Cart Store ────────────────────────────────────────────────
interface CartState {
  items: CartItem[];
  totalCredits: number;
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  resetCart: () => void;
  setCart: (items: CartItem[], total: number) => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  totalCredits: 0,
  addToCart: (item) => {
    const existingIndex = get().items.findIndex((x) => x.item_id === item.item_id);
    let updatedItems = [...get().items];

    if (existingIndex >= 0) {
      const existing = updatedItems[existingIndex];
      const quantity = existing.quantity + (item.quantity || 1);
      updatedItems[existingIndex] = {
        ...existing,
        quantity,
        subtotal: quantity * item.credit_cost,
      };
    } else {
      updatedItems.push({
        ...item,
        quantity: item.quantity || 1,
        subtotal: (item.quantity || 1) * item.credit_cost,
      });
    }

    const totalCredits = updatedItems.reduce((sum, i) => sum + i.subtotal, 0);
    set({ items: updatedItems, totalCredits });
  },
  removeFromCart: (itemId) => {
    const updatedItems = get().items.filter((x) => x.item_id !== itemId);
    const totalCredits = updatedItems.reduce((sum, i) => sum + i.subtotal, 0);
    set({ items: updatedItems, totalCredits });
  },
  setCart: (items, totalCredits) => set({ items, totalCredits }),
  clearCart: () => set({ items: [], totalCredits: 0 }),
  resetCart: () => set({ items: [], totalCredits: 0 }),
}));
