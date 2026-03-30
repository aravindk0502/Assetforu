'use client';
import { useEffect, useState } from 'react';
import { X, Heart, CheckCircle } from 'lucide-react';

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'info';
  count: number;
  isAdding: boolean;
}

// Simple toast store
let toastQueue: ToastMessage[] = [];
let listeners: Set<(toasts: ToastMessage[]) => void> = new Set();

export function addToast(message: string, type: 'success' | 'info' = 'success', count: number = 1, isAdding: boolean = true) {
  const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const toast: ToastMessage = { id, message, type, count, isAdding };
  toastQueue = [toast, ...toastQueue.slice(0, 4)]; // Keep max 5
  listeners.forEach(listener => listener([...toastQueue]));
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    toastQueue = toastQueue.filter(t => t.id !== id);
    listeners.forEach(listener => listener([...toastQueue]));
  }, 3000);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    listeners.add(setToasts);
    return () => {
      listeners.delete(setToasts);
    };
  }, []);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-24 sm:bottom-6 right-4 z-50 flex flex-col gap-2 max-w-xs">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-lg px-4 py-3 text-sm font-semibold flex items-center gap-2 shadow-lg animate-in slide-in-from-bottom-2 duration-300 ${
            toast.type === 'success'
              ? 'bg-emerald-500 text-white'
              : 'bg-blue-500 text-white'
          }`}
        >
          <Heart className="w-4 h-4 fill-current" />
          <span className="flex-1">
            {toast.message} {toast.count > 1 && `(${toast.count})`}
          </span>
          <button
            onClick={() => {
              toastQueue = toastQueue.filter(t => t.id !== toast.id);
              setToasts([...toastQueue]);
            }}
            className="hover:opacity-75"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
