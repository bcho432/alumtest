import { useUserRoles } from '@/hooks/useUserRoles';

export const UserHomePage = () => {
  const { isAdmin, isLoading, error } = useUserRoles();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
              <h1 className="text-3xl font-bold mb-8">Welcome to Storiats</h1>
      
      {isAdmin ? (
        <div className="bg-blue-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Admin Dashboard</h2>
          <p className="mb-4">You have administrative access to the platform.</p>
          <a
            href="/admin"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go to Admin Dashboard
          </a>
        </div>
      ) : (
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">User Dashboard</h2>
          <p className="mb-4">Welcome to your personal dashboard.</p>
          <a
            href="/dashboard"
            className="inline-block bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Go to Dashboard
          </a>
        </div>
      )}
    </div>
  );
}; 