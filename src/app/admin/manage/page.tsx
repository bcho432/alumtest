'use client';

import { useState } from 'react';
import { useStoriatsAdmins } from '@/hooks/useStoriatsAdmins';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/use-toast';
import { Spinner } from '@/components/ui/Spinner';

export default function AdminManagementPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const { settings, loading, addAdmin, removeAdmin } = useStoriatsAdmins();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleAddAdmin = async () => {
    if (!user?.email) {
      toast('You must be logged in to add admins', 'error');
      return;
    }
    try {
      await addAdmin(email, name, user.email);
      setEmail('');
      setName('');
    } catch (error) {
      console.error('Error adding admin:', error);
    }
  };

  const handleRemoveAdmin = async (email: string) => {
    if (!user?.email) {
      toast('You must be logged in to remove admins', 'error');
      return;
    }
    try {
      await removeAdmin(email, user.email);
    } catch (error) {
      console.error('Error removing admin:', error);
      toast('Failed to remove admin', 'error');
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-8">Storiats Admin Management</h1>
      
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Add New Admin</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter admin email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter admin name"
            />
          </div>
          <Button onClick={handleAddAdmin}>Add Admin</Button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Current Admins</h2>
        {loading ? (
          <div className="flex justify-center p-4">
            <Spinner className="w-6 h-6" />
          </div>
        ) : (
          <div className="space-y-4">
            {settings?.admin_emails.map((adminEmail) => (
              <div key={adminEmail} className="flex items-center justify-between p-4 border rounded">
                <div>
                  <div className="font-medium">{adminEmail.split('@')[0]}</div>
                  <div className="text-sm text-gray-500">{adminEmail}</div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => handleRemoveAdmin(adminEmail)}
                >
                  Remove
                </Button>
              </div>
            ))}
            {(!settings?.admin_emails || settings.admin_emails.length === 0) && (
              <div className="text-gray-500">No admins found</div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
} 