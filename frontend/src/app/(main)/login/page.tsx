'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store';
import { authAPI } from '@/lib/api';
import { CheckCircle, Leaf, Loader2, Phone } from 'lucide-react';
import clsx from 'clsx';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useAuthStore((s) => s.token);
  const { setAuth } = useAuthStore();

  const [step, setStep] = useState<'phone' | 'otp' | 'success'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const nextPath = useMemo(() => {
    const n = searchParams?.get('next') || '';
    if (!n) return '';
    if (!n.startsWith('/')) return '';
    if (n.startsWith('//')) return '';
    return n;
  }, [searchParams]);

  useEffect(() => {
    if (!token) return;
    router.replace(nextPath || '/profile');
  }, [token, nextPath, router]);

  // Countdown for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  // Focus first OTP input when step changes
  useEffect(() => {
    if (step !== 'otp') return;
    setTimeout(() => otpRefs.current[0]?.focus(), 100);
  }, [step]);

  const handleSendOtp = async () => {
    if (!/^\d{10}$/.test(phone)) {
      setError('Enter a valid 10-digit phone number');
      return;
    }
    if (!termsAccepted) {
      setError('You must accept the Terms & Conditions and Privacy Policy');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authAPI.sendOtp(phone);
      setStep('otp');
      setCountdown(30);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otpStr = otp.join('');
    if (otpStr.length < 4) {
      setError('Enter the OTP');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await authAPI.verifyOtp(phone, otpStr, termsAccepted);
      const { token: t, user } = res.data as { token: string; user: unknown };
      localStorage.setItem('af_last_phone', phone);
      setAuth(user as never, t);
      setStep('success');
      setTimeout(() => {
        router.replace(nextPath || '/profile');
      }, 700);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'Invalid OTP');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setError('');
    setLoading(true);
    try {
      await authAPI.sendOtp(phone);
      setCountdown(30);
      setOtp(['', '', '', '', '', '']);
    } catch {
      setError('Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-br from-primary-700 to-primary-600 px-8 pt-8 pb-6 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Leaf className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-lg tracking-tight">AssetForU</span>
          </div>
          <h1 className="text-2xl font-black">{step === 'success' ? 'Welcome!' : step === 'otp' ? 'Verify OTP' : 'Sign in'}</h1>
          <p className="text-white/80 text-sm mt-1">
            {step === 'success'
              ? 'Redirecting…'
              : step === 'otp'
                ? 'Enter the 6-digit OTP sent to your phone.'
                : 'Use your mobile number to login.'}
          </p>
        </div>

        <div className="px-8 py-6">
          {step === 'success' && (
            <div className="flex flex-col items-center py-6">
              <CheckCircle className="w-16 h-16 text-primary-700 mb-4" strokeWidth={1.5} />
              <p className="text-lg font-bold text-slate-800">You&apos;re logged in!</p>
              <p className="text-sm text-slate-500 mt-1">Taking you to {nextPath || '/profile'}…</p>
            </div>
          )}

          {step === 'phone' && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Phone Number</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500 font-semibold text-sm">+91</span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                    className="input-base pl-12"
                    placeholder="10-digit mobile number"
                    autoFocus
                  />
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded accent-primary-700"
                />
                <span className="text-xs text-slate-500 leading-relaxed">
                  I agree to the <a href="/terms" className="text-primary-700 font-semibold hover:underline" target="_blank">Terms</a> and{' '}
                  <a href="/privacy" className="text-primary-700 font-semibold hover:underline" target="_blank">Privacy Policy</a>.
                </span>
              </label>

              {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

              <button
                onClick={handleSendOtp}
                disabled={loading || !phone || !termsAccepted}
                className={clsx(
                  'w-full py-3.5 rounded-xl font-bold text-white transition-all',
                  loading || !phone || !termsAccepted
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'bg-primary-700 hover:bg-primary-800 shadow-primary active:scale-[0.98]'
                )}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Sending OTP…
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Phone className="w-4 h-4" /> Send OTP
                  </span>
                )}
              </button>
            </div>
          )}

          {step === 'otp' && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Enter 6-digit OTP</label>
                <div className="flex gap-2 justify-between">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className={clsx(
                        'w-12 h-14 text-center text-xl font-black rounded-xl border-2 transition-all focus:outline-none',
                        digit
                          ? 'border-primary-700 bg-primary-50 text-primary-700'
                          : 'border-slate-200 focus:border-primary-700'
                      )}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <button
                  onClick={() => { setStep('phone'); setOtp(['', '', '', '', '', '']); setError(''); }}
                  className="text-slate-500 hover:text-primary-700 font-medium"
                >
                  ← Change number
                </button>
                <button
                  onClick={handleResend}
                  disabled={countdown > 0}
                  className={clsx('font-bold', countdown > 0 ? 'text-slate-400' : 'text-primary-700 hover:underline')}
                >
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                </button>
              </div>

              {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

              <button
                onClick={handleVerifyOtp}
                disabled={loading}
                className={clsx(
                  'w-full py-3.5 rounded-xl font-bold text-white transition-all',
                  loading ? 'bg-slate-300 cursor-not-allowed' : 'bg-primary-700 hover:bg-primary-800 shadow-primary active:scale-[0.98]'
                )}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Verifying…
                  </span>
                ) : (
                  'Verify & Continue'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
