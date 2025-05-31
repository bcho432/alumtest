'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast, ToastOptions } from 'react-hot-toast';

interface ToastContextType {
  showToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize the context after the component mounts
  React.useEffect(() => {
    setIsInitialized(true);
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    if (!isInitialized) return;

    const toastOptions: ToastOptions = {
      duration: 4000,
      position: 'top-right' as const,
    };

    switch (type) {
      case 'success':
        toast.success(message, toastOptions);
        break;
      case 'error':
        toast.error(message, toastOptions);
        break;
      case 'info':
        toast(message, toastOptions);
        break;
      case 'warning':
        toast(message, { ...toastOptions, icon: '⚠️' });
        break;
    }
  }, [isInitialized]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
} 