'use client';


import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useUIStore } from '@/store';
import { formatCurrency } from '@/lib/currency';
import BackNavigation from '@/components/BackNavigation';
import { cancelActiveRazorpayCheckout, startRazorpayPayment } from '@/lib/razorpayCheckout';

const presetAmounts = [10, 20, 50, 100, 200, 500, 1000];

export default function BuyCreditsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const { walletBalance, setWalletBalance, addTransaction, openSignupModal, currency } = useUIStore();
  const [selected, setSelected] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<'upi' | 'card'>('upi');
  const [message, setMessage] = useState('');
  const [paying, setPaying] = useState(false);
  const [isMobileWeb, setIsMobileWeb] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(max-width: 768px)');
    const update = () => setIsMobileWeb(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  const amount = useMemo(() => {
    if (customAmount.trim().length) {
      const parsed = Number(customAmount);
      return Number.isNaN(parsed) ? 0 : Math.max(0, parsed);
    }
    return selected || 0;
  }, [customAmount, selected]);

  const handlePay = async () => {
    if (!user || !token) {
      openSignupModal(() => router.push('/wallet/buy'));
      return;
    }
    if (amount <= 0) {
      setMessage('Please choose a valid amount.');
      return;
    }
    setPaying(true);
    try {
      await startRazorpayPayment({
        amountInr: amount,
        title: 'Wallet Top-up',
        description: `Add ${formatCurrency(amount, currency)} to wallet`,
        prefill: { phone: user.phone, name: user.name },
        notes: { purpose: 'wallet_topup', method: paymentMode },
        preferredMethod: paymentMode,
      });
      setWalletBalance(walletBalance + amount);
      addTransaction({
        type: 'credit',
        description: `Purchased ${formatCurrency(amount, currency)} Asset Credits via ${paymentMode === 'upi' ? 'UPI' : 'Card'}`,
        credits: amount,
      });
      setMessage('Payment successful. Credits added to your wallet.');
      setSelected(null);
      setCustomAmount('');
      setTimeout(() => setMessage(''), 3000);
    } catch (e: unknown) {
      const err = e instanceof Error ? e.message : 'Payment failed';
      const lowered = String(err).toLowerCase();
      if (lowered.includes('session expired') || lowered.includes('not authenticated') || lowered.includes('no token')) {
        openSignupModal(() => router.push('/wallet/buy'));
      }
      setMessage(err);
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="page-enter mx-auto max-w-4xl px-6 py-10">
      <BackNavigation />
      <h1 className="text-3xl font-black text-slate-900 mb-2">Buy Asset Credits</h1>
      <p className="text-slate-600 mb-8">Credits purchased here are redeemable only for Asset Store products and services.</p>

      {message && (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
          {message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-black text-slate-900 mb-4">Select Amount</h2>
          <div className="grid grid-cols-4 gap-3">
            {presetAmounts.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => {
                  setSelected(amt);
                  setCustomAmount('');
                }}
                className={`rounded-xl px-3 py-2 text-sm font-bold ${selected === amt ? 'bg-primary-700 text-white' : 'border border-slate-200 text-slate-700'
                  }`}
              >
                {formatCurrency(amt, currency)}
              </button>
            ))}
          </div>

          <div className="mt-5">
            <label className="text-xs text-slate-500">Custom Amount (optional)</label>
            <input
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value.replace(/[^0-9]/g, ''));
                setSelected(null);
              }}
              placeholder="Enter amount"
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
            />
          </div>

          <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
            <p className="text-xs text-slate-500">You will add</p>
            <p className="text-2xl font-black text-slate-900">{formatCurrency(amount || 0, currency)}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-black text-slate-900 mb-4">Payment Method</h2>
          <p className="text-xs text-slate-500 mb-4">Choose UPI or Card. Razorpay opens your selected method first.</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMode('upi')}
              className={`rounded-xl border px-4 py-3 text-left text-sm font-bold ${paymentMode === 'upi' ? 'border-primary-700 bg-primary-50 text-primary-800' : 'border-slate-200 text-slate-700'}`}
            >
              UPI
            </button>
            <button
              type="button"
              onClick={() => setPaymentMode('card')}
              className={`rounded-xl border px-4 py-3 text-left text-sm font-bold ${paymentMode === 'card' ? 'border-primary-700 bg-primary-50 text-primary-800' : 'border-slate-200 text-slate-700'}`}
            >
              Card
            </button>
          </div>

          {paymentMode === 'upi' && (
            <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              {isMobileWeb
                ? 'UPI selected: Razorpay will use UPI Intent (Google Pay / PhonePe / Paytm apps).'
                : 'UPI selected: Razorpay will show QR for desktop payments.'}
            </p>
          )}

          {paymentMode === 'card' && (
            <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Card selected: Razorpay will open card flow only.
            </p>
          )}

          <button
            type="button"
            onClick={handlePay}
            disabled={paying || amount <= 0}
            className="mt-6 w-full rounded-xl bg-primary-700 text-white py-3 font-bold"
          >
            {paying ? 'Processing…' : 'Pay Now'}
          </button>
          {paying && (
            <button
              type="button"
              onClick={() => {
                cancelActiveRazorpayCheckout();
                setMessage('Payment closed.');
                setPaying(false);
              }}
              className="mt-3 w-full rounded-xl border border-slate-300 bg-white text-slate-700 py-3 font-bold"
            >
              Force Close Payment
            </button>
          )}
          <p className="mt-3 text-xs text-slate-500">If popup controls are not visible, press `Esc` to close payment.</p>
          <p className="mt-3 text-xs text-slate-500">Manual UPI ID entry is deprecated. Use UPI app (mobile) or QR (desktop).</p>
        </div>
      </div>
    </div>
  );
}
