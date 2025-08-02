import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { pinnedSchoolsService } from '@/services/pinnedSchools';
import { toast } from 'react-hot-toast';
import { University } from '@/types/university';

interface UniversityHeaderProps {
  university: University;
}

export const UniversityHeader = ({ university }: UniversityHeaderProps) => {
  const { user } = useAuth();
  const [isPinning, setIsPinning] = useState(false);

  const handlePin = async () => {
    if (!user) {
      toast.error('Please sign in to pin schools');
      return;
    }

    try {
      setIsPinning(true);
      await pinnedSchoolsService.pinSchool(user.id, {
        orgId: university.id,
        name: university.name,
        logoUrl: university.logoUrl || ''
      });
      toast.success('School pinned successfully');
    } catch (error) {
      toast.error('Failed to pin school');
      console.error('Error pinning school:', error);
    } finally {
      setIsPinning(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white border-b">
      <div className="flex items-center space-x-4">
        {university.logoUrl ? (
          <img
            src={university.logoUrl}
            alt={`${university.name} logo`}
            className="w-12 h-12 object-contain rounded"
          />
        ) : (
          <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
            <span className="text-gray-500 text-lg">{university.name[0]}</span>
          </div>
        )}
        <h1 className="text-2xl font-bold">{university.name}</h1>
      </div>
      {user && (
        <button
          onClick={handlePin}
          disabled={isPinning}
          className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
          aria-label={isPinning ? 'Pinning school...' : 'Pin this school'}
        >
          {isPinning ? 'Pinning...' : 'Pin School'}
        </button>
      )}
    </div>
  );
}; 