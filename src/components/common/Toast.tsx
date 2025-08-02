import React from 'react';
import { toast } from 'react-hot-toast';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  duration?: number;
  onClose?: () => void;
}

export const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
  switch (type) {
    case 'success':
      return toast.success(message);
    case 'error':
      return toast.error(message);
    case 'warning':
      return toast(message, { icon: '⚠️' });
    default:
      return toast(message);
  }
};

export const hideToast = () => {
  toast.dismiss();
};

const Toast: React.FC<ToastProps> = ({ message, type = 'info', position = 'bottom-right', duration = 3000, onClose }) => {
  return (
    <div className={`toast toast-${type} toast-${position}`}>
      {message}
    </div>
  );
};

export default Toast; 