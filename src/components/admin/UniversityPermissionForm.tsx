import { useState } from 'react';
import { universityPermissionsService } from '@/services/universityPermissions';
import { toast } from 'react-hot-toast';

interface GrantRoleResponse {
  success: boolean;
  userId: string;
  isUpdate: boolean;
}

const ALLOWED_ROLES = ['admin', 'editor', 'contributor'] as const;
type AllowedRole = typeof ALLOWED_ROLES[number];

export function UniversityPermissionForm({ orgId, onRoleGranted }: { orgId: string; onRoleGranted: () => void }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AllowedRole>('editor');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (email: string): boolean => {
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  };

  const validateRole = (role: string): role is AllowedRole => {
    return ALLOWED_ROLES.includes(role as AllowedRole);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate email
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    // Validate role
    if (!validateRole(role)) {
      setError('Invalid role selected.');
      return;
    }

    setLoading(true);
    try {
      const result = await universityPermissionsService.grantRoleByEmail(orgId, email, role, '') as GrantRoleResponse;
      if (result.isUpdate) {
        toast.success('Role updated successfully');
      } else {
        toast.success('Role granted successfully');
      }
      setEmail('');
      setRole('editor');
      onRoleGranted();
    } catch (err: any) {
      if (err.message?.includes('already has this role')) {
        setError('This user already has this role.');
      } else if (err.message?.includes('not found')) {
        setError('User not found. Please check the email address.');
      } else if (err.message?.includes('Not a university admin')) {
        setError('You do not have permission to grant roles.');
      } else if (err.message?.includes('Invalid role')) {
        setError('Invalid role selected. Please choose a valid role.');
      } else {
        setError('Failed to grant role. Please try again.');
      }
      console.error('Error granting role:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">User Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
          placeholder="user@example.com"
        />
      </div>
      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
        <select
          id="role"
          value={role}
          onChange={e => {
            const newRole = e.target.value;
            if (validateRole(newRole)) {
              setRole(newRole);
            }
          }}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          {ALLOWED_ROLES.map(role => (
            <option key={role} value={role}>
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Processing...' : 'Grant Role'}
      </button>
    </form>
  );
} 