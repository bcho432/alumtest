import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type ToastStatus = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  title: string;
  description?: string;
  status: ToastStatus;
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(({ title, description, status }: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, description, status }]);

    // Auto-hide after 5 seconds
    setTimeout(() => {
      hideToast(id);
    }, 5000);
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-4">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 50, scale: 0.3 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
              className={`
                p-4 rounded-lg shadow-lg max-w-sm w-full
                ${toast.status === 'success' ? 'bg-green-50 border border-green-200' : ''}
                ${toast.status === 'error' ? 'bg-red-50 border border-red-200' : ''}
                ${toast.status === 'info' ? 'bg-blue-50 border border-blue-200' : ''}
                ${toast.status === 'warning' ? 'bg-yellow-50 border border-yellow-200' : ''}
              `}
            >
              <div className="flex items-start">
                <div className="flex-1">
                  <h3 className={`
                    text-sm font-medium
                    ${toast.status === 'success' ? 'text-green-800' : ''}
                    ${toast.status === 'error' ? 'text-red-800' : ''}
                    ${toast.status === 'info' ? 'text-blue-800' : ''}
                    ${toast.status === 'warning' ? 'text-yellow-800' : ''}
                  `}>
                    {toast.title}
                  </h3>
                  {toast.description && (
                    <p className={`
                      mt-1 text-sm
                      ${toast.status === 'success' ? 'text-green-700' : ''}
                      ${toast.status === 'error' ? 'text-red-700' : ''}
                      ${toast.status === 'info' ? 'text-blue-700' : ''}
                      ${toast.status === 'warning' ? 'text-yellow-700' : ''}
                    `}>
                      {toast.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => hideToast(toast.id)}
                  className={`
                    ml-4 text-sm font-medium
                    ${toast.status === 'success' ? 'text-green-600 hover:text-green-800' : ''}
                    ${toast.status === 'error' ? 'text-red-600 hover:text-red-800' : ''}
                    ${toast.status === 'info' ? 'text-blue-600 hover:text-blue-800' : ''}
                    ${toast.status === 'warning' ? 'text-yellow-600 hover:text-yellow-800' : ''}
                  `}
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
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