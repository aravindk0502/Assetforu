'use client';

type CreateOrderResponse = {
  success?: boolean;
  message?: string;
  data?: {
    key_id: string;
    order_id: string;
    amount_paise: number;
    currency: string;
  };
};

type VerifyResponse = { success?: boolean; message?: string };

type RazorpayResult = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type StartPaymentInput = {
  amountInr: number;
  title: string;
  description?: string;
  prefill?: { phone?: string; name?: string };
  notes?: Record<string, string>;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function getAuthToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('af_token') || '';
}

let scriptLoadingPromise: Promise<void> | null = null;
async function loadRazorpayScript() {
  if (typeof window === 'undefined') return;
  if (window.Razorpay) return;
  if (!scriptLoadingPromise) {
    scriptLoadingPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
      document.body.appendChild(script);
    });
  }
  await scriptLoadingPromise;
}

function openRazorpay(options: Record<string, unknown>) {
  return new Promise<RazorpayResult>((resolve, reject) => {
    if (typeof window === 'undefined' || !window.Razorpay) {
      reject(new Error('Razorpay SDK unavailable'));
      return;
    }
    const instance = new window.Razorpay({
      ...options,
      handler: (response: RazorpayResult) => resolve(response),
      modal: {
        ondismiss: () => reject(new Error('Payment cancelled')),
      },
    });
    instance.open();
  });
}

export async function startRazorpayPayment(input: StartPaymentInput) {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated');

  await loadRazorpayScript();

  const createRes = await fetch('/api/public/payment/create-order', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({
      amount_inr: input.amountInr,
      notes: input.notes || {},
    }),
  });
  const createJson = (await createRes.json().catch(() => ({}))) as CreateOrderResponse;
  if (!createRes.ok || !createJson?.success || !createJson?.data?.order_id || !createJson?.data?.key_id) {
    throw new Error(createJson?.message || 'Unable to start payment');
  }

  const payment = await openRazorpay({
    key: createJson.data.key_id,
    amount: createJson.data.amount_paise,
    currency: createJson.data.currency || 'INR',
    name: 'AssetForU',
    description: input.description || input.title,
    order_id: createJson.data.order_id,
    prefill: {
      contact: input.prefill?.phone,
      name: input.prefill?.name,
    },
    notes: input.notes || {},
    theme: { color: '#128148' },
  });

  const verifyRes = await fetch('/api/public/payment/verify', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({
      ...payment,
      amount_inr: input.amountInr,
      notes: input.notes || {},
    }),
  });
  const verifyJson = (await verifyRes.json().catch(() => ({}))) as VerifyResponse;
  if (!verifyRes.ok || !verifyJson?.success) {
    throw new Error(verifyJson?.message || 'Payment verification failed');
  }

  return payment;
}

