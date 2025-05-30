import * as React from 'react';
import { cn } from '@/lib/utils';

interface ToastProps {
  id?: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  onClose?: () => void;
}

export function Toast({
  title,
  description,
  variant = 'default',
  onClose
}: ToastProps) {
  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 flex w-full max-w-sm items-center space-x-4 rounded-lg p-4 shadow-lg',
        {
          'bg-white text-gray-900': variant === 'default',
          'bg-red-50 text-red-900': variant === 'destructive',
          'bg-green-50 text-green-900': variant === 'success'
        }
      )}
    >
      <div className="flex-1">
        {title && <div className="font-medium">{title}</div>}
        {description && <div className="text-sm opacity-90">{description}</div>}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-4 text-gray-400 hover:text-gray-500"
        >
          <span className="sr-only">Close</span>
          <svg
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = React.useState<ToastProps[]>([]);

  const toast = React.useCallback(
    ({ title, description, variant }: ToastProps) => {
      const id = Math.random().toString(36).substr(2, 9);
      setToasts(prev => [...prev, { id, title, description, variant }]);

      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 5000);
    },
    []
  );

  return { toast, toasts };
} 