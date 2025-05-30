import React from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  duration?: number;
  onClose?: () => void;
}

export const showToast = jest.fn();
export const hideToast = jest.fn();

const Toast: React.FC<ToastProps> = ({ message, type = 'info', position = 'bottom-right', duration = 3000, onClose }) => {
  return (
    <div className={`toast toast-${type} toast-${position}`}>
      {message}
    </div>
  );
};

export default Toast; 