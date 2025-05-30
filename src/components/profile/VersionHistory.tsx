import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface Version {
  id: string;
  version: number;
  status: 'draft' | 'pending' | 'published' | 'archived';
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: Date;
  comments?: string;
}

interface VersionHistoryProps {
  profileId: string;
  orgId: string;
  onVersionSelect?: (version: Version) => void;
  onVersionRestore?: (version: Version) => Promise<void>;
  className?: string;
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({
  profileId,
  orgId,
  onVersionSelect,
  onVersionRestore,
  className
}) => {
  const { user } = useAuth();
  const { isAdmin, isEditor } = usePermissions();
  const [versions, setVersions] = useState<Version[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [hasEditorAccess, setHasEditorAccess] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    const checkPermissions = async () => {
      if (!user) {
        setHasAdminAccess(false);
        setHasEditorAccess(false);
        setIsLoading(false);
        return;
      }

      try {
        const [adminAccess, editorAccess] = await Promise.all([
          isAdmin(orgId),
          isEditor(orgId, profileId)
        ]);
        setHasAdminAccess(adminAccess);
        setHasEditorAccess(editorAccess);
      } catch (error) {
        console.error('Error checking permissions:', error);
        toast.error('Failed to check permissions');
      } finally {
        setIsLoading(false);
      }
    };

    checkPermissions();
  }, [user, orgId, profileId, isAdmin, isEditor]);

  useEffect(() => {
    const fetchVersions = async () => {
      if (!profileId) return;

      setIsLoading(true);
      try {
        // TODO: Implement version fetching from your backend
        // This is a mock implementation
        const mockVersions: Version[] = [
          {
            id: '1',
            version: 1,
            status: 'published',
            changes: [
              {
                field: 'name',
                oldValue: 'John Doe',
                newValue: 'John Smith'
              }
            ],
            createdBy: {
              id: 'user1',
              name: 'Admin User',
              email: 'admin@example.com'
            },
            createdAt: new Date('2024-01-01'),
            comments: 'Initial version'
          }
        ];
        setVersions(mockVersions);
      } catch (error) {
        console.error('Error fetching versions:', error);
        toast.error('Failed to fetch version history');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVersions();
  }, [profileId]);

  const handleVersionSelect = (version: Version) => {
    setSelectedVersion(version);
    onVersionSelect?.(version);
  };

  const handleVersionRestore = async (version: Version) => {
    if (!hasAdminAccess) {
      toast.error('You do not have permission to restore versions');
      return;
    }

    setIsRestoring(true);
    try {
      await onVersionRestore?.(version);
      toast.success('Version restored successfully');
    } catch (error) {
      console.error('Error restoring version:', error);
      toast.error('Failed to restore version');
    } finally {
      setIsRestoring(false);
    }
  };

  const getStatusBadge = (status: Version['status']) => {
    const variants = {
      draft: 'secondary',
      pending: 'secondary',
      published: 'success',
      archived: 'destructive'
    } as const;

    return (
      <Badge variant={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center p-4', className)}>
        <Icon name="loader" className="animate-spin h-6 w-6 text-gray-400" />
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className={cn('text-center p-4 text-gray-500', className)}>
        No version history available
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Version History</h3>
        {hasAdminAccess && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleVersionRestore(versions[0])}
            disabled={isRestoring}
          >
            {isRestoring ? (
              <>
                <Icon name="loader" className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Restoring...
              </>
            ) : (
              <>
                <Icon name="history" className="mr-2 h-4 w-4" />
                Restore Latest
              </>
            )}
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {versions.map((version) => (
          <motion.div
            key={version.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              'p-4 rounded-lg border transition-colors',
              selectedVersion?.id === version.id
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 hover:border-gray-300'
            )}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Version {version.version}</span>
                  {getStatusBadge(version.status)}
                </div>
                <p className="text-sm text-gray-500">
                  {formatDistanceToNow(version.createdAt, { addSuffix: true })} by{' '}
                  {version.createdBy.name}
                </p>
                {version.comments && (
                  <p className="text-sm text-gray-600">{version.comments}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleVersionSelect(version)}
                >
                  <Icon name="eye" className="mr-2 h-4 w-4" />
                  View
                </Button>
                {hasAdminAccess && version.version !== versions[0].version && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleVersionRestore(version)}
                    disabled={isRestoring}
                  >
                    {isRestoring ? (
                      <>
                        <Icon name="loader" className="animate-spin -ml-1 mr-2 h-4 w-4" />
                        Restoring...
                      </>
                    ) : (
                      <>
                        <Icon name="history" className="mr-2 h-4 w-4" />
                        Restore
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            <AnimatePresence>
              {selectedVersion?.id === version.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 overflow-hidden"
                >
                  <div className="space-y-2">
                    {version.changes.map((change, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 text-sm"
                      >
                        <span className="font-medium text-gray-700">
                          {change.field}:
                        </span>
                        <div className="flex-1">
                          <div className="text-red-500 line-through">
                            {JSON.stringify(change.oldValue)}
                          </div>
                          <div className="text-green-500">
                            {JSON.stringify(change.newValue)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}; 