import { useUserRoles } from '@/hooks/useUserRoles';

export const AdminEntryCard = () => {
  const { isAdmin, isLoading } = useUserRoles();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Admin Access</h2>
      <p className="text-gray-600 mb-4">
        You have administrative access to the platform.
      </p>
      <a
        href="/admin"
        className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Go to Admin Dashboard
      </a>
    </div>
  );
}; 