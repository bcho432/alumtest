import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { pinnedSchoolsService } from '@/services/pinnedSchools';
import { PinnedSchool, PinnedSchoolsState } from '@/types/pinned';

export function usePinnedSchools(): PinnedSchoolsState & {
  unpinSchool: (schoolId: string) => Promise<void>;
} {
  const { user } = useAuth();
  const [state, setState] = useState<PinnedSchoolsState>({
    schools: [],
    isLoading: true,
    error: null
  });

  useEffect(() => {
    const fetchPinnedSchools = async () => {
      if (!user) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        setState(prev => ({ ...prev, isLoading: true }));
        const schools = await pinnedSchoolsService.getPinnedSchools(user.id);
        setState({ schools, isLoading: false, error: null });
      } catch (error) {
        console.error('Error fetching pinned schools:', error);
        setState({
          schools: [],
          isLoading: false,
          error: error instanceof Error ? error : new Error('Failed to fetch pinned schools')
        });
      }
    };

    fetchPinnedSchools();
  }, [user]);

  const unpinSchool = async (schoolId: string) => {
    if (!user) return;

    try {
      await pinnedSchoolsService.unpinSchool(user.id, schoolId);
      setState(prev => ({
        ...prev,
        schools: prev.schools.filter(school => school.orgId !== schoolId)
      }));
    } catch (error) {
      console.error('Error unpinning school:', error);
      throw error;
    }
  };

  return {
    ...state,
    unpinSchool
  };
} 