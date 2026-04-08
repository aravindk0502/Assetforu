'use client';
import { useEffect, useState } from 'react';
import { storeAPI } from '@/lib/api';
import { StoreItem } from '@/types';
import { Plus, Loader2, X, CheckCircle } from 'lucide-react';
import clsx from 'clsx';
import BackNavigation from '@/components/BackNavigation';
import AdminJsonModal from '@/components/admin/AdminJsonModal';
import { useAuthStore } from '@/store';

export default function AdminStorePage() {
  const token = useAuthStore((s) => s.token);
  const [items, setItems] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewItem, setViewItem] = useState<StoreItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ title: '', description: '', image_url: '', type: 'service', category: 'legal', credit_cost: '', is_popular: false });
  const [imagePreview, setImagePreview] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'service' | 'product'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | string>('all');
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [useCustomCategory, setUseCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');

  const load = async (opts?: { type?: string; category?: string }) => {
    try {
      const qs = new URLSearchParams();
      if (opts?.type) qs.set('type', opts.type);
      if (opts?.category) qs.set('category', opts.category);
      const blobRes = await fetch(`/api/public/store-items${qs.toString() ? `?${qs.toString()}` : ''}`, { cache: 'no-store' });
      const blobJson = (await blobRes.json().catch(() => ({}))) as { success?: boolean; data?: StoreItem[] };
      if (blobRes.ok && blobJson?.success && Array.isArray(blobJson?.data)) {
        setItems(blobJson.data);
        return;
      }
      const r = await storeAPI.listItems(opts);
      setItems(r.data.data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    setLoading(true);
    load({
      type: typeFilter === 'all' ? undefined : typeFilter,
      category: categoryFilter === 'all' ? undefined : categoryFilter,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, categoryFilter]);

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

  const uploadImage = async (file: File) => {
    const blob = await compressToBlob(file);
    const formData = new FormData();
    formData.append('file', new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' }));
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const json = (await res.json().catch(() => ({}))) as { success?: boolean; url?: string; message?: string };
    if (!res.ok || !json?.url) throw new Error(json?.message || 'Upload failed');
    return json.url;
  };

  const handleImagePick = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    setError('');
    try {
      setUploading(true);
      const url = await uploadImage(file);
      setForm((f) => ({ ...f, image_url: url }));
      setImagePreview(url);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Upload failed';
      setError(`Image upload failed: ${msg}`);
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = async () => {
    setError('');
    if (!form.title || !form.credit_cost) { setError('Title and credit cost are required'); return; }
    const category = (useCustomCategory ? customCategory.trim() : form.category.trim());
    if (!category) { setError('Category is required'); return; }
    if (!form.image_url) { setError('Image is required'); return; }

    setSaving(true);
    try {
      const bearer = token || (typeof window !== 'undefined' ? localStorage.getItem('af_token') : null);
      if (!bearer) throw new Error('Not authenticated');

      const payload = { ...form, category, credit_cost: parseFloat(form.credit_cost) };
      const res = await fetch('/api/admin/store-items', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${bearer}` },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => ({}))) as { success?: boolean; message?: string };
      if (!res.ok || json?.success === false) throw new Error(json?.message || `HTTP ${res.status}`);

      setSuccess('Store item created!');
      setShowForm(false);
      setForm({ title: '', description: '', image_url: '', type: 'service', category: 'legal', credit_cost: '', is_popular: false });
      setImagePreview('');
      setUseCustomCategory(false);
      setCustomCategory('');
      await load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to add item';
      setError(`Failed to add item: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!showForm) setImagePreview('');
  }, [showForm]);

  const visibleItems = items.filter((item) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.type.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q)
    );
  });

  const categories = Array.from(new Set(items.map((i) => i.category))).sort((a, b) => a.localeCompare(b));

  return (
    <div>
      <BackNavigation />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white">Store Items</h1>
          <p className="text-slate-400 mt-1">{items.length} items in store</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-primary-600 transition-colors">
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-5">
        <div className="flex items-center gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'all' | 'service' | 'product')}
            className="bg-slate-900 border border-slate-800 text-slate-300 text-sm rounded-xl px-3 py-2.5 focus:ring-primary-700 focus:outline-none"
          >
            <option value="all">All types</option>
            <option value="service">Service</option>
            <option value="product">Product</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 text-sm rounded-xl px-3 py-2.5 focus:ring-primary-700 focus:outline-none"
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search store items…"
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-primary-700 focus:outline-none"
        />
      </div>

      {success && (
        <div className="flex items-center gap-2 bg-green-900/50 border border-green-800 text-green-400 rounded-xl px-4 py-3 mb-5 text-sm font-medium">
          <CheckCircle className="w-4 h-4" /> {success}
        </div>
      )}
      {error && (
        <div className="bg-red-900/40 border border-red-800 text-red-300 rounded-xl px-4 py-3 mb-5 text-sm font-medium">
          {error}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Add Store Item</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              {[{ key: 'title', label: 'Title *', type: 'text' }, { key: 'credit_cost', label: 'Credit Cost (₹) *', type: 'number' }].map(({ key, label, type }) => (
                <div key={key}>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>
                  <input type={type} value={form[key as keyof typeof form] as string} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-primary-700 focus:outline-none" />
                </div>
              ))}

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Image (Gallery)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => void handleImagePick(e.target.files?.[0] || null)}
                  disabled={uploading}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-700 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white hover:file:bg-slate-600"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Selecting an image will auto-fill `image_url`. For best performance, use a hosted URL when possible.
                </p>
                {(imagePreview || form.image_url) && (
                  <div className="mt-3 flex items-start gap-3">
                    <img
                      src={imagePreview || form.image_url}
                      alt="Preview"
                      className="h-16 w-24 rounded-lg object-cover border border-slate-700 bg-slate-950"
                    />
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Image URL</label>
                      <input
                        type="url"
                        value={form.image_url}
                        onChange={(e) => { setForm((f) => ({ ...f, image_url: e.target.value })); setImagePreview(''); }}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-primary-700 focus:outline-none"
                        placeholder="https://…"
                      />
                      <button
                        type="button"
                        onClick={() => { setForm((f) => ({ ...f, image_url: '' })); setImagePreview(''); }}
                        className="mt-2 text-xs font-bold text-slate-400 hover:text-white"
                      >
                        Clear image
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none">
                    <option value="service">Service</option><option value="product">Product</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Category</label>
                  <select
                    value={useCustomCategory ? '__custom__' : form.category}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === '__custom__') {
                        setUseCustomCategory(true);
                        setCustomCategory(customCategory || '');
                      } else {
                        setUseCustomCategory(false);
                        setForm((f) => ({ ...f, category: v }));
                      }
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
                  >
                    {['legal', 'advisory', 'documentation', 'plants', 'home_items'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="__custom__">Custom…</option>
                  </select>
                  {useCustomCategory && (
                    <input
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="Enter category"
                      className="mt-2 w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-primary-700 focus:outline-none"
                    />
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
                <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-primary-700 focus:outline-none resize-none" />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.is_popular} onChange={e => setForm(f => ({ ...f, is_popular: e.target.checked }))} className="accent-primary-700 w-4 h-4" />
                <span className="text-sm text-slate-300 font-medium">Mark as Popular</span>
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm font-semibold hover:bg-slate-800 transition-colors">Cancel</button>
              <button onClick={handleCreate} disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-700 text-white text-sm font-bold hover:bg-primary-600 transition-colors">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Add Item
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-800 border-b border-slate-700">
            <tr>
              {['ID', 'Title', 'Type', 'Category', 'Credit Cost', 'Popular', 'Image', 'Description', 'Actions'].map((h) => (
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
            ) : visibleItems.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-slate-500">
                  No store items found.
                </td>
              </tr>
            ) : (
              visibleItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-5 py-4 text-slate-500 text-xs font-mono">{item.id}</td>
                  <td className="px-5 py-4">
                    <p className="font-bold text-white text-sm leading-snug">{item.title}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={clsx(
                        'badge text-[10px]',
                        item.type === 'service' ? 'bg-blue-900/50 text-blue-400' : 'bg-green-900/50 text-green-400'
                      )}
                    >
                      {item.type}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-300 text-xs">{item.category}</td>
                  <td className="px-5 py-4 text-primary-400 font-black credit-number">₹{item.credit_cost}</td>
                  <td className="px-5 py-4 text-slate-300 text-xs">{item.is_popular ? 'Yes' : 'No'}</td>
                  <td className="px-5 py-4 text-slate-400 text-xs">
                    {item.image_url ? (
                      <a
                        href={item.image_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary-400 hover:text-primary-300 font-semibold"
                      >
                        Open
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-5 py-4 text-slate-400 text-xs max-w-[280px] truncate">{item.description}</td>
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => setViewItem(item)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-700 transition-colors"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AdminJsonModal title="Store Item" record={viewItem} onClose={() => setViewItem(null)} />
    </div>
  );
}
