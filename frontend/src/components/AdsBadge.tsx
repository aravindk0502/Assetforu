'use client';

import { Megaphone } from 'lucide-react';

export function AdsBadge({ show = true }: { show?: boolean }) {
  if (!show) return null;
  return (
    <div className="pointer-events-none absolute bottom-2 right-2 z-20 inline-flex items-center gap-1 rounded-full bg-slate-900/40 px-2 py-1 text-[10px] font-semibold tracking-wide text-white/90 backdrop-blur-sm">
      <Megaphone className="h-3 w-3 opacity-90" />
      <span>ADS</span>
    </div>
  );
}
