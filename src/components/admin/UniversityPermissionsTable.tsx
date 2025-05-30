import { useEffect, useState } from 'react';
import { universityPermissionsService } from '@/services/universityPermissions';
import { analytics } from '@/services/analytics';
import { PermissionRow } from './PermissionRow';
import { Button } from '@/components/ui/Button';
import { UserData } from '@/types/user';
import { Permission } from '@/types/permission';
import { useUserRoles } from '@/hooks/useUserRoles';

export function UniversityPermissionsTable({ orgId }: { orgId: string }) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(false);
  const pageSize = 25;

  const { universityAdminFor, isLoading: isRolesLoading } = useUserRoles();
  const isAdmin = universityAdminFor.some(u => u.id === orgId);

  const fetchPage = async () => {
    setLoading(true);
    const docs = await universityPermissionsService.listPermissions(orgId, pageSize, lastDoc);
    const perms = await Promise.all(docs.map(async (docSnap: any) => {
      const userId = docSnap.id;
      const userData = await universityPermissionsService.getUser(userId);
      return {
        id: userId,
        ...docSnap.data(),
        user: {
          uid: userId,
          displayName: userData?.displayName,
          email: userData?.email,
        },
      };
    }));
    setPermissions(prev => [...prev, ...perms]);
    setLastDoc(docs[docs.length - 1]);
    setHasMore(docs.length === pageSize);
    setLoading(false);
  };

  const handleRoleRemoved = () => {
    // Refresh the permissions list
    setPermissions([]);
    setLastDoc(null);
    fetchPage();
  };

  useEffect(() => {
    setPermissions([]);
    setLastDoc(null);
    fetchPage();
    analytics.trackEvent({
      name: 'permissions_table_viewed',
      properties: { orgId },
    });
    // eslint-disable-next-line
  }, [orgId]);

  if (loading && permissions.length === 0) return <div>Loading...</div>;
  if (!loading && permissions.length === 0) return <div>No users have been granted roles yet.</div>;
  if (isRolesLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow">
        {permissions.map(({ id, role, user }: { id: string; role: string; user: any }) => (
          <PermissionRow
            key={id}
            user={{
              uid: (user?.uid ?? user?.id ?? id ?? '') as string,
              displayName: user?.displayName ?? '',
              email: user?.email ?? '',
            }}
            role={role as import('@/types/permission').AllowedRole}
            orgId={orgId}
            onRoleRemoved={handleRoleRemoved}
            isAdmin={isAdmin}
          />
        ))}
      </div>
      {isAdmin && hasMore && (
        <div className="flex justify-center">
          <Button
            variant="secondary"
            onClick={fetchPage}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load more'}
          </Button>
        </div>
      )}
    </div>
  );
} 