import { useState } from 'react';
import { usePinnedSchools } from '@/hooks/usePinnedSchools';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import Link from 'next/link';

export const PinnedSchoolsPanel = () => {
  const { schools, isLoading, error, unpinSchool } = usePinnedSchools();
  const [unpinningSchoolId, setUnpinningSchoolId] = useState<string | null>(null);

  const handleUnpin = async (schoolId: string) => {
    try {
      setUnpinningSchoolId(schoolId);
      await unpinSchool(schoolId);
      toast.success('School unpinned successfully');
    } catch (error) {
      toast.error('Failed to unpin school');
      console.error('Error unpinning school:', error);
    } finally {
      setUnpinningSchoolId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8" role="status" aria-label="Loading pinned schools">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600">
          <span className="sr-only">Loading pinned schools...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="p-4 text-red-600 bg-red-50 rounded-lg" 
        role="alert"
        aria-live="assertive"
      >
        Error loading pinned schools. Please try again later.
      </div>
    );
  }

  if (schools.length === 0) {
    return (
      <div 
        className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg"
        role="status"
        aria-label="No pinned schools"
      >
        No pinned schools yet. Pin your favorite schools to access them quickly.
      </div>
    );
  }

  return (
    <div 
      className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
      role="list"
      aria-label="Pinned schools"
    >
      {schools.map((school) => (
        <div
          key={school.orgId}
          className="flex items-center justify-between p-4 bg-white border rounded-lg shadow-sm"
          role="listitem"
        >
          <Link 
            href={`/universities/${school.orgId}`} 
            className="flex items-center space-x-3"
            aria-label={`Visit ${school.name}`}
          >
            {school.logoUrl ? (
              <div className="relative w-12 h-12">
                <Image
                  src={school.logoUrl}
                  alt={`${school.name} logo`}
                  fill
                  className="object-contain rounded"
                />
              </div>
            ) : (
              <div 
                className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center"
                aria-hidden="true"
              >
                <span className="text-gray-500 text-lg">{school.name[0]}</span>
              </div>
            )}
            <span className="font-medium">{school.name}</span>
          </Link>
          <button
            onClick={() => handleUnpin(school.orgId)}
            disabled={unpinningSchoolId === school.orgId}
            className="px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
            aria-label={unpinningSchoolId === school.orgId ? 
              `Unpinning ${school.name}...` : 
              `Unpin ${school.name}`
            }
          >
            {unpinningSchoolId === school.orgId ? 'Unpinning...' : 'Unpin'}
          </button>
        </div>
      ))}
    </div>
  );
}; 