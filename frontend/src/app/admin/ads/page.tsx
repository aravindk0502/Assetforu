'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Loader2, X, CheckCircle, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import BackNavigation from '@/components/BackNavigation';
import AdminJsonModal from '@/components/admin/AdminJsonModal';
import { useAuthStore } from '@/store';
import type { AdPlacement, AdPlacementBanner } from '@/types';

function safeDate(value: unknown) {
  if (!value) return '—';
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
}

function toDateTimeLocal(iso: string | null | undefined) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function compressToBlob(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
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
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Failed to encode image'))), 'image/webp', 0.78);
      } catch (e) {
        reject(e);
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
}

async function uploadImage(file: File) {
  const blob = await compressToBlob(file);
  const formData = new FormData();
  formData.append('file', new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' }));
  const res = await fetch('/api/upload', { method: 'POST', body: formData });
  const json = (await res.json().catch(() => ({}))) as { success?: boolean; url?: string; message?: string };
  if (!res.ok || !json?.url) throw new Error(json?.message || 'Upload failed');
  return json.url;
}

export default function AdminAdsPage() {
  const token = useAuthStore((s) => s.token);
  const [ads, setAds] = useState<AdPlacementBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewAd, setViewAd] = useState<AdPlacementBanner | null>(null);
  const [editAd, setEditAd] = useState<AdPlacementBanner | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    placement: 'home_carousel' as AdPlacement,
    href: '',
    cta_label: '',
    priority: '0',
    is_active: true,
    start_time: '',
    end_time: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const bearer = token || (typeof window !== 'undefined' ? localStorage.getItem('af_token') : null);
      if (!bearer) {
        setAds([]);
        return;
      }
      const res = await fetch('/api/admin/ads', { headers: { authorization: `Bearer ${bearer}` }, cache: 'no-store' });
      const json = (await res.json().catch(() => ({}))) as { success?: boolean; data?: AdPlacementBanner[]; message?: string };
      if (!res.ok || json?.success === false) throw new Error(json?.message || `HTTP ${res.status}`);
      setAds(Array.isArray(json.data) ? json.data : []);
    } catch {
      setAds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      placement: 'home_carousel',
      href: '',
      cta_label: 'See Properties',
      priority: '0',
      is_active: true,
      start_time: '',
      end_time: '',
    });
    setImageUrls([]);
    setImageUrlInput('');
    setEditAd(null);
    setError('');
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (ad: AdPlacementBanner) => {
    setEditAd(ad);
    setForm({
      title: ad.title || '',
      description: ad.description || '',
      placement: ad.placement || 'home_carousel',
      href: ad.href || '',
      cta_label: ad.cta_label || 'See Properties',
      priority: String(ad.priority ?? 0),
      is_active: Boolean(ad.is_active),
      start_time: toDateTimeLocal(ad.start_time ?? null),
      end_time: toDateTimeLocal(ad.end_time ?? null),
    });
    setImageUrls((ad.images || []).slice(0, 5));
    setError('');
    setShowForm(true);
  };

  const addImages = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setError('');
    const remaining = Math.max(0, 5 - imageUrls.length);
    if (remaining <= 0) return;
    const selected = Array.from(files).slice(0, remaining);
    try {
      setUploading(true);
      const urls = await Promise.all(selected.map((f) => uploadImage(f)));
      setImageUrls((prev) => [...prev, ...urls].slice(0, 5));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Upload failed';
      setError(`Failed to upload image: ${msg}`);
    } finally {
      setUploading(false);
    }
  };

  const addImageUrl = () => {
    const url = imageUrlInput.trim();
    if (!url) return;
    setImageUrls((prev) => [...prev, url].slice(0, 5));
    setImageUrlInput('');
  };

  const removeImage = (url: string) => {
    setImageUrls((prev) => prev.filter((u) => u !== url));
  };

  const handleSave = async () => {
    setError('');
    if (uploading) return setError('Please wait for image upload to complete.');
    if (!form.title.trim()) return setError('Title is required');
    if (!imageUrls.length) return setError('Add at least 1 image (up to 5)');

    setSaving(true);
    try {
      const bearer = token || (typeof window !== 'undefined' ? localStorage.getItem('af_token') : null);
      if (!bearer) throw new Error('Not authenticated');

      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        placement: form.placement,
        href: form.href.trim() || undefined,
        cta_label: form.cta_label.trim() || undefined,
        priority: Number(form.priority) || 0,
        is_active: Boolean(form.is_active),
        start_time: form.start_time ? new Date(form.start_time).toISOString() : null,
        end_time: form.end_time ? new Date(form.end_time).toISOString() : null,
        images: imageUrls,
      };

      const isEdit = Boolean(editAd?.id);
      const res = await fetch(isEdit ? `/api/admin/ads/${editAd!.id}` : '/api/admin/ads', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${bearer}` },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => ({}))) as { success?: boolean; message?: string };
      if (!res.ok || json?.success === false) throw new Error(json?.message || `HTTP ${res.status}`);

      setSuccess(isEdit ? 'Ad updated!' : 'Ad created!');
      setShowForm(false);
      resetForm();
      await load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to save ad';
      setError(`Failed to save ad: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const bearer = token || (typeof window !== 'undefined' ? localStorage.getItem('af_token') : null);
    if (!bearer) return;
    const ok = typeof window !== 'undefined' ? window.confirm('Delete this ad?') : false;
    if (!ok) return;
    await fetch(`/api/admin/ads/${id}`, { method: 'DELETE', headers: { authorization: `Bearer ${bearer}` } });
    await load();
  };

  const visibleAds = useMemo(() => ads, [ads]);

  return (
    <div>
      <BackNavigation />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white">Ads/Placements</h1>
          <p className="text-slate-400 mt-1">{ads.length} ads</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-primary-600 transition-colors">
          <Plus className="w-4 h-4" /> New Ad
        </button>
      </div>

      {success && (
        <div className="flex items-center gap-2 bg-green-900/50 border border-green-800 text-green-400 rounded-xl px-4 py-3 mb-5 text-sm font-medium">
          <CheckCircle className="w-4 h-4" /> {success}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">{editAd ? 'Edit Ad' : 'Create Ad'}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Title *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-primary-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-primary-700 focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Placement *</label>
                  <select
                    value={form.placement}
                    onChange={(e) => setForm((f) => ({ ...f, placement: e.target.value as AdPlacement }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
                  >
                    <option value="home_hero">Home Hero</option>
                    <option value="home_carousel">Home Carousel</option>
                    <option value="campaign_cards">Campaign Cards</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Priority</label>
                  <input
                    type="number"
                    value={form.priority}
                    onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Start date/time</label>
                  <input
                    type="datetime-local"
                    value={form.start_time}
                    onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">End date/time</label>
                  <input
                    type="datetime-local"
                    value={form.end_time}
                    onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Link (href)</label>
                  <input
                    value={form.href}
                    onChange={(e) => setForm((f) => ({ ...f, href: e.target.value }))}
                    placeholder="https://…"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">CTA label</label>
                  <input
                    value={form.cta_label}
                    onChange={(e) => setForm((f) => ({ ...f, cta_label: e.target.value }))}
                    placeholder="See Properties"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Images (up to 5)</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => void addImages(e.target.files)}
                  disabled={uploading}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-700 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white hover:file:bg-slate-600"
                />
                <p className="text-[11px] text-slate-500 mt-1">{uploading ? 'Uploading…' : 'Select multiple images from gallery, or add hosted URLs below.'}</p>

                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="Paste hosted image URL and click Add"
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-primary-700 focus:outline-none"
                  />
                  <button type="button" onClick={addImageUrl} className="px-4 py-2.5 rounded-xl bg-slate-700 text-white text-sm font-bold hover:bg-slate-600">
                    Add
                  </button>
                </div>

                {imageUrls.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {imageUrls.map((u) => (
                      <div key={u} className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
                        <img src={u} alt="preview" className="h-20 w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(u)}
                          className="absolute top-1 right-1 rounded-lg bg-black/60 text-white text-[10px] font-bold px-2 py-1 hover:bg-black/80"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {error && <p className="text-sm text-rose-400 font-semibold">{error}</p>}

              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} className="accent-primary-700 w-4 h-4" />
                <span className="text-sm text-slate-300 font-medium">Active</span>
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm font-semibold hover:bg-slate-800 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || uploading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-700 text-white text-sm font-bold hover:bg-primary-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving || uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}{' '}
                {uploading ? 'Uploading…' : editAd ? 'Save Changes' : 'Create Ad'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-800 border-b border-slate-700">
            <tr>
              {['ID', 'Title', 'Placement', 'Active', 'Start', 'End', 'Priority', 'Images', 'Actions'].map((h) => (
                <th key={h} className="px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={9} className="text-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary-400 mx-auto" />
                </td>
              </tr>
            ) : visibleAds.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-slate-500">
                  No ads yet.
                </td>
              </tr>
            ) : (
              visibleAds.map((ad) => (
                <tr key={ad.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-5 py-4 text-slate-500 text-xs font-mono">{ad.id}</td>
                  <td className="px-5 py-4">
                    <p className="text-white font-semibold text-sm">{ad.title}</p>
                    {ad.href ? <p className="text-slate-500 text-xs mt-0.5 truncate max-w-[260px]">{ad.href}</p> : null}
                  </td>
                  <td className="px-5 py-4">
                    <span className="badge bg-slate-800 text-slate-200 text-[10px]">{ad.placement}</span>
                  </td>
                  <td className="px-5 py-4 text-slate-300 text-xs">{ad.is_active ? 'Yes' : 'No'}</td>
                  <td className="px-5 py-4 text-slate-400 text-xs">{safeDate(ad.start_time)}</td>
                  <td className="px-5 py-4 text-slate-400 text-xs">{safeDate(ad.end_time)}</td>
                  <td className="px-5 py-4 text-slate-300 text-xs">{String(ad.priority ?? 0)}</td>
                  <td className="px-5 py-4 text-slate-300 text-xs">{ad.images?.length || 0}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setViewAd(ad)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-700 transition-colors"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(ad)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-700 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(ad.id)}
                        className="px-3 py-1.5 rounded-lg bg-rose-900/40 text-rose-200 text-xs font-bold hover:bg-rose-900/60 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AdminJsonModal title="Ad" record={viewAd} onClose={() => setViewAd(null)} />
    </div>
  );
}
