'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { EnhancedProfileCard } from './EnhancedProfileCard';
import { Profile, PersonalProfile, MemorialProfile } from '@/types/profile';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface ProfileListProps {
  profiles: Profile[];
  onProfileDelete?: (profileId: string) => Promise<void>;
  onProfileShare?: (profileId: string) => Promise<void>;
  className?: string;
}

export const ProfileList: React.FC<ProfileListProps> = ({
  profiles,
  onProfileDelete,
  onProfileShare,
  className
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'updatedAt'>('name');
  const [filterBy, setFilterBy] = useState<'all' | 'published' | 'draft'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredProfiles = profiles
    .filter(profile => {
      const matchesSearch = profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (profile.type === 'personal' && (profile as PersonalProfile).bio?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (profile.type === 'memorial' && (profile as MemorialProfile).description?.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesFilter = filterBy === 'all' || profile.status === filterBy;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'createdAt':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'updatedAt':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        default:
          return 0;
      }
    });

  const handleDelete = async (profileId: string) => {
    if (!onProfileDelete) return;
    
    try {
      await onProfileDelete(profileId);
      toast.success('Profile deleted successfully');
    } catch (error) {
      console.error('Error deleting profile:', error);
      toast.error('Failed to delete profile');
    }
  };

  const handleShare = async (profileId: string) => {
    if (!onProfileShare) return;
    
    try {
      await onProfileShare(profileId);
      toast.success('Profile shared successfully');
    } catch (error) {
      console.error('Error sharing profile:', error);
      toast.error('Failed to share profile');
    }
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex-1 w-full sm:w-auto">
          <div className="relative">
            <Input
              type="search"
              placeholder="Search profiles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10"
            />
            <Icon name="search" className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Select
            value={sortBy}
            onChange={(value) => setSortBy(value as typeof sortBy)}
            options={[
              { value: 'name', label: 'Sort by Name' },
              { value: 'createdAt', label: 'Sort by Created' },
              { value: 'updatedAt', label: 'Sort by Updated' }
            ]}
          >
          </Select>
          
          <Select
            value={filterBy}
            onChange={(value) => setFilterBy(value as typeof filterBy)}
            options={[
              { value: 'all', label: 'All Profiles' },
              { value: 'published', label: 'Published' },
              { value: 'draft', label: 'Drafts' }
            ]}
          >
          </Select>
          
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="px-2"
            >
              <Icon name="grid" className="w-5 h-5" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="px-2"
            >
              <Icon name="list" className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Profile Grid/List */}
      <motion.div
        layout
        className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'space-y-4'
        }
      >
        {filteredProfiles.map((profile) => (
          <motion.div
            key={profile.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <EnhancedProfileCard
              profile={profile}
              variant={viewMode === 'grid' ? 'detailed' : 'compact'}
              onEdit={() => router.push(`/profile/${profile.id}/edit`)}
              onShare={() => handleShare(profile.id)}
              onDelete={() => handleDelete(profile.id)}
              showActions={true}
              showStats={viewMode === 'grid'}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Empty State */}
      {filteredProfiles.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Icon name="user" className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No profiles found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm
              ? "Try adjusting your search or filter to find what you're looking for."
              : 'Get started by creating a new profile.'}
          </p>
          <Button
            onClick={() => router.push('/profile/new')}
            className="inline-flex items-center"
          >
            <Icon name="plus" className="w-5 h-5 mr-2" />
            Create New Profile
          </Button>
        </div>
      )}
    </div>
  );
}; 