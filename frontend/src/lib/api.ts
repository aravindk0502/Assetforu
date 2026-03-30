import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('af_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      // In development, keep local session unless user explicitly logs out.
      if (process.env.NODE_ENV === 'production') {
        localStorage.removeItem('af_token');
        localStorage.removeItem('af_user');
        window.dispatchEvent(new Event('auth:logout'));
      }
    }
    return Promise.reject(err);
  }
);

// ── Auth ─────────────────────────────────────────────────────
export const authAPI = {
  sendOtp: (phone: string) => api.post('/auth/send-otp', { phone }),
  verifyOtp: (phone: string, otp: string, terms_accepted: boolean) =>
    api.post('/auth/verify-otp', { phone, otp, terms_accepted }),
};

// ── User ─────────────────────────────────────────────────────
export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data: { name?: string; email?: string; phone?: string }) => api.patch('/user/profile', data),
};

// ── Wallet ───────────────────────────────────────────────────
export const walletAPI = {
  get: () => api.get('/wallet'),
  addCredits: (credits: number, amount: number, reference_id?: string) =>
    api.post('/wallet/add', { credits, amount, reference_id }),
};

// ── Campaigns ────────────────────────────────────────────────
export const campaignAPI = {
  list: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/campaigns', { params }),
  get: (id: string) => api.get(`/campaign/${id}`),
  participate: (campaign_id: string, quantity = 1) =>
    api.post('/campaigns/participate', { campaign_id, quantity }),
  limit: (campaign_id: string) => api.get(`/campaigns/${campaign_id}/limit`),
};

// ── Store ────────────────────────────────────────────────────
export const storeAPI = {
  listItems: (params?: { type?: string; category?: string }) =>
    api.get('/store-items', { params }),
  getCart: () => api.get('/store/cart/items'),
  addToCart: (store_item_id: string, quantity?: number) =>
    api.post('/store/cart', { store_item_id, quantity }),
  removeFromCart: (itemId: string) => api.delete(`/store/cart/${itemId}`),
  checkout: () => api.post('/store/purchase'),
};

// ── Payment ──────────────────────────────────────────────────
export const paymentAPI = {
  createOrder: (amount_inr: number) => api.post('/payment/create-order', { amount_inr }),
  verify: (data: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) =>
    api.post('/payment/verify', data),
};

// ── Admin ────────────────────────────────────────────────────
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (page?: number) => api.get('/admin/users', { params: { page } }),
  getTransactions: () => api.get('/admin/transactions'),
  createCampaign: (data: Record<string, unknown>) => api.post('/admin/campaigns', data),
  updateCampaign: (id: string, data: Record<string, unknown>) => api.patch(`/admin/campaigns/${id}`, data),
  createStoreItem: (data: Record<string, unknown>) => api.post('/admin/store-items', data),
};
