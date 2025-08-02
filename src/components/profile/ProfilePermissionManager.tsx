import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUniversity } from '@/hooks/useUniversity';
import { Profile } from '@/types';
import { UserPermission, AllowedRole } from '@/types/permission';
import { permissionsService } from '@/services/permissions';
import { analytics } from '@/services/analytics';
import { toast } from 'react-hot-toast';
import RoleDropdown from './RoleDropdown';
import InviteUserModal from './InviteUserModal';
import { AppError } from '@/utils/errors';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface ProfilePermissionManagerProps {
  universityId: string;
}

const ROLE_HIERARCHY: Record<AllowedRole, AllowedRole[]> = {
  admin: ['admin', 'editor', 'contributor', 'viewer'],
  editor: ['editor', 'contributor', 'viewer'],
  contributor: ['contributor', 'viewer'],
  viewer: ['viewer']
};

export default function ProfilePermissionManager({ universityId }: ProfilePermissionManagerProps) {
  const { user } = useAuth();
  const { profiles, isLoading: isLoadingProfiles } = useUniversity(universityId);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [permissions, setPermissions] = useState<Record<string, UserPermission>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: 'grant' | 'revoke';
    userId: string;
    role?: AllowedRole;
  } | null>(null);

  const validateRoleAssignment = useCallback((currentRole: AllowedRole | null, newRole: AllowedRole): boolean => {
    if (!currentRole) return true;
    return ROLE_HIERARCHY[currentRole].includes(newRole);
  }, []);

  // Load permissions when profile is selected
  useEffect(() => {
    if (!selectedProfile) return;

    const loadPermissions = async () => {
      setIsLoading(true);
      try {
        const profilePermissions = await permissionsService.getProfilePermissions(selectedProfile.id);
        setPermissions(profilePermissions);
        analytics.trackEvent({
          name: 'permission_viewed',
          properties: {
            profileId: selectedProfile.id,
            universityId
          }
        });
      } catch (error) {
        console.error('Error loading permissions:', error);
        if (error instanceof AppError) {
          toast.error(error.message);
        } else {
          toast.error('Failed to load permissions');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadPermissions();
  }, [selectedProfile, universityId]);

  const handleRoleChange = async (userId: string, newRole: AllowedRole) => {
    if (!selectedProfile || !user) return;

    const currentRole = permissions[userId]?.role;
    if (!validateRoleAssignment(currentRole, newRole)) {
      toast.error('Invalid role assignment');
      return;
    }

    setPendingAction({
      type: 'grant',
      userId,
      role: newRole
    });
    setShowConfirmDialog(true);
  };

  const handleRemoveRole = async (userId: string) => {
    if (!selectedProfile || !user) return;

    setPendingAction({
      type: 'revoke',
      userId
    });
    setShowConfirmDialog(true);
  };

  const executePendingAction = async () => {
    if (!selectedProfile || !user || !pendingAction) return;

    setIsLoading(true);
    try {
      if (pendingAction.type === 'grant' && pendingAction.role) {
        await permissionsService.setUserProfilePermission(
          pendingAction.userId,
          selectedProfile.id,
          pendingAction.role
        );
        
        setPermissions(prev => ({
          ...prev,
          [pendingAction.userId]: {
            role: pendingAction.role!,
            grantedBy: user.id,
            grantedAt: new Date()
          }
        }));
        
        analytics.trackEvent({
          name: 'role_granted',
          properties: {
            profileId: selectedProfile.id,
            userId: pendingAction.userId,
            role: pendingAction.role,
            universityId
          }
        });
        
        toast.success('Role updated successfully');
      } else if (pendingAction.type === 'revoke') {
        await permissionsService.removeUserProfilePermission(
          pendingAction.userId,
          selectedProfile.id
        );
        
        const { [pendingAction.userId]: removed, ...remaining } = permissions;
        setPermissions(remaining);
        
        analytics.trackEvent({
          name: 'role_revoked',
          properties: {
            profileId: selectedProfile.id,
            userId: pendingAction.userId,
            universityId
          }
        });
        
        toast.success('Role removed successfully');
      }
    } catch (error) {
      console.error('Error managing role:', error);
      if (error instanceof AppError) {
        toast.error(error.message);
      } else {
        toast.error('Failed to manage role');
      }
    } finally {
      setIsLoading(false);
      setShowConfirmDialog(false);
      setPendingAction(null);
    }
  };

  if (isLoadingProfiles) {
    return <div>Loading profiles...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Profile Permissions</h2>
        <button
          onClick={() => setShowInviteModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          disabled={!selectedProfile}
        >
          Invite User
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="profile-select" className="block text-sm font-medium text-gray-700">
            Select Profile
          </label>
          <select
            id="profile-select"
            value={selectedProfile?.id || ''}
            onChange={(e) => {
              const profile = profiles.find(p => p.id === e.target.value);
              setSelectedProfile(profile || null);
            }}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="">Select a profile...</option>
            {profiles.map(profile => (
              <option key={profile.id} value={profile.id}>
                {profile.name}
              </option>
            ))}
          </select>
        </div>

        {selectedProfile && (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {Object.entries(permissions).map(([userId, permission]) => (
                <li key={userId} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{userId}</p>
                        <p className="text-sm text-gray-500">Current role: {permission.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <RoleDropdown
                        currentRole={permission.role}
                        onRoleChange={(newRole) => handleRoleChange(userId, newRole)}
                      />
                      <button
                        onClick={() => handleRemoveRole(userId)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {showInviteModal && selectedProfile && (
        <InviteUserModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          profileId={selectedProfile.id}
          universityId={universityId}
          onSuccess={() => {
            setShowInviteModal(false);
            // Refresh permissions
            const loadPermissions = async () => {
              const profilePermissions = await permissionsService.getProfilePermissions(selectedProfile.id);
              setPermissions(profilePermissions);
            };
            loadPermissions();
          }}
        />
      )}

      {/* Confirmation dialog */}
      <ConfirmDialog
        title={pendingAction?.type === 'grant' ? 'Change Role' : 'Remove Role'}
        message={
          pendingAction?.type === 'grant'
            ? `Are you sure you want to change the role to ${pendingAction.role}?`
            : 'Are you sure you want to remove this role?'
        }
        onConfirm={executePendingAction}
        onCancel={() => {
          setShowConfirmDialog(false);
          setPendingAction(null);
        }}
        isLoading={isLoading}
        variant="primary"
        open={showConfirmDialog}
      />
    </div>
  );
} 