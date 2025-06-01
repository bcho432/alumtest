'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { getFirebaseServices } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, orderBy, limit, startAfter } from 'firebase/firestore';
import { useToast } from '@/components/ui/toast';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/Dialog';

interface Profile {
  id: string;
  name: string;
  type: 'memorial' | 'living';
  status: 'draft' | 'published' | 'pending_review';
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

interface ProfileListProps {
  universityId: string;
}

const ITEMS_PER_PAGE = 9;

export function ProfileList({ universityId }: ProfileListProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'draft' | 'published' | 'pending_review'>('all');
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchProfiles();
  }, [universityId, filter]);

  const fetchProfiles = async (isLoadMore = false) => {
    try {
      const { db } = await getFirebaseServices();
      if (!db) return;

      let q = query(
        collection(db, `universities/${universityId}/profiles`),
        orderBy('createdAt', 'desc'),
        limit(ITEMS_PER_PAGE)
      );

      if (filter !== 'all') {
        q = query(q, where('status', '==', filter));
      }

      if (isLoadMore && lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const profilesSnapshot = await getDocs(q);
      const profilesData = profilesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Profile[];

      setLastDoc(profilesSnapshot.docs[profilesSnapshot.docs.length - 1]);
      setHasMore(profilesSnapshot.docs.length === ITEMS_PER_PAGE);

      if (isLoadMore) {
        setProfiles(prev => [...prev, ...profilesData]);
      } else {
        setProfiles(profilesData);
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch profiles',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (profileId: string, newStatus: Profile['status']) => {
    try {
      const { db } = await getFirebaseServices();
      if (!db) return;

      const profileRef = doc(db, `universities/${universityId}/profiles/${profileId}`);
      await updateDoc(profileRef, {
        status: newStatus,
        updatedAt: new Date()
      });

      setProfiles(profiles.map(profile => 
        profile.id === profileId ? { ...profile, status: newStatus } : profile
      ));

      toast({
        title: 'Success',
        description: 'Profile status updated successfully'
      });
    } catch (error) {
      console.error('Error updating profile status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile status. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteProfile = async (profileId: string) => {
    try {
      setIsDeleting(true);
      const { db } = await getFirebaseServices();
      if (!db) return;

      const profileRef = doc(db, `universities/${universityId}/profiles/${profileId}`);
      await deleteDoc(profileRef);

      setProfiles(profiles.filter(profile => profile.id !== profileId));
      setProfileToDelete(null);

      toast({
        title: 'Success',
        description: 'Profile deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete profile. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredProfiles = profiles.filter(profile => 
    filter === 'all' || profile.status === filter
  );

  if (loading && !profiles.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex space-x-4">
        <Button
          variant={filter === 'all' ? 'primary' : 'outline'}
          onClick={() => setFilter('all')}
        >
          All
        </Button>
        <Button
          variant={filter === 'published' ? 'primary' : 'outline'}
          onClick={() => setFilter('published')}
        >
          Published
        </Button>
        <Button
          variant={filter === 'draft' ? 'primary' : 'outline'}
          onClick={() => setFilter('draft')}
        >
          Drafts
        </Button>
        <Button
          variant={filter === 'pending_review' ? 'primary' : 'outline'}
          onClick={() => setFilter('pending_review')}
        >
          Pending Review
        </Button>
      </div>

      {/* Profiles List */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProfiles.map((profile) => (
          <Card key={profile.id} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <Icon
                    name={profile.type === 'memorial' ? 'heart' : 'user'}
                    className="h-6 w-6 text-gray-500"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{profile.name}</h3>
                  <p className="text-sm text-gray-500">
                    {profile.type === 'memorial' ? 'Memorial' : 'Living'} Profile
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <select
                  value={profile.status}
                  onChange={(e) => handleStatusChange(profile.id, e.target.value as Profile['status'])}
                  className="rounded-md border-gray-300 text-sm focus:border-primary focus:ring-primary"
                >
                  <option value="draft">Draft</option>
                  <option value="pending_review">Pending Review</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <div>
                Created: {new Date(profile.createdAt).toLocaleDateString()}
              </div>
              <div>
                Updated: {new Date(profile.updatedAt).toLocaleDateString()}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                <Link href={`/memorials/${profile.id}`}>
                  <Button variant="outline" size="sm">
                    <Icon name="eye" className="h-4 w-4 mr-2" />
                    View
                  </Button>
                </Link>
                <Link href={`/admin/universities/${universityId}/profiles/${profile.id}/edit`}>
                  <Button variant="outline" size="sm">
                    <Icon name="edit" className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </Link>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setProfileToDelete(profile.id)}
                className="text-red-600 hover:text-red-900"
              >
                <Icon name="trash" className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center mt-6">
          <Button
            variant="outline"
            onClick={() => fetchProfiles(true)}
            disabled={loading}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
            ) : (
              <Icon name="arrow-down" className="h-4 w-4 mr-2" />
            )}
            Load More
          </Button>
        </div>
      )}

      {filteredProfiles.length === 0 && !loading && (
        <div className="text-center py-12">
          <Icon name="users" className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No profiles found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === 'all'
              ? 'No profiles have been created yet.'
              : `No ${filter} profiles found.`}
          </p>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!profileToDelete} onOpenChange={(open) => !open && setProfileToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Profile</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this profile? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setProfileToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => profileToDelete && handleDeleteProfile(profileToDelete)}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Icon name="trash" className="h-4 w-4 mr-2" />
              )}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 