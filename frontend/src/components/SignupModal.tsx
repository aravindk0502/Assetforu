'use client';
import { useState, useEffect, useRef } from 'react';
import { useUIStore, useAuthStore } from '@/store';
import { authAPI } from '@/lib/api';
import { X, Leaf, Phone, Shield, Loader2, CheckCircle } from 'lucide-react';
import clsx from 'clsx';

type Step = 'phone' | 'otp' | 'success';

export function SignupModal() {
  const { closeSignupModal, signupModalCallback } = useUIStore();
  const { setAuth } = useAuthStore();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [devOtp, setDevOtp] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  // Focus first OTP input when step changes
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    }
  }, [step]);

  const handleSendOtp = async () => {
    if (!/^\d{10}$/.test(phone)) {
      setError('Enter a valid 10-digit phone number');
      return;
    }
    setError('');
    setDevOtp('');
    setLoading(true);
    try {
      const res = await authAPI.sendOtp(phone);
      setStep('otp');
      setCountdown(30);
      if (res?.data?.otp) {
        setDevOtp(String(res.data.otp));
      }
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
    if (otpStr.length < 6) { setError('Enter the 6-digit OTP'); return; }
    if (!termsAccepted) { setError('You must accept the Terms & Conditions and Privacy Policy'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await authAPI.verifyOtp(phone, otpStr, termsAccepted);
      const { token, user } = res.data;
      localStorage.setItem('af_last_phone', phone);
      setAuth(user, token);
      setStep('success');
      setTimeout(() => {
        closeSignupModal();
        signupModalCallback?.();
      }, 1500);
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

  const handleDevLogin = async () => {
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
      const res = await authAPI.devLogin(phone, termsAccepted);
      const { token, user } = res.data;
      localStorage.setItem('af_last_phone', phone);
      setAuth(user, token);
      setStep('success');
      setTimeout(() => {
        closeSignupModal();
        signupModalCallback?.();
      }, 1500);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'Dev login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-overlay bg-black/50"
      onClick={(e) => e.target === e.currentTarget && closeSignupModal()}
    >
      <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-fade-up">
        {/* Green header strip */}
        <div className="bg-gradient-to-br from-primary-700 to-primary-600 px-8 pt-8 pb-6 text-white">
          <button
            onClick={closeSignupModal}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Leaf className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-lg tracking-tight">AssetForU</span>
          </div>
          <h2 className="text-2xl font-black">
            {step === 'success' ? 'Welcome!' : step === 'otp' ? 'Verify OTP' : 'Get Started'}
          </h2>
          <p className="text-white/80 text-sm mt-1">
            {step === 'success'
              ? 'Your account is ready.'
              : step === 'otp'
                ? `OTP sent to +91 ${phone}`
                : 'Sign up or log in to access campaigns & wallet.'}
          </p>
        </div>

        <div className="px-8 py-6">
          {/* Success */}
          {step === 'success' && (
            <div className="flex flex-col items-center py-6">
              <CheckCircle className="w-16 h-16 text-primary-700 mb-4" strokeWidth={1.5} />
              <p className="text-lg font-bold text-slate-800">You&apos;re logged in!</p>
              <p className="text-sm text-slate-500 mt-1">Redirecting you now…</p>
            </div>
          )}

          {/* Phone step */}
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
                    onChange={(e) => setPhone(e.target.value.replace(/\D/, ''))}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                    className="input-base pl-12"
                    placeholder="10-digit mobile number"
                    autoFocus
                  />
                </div>
              </div>

              {/* Terms */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded accent-primary-700"
                />
                <span className="text-xs text-slate-500 leading-relaxed">
                  I agree to the{' '}
                  <a href="/terms" className="text-primary-700 font-semibold hover:underline" target="_blank">Terms &amp; Conditions</a>{' '}
                  and{' '}
                  <a href="/privacy" className="text-primary-700 font-semibold hover:underline" target="_blank">Privacy Policy</a>.{' '}
                  I understand that I am purchasing Asset Credits usable across services and that benefits are complimentary with no guaranteed allocation.
                </span>
              </label>

              {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
              {devOtp && (
                <p className="text-sm font-medium text-primary-700 bg-primary-50 p-2 rounded">
                  Dev OTP (use this in development): {devOtp}
                </p>
              )}

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

              <button
                onClick={handleDevLogin}
                disabled={loading || !phone || !termsAccepted}
                className={clsx(
                  'w-full py-3 rounded-xl font-bold text-sm transition-all',
                  loading || !phone || !termsAccepted
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-slate-100 text-primary-700 hover:bg-slate-200'
                )}
              >
                {loading ? 'Logging in…' : '🚀 Quick Dev Login (skip OTP)'}
              </button>
            </div>
          )}

          {/* OTP step */}
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
                disabled={loading || otp.join('').length < 6}
                className={clsx(
                  'w-full py-3.5 rounded-xl font-bold text-white transition-all',
                  loading || otp.join('').length < 6
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'bg-primary-700 hover:bg-primary-800 shadow-primary active:scale-[0.98]'
                )}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Verifying…
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Shield className="w-4 h-4" /> Verify &amp; Continue
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Legal footer */}
          {step !== 'success' && (
            <p className="text-center text-[11px] text-slate-400 mt-4 leading-relaxed">
              You are purchasing Asset Credits. Credits are usable across services.
              Benefits are complimentary. No guaranteed allocation.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
