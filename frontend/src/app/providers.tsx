'use client';
import { useEffect } from 'react';
import { useAuthStore } from '@/store';
import { SignupModal } from '@/components/SignupModal';
import { ToastContainer } from '@/components/Toast';
import { useUIStore } from '@/store';
import { FcmRegistrar } from '@/components/FcmRegistrar';
import { LanguageProvider } from '@/components/LanguageProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  const loadFromStorage = useAuthStore((s) => s.loadFromStorage);
  const logout = useAuthStore((s) => s.logout);
  const resetUserData = useUIStore((s) => s.resetUserData);

  useEffect(() => {
    loadFromStorage();
    const handler = () => {
      logout();
      resetUserData();
    };
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, [loadFromStorage, logout, resetUserData]);

  return (
    <LanguageProvider>
      {children}
      <FcmRegistrar />
      <ModalManager />
      <ToastContainer />
    </LanguageProvider>
  );
}

function ModalManager() {
  const { signupModalOpen } = useUIStore();
  if (!signupModalOpen) return null;
  return <SignupModal />;
}
