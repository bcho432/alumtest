'use client';

import { getFirebaseServices } from '@/lib/firebase';
import { ProfileList } from '@/components/profile/ProfileList';
import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import type { Profile } from '@/types/profile';
import { useParams } from 'next/navigation';

export default function AdminProfilesPage() {
  const { id: universityId } = useParams();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const { db } = await getFirebaseServices();
        if (!db) throw new Error('Firestore is not initialized');

        const profilesRef = collection(db, 'profiles');
        const q = query(profilesRef, where('universityId', '==', universityId));
        const snapshot = await getDocs(q);
        
        const profilesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Profile[];

        setProfiles(profilesData);
      } catch (error) {
        console.error('Error fetching profiles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, [universityId]);

  const handleProfileDelete = async (profileId: string) => {
    // Implement profile deletion logic
  };

  const handleProfileShare = async (profileId: string) => {
    // Implement profile sharing logic
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Manage Profiles</h1>
      <ProfileList
        profiles={profiles}
        onProfileDelete={handleProfileDelete}
        onProfileShare={handleProfileShare}
      />
    </div>
  );
} 