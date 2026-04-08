'use client';
import { X } from 'lucide-react';

export default function AdminJsonModal({
  title,
  record,
  onClose,
}: {
  title: string;
  record: unknown;
  onClose: () => void;
}) {
  if (!record) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <pre className="text-xs text-slate-200 bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-auto">
          {JSON.stringify(record, null, 2)}
        </pre>
      </div>
    </div>
  );
}

