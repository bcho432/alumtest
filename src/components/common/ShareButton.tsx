'use client';

import React, { useState } from 'react';
import { Icon } from '@/components/common/Icon';

interface ShareButtonProps {
  url: string;
}

export function ShareButton({ url }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const profileUrl = `${window.location.origin}/profile/${url}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out this profile',
          url: profileUrl,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(profileUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Error copying to clipboard:', error);
      }
    }
  };

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50"
    >
      <Icon name={copied ? 'check' : 'share'} className="h-5 w-5 mr-2" />
      {copied ? 'Copied!' : 'Share'}
    </button>
  );
} 