import { useState } from 'react';
import { UserRole } from '@/types';
import { permissionsService } from '@/services/permissions';
import { analytics } from '@/services/analytics';
import { toast } from 'react-hot-toast';

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileId: string;
  universityId: string;
  onSuccess: () => void;
}

export default function InviteUserModal({
  isOpen,
  onClose,
  profileId,
  universityId,
  onSuccess
}: InviteUserModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('viewer');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // TODO: Implement invite flow
      // For now, just create the permission directly
      await permissionsService.setUserProfilePermission(email, profileId, role);
      
      analytics.trackEvent({
        name: 'user_invited',
        properties: {
          profileId,
          universityId,
          email,
          role
        }
      });
      
      toast.success('User invited successfully');
      onSuccess();
    } catch (error) {
      console.error('Error inviting user:', error);
      toast.error('Failed to invite user');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-medium mb-4">Invite User</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
              Role
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="viewer">Viewer</option>
              <option value="contributor">Contributor</option>
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isLoading ? 'Inviting...' : 'Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 