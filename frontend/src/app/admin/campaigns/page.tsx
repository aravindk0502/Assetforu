'use client';
import { useEffect, useState } from 'react';
import { adminAPI, campaignAPI } from '@/lib/api';
import { Campaign } from '@/types';
import { Plus, Loader2, X, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';
import BackNavigation from '@/components/BackNavigation';
import AdminJsonModal from '@/components/admin/AdminJsonModal';

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'active' | 'upcoming' | 'closed'>('active');
  const [showForm, setShowForm] = useState(false);
  const [viewCampaign, setViewCampaign] = useState<Campaign | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    credit_price: '',
    total_slots: '100',
    end_time: '',
    badge: '',
    is_featured: false,
  });
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [error, setError] = useState('');

  const loadCampaigns = async () => {
    try {
      const res = await campaignAPI.list({ status: statusFilter, limit: 100 });
      setCampaigns(res.data.data);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { setLoading(true); loadCampaigns(); }, [statusFilter]);

  const handleCreate = async () => {
    setError('');
    if (!form.title.trim()) { setError('Title is required'); return; }
    if (!form.description.trim()) { setError('Description is required'); return; }
    if (!form.credit_price) { setError('Credit price is required'); return; }
    if (!imageUrls.length) { setError('Add at least 1 image (up to 5)'); return; }

    setSaving(true);
    try {
      const payload = {
        ...form,
        credit_price: parseFloat(form.credit_price),
        total_slots: parseInt(form.total_slots),
        end_time: form.end_time ? new Date(form.end_time).toISOString() : null,
        image_url: JSON.stringify(imageUrls.slice(0, 5)),
      };
      await adminAPI.createCampaign(payload);
      setSuccess('Campaign created!');
      setShowForm(false);
      setForm({ title: '', description: '', location: '', credit_price: '', total_slots: '100', end_time: '', badge: '', is_featured: false });
      setImageUrls([]);
      setImageUrlInput('');
      await loadCampaigns();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'Failed to create campaign');
    } finally { setSaving(false); }
  };

  const handleStatusChange = async (id: string, status: string) => {
    await adminAPI.updateCampaign(id, { status });
    await loadCampaigns();
  };

  useEffect(() => {
    if (!showForm) {
      setImageUrls([]);
      setImageUrlInput('');
      setError('');
    }
  }, [showForm]);

  const compressToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        try {
          const maxW = 1600;
          const scale = Math.min(1, maxW / img.width);
          const w = Math.max(1, Math.round(img.width * scale));
          const h = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas not supported');
          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL('image/webp', 0.82);
          resolve(dataUrl);
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

  const addImages = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setError('');
    const remaining = Math.max(0, 5 - imageUrls.length);
    if (remaining <= 0) return;
    const selected = Array.from(files).slice(0, remaining);
    try {
      const dataUrls = await Promise.all(selected.map((f) => compressToDataUrl(f)));
      setImageUrls((prev) => [...prev, ...dataUrls].slice(0, 5));
    } catch {
      setError('Failed to read image. Try a smaller file.');
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
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-primary-600 transition-colors">
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
              <h2 className="text-lg font-bold text-white">Create Campaign</h2>
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
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Images (up to 5)</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => void addImages(e.target.files)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-700 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white hover:file:bg-slate-600"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  You can select multiple images. We compress to WebP for upload. For best performance, use hosted URLs.
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
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-primary-700 focus:outline-none resize-none"
                />
              </div>
              {error && <p className="text-sm text-rose-400 font-semibold">{error}</p>}
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.is_featured} onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))} className="accent-primary-700 w-4 h-4" />
                <span className="text-sm text-slate-300 font-medium">Featured on homepage</span>
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm font-semibold hover:bg-slate-800 transition-colors">Cancel</button>
              <button onClick={handleCreate} disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-700 text-white text-sm font-bold hover:bg-primary-600 transition-colors">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Create Campaign
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
                <td className="px-5 py-4 text-slate-400 text-xs">{c.created_at ? format(new Date(c.created_at), 'dd MMM yyyy') : '—'}</td>
                <td className="px-5 py-4 text-slate-400 text-xs">{c.end_time ? format(new Date(c.end_time), 'dd MMM yyyy') : '—'}</td>
                <td className="px-5 py-4">
                  <span className={clsx('badge', c.status === 'active' ? 'bg-green-900/50 text-green-400' : 'bg-slate-800 text-slate-500')}>{c.status}</span>
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
                    <select
                      value={c.status}
                      onChange={e => handleStatusChange(c.id, e.target.value)}
                      className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-2 py-1 focus:ring-primary-700 focus:outline-none"
                    >
                      <option value="active">Active</option>
                      <option value="closed">Close</option>
                      <option value="upcoming">Upcoming</option>
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
