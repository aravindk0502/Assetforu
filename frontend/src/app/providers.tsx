'use client';
import { useEffect } from 'react';
import { useAuthStore } from '@/store';
import { SignupModal } from '@/components/SignupModal';
import { ToastContainer } from '@/components/Toast';
import { useUIStore } from '@/store';

export function Providers({ children }: { children: React.ReactNode }) {
  const loadFromStorage = useAuthStore((s) => s.loadFromStorage);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    loadFromStorage();
    const handler = () => logout();
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, [loadFromStorage, logout]);

  return (
    <>
      {children}
      <ModalManager />
      <ToastContainer />
    </>
  );
}

function ModalManager() {
  const { signupModalOpen } = useUIStore();
  if (!signupModalOpen) return null;
  return <SignupModal />;
}
