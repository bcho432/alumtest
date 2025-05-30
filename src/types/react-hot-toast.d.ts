declare module 'react-hot-toast' {
  export interface ToastOptions {
    duration?: number;
    position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
    style?: React.CSSProperties;
    className?: string;
    icon?: React.ReactNode;
  }

  export interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'loading' | 'blank' | 'custom';
    visible: boolean;
  }

  export const toast: {
    (message: string, options?: ToastOptions): string;
    success: (message: string, options?: ToastOptions) => string;
    error: (message: string, options?: ToastOptions) => string;
    loading: (message: string, options?: ToastOptions) => string;
    dismiss: (toastId?: string) => void;
    remove: (toastId?: string) => void;
  };

  export const Toaster: React.FC<{
    position?: ToastOptions['position'];
    toastOptions?: ToastOptions;
    reverseOrder?: boolean;
    gutter?: number;
    containerStyle?: React.CSSProperties;
    containerClassName?: string;
  }>;
} 