import { useState } from 'react';
import { universityPermissionsService } from '@/services/universityPermissions';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/Dialog';
import { UserData } from '@/types/user';
import { Badge } from '@/components/ui/Badge';
import { AllowedRole, ALLOWED_ROLES } from '@/types/permission';

interface PermissionRowProps {
  user: UserData;
  role: AllowedRole;
  orgId: string;
  onRoleRemoved: () => void;
  isAdmin: boolean;
}

export function PermissionRow({ user, role, orgId, onRoleRemoved, isAdmin }: PermissionRowProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRemoveRole = async () => {
    if (!isAdmin) {
      toast.error('You do not have permission to remove roles');
      return;
    }

    setLoading(true);
    try {
      await universityPermissionsService.removeRole(orgId, user.uid);
      toast.success('Role removed successfully');
      onRoleRemoved();
    } catch (error) {
      console.error('Error removing role:', error);
      toast.error('Failed to remove role');
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  const validateRole = (newRole: string): newRole is AllowedRole => {
    return ALLOWED_ROLES.includes(newRole as AllowedRole);
  };

  const handleRoleChange = async (newRole: string) => {
    if (!isAdmin) {
      toast.error('You do not have permission to change roles');
      return;
    }

    if (!validateRole(newRole)) {
      toast.error('Invalid role selected');
      return;
    }

    setLoading(true);
    try {
      await universityPermissionsService.grantRole(orgId, user.uid, newRole);
      toast.success('Role updated successfully');
      onRoleRemoved(); // Refresh the list
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border-b last:border-b-0">
      <div className="flex items-center space-x-4">
        <div>
          <p className="font-medium">{user.displayName || 'Unknown User'}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
        <Badge variant={role === 'admin' ? 'destructive' : role === 'editor' ? 'default' : 'secondary'}>
          {role.charAt(0).toUpperCase() + role.slice(1)}
        </Badge>
      </div>
      {isAdmin && (
        <div className="flex items-center space-x-2">
          <select
            value={role}
            onChange={(e) => handleRoleChange(e.target.value)}
            disabled={loading}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            {ALLOWED_ROLES.map((r) => (
              <option key={r} value={r}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </option>
            ))}
          </select>
          <Button
            variant="secondary"
            className="bg-red-600 hover:bg-red-700 text-white"
            size="sm"
            onClick={() => setShowDeleteModal(true)}
            disabled={loading}
          >
            Remove
          </Button>
        </div>
      )}

      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Role</DialogTitle>
            <DialogClose>Cancel</DialogClose>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={handleRemoveRole}
              disabled={loading}
            >
              {loading ? 'Removing...' : 'Remove'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 