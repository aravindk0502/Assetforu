'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useUIStore } from '@/store';

export default function LoginPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const openSignupModal = useUIStore((s) => s.openSignupModal);
  const opened = useRef(false);

  useEffect(() => {
    if (token) {
      router.replace('/profile');
      return;
    }
    if (opened.current) return;
    opened.current = true;
    openSignupModal(() => router.replace('/profile'));
  }, [token, openSignupModal, router]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-sm text-slate-600">Opening login…</p>
      </div>
    </div>
  );
}

