'use client';
import { useAuthStore, useUIStore } from '@/store';
import { useCallback } from 'react';

/**
 * useProtectedAction
 * Returns a wrapper that:
 *  - If user is logged in → runs the action immediately
 *  - If not logged in → opens signup modal, then runs action after login
 */
export function useProtectedAction() {
  const { user } = useAuthStore();
  const { openSignupModal } = useUIStore();

  const protect = useCallback(
    (action: () => void) => {
      if (user) {
        action();
      } else {
        openSignupModal(action);
      }
    },
    [user, openSignupModal]
  );

  return protect;
}

export function useIsAuthenticated() {
  const { user } = useAuthStore();
  return !!user;
}
