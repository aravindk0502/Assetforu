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
  const [form, setForm] = useState({ title: '', description: '', location: '', image_url: '', credit_price: '', total_slots: '100', end_time: '', badge: '', is_featured: false });
  const [imagePreview, setImagePreview] = useState<string>('');

  const loadCampaigns = async () => {
    try {
      const res = await campaignAPI.list({ status: statusFilter, limit: 100 });
      setCampaigns(res.data.data);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { setLoading(true); loadCampaigns(); }, [statusFilter]);

  const handleCreate = async () => {
    if (!form.title || !form.credit_price) return;
    setSaving(true);
    try {
      await adminAPI.createCampaign({ ...form, credit_price: parseFloat(form.credit_price), total_slots: parseInt(form.total_slots) });
      setSuccess('Campaign created!');
      setShowForm(false);
      setForm({ title: '', description: '', location: '', image_url: '', credit_price: '', total_slots: '100', end_time: '', badge: '', is_featured: false });
      setImagePreview('');
      await loadCampaigns();
      setTimeout(() => setSuccess(''), 3000);
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const handleStatusChange = async (id: string, status: string) => {
    await adminAPI.updateCampaign(id, { status });
    await loadCampaigns();
  };

  useEffect(() => {
    if (!showForm) {
      setImagePreview('');
    }
  }, [showForm]);

  const handleImagePick = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      setForm((f) => ({ ...f, image_url: dataUrl }));
      setImagePreview(dataUrl);
    };
    reader.readAsDataURL(file);
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
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Image (Gallery)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImagePick(e.target.files?.[0] || null)}
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
                        placeholder="https://… or data:image/…"
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

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-primary-700 focus:outline-none resize-none"
                />
              </div>
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
