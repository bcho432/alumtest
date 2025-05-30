'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { useToast } from '@/components/ui/toast';
import { Chart } from '@/components/ui/Chart';

interface Organization {
  id: string;
  name: string;
  description: string;
  website: string;
  location: string;
  industry: string;
  size: string;
  members: Record<string, string>;
  createdAt: Date | { toDate: () => Date };
  updatedAt: Date | { toDate: () => Date };
  activity?: {
    date: string;
    count: number;
  }[];
}

export default function OrganizationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      router.push('/');
      return;
    }

    const fetchOrganization = async () => {
      try {
        const db = await getDb();
        if (!db) {
          toast({
            title: 'Error',
            description: 'Firestore is not initialized',
            variant: 'destructive'
          });
          setLoading(false);
          return;
        }

        const orgDoc = await getDoc(doc(db, 'organizations', params.id));
        if (orgDoc.exists()) {
          const orgData = { id: orgDoc.id, ...orgDoc.data() } as Organization;
          setOrganization(orgData);
        } else {
          router.push('/admin/organizations');
        }
      } catch (error) {
        console.error('Error fetching organization:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch organization data',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrganization();
  }, [isAdmin, router, params.id, toast]);

  useKeyboardNavigation({
    '/': () => router.push('/'),
    'e': () => router.push(`/admin/organizations/${params.id}/edit`),
    'm': () => router.push(`/admin/organizations/${params.id}/members`),
    'Escape': () => router.push('/admin/organizations')
  });

  const memberRoles = organization ? Object.values(organization.members).reduce((acc, role) => {
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) : {};

  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!organization) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs
        items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Organizations', href: '/admin/organizations' },
          { label: organization.name }
        ]}
      />

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card>
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-2xl font-semibold">{organization.name}</h1>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="secondary">{organization.industry}</Badge>
                  <Badge variant="outline">{organization.size} employees</Badge>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/admin/organizations/${params.id}/edit`)}
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/admin/organizations/${params.id}/members`)}
                >
                  Members
                </Button>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h2 className="text-sm font-medium text-gray-700 mb-2">Description</h2>
                <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">{organization.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h2 className="text-sm font-medium text-gray-700 mb-2">Location</h2>
                  <p className="text-gray-900">{organization.location}</p>
                </div>
                <div>
                  <h2 className="text-sm font-medium text-gray-700 mb-2">Website</h2>
                  <a
                    href={organization.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 flex items-center"
                  >
                    {organization.website}
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Organization Details</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Member Distribution</h3>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {Object.entries(memberRoles).map(([role, count]) => (
                      <div key={role} className="bg-gray-50 p-3 rounded-lg text-center">
                        <div className="text-2xl font-semibold text-primary-600">{count}</div>
                        <div className="text-sm text-gray-600 capitalize">{role}s</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700">Created</h3>
                  <p className="mt-1 text-gray-900">
                    {organization.createdAt instanceof Date
                      ? organization.createdAt.toLocaleDateString()
                      : organization.createdAt.toDate().toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700">Last Updated</h3>
                  <p className="mt-1 text-gray-900">
                    {organization.updatedAt instanceof Date
                      ? organization.updatedAt.toLocaleDateString()
                      : organization.updatedAt.toDate().toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {organization.activity && (
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Activity Overview</h2>
                <Chart
                  type="line"
                  data={{
                    labels: organization.activity.map(a => a.date),
                    datasets: [{
                      label: 'Activity',
                      data: organization.activity.map(a => a.count),
                      borderColor: 'rgb(59, 130, 246)',
                      tension: 0.4
                    }]
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        display: false
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          stepSize: 1
                        }
                      }
                    }
                  }}
                />
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 