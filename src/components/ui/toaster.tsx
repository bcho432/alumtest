'use client';

import { Toaster as HotToaster } from 'react-hot-toast';
import { useEffect, useState } from 'react';

export function Toaster() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        duration: 5000,
        style: {
          background: '#fff',
          color: '#363636',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          borderRadius: '0.5rem',
          padding: '1rem',
        },
      }}
    />
  );
} 