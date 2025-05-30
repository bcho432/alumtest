import { useState } from 'react';

export type ToastStatus = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  title: string;
  description: string;
  status: ToastStatus;
  duration?: number;
}

export const useToast = () => {
  const [toast, setToast] = useState<ToastOptions | null>(null);

  const showToast = (options: ToastOptions) => {
    setToast(options);
    if (options.duration !== 0) {
      setTimeout(() => {
        setToast(null);
      }, options.duration || 5000);
    }
  };

  const hideToast = () => {
    setToast(null);
  };

  return {
    toast,
    showToast,
    hideToast,
  };
}; 