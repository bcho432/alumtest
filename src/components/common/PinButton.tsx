'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { Icon } from '@/components/common/Icon';

interface PinButtonProps {
  profileId: string;
  className?: string;
}

export function PinButton({ profileId, className = '' }: PinButtonProps) {
  const { user } = useAuth();
  const [isPinned, setIsPinned] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const checkPinStatus = async () => {
      try {
        const db = await getDb();
        if (!db) {
          console.error('Firestore not initialized');
          return;
        }

        const pinRef = doc(db, 'users', user.id, 'pinnedProfiles', profileId);
        const pinDoc = await getDoc(pinRef);
        setIsPinned(pinDoc.exists());
      } catch (error) {
        console.error('Error checking pin status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkPinStatus();
  }, [user, profileId]);

  const handlePinToggle = async () => {
    if (!user) return;

    try {
      const db = await getDb();
      if (!db) {
        console.error('Firestore not initialized');
        return;
      }

      const pinRef = doc(db, 'users', user.id, 'pinnedProfiles', profileId);
      
      if (isPinned) {
        await deleteDoc(pinRef);
      } else {
        await setDoc(pinRef, {
          profileId,
          pinnedAt: new Date()
        });
      }
      
      setIsPinned(!isPinned);
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };

  if (!user || isLoading) {
    return null;
  }

  return (
    <button
      onClick={handlePinToggle}
      className={`p-2 rounded-full hover:bg-gray-100 ${className}`}
      title={isPinned ? 'Unpin profile' : 'Pin profile'}
    >
      <Icon
        name={isPinned ? 'pin-filled' : 'pin'}
        className={`w-5 h-5 ${isPinned ? 'text-blue-500' : 'text-gray-400'}`}
      />
    </button>
  );
} 