import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { Icon } from './Icon';
import { Spinner } from './Spinner';
import { Badge } from './Badge';
import { useToast } from './toast';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  status: 'active' | 'pending' | 'inactive';
  last_active?: string;
  created_at: string;
}

interface ProfileListProps {
  universityId: string;
  onUpdate: () => void;
}

export function ProfileList({ universityId, onUpdate }: ProfileListProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadProfiles();
  }, [universityId]);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: profilesData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('university_id', universityId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        throw error;
      }

      setProfiles(profilesData || []);
    } catch (err) {
      console.error('Error loading profiles:', err);
      setError('Failed to load profiles. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleSelectProfile = (profileId: string) => {
    setSelectedProfiles(prev =>
      prev.includes(profileId)
        ? prev.filter(id => id !== profileId)
        : [...prev, profileId]
    );
  };

  const handleSelectAll = () => {
    setSelectedProfiles(prev =>
      prev.length === filteredProfiles.length
        ? []
        : filteredProfiles.map(profile => profile.id)
    );
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedProfiles.length === 0) {
      toast({
        title: 'No profiles selected',
        description: 'Please select at least one profile to perform this action.',
        variant: 'destructive'
      });
      return;
    }

    try {
      if (action === 'delete') {
        const { error } = await supabase
          .from('profiles')
          .delete()
          .in('id', selectedProfiles);

        if (error) throw error;

        setProfiles(prev => prev.filter(profile => !selectedProfiles.includes(profile.id)));
        setSelectedProfiles([]);
        
        toast({
          title: 'Profiles deleted',
          description: `${selectedProfiles.length} profile(s) have been deleted.`,
          variant: 'default'
        });
      } else {
        const status = action === 'activate' ? 'active' : 'inactive';
        const { error } = await supabase
          .from('profiles')
          .update({ status })
          .in('id', selectedProfiles);

        if (error) throw error;

        setProfiles(prev => prev.map(profile => 
          selectedProfiles.includes(profile.id) 
            ? { ...profile, status }
            : profile
        ));
        setSelectedProfiles([]);

        toast({
          title: 'Profiles updated',
          description: `${selectedProfiles.length} profile(s) have been ${action}d.`,
          variant: 'default'
        });
      }

      onUpdate();
    } catch (err) {
      console.error(`Error performing ${action} action:`, err);
      toast({
        title: 'Error',
        description: `Failed to ${action} profiles. Please try again.`,
        variant: 'destructive'
      });
    }
  };

  const filteredProfiles = profiles.filter(profile =>
    profile.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    profile.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={loadProfiles}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-sm">
          <Input
            type="search"
            placeholder="Search profiles..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => handleBulkAction('activate')}
            disabled={selectedProfiles.length === 0}
          >
            <Icon name="check" className="w-4 h-4 mr-2" />
            Activate
          </Button>
          <Button
            variant="outline"
            onClick={() => handleBulkAction('deactivate')}
            disabled={selectedProfiles.length === 0}
          >
            <Icon name="x" className="w-4 h-4 mr-2" />
            Deactivate
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleBulkAction('delete')}
            disabled={selectedProfiles.length === 0}
          >
            <Icon name="trash" className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedProfiles.length === filteredProfiles.length}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Active
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProfiles.map(profile => (
                <tr key={profile.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedProfiles.includes(profile.id)}
                      onChange={() => handleSelectProfile(profile.id)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <Icon name="user" className="w-6 h-6 text-gray-500" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {profile.full_name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{profile.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{profile.role}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge
                      variant={
                        profile.status === 'active'
                          ? 'success'
                          : profile.status === 'pending'
                          ? 'secondary'
                          : 'default'
                      }
                    >
                      {profile.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {profile.last_active
                        ? new Date(profile.last_active).toLocaleDateString()
                        : 'Never'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {/* Implement edit action */}}
                    >
                      <Icon name="edit" className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
} 