import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { getFirebaseServices } from '@/lib/firebase';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { Icon } from './Icon';
import { Spinner } from './Spinner';
import { Badge } from './Badge';
import { useToast } from './toast';

interface Memorial {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'published' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  views: number;
  likes: number;
  comments: number;
}

interface MemorialListProps {
  universityId: string;
  onUpdate: () => void;
}

export function MemorialList({ universityId, onUpdate }: MemorialListProps) {
  const [memorials, setMemorials] = useState<Memorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMemorials, setSelectedMemorials] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadMemorials();
  }, [universityId]);

  const loadMemorials = async () => {
    try {
      setLoading(true);
      setError(null);

      const { db } = await getFirebaseServices();
      if (!db) {
        throw new Error('Database is not initialized');
      }

      const memorialsRef = collection(db, 'memorials');
      const q = query(
        memorialsRef,
        where('universityId', '==', universityId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const snapshot = await getDocs(q);
      const memorialsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as Memorial[];

      setMemorials(memorialsData);
    } catch (err) {
      console.error('Error loading memorials:', err);
      setError('Failed to load memorials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleSelectMemorial = (memorialId: string) => {
    setSelectedMemorials(prev =>
      prev.includes(memorialId)
        ? prev.filter(id => id !== memorialId)
        : [...prev, memorialId]
    );
  };

  const handleSelectAll = () => {
    setSelectedMemorials(prev =>
      prev.length === filteredMemorials.length
        ? []
        : filteredMemorials.map(memorial => memorial.id)
    );
  };

  const handleStatusChange = async (memorialId: string, newStatus: Memorial['status']) => {
    try {
      const { db } = await getFirebaseServices();
      if (!db) {
        throw new Error('Database is not initialized');
      }

      const memorialRef = doc(db, 'memorials', memorialId);
      await updateDoc(memorialRef, {
        status: newStatus,
        updatedAt: new Date()
      });

      toast({
        title: 'Status updated',
        description: 'Memorial status has been updated successfully.',
        variant: 'success'
      });

      await loadMemorials();
    } catch (err) {
      console.error('Error updating memorial status:', err);
      toast({
        title: 'Error',
        description: 'Failed to update memorial status. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleBulkStatusChange = async (newStatus: Memorial['status']) => {
    try {
      const { db } = await getFirebaseServices();
      if (!db) {
        throw new Error('Database is not initialized');
      }

      const batch = writeBatch(db);
      selectedMemorials.forEach(memorialId => {
        const memorialRef = doc(db, 'memorials', memorialId);
        batch.update(memorialRef, {
          status: newStatus,
          updatedAt: new Date()
        });
      });

      await batch.commit();

      toast({
        title: 'Status updated',
        description: 'Selected memorials have been updated successfully.',
        variant: 'success'
      });

      await loadMemorials();
      setSelectedMemorials([]);
    } catch (err) {
      console.error('Error updating memorials:', err);
      toast({
        title: 'Error',
        description: 'Failed to update memorials. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const filteredMemorials = memorials.filter(memorial =>
    memorial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    memorial.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={loadMemorials}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-sm">
          <Input
            type="search"
            placeholder="Search memorials..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full"
          />
        </div>

        {selectedMemorials.length > 0 && (
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              onClick={() => handleBulkStatusChange('published')}
            >
              <Icon name="check" className="w-4 h-4 mr-2" />
              Publish Selected
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleBulkStatusChange('archived')}
            >
              <Icon name="archive" className="w-4 h-4 mr-2" />
              Archive Selected
            </Button>
          </div>
        )}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedMemorials.length === filteredMemorials.length}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stats
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredMemorials.map(memorial => (
                <tr key={memorial.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedMemorials.includes(memorial.id)}
                      onChange={() => handleSelectMemorial(memorial.id)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {memorial.title}
                    </div>
                    <div className="text-sm text-gray-500">
                      {memorial.description.substring(0, 100)}...
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge
                      variant={
                        memorial.status === 'published'
                          ? 'success'
                          : memorial.status === 'draft'
                          ? 'secondary'
                          : 'destructive'
                      }
                    >
                      {memorial.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(memorial.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <Icon name="eye" className="w-4 h-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-500">
                          {memorial.views}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Icon name="heart" className="w-4 h-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-500">
                          {memorial.likes}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Icon name="message" className="w-4 h-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-500">
                          {memorial.comments}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {memorial.status === 'draft' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStatusChange(memorial.id, 'published')}
                        >
                          <Icon name="check" className="w-4 h-4" />
                        </Button>
                      )}
                      {memorial.status === 'published' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStatusChange(memorial.id, 'archived')}
                        >
                          <Icon name="archive" className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {/* Implement edit action */}}
                      >
                        <Icon name="edit" className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
} 