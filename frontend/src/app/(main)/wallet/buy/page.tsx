'use client';


import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useUIStore } from '@/store';
import { formatCurrency } from '@/lib/currency';
import BackNavigation from '@/components/BackNavigation';
import { startRazorpayPayment } from '@/lib/razorpayCheckout';

const presetAmounts = [10, 20, 50, 100, 200, 500, 1000];
const upiOptions = [
  { id: 'upi-1', label: 'Google Pay UPI' },
  { id: 'upi-2', label: 'PhonePe UPI' },
  { id: 'upi-3', label: 'Paytm UPI' },
  { id: 'upi-4', label: 'BHIM UPI' },
];

export default function BuyCreditsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { walletBalance, setWalletBalance, addTransaction, openSignupModal, currency } = useUIStore();
  const [selected, setSelected] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [upi, setUpi] = useState(upiOptions[0].id);
  const [message, setMessage] = useState('');
  const [paying, setPaying] = useState(false);

  const amount = useMemo(() => {
    if (customAmount.trim().length) {
      const parsed = Number(customAmount);
      return Number.isNaN(parsed) ? 0 : Math.max(0, parsed);
    }
    return selected || 0;
  }, [customAmount, selected]);

  const handlePay = async () => {
    if (!user) {
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
        notes: { purpose: 'wallet_topup', method: upi },
      });
      setWalletBalance(walletBalance + amount);
      addTransaction({
        type: 'credit',
        description: `Purchased ${formatCurrency(amount, currency)} Asset Credits for Asset Store via ${upiOptions.find((u) => u.id === upi)?.label || 'UPI'}`,
        credits: amount,
      });
      setMessage('Payment successful. Credits added to your wallet.');
      setSelected(null);
      setCustomAmount('');
      setTimeout(() => setMessage(''), 3000);
    } catch (e: unknown) {
      const err = e instanceof Error ? e.message : 'Payment failed';
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
          <h2 className="text-lg font-black text-slate-900 mb-4">Razorpay UPI</h2>
          <p className="text-xs text-slate-500 mb-4">Choose a UPI option below to proceed with payment.</p>
          <div className="space-y-2">
            {upiOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setUpi(option.id)}
                className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-semibold ${upi === option.id ? 'border-primary-700 bg-primary-50 text-primary-800' : 'border-slate-200 text-slate-700'
                  }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handlePay}
            disabled={paying || amount <= 0}
            className="mt-6 w-full rounded-xl bg-primary-700 text-white py-3 font-bold"
          >
            {paying ? 'Processing…' : 'Pay Now'}
          </button>
          <p className="mt-3 text-xs text-slate-500">Payments are processed via Razorpay. UPI will be shown on checkout.</p>
        </div>
      </div>
    </div>
  );
}
