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
  preferredMethod?: 'upi' | 'card';
  preferredUpiApp?: 'gpay' | 'phonepe' | 'paytm' | 'bhim';
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      close: () => void;
      on?: (event: string, cb: (...args: unknown[]) => void) => void;
    };
  }
}

function isMobileWeb() {
  if (typeof window === 'undefined') return false;
  const ua = String(window.navigator.userAgent || '').toLowerCase();
  return /android|iphone|ipad|ipod/.test(ua);
}

function getAuthToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('af_token') || '';
}

function handleAuthFailure() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('af_token');
  localStorage.removeItem('af_user');
  window.dispatchEvent(new Event('auth:logout'));
}

let scriptLoadingPromise: Promise<void> | null = null;
let activeCheckout: { close: () => void } | null = null;
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

export function cancelActiveRazorpayCheckout() {
  if (!activeCheckout) return false;
  try {
    activeCheckout.close();
    return true;
  } catch {
    return false;
  }
}

function openRazorpay(options: Record<string, unknown>) {
  return new Promise<RazorpayResult>((resolve, reject) => {
    if (typeof window === 'undefined' || !window.Razorpay) {
      reject(new Error('Razorpay SDK unavailable'));
      return;
    }
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeCheckout) {
        try { activeCheckout.close(); } catch { /* ignore */ }
      }
    };
    const instance = new window.Razorpay({
      ...options,
      handler: (response: RazorpayResult) => resolve(response),
      modal: {
        escape: true,
        handleback: true,
        confirm_close: true,
        backdropclose: false,
        ondismiss: () => reject(new Error('Payment cancelled')),
      },
    });
    activeCheckout = instance;
    window.addEventListener('keydown', onEsc);
    const cleanup = () => {
      activeCheckout = null;
      window.removeEventListener('keydown', onEsc);
    };
    // If SDK emits failures, cleanup happens before reject path unwinds.
    if (instance.on) {
      instance.on('payment.failed', cleanup);
    }
    const prevResolve = resolve;
    const prevReject = reject;
    resolve = (value) => { cleanup(); prevResolve(value); };
    reject = (reason) => { cleanup(); prevReject(reason); };
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
  if (createRes.status === 401) {
    handleAuthFailure();
    throw new Error('Session expired. Please login again and retry payment.');
  }
  if (!createRes.ok || !createJson?.success || !createJson?.data?.order_id || !createJson?.data?.key_id) {
    throw new Error(createJson?.message || 'Unable to start payment');
  }

  const preferUpi = input.preferredMethod === 'upi';
  const mobile = isMobileWeb();
  const preferredUpiLabel =
    input.preferredUpiApp === 'gpay'
      ? 'Google Pay'
      : input.preferredUpiApp === 'phonepe'
        ? 'PhonePe'
        : input.preferredUpiApp === 'paytm'
          ? 'Paytm'
          : input.preferredUpiApp === 'bhim'
            ? 'BHIM'
            : 'UPI';

  const displayConfig = preferUpi
    ? {
      blocks: {
        upi_only: {
          name: `Pay with ${preferredUpiLabel} / UPI`,
          instruments: [{ method: 'upi', flows: mobile ? ['intent'] : ['qr'] }],
        },
      },
      sequence: ['block.upi_only'],
      preferences: { show_default_blocks: false },
    }
    : {
      blocks: {
        card_only: {
          name: 'Pay with Cards',
          instruments: [{ method: 'card' }],
        },
      },
      sequence: ['block.card_only'],
      preferences: { show_default_blocks: false },
    };

  const methodConfig =
    input.preferredMethod === 'upi'
      ? { upi: true, card: false, netbanking: false, wallet: false, emi: false, paylater: false }
      : { upi: false, card: true, netbanking: false, wallet: false, emi: false, paylater: false };

  const prefill = input.preferredMethod === 'card'
    ? { name: input.prefill?.name }
    : { contact: input.prefill?.phone, name: input.prefill?.name };

  const payment = await openRazorpay({
    key: createJson.data.key_id,
    amount: createJson.data.amount_paise,
    currency: createJson.data.currency || 'INR',
    name: 'AssetForU',
    description: input.description || input.title,
    order_id: createJson.data.order_id,
    prefill,
    notes: {
      ...(input.notes || {}),
      preferred_method: input.preferredMethod || 'upi',
      preferred_upi_app: input.preferredUpiApp || '',
    },
    method: methodConfig,
    config: { display: displayConfig },
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
  if (verifyRes.status === 401) {
    handleAuthFailure();
    throw new Error('Session expired. Please login again and retry payment.');
  }
  if (!verifyRes.ok || !verifyJson?.success) {
    throw new Error(verifyJson?.message || 'Payment verification failed');
  }

  return payment;
}
