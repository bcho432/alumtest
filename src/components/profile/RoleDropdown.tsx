import { UserRole } from '@/types';

interface RoleDropdownProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

const ALLOWED_ROLES = ['admin', 'editor', 'contributor'] as const;
type AllowedRole = typeof ALLOWED_ROLES[number];

export default function RoleDropdown({ currentRole, onRoleChange }: RoleDropdownProps) {
  const validateRole = (role: string): role is AllowedRole => {
    return ALLOWED_ROLES.includes(role as AllowedRole);
  };

  return (
    <select
      value={currentRole}
      onChange={(e) => {
        const newRole = e.target.value;
        if (validateRole(newRole)) {
          onRoleChange(newRole);
        }
      }}
      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
    >
      {ALLOWED_ROLES.map((role) => (
        <option key={role} value={role}>
          {role.charAt(0).toUpperCase() + role.slice(1)}
        </option>
      ))}
    </select>
  );
} 