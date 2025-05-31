import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    return (
      <div className="mb-4">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium leading-6 text-gray-900 mb-1">
            {label}
          </label>
        )}
        <div>
          <input
            ref={ref}
            id={id}
            className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ${
              error ? 'ring-red-500' : 'ring-gray-300'
            } placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 ${className}`}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-600" id={`${id}-error`}>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-2 text-sm text-gray-500" id={`${id}-description`}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input'; 