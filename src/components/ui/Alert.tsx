'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Icon } from './Icon';

interface AlertProps {
  title?: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  className?: string;
  onClose?: () => void;
  showIcon?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  role?: 'alert' | 'status';
}

const alertStyles = {
  info: {
    container: 'bg-blue-50 border border-blue-200',
    icon: 'text-blue-400',
    title: 'text-blue-800',
    message: 'text-blue-700',
    action: 'text-blue-800 hover:bg-blue-100',
  },
  success: {
    container: 'bg-green-50 border border-green-200',
    icon: 'text-green-400',
    title: 'text-green-800',
    message: 'text-green-700',
    action: 'text-green-800 hover:bg-green-100',
  },
  warning: {
    container: 'bg-yellow-50 border border-yellow-200',
    icon: 'text-yellow-400',
    title: 'text-yellow-800',
    message: 'text-yellow-700',
    action: 'text-yellow-800 hover:bg-yellow-100',
  },
  error: {
    container: 'bg-red-50 border border-red-200',
    icon: 'text-red-400',
    title: 'text-red-800',
    message: 'text-red-700',
    action: 'text-red-800 hover:bg-red-100',
  },
};

const alertIcons = {
  info: 'info',
  success: 'check-circle',
  warning: 'warning',
  error: 'error',
};

export function Alert({
  title,
  message,
  type = 'info',
  className = '',
  onClose,
  showIcon = true,
  action,
  role = 'alert',
}: AlertProps) {
  const styles = alertStyles[type];
  const icon = alertIcons[type];

  return (
    <div 
      className={cn('rounded-md p-4', styles.container, className)}
      role={role}
      aria-live={role === 'alert' ? 'assertive' : 'polite'}
    >
      <div className="flex">
        {showIcon && (
          <div className="flex-shrink-0">
            <Icon name={icon} className={cn('h-5 w-5', styles.icon)} aria-hidden="true" />
          </div>
        )}
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={cn('text-sm font-medium', styles.title)}>{title}</h3>
          )}
          <div className={cn('mt-2 text-sm', styles.message)}>
            <p>{message}</p>
          </div>
          {(action || onClose) && (
            <div className="mt-4 flex space-x-3">
              {action && (
                <button
                  type="button"
                  onClick={action.onClick}
                  className={cn(
                    'inline-flex items-center rounded-md px-2 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2',
                    styles.action
                  )}
                >
                  {action.label}
                </button>
              )}
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className={cn(
                    'inline-flex items-center rounded-md px-2 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2',
                    styles.action
                  )}
                >
                  Dismiss
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Convenience components for common use cases
export function ErrorMessage(props: Omit<AlertProps, 'type'>) {
  return <Alert {...props} type="error" />;
}

export function SuccessMessage(props: Omit<AlertProps, 'type'>) {
  return <Alert {...props} type="success" />;
}

export function WarningMessage(props: Omit<AlertProps, 'type'>) {
  return <Alert {...props} type="warning" />;
}

export function InfoMessage(props: Omit<AlertProps, 'type'>) {
  return <Alert {...props} type="info" />;
} 