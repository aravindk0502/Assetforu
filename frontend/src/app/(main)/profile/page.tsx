'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { userAPI, walletAPI } from '@/lib/api';
import { useAuthStore, useUIStore, useCartStore } from '@/store';
import { formatCurrency } from '@/lib/currency';
import BackNavigation from '@/components/BackNavigation';
import {
  User,
  Wallet,
  Settings,
  LogOut,
  Calendar,
  Mail,
  Phone,
  Ticket,
  Heart,
  Globe,
  Bell,
  CreditCard,
} from 'lucide-react';

type MenuKey = 'personal' | 'wallet' | 'tickets' | 'favorites' | 'preferences' | 'currency';

type Gender = 'male' | 'female' | 'other' | '';

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, updateUser, token, isLoaded, loadFromStorage } = useAuthStore();
  const { openSignupModal, walletBalance, setWalletBalance, activity, transactions, favorites, currency, setCurrency } = useUIStore();
  const [active, setActive] = useState<MenuKey>('personal');
  const [mounted, setMounted] = useState(false);
  const [hasStoredToken, setHasStoredToken] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [gender, setGender] = useState<Gender>('');
  const [dob, setDob] = useState('');
  const [country, setCountry] = useState('India');
  const [nationality, setNationality] = useState('India');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [accountHolder, setAccountHolder] = useState('');

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    if (user.id?.startsWith('dev_')) {
      setLoading(false);
      return;
    }
    try {
      const [profileRes, walletRes] = await Promise.all([
        userAPI.getProfile(),
        walletAPI.get(),
      ]);
      updateUser(profileRes.data.data);
      setWalletBalance(walletRes.data.data.balance);
      setName(profileRes.data.data.name || '');
      setEmail(profileRes.data.data.email || '');
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [user, updateUser, setWalletBalance]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setMounted(true);
    if (!isLoaded) {
      loadFromStorage();
    }
  }, [isLoaded, loadFromStorage]);

  useEffect(() => {
    try {
      setHasStoredToken(!!localStorage.getItem('af_token'));
      const extrasRaw = localStorage.getItem('af_profile_extras');
      if (extrasRaw) {
        const extras = JSON.parse(extrasRaw) as {
          gender?: Gender;
          dob?: string;
          country?: string;
          nationality?: string;
          bankName?: string;
          accountNumber?: string;
          ifsc?: string;
          accountHolder?: string;
        };
        if (extras.gender) setGender(extras.gender);
        if (extras.dob) setDob(extras.dob);
        if (extras.country) setCountry(extras.country);
        if (extras.nationality) setNationality(extras.nationality);
        if (extras.bankName) setBankName(extras.bankName);
        if (extras.accountNumber) setAccountNumber(extras.accountNumber);
        if (extras.ifsc) setIfsc(extras.ifsc);
        if (extras.accountHolder) setAccountHolder(extras.accountHolder);
      }
    } catch {
      setHasStoredToken(false);
    }
  }, [token, isLoaded]);

  const isAuthed = !!user || !!token || hasStoredToken;
  const isGuest = isLoaded && !isAuthed;

  const MENU = useMemo(
    () => [
      { id: 'personal' as const, label: 'Personal Details', icon: User },
      { id: 'wallet' as const, label: 'Wallet', icon: Wallet },
      { id: 'tickets' as const, label: 'Tickets', icon: Ticket },
      { id: 'favorites' as const, label: 'Favourites', icon: Heart },
      { id: 'preferences' as const, label: 'Notification Preferences', icon: Bell },
      { id: 'currency' as const, label: 'Currency', icon: CreditCard },
    ],
    []
  );

  const displayName = user?.name || 'AssetForU User';
  const displayEmail = user?.email || 'user@assetforu.com';
  const displayPhone = user?.phone ? `+91 ${user.phone}` : '+91 9XXXXXXXXX';

  const handleSave = async () => {
    setSaving(true);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'af_profile_extras',
          JSON.stringify({ gender, dob, country, nationality, bankName, accountNumber, ifsc, accountHolder })
        );
      }

      if (user?.id?.startsWith('dev_')) {
        updateUser({ name, email });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        return;
      }

      await userAPI.updateProfile({ name, email });
      updateUser({ name, email });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.assign('/');
  };

  return (
    <div className="min-h-screen bg-[#f1f0ef]">
      <div className="mx-auto max-w-6xl px-6 py-10 page-enter">
        <BackNavigation />
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-primary-700 text-white flex items-center justify-center">
            <Settings className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-500">Account</p>
            <h1 className="text-2xl font-black text-slate-900">My Profile</h1>
          </div>
        </div>

        {isGuest && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-center justify-between gap-3">
            <span>Sign in to save your profile details and access wallet tickets.</span>
            <button onClick={() => openSignupModal()} className="rounded-xl bg-primary-700 text-white px-4 py-2 text-xs font-bold">
              Sign In
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
          <aside>
            <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center">
                  <User className="w-10 h-10 text-slate-400" />
                </div>
                <h2 className="mt-4 text-lg font-black text-slate-900">{displayName}</h2>
                <p className="text-xs text-slate-500">{displayEmail}</p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-100 text-emerald-700 px-3 py-1 text-xs font-bold" suppressHydrationWarning>
                  <Wallet className="w-3.5 h-3.5" /> Wallet Balance {mounted ? formatCurrency(Number(walletBalance), currency) : '0'}
                </div>
              </div>

              <div className="mt-6 space-y-2">
                {MENU.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActive(id)}
                    className={clsx(
                      'w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors',
                      active === id
                        ? 'bg-primary-600 text-white'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    )}
                  >
                    <Icon className="w-4 h-4" /> {label}
                  </button>
                ))}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" /> Log Out
                </button>
              </div>
            </div>
          </aside>

          <main>
            {active === 'personal' && (
            <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Personal Details</h2>
                  <p className="text-sm text-slate-500">Update your profile for AssetForU benefits.</p>
                </div>
              </div>

              {saveSuccess && (
                <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-2 text-sm font-semibold">
                  Profile updated successfully.
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Full Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-primary-500 outline-none"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Email Address</label>
                  <div className="mt-2 relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 pl-10 pr-4 py-3 text-sm focus:border-primary-500 outline-none"
                      placeholder="you@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Phone Number</label>
                  <div className="mt-2 relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      value={displayPhone}
                      readOnly
                      className="w-full rounded-2xl border border-slate-200 pl-10 pr-4 py-3 text-sm bg-slate-50 text-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Date of Birth</label>
                  <div className="mt-2 relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 pl-10 pr-4 py-3 text-sm focus:border-primary-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Gender</label>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {(['male', 'female', 'other'] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGender(g)}
                        className={clsx(
                          'rounded-2xl border px-3 py-2 text-xs font-bold uppercase',
                          gender === g ? 'border-primary-600 text-primary-700 bg-primary-50' : 'border-slate-200 text-slate-500'
                        )}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Country of Residence</label>
                  <div className="mt-2 relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 pl-10 pr-4 py-3 text-sm focus:border-primary-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Nationality</label>
                  <input
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-primary-500 outline-none"
                  />
                </div>

                <div className="md:col-span-2 pt-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Bank Details</p>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Account Holder Name</label>
                  <input
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-primary-500 outline-none"
                    placeholder="Name as per bank"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Bank Name</label>
                  <input
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-primary-500 outline-none"
                    placeholder="Your bank name"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Account Number</label>
                  <input
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-primary-500 outline-none"
                    placeholder="Account number"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">IFSC Code</label>
                  <input
                    value={ifsc}
                    onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-primary-500 outline-none"
                    placeholder="e.g. HDFC0001234"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={() => (isGuest ? openSignupModal() : handleSave())}
                  disabled={saving}
                  className="rounded-2xl bg-primary-700 text-white px-6 py-3 text-sm font-bold hover:bg-primary-800 transition disabled:opacity-70"
                >
                  {saving ? 'Updating...' : 'Update'}
                </button>
                {loading && <span className="text-xs text-slate-400">Syncing account...</span>}
              </div>
            </div>
            )}

            {active === 'wallet' && (
              <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
                <h2 className="text-xl font-black text-slate-900 mb-4">Wallet</h2>
                <p className="text-sm text-slate-500 mb-6">Your current Asset Credits balance and transactions.</p>
                <div className="rounded-2xl bg-primary-50 border border-primary-100 p-4 mb-6">
                  <p className="text-xs text-primary-600 font-semibold uppercase">Balance</p>
                  <p className="text-3xl font-black text-primary-700" suppressHydrationWarning>
                    {mounted ? formatCurrency(Number(walletBalance), currency) : '0'}
                  </p>
                </div>
                {transactions.length === 0 ? (
                  <p className="text-sm text-slate-500">No transactions yet.</p>
                ) : (
                  <div className="space-y-3">
                    {transactions.slice(0, 6).map((t) => (
                      <div key={t.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm">
                        <span className="text-slate-600">{t.description}</span>
                        <span className="font-bold text-slate-900">{formatCurrency(Number(t.credits), currency)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {active === 'tickets' && (
              <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
                <h2 className="text-xl font-black text-slate-900 mb-4">Tickets</h2>
                <p className="text-sm text-slate-500 mb-6">Your campaign ticket numbers for upcoming draws.</p>
                <div className="space-y-3">
                  {activity.filter((a) => typeof a.ticketNumber === 'number').length === 0 ? (
                    <p className="text-sm text-slate-500">No tickets yet.</p>
                  ) : (
                    activity
                      .filter((a) => typeof a.ticketNumber === 'number')
                      .slice(0, 12)
                      .map((a) => (
                        <div key={a.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm">
                          <div>
                            <p className="font-semibold text-slate-800">{a.campaignName}</p>
                            <p className="text-xs text-slate-500">Ticket #{a.ticketNumber}</p>
                          </div>
                          <span className="text-slate-500">{new Date(a.createdAt).toLocaleDateString()}</span>
                        </div>
                      ))
                  )}
                </div>
              </div>
            )}

            {active === 'favorites' && (
              <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
                <h2 className="text-xl font-black text-slate-900 mb-4">Favourites</h2>
                <p className="text-sm text-slate-500">Saved campaigns and products will appear here.</p>
                {favorites.length === 0 ? (
                  <p className="text-sm text-slate-400 mt-3">No favourites yet.</p>
                ) : (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {favorites.map((fav) => (
                      <div key={fav.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 flex gap-3">
                        <img src={fav.image_url} alt={fav.title} className="h-16 w-16 rounded-xl object-cover" />
                        <div>
                          <p className="text-sm font-bold text-slate-900">{fav.title}</p>
                          <p className="text-xs text-slate-500 mt-1">{formatCurrency(fav.credits, currency)} · {fav.credits} Credits</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {active === 'preferences' && (
              <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
                <h2 className="text-xl font-black text-slate-900 mb-4">Notification Preferences</h2>
                <div className="space-y-3 text-sm">
                  {['Campaign Updates', 'Wallet Alerts', 'Draw Results'].map((label) => (
                    <label key={label} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                      <span className="text-slate-700 font-medium">{label}</span>
                      <input type="checkbox" className="h-4 w-4 accent-primary-700" defaultChecked />
                    </label>
                  ))}
                </div>
              </div>
            )}

            {active === 'currency' && (
              <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
                <h2 className="text-xl font-black text-slate-900 mb-4">Currency</h2>
                <p className="text-sm text-slate-500 mb-4">Choose your preferred currency.</p>
                <select
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-primary-500 outline-none"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as 'INR' | 'USD' | 'AED')}
                >
                  <option value="INR">INR (₹)</option>
                  <option value="AED">AED (د.إ)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
            )}


          </main>
        </div>
      </div>
    </div>
  );
}
