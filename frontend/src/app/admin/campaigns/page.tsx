'use client';
import { useEffect, useState } from 'react';
import { campaignAPI } from '@/lib/api';
import { Campaign } from '@/types';
import { Plus, Loader2, X, CheckCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';
import BackNavigation from '@/components/BackNavigation';
import AdminJsonModal from '@/components/admin/AdminJsonModal';
import type { CampaignLandMeta } from '@/lib/campaignMeta';
import { buildCampaignDescription, parseCampaignMeta } from '@/lib/campaignMeta';
import { useAuthStore } from '@/store';
import { parseCampaignImages } from '@/lib/campaignImages';

function safeFormatDate(value: unknown, fmt = 'dd MMM yyyy') {
  if (!value) return '—';
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return '—';
  try {
    return format(d, fmt);
  } catch {
    return '—';
  }
}

export default function AdminCampaignsPage() {
  const token = useAuthStore((s) => s.token);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'active' | 'upcoming' | 'closed'>('active');
  const [showForm, setShowForm] = useState(false);
  const [viewCampaign, setViewCampaign] = useState<Campaign | null>(null);
  const [editCampaign, setEditCampaign] = useState<Campaign | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    title: '',
    location: '',
    credit_price: '',
    total_slots: '100',
    end_time: '',
    badge: '',
    is_featured: false,
    status: 'active' as 'active' | 'upcoming' | 'closed',
  });
  const [maxQty, setMaxQty] = useState('3');
  const [soldOutAnnouncement, setSoldOutAnnouncement] = useState('');
  const [isAd, setIsAd] = useState(false);
  const [descriptionText, setDescriptionText] = useState('');
  const [land, setLand] = useState<CampaignLandMeta>({
    city: '',
    state: '',
    country: 'India',
    priceLabel: '',
    contactPhone: '',
    whatsappNumber: '',
    mapUrl: '',
  });
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const toDateTimeLocal = (iso: string | null | undefined) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const loadCampaigns = async () => {
    try {
      // Prefer Blob-backed campaigns so admin/live stay in sync without CORS issues.
      const res = await fetch(`/api/public/campaigns?status=${statusFilter}&limit=200`, { cache: 'no-store' });
      const json = (await res.json().catch(() => ({}))) as { success?: boolean; data?: Campaign[] };
      if (res.ok && json?.success && Array.isArray(json?.data)) {
        setCampaigns(json.data);
        return;
      }
      // Fallback to API URL if blob is not configured.
      const apiRes = await campaignAPI.list({ status: statusFilter, limit: 100 });
      setCampaigns(apiRes.data.data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setLoading(true); loadCampaigns(); }, [statusFilter]);

  const resetForm = () => {
    setForm({ title: '', location: '', credit_price: '', total_slots: '100', end_time: '', badge: '', is_featured: false, status: statusFilter });
    setDescriptionText('');
    setLand({ city: '', state: '', country: 'India', priceLabel: '', contactPhone: '', whatsappNumber: '', mapUrl: '' });
    setImageUrls([]);
    setImageUrlInput('');
    setMaxQty('3');
    setSoldOutAnnouncement('');
    setIsAd(false);
    setEditCampaign(null);
    setError('');
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (c: Campaign) => {
    const meta = parseCampaignMeta(c.description, c.image_urls || c.image_url);
    setEditCampaign(c);
    setForm({
      title: c.title || '',
      location: c.location || '',
      credit_price: String(c.credit_price ?? ''),
      total_slots: String(c.total_slots ?? '100'),
      end_time: toDateTimeLocal(c.end_time),
      badge: c.badge || '',
      is_featured: Boolean(c.is_featured),
      status: (c.status || 'active') as any,
    });
    setDescriptionText(meta.text || c.description || '');
    setLand({
      city: meta.land?.city || '',
      state: meta.land?.state || '',
      country: meta.land?.country || 'India',
      priceLabel: meta.land?.priceLabel || '',
      contactPhone: meta.land?.contactPhone || '',
      whatsappNumber: meta.land?.whatsappNumber || '',
      mapUrl: meta.land?.mapUrl || '',
    });
    const imgs = meta.images.length ? meta.images : parseCampaignImages(c.image_urls || c.image_url);
    setImageUrls(imgs.slice(0, 5));
    setMaxQty(String(c.max_qty ?? meta.maxQty ?? 3));
    setSoldOutAnnouncement(String(c.sold_out_announcement ?? ''));
    setIsAd(meta.isAd ?? false);
    setError('');
    setShowForm(true);
  };

  const handleSave = async () => {
    setError('');
    if (!form.title.trim()) { setError('Title is required'); return; }
    if (!descriptionText.trim()) { setError('Description is required'); return; }
    if (!form.credit_price) { setError('Credit price is required'); return; }
    if (!imageUrls.length) { setError('Add at least 1 image (up to 5)'); return; }

    setSaving(true);
    try {
      const bearer = token || (typeof window !== 'undefined' ? localStorage.getItem('af_token') : null);
      if (!bearer) throw new Error('Not authenticated');

      const description = buildCampaignDescription({
        text: descriptionText,
        images: imageUrls,
        maxQty: maxQty ? Math.max(1, Math.min(20, parseInt(maxQty) || 3)) : undefined,
        isAd,
        land: {
          city: land.city?.trim() || undefined,
          state: land.state?.trim() || undefined,
          country: land.country?.trim() || undefined,
          priceLabel: land.priceLabel?.trim() || undefined,
          contactPhone: land.contactPhone?.trim() || undefined,
          whatsappNumber: land.whatsappNumber?.trim() || undefined,
          mapUrl: land.mapUrl?.trim() || undefined,
        },
      });
      const payload = {
        ...form,
        description,
        credit_price: parseFloat(form.credit_price),
        total_slots: parseInt(form.total_slots),
        max_qty: maxQty ? Math.max(1, Math.min(50, parseInt(maxQty) || 3)) : undefined,
        sold_out_announcement: soldOutAnnouncement.trim() || undefined,
        end_time: (() => {
          if (!form.end_time) return null;
          const d = new Date(form.end_time);
          return Number.isNaN(d.getTime()) ? null : d.toISOString();
        })(),
        image_url: imageUrls[0],
        image_urls: imageUrls,
      };
      const isEdit = Boolean(editCampaign?.id);
      const res = await fetch(isEdit ? `/api/admin/campaigns/${editCampaign!.id}` : '/api/admin/campaigns', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${bearer}`,
        },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => ({}))) as { success?: boolean; message?: string };
      if (!res.ok || json?.success === false) {
        throw new Error(json?.message || `HTTP ${res.status}`);
      }
      setSuccess(isEdit ? 'Campaign updated!' : 'Campaign created!');
      setShowForm(false);
      resetForm();
      await loadCampaigns();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to create campaign';
      setError(`Failed to save campaign: ${msg}`);
    } finally { setSaving(false); }
  };

  const handleStatusChange = async (id: string, statusRaw: string) => {
    const status = statusRaw === 'close' ? 'closed' : statusRaw;
    const bearer = token || (typeof window !== 'undefined' ? localStorage.getItem('af_token') : null);
    if (!bearer) return;
    await fetch(`/api/admin/campaigns/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${bearer}` },
      body: JSON.stringify({ status }),
    });
    if (status !== statusFilter) setStatusFilter(status as any);
    else await loadCampaigns();
  };

  const handleDelete = async (id: string) => {
    const bearer = token || (typeof window !== 'undefined' ? localStorage.getItem('af_token') : null);
    if (!bearer) return;
    const ok = typeof window !== 'undefined' ? window.confirm('Delete this campaign?') : false;
    if (!ok) return;
    await fetch(`/api/admin/campaigns/${id}`, {
      method: 'DELETE',
      headers: { authorization: `Bearer ${bearer}` },
    });
    await loadCampaigns();
  };

  useEffect(() => {
    if (!showForm) {
      setImageUrls([]);
      setImageUrlInput('');
      setError('');
      setDescriptionText('');
      setLand({ city: '', state: '', country: 'India', priceLabel: '', contactPhone: '', whatsappNumber: '', mapUrl: '' });
      setMaxQty('3');
      setSoldOutAnnouncement('');
      setIsAd(true);
      setEditCampaign(null);
    }
  }, [showForm]);

  const compressToBlob = (file: File): Promise<Blob> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        try {
          const maxW = 1400;
          const scale = Math.min(1, maxW / img.width);
          const w = Math.max(1, Math.round(img.width * scale));
          const h = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas not supported');
          ctx.drawImage(img, 0, 0, w, h);
          canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error('Failed to encode image'))),
            'image/webp',
            0.78
          );
        } catch (err) {
          reject(err);
        } finally {
          URL.revokeObjectURL(url);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      img.src = url;
    });

  const blobToDataUrl = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Failed to read image'));
      reader.readAsDataURL(blob);
    });

  const buildFallbackDataUrl = async (file: File) => {
    const blob = await compressToBlob(file);
    const dataUrl = await blobToDataUrl(blob);
    if (!dataUrl.startsWith('data:image/')) throw new Error('Invalid image data');
    return dataUrl;
  };

  const uploadImage = async (file: File) => {
    const blob = await compressToBlob(file);
    const formData = new FormData();
    formData.append('file', new File([blob], file.name.replace(/\\.[^.]+$/, '.webp'), { type: 'image/webp' }));
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const json = (await res.json().catch(() => ({}))) as { success?: boolean; url?: string; message?: string };
    if (!res.ok || !json?.url) throw new Error(json?.message || 'Upload failed');
    return json.url;
  };

  const addImages = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setError('');
    const remaining = Math.max(0, 5 - imageUrls.length);
    if (remaining <= 0) return;
    const selected = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .slice(0, remaining);
    setUploading(true);
    try {
      const urls: string[] = [];
      const warnings: string[] = [];

      for (const file of selected) {
        try {
          const uploaded = await uploadImage(file);
          urls.push(uploaded);
        } catch (e) {
          const serverMsg = e instanceof Error ? e.message : 'Upload failed';
          try {
            const localDataUrl = await buildFallbackDataUrl(file);
            urls.push(localDataUrl);
            warnings.push(`${file.name}: uploaded as local image (${serverMsg})`);
          } catch (fallbackErr) {
            const fallbackMsg = fallbackErr instanceof Error ? fallbackErr.message : 'Fallback failed';
            warnings.push(`${file.name}: ${serverMsg}; ${fallbackMsg}`);
          }
        }
      }

      if (urls.length) {
        setImageUrls((prev) => [...prev, ...urls].slice(0, 5));
      }
      if (warnings.length) {
        setError(`Image upload warning: ${warnings[0]}`);
      }
      if (!urls.length) {
        setError('Failed to upload selected images.');
      }
    } finally {
      setUploading(false);
    }
  };

  const addImageUrl = () => {
    const url = imageUrlInput.trim();
    if (!url) return;
    setImageUrls((prev) => {
      const next = [...prev, url];
      return next.slice(0, 5);
    });
    setImageUrlInput('');
  };

  return (
    <div>
      <BackNavigation />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white">Campaigns</h1>
          <p className="text-slate-400 mt-1">{campaigns.length} {statusFilter} campaigns</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1">
            {(['active', 'upcoming', 'closed'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={clsx(
                  'px-3 py-2 text-xs font-bold rounded-lg transition-colors uppercase tracking-wide',
                  statusFilter === s ? 'bg-primary-700 text-white' : 'text-slate-400 hover:text-white'
                )}
              >
                {s}
              </button>
            ))}
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-primary-600 transition-colors">
            <Plus className="w-4 h-4" /> New Campaign
          </button>
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-2 bg-green-900/50 border border-green-800 text-green-400 rounded-xl px-4 py-3 mb-5 text-sm font-medium">
          <CheckCircle className="w-4 h-4" /> {success}
        </div>
      )}

      {/* Create form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">{editCampaign ? 'Edit Campaign' : 'Create Campaign'}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              {[
                { key: 'title', label: 'Title *', type: 'text' },
                { key: 'location', label: 'Location', type: 'text' },
                { key: 'credit_price', label: 'Credit Price (₹) *', type: 'number' },
                { key: 'total_slots', label: 'Total Slots', type: 'number' },
                { key: 'end_time', label: 'End Date/Time', type: 'datetime-local' },
                { key: 'badge', label: 'Badge Label (e.g. Hot Deal)', type: 'text' },
              ].map(({ key, label, type }) => (
                <div key={key}>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>
                  <input
                    type={type}
                    value={form[key as keyof typeof form] as string}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-primary-700 focus:border-primary-700 focus:outline-none"
                  />
                </div>
              ))}

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as any }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-primary-700 focus:border-primary-700 focus:outline-none"
                >
                  <option value="active">Active</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Max selectable packs</label>
                <select
                  value={maxQty}
                  onChange={(e) => setMaxQty(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-primary-700 focus:border-primary-700 focus:outline-none"
                >
                  {Array.from({ length: 10 }, (_, i) => String(i + 1)).map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">Controls how many packs (1..N) a user can select on the campaign page.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Sold-out announcement (optional)</label>
                <input
                  type="text"
                  value={soldOutAnnouncement}
                  onChange={(e) => setSoldOutAnnouncement(e.target.value)}
                  placeholder="e.g. Campaign closed — will announce live event soon"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-primary-700 focus:border-primary-700 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">Shown on the campaign card when the campaign is sold out (slots filled).</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Images (up to 5)</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    void addImages(e.target.files);
                    e.currentTarget.value = '';
                  }}
                  disabled={uploading}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-700 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white hover:file:bg-slate-600"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  {uploading ? 'Uploading…' : 'Select multiple images (we upload to Vercel Blob). You can also add hosted URLs.'}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="Paste hosted image URL and click Add"
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-primary-700 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={addImageUrl}
                    className="px-4 py-2.5 rounded-xl bg-slate-700 text-white text-sm font-bold hover:bg-slate-600"
                  >
                    Add
                  </button>
                </div>
                {imageUrls.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {imageUrls.map((src, idx) => (
                      <div key={idx} className="relative">
                        <img src={src} alt={`Image ${idx + 1}`} className="h-20 w-full rounded-lg object-cover border border-slate-700 bg-slate-950" />
                        <button
                          type="button"
                          onClick={() => setImageUrls((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 rounded-md bg-black/60 text-white text-xs px-2 py-1 hover:bg-black/80"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Description *</label>
                <textarea
                  rows={3}
                  value={descriptionText}
                  onChange={e => setDescriptionText(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-primary-700 focus:outline-none resize-none"
                />
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-950/40 p-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Land Details (Optional)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">City</label>
                    <input value={land.city || ''} onChange={(e) => setLand((l) => ({ ...l, city: e.target.value }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-primary-700 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">State</label>
                    <input value={land.state || ''} onChange={(e) => setLand((l) => ({ ...l, state: e.target.value }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-primary-700 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Country</label>
                    <input value={land.country || ''} onChange={(e) => setLand((l) => ({ ...l, country: e.target.value }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-primary-700 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Price Label</label>
                    <input value={land.priceLabel || ''} onChange={(e) => setLand((l) => ({ ...l, priceLabel: e.target.value }))}
                      placeholder="e.g. ₹48 Lakhs"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-primary-700 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Call Phone</label>
                    <input value={land.contactPhone || ''} onChange={(e) => setLand((l) => ({ ...l, contactPhone: e.target.value }))}
                      placeholder="+91…"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-primary-700 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">WhatsApp</label>
                    <input value={land.whatsappNumber || ''} onChange={(e) => setLand((l) => ({ ...l, whatsappNumber: e.target.value }))}
                      placeholder="9190…"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-primary-700 focus:outline-none" />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Map URL</label>
                  <input value={land.mapUrl || ''} onChange={(e) => setLand((l) => ({ ...l, mapUrl: e.target.value }))}
                    placeholder="https://maps.google.com/?q=…"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-primary-700 focus:outline-none" />
                </div>
              </div>
              {error && <p className="text-sm text-rose-400 font-semibold">{error}</p>}
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.is_featured} onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))} className="accent-primary-700 w-4 h-4" />
                <span className="text-sm text-slate-300 font-medium">Featured on homepage</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={isAd} onChange={e => setIsAd(e.target.checked)} className="accent-primary-700 w-4 h-4" />
                <span className="text-sm text-slate-300 font-medium">Show ADS badge</span>
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm font-semibold hover:bg-slate-800 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-700 text-white text-sm font-bold hover:bg-primary-600 transition-colors">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} {editCampaign ? 'Save Changes' : 'Create Campaign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Campaigns table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-800 border-b border-slate-700">
            <tr>
              {['ID', 'Campaign', 'Credit Price', 'Slots', 'Badge', 'Featured', 'Created', 'End Time', 'Status', 'Actions'].map(h => (
                <th key={h} className="px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              <tr><td colSpan={10} className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary-400 mx-auto" /></td></tr>
            ) : campaigns.length === 0 ? (
              <tr><td colSpan={10} className="text-center py-12 text-slate-500">No campaigns yet.</td></tr>
            ) : campaigns.map(c => (
              <tr key={c.id} className="hover:bg-slate-800/50 transition-colors">
                <td className="px-5 py-4 text-slate-500 text-xs font-mono">{c.id}</td>
                <td className="px-5 py-4">
                  <p className="text-white font-semibold text-sm">{c.title}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{c.location}</p>
                </td>
                <td className="px-5 py-4 text-primary-400 font-black credit-number">₹{c.credit_price}</td>
                <td className="px-5 py-4 text-slate-300 text-sm">{c.filled_slots}/{c.total_slots}</td>
                <td className="px-5 py-4 text-slate-400 text-xs">{c.badge || '—'}</td>
                <td className="px-5 py-4 text-slate-300 text-xs">{c.is_featured ? 'Yes' : 'No'}</td>
                <td className="px-5 py-4 text-slate-400 text-xs">{safeFormatDate(c.created_at)}</td>
                <td className="px-5 py-4 text-slate-400 text-xs">{safeFormatDate(c.end_time)}</td>
                <td className="px-5 py-4">
                  <span className={clsx(
                    'badge',
                    c.status === 'active' ? 'bg-green-900/50 text-green-400' : c.status === 'upcoming' ? 'bg-amber-900/40 text-amber-300' : 'bg-slate-800 text-slate-500'
                  )}>{c.status}</span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setViewCampaign(c)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-700 transition-colors"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(c)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-700 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(c.id)}
                      className="px-3 py-1.5 rounded-lg bg-rose-900/40 text-rose-200 text-xs font-bold hover:bg-rose-900/60 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <select
                      value={c.status}
                      onChange={e => handleStatusChange(c.id, e.target.value)}
                      className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-2 py-1 focus:ring-primary-700 focus:outline-none"
                    >
                      <option value="active">Active</option>
                      <option value="upcoming">Upcoming</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AdminJsonModal title="Campaign" record={viewCampaign} onClose={() => setViewCampaign(null)} />
    </div>
  );
}
