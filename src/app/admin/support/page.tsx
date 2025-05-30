'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Icon } from '@/components/ui/Icon';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { toast } from 'react-hot-toast';
import { getFirebaseServices } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, addDoc, updateDoc, doc, Timestamp, where } from 'firebase/firestore';

interface SupportTicket {
  id: string;
  title: string;
  description: string;
  status: 'new' | 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  category: string;
  createdBy: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

interface TicketTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
}

export default function SupportDashboard() {
  const router = useRouter();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    priority: 'medium' as SupportTicket['priority'],
    category: 'general'
  });
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [metrics, setMetrics] = useState({
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    resolvedTickets: 0,
    urgentTickets: 0,
    averageResponseTime: 0
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }

    if (!authLoading && !isAdmin) {
      router.push('/');
      return;
    }

    if (user && isAdmin) {
      loadTickets();
    }
  }, [user, authLoading, isAdmin, router]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const { db } = await getFirebaseServices();
      if (!db) throw new Error('Firestore instance not available');

      const ticketsSnapshot = await getDocs(
        query(collection(db, 'support_tickets'), orderBy('createdAt', 'desc'))
      );

      const ticketsData = ticketsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SupportTicket[];

      setTickets(ticketsData);

      // Calculate metrics
      const metrics = {
        totalTickets: ticketsData.length,
        openTickets: ticketsData.filter(t => t.status === 'new' || t.status === 'open').length,
        inProgressTickets: ticketsData.filter(t => t.status === 'in-progress').length,
        resolvedTickets: ticketsData.filter(t => t.status === 'resolved').length,
        urgentTickets: ticketsData.filter(t => t.priority === 'urgent').length,
        averageResponseTime: calculateAverageResponseTime(ticketsData)
      };

      setMetrics(metrics);
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast.error('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  const calculateAverageResponseTime = (tickets: SupportTicket[]) => {
    const resolvedTickets = tickets.filter(t => t.status === 'resolved' || t.status === 'closed');
    if (resolvedTickets.length === 0) return 0;

    const totalTime = resolvedTickets.reduce((acc, ticket) => {
      const created = new Date(ticket.createdAt).getTime();
      const updated = new Date(ticket.updatedAt).getTime();
      return acc + (updated - created);
    }, 0);

    return Math.round(totalTime / resolvedTickets.length / (1000 * 60 * 60)); // Convert to hours
  };

  const handleCreateTicket = async () => {
    if (!user) return;

    try {
      const { db } = await getFirebaseServices();
      if (!db) throw new Error('Firestore instance not available');

      const ticketData = {
        ...newTicket,
        status: 'new' as SupportTicket['status'],
        createdBy: user.uid,
        createdAt: Timestamp.now().toDate().toISOString(),
        updatedAt: Timestamp.now().toDate().toISOString()
      };

      await addDoc(collection(db, 'support_tickets'), ticketData);
      toast.success('Support ticket created successfully');
      setShowNewTicketForm(false);
      setNewTicket({
        title: '',
        description: '',
        priority: 'medium',
        category: 'general'
      });
      loadTickets();
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Failed to create support ticket');
    }
  };

  const handleUpdateStatus = async (ticketId: string, newStatus: SupportTicket['status']) => {
    try {
      const { db } = await getFirebaseServices();
      if (!db) throw new Error('Firestore instance not available');

      await updateDoc(doc(db, 'support_tickets', ticketId), {
        status: newStatus,
        updatedAt: Timestamp.now().toDate().toISOString()
      });

      toast.success('Ticket status updated successfully');
      loadTickets();
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast.error('Failed to update ticket status');
    }
  };

  const getStatusColor = (status: SupportTicket['status']) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: SupportTicket['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesStatus = !filterStatus || ticket.status === filterStatus;
    const matchesPriority = !filterPriority || ticket.priority === filterPriority;
    const matchesSearch = !searchTerm || 
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesPriority && matchesSearch;
  });

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-indigo-50 to-white">
        <Spinner />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'Support' }
          ]}
        />

        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="p-6 bg-white/80 backdrop-blur-sm border border-indigo-100 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Total Tickets</h3>
              <Icon name="ticket" className="w-6 h-6 text-indigo-600" />
            </div>
            <p className="text-3xl font-bold text-indigo-600">{metrics.totalTickets}</p>
          </Card>

          <Card className="p-6 bg-white/80 backdrop-blur-sm border border-indigo-100 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Open Tickets</h3>
              <Icon name="exclamation-circle" className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-blue-600">{metrics.openTickets}</p>
          </Card>

          <Card className="p-6 bg-white/80 backdrop-blur-sm border border-indigo-100 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Urgent Tickets</h3>
              <Icon name="exclamation" className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-3xl font-bold text-red-600">{metrics.urgentTickets}</p>
          </Card>

          <Card className="p-6 bg-white/80 backdrop-blur-sm border border-indigo-100 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">In Progress</h3>
              <Icon name="clock" className="w-6 h-6 text-yellow-600" />
            </div>
            <p className="text-3xl font-bold text-yellow-600">{metrics.inProgressTickets}</p>
          </Card>

          <Card className="p-6 bg-white/80 backdrop-blur-sm border border-indigo-100 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Resolved</h3>
              <Icon name="check-circle" className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-600">{metrics.resolvedTickets}</p>
          </Card>

          <Card className="p-6 bg-white/80 backdrop-blur-sm border border-indigo-100 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Avg. Response Time</h3>
              <Icon name="clock" className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-purple-600">{metrics.averageResponseTime}h</p>
          </Card>
        </div>

        <div className="mt-6">
          <Card className="bg-white/80 backdrop-blur-sm border border-indigo-100 shadow-lg">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h1 className="text-2xl font-semibold">Support Tickets</h1>
                  <p className="mt-1 text-gray-600">Manage and track support requests</p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/admin')}
                  >
                    Back to Dashboard
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => setShowNewTicketForm(true)}
                  >
                    Create Ticket
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 mb-6 md:grid-cols-3">
                <div className="md:col-span-2">
                  <Input
                    type="search"
                    placeholder="Search tickets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={filterStatus}
                    onChange={setFilterStatus}
                    className="w-full"
                    options={[
                      { value: '', label: 'All Status' },
                      { value: 'new', label: 'New' },
                      { value: 'open', label: 'Open' },
                      { value: 'in-progress', label: 'In Progress' },
                      { value: 'resolved', label: 'Resolved' },
                      { value: 'closed', label: 'Closed' }
                    ]}
                  />
                  <Select
                    value={filterPriority}
                    onChange={setFilterPriority}
                    className="w-full"
                    options={[
                      { value: '', label: 'All Priority' },
                      { value: 'urgent', label: 'Urgent' },
                      { value: 'high', label: 'High' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'low', label: 'Low' }
                    ]}
                  />
                </div>
              </div>

              {filteredTickets.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No support tickets found
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="p-4 bg-white rounded-lg border border-gray-200 hover:border-indigo-200 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-medium">{ticket.title}</h3>
                        <div className="flex space-x-2">
                          <Badge className={getStatusColor(ticket.status)}>
                            {ticket.status}
                          </Badge>
                          <Badge className={getPriorityColor(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-gray-600 mb-4">{ticket.description}</p>
                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <div>
                          Created: {new Date(ticket.createdAt).toLocaleString()}
                        </div>
                        <div className="flex space-x-2">
                          <Select
                            value={ticket.status}
                            onChange={(value) => handleUpdateStatus(ticket.id, value as SupportTicket['status'])}
                            className="text-sm"
                            options={[
                              { value: 'new', label: 'New' },
                              { value: 'open', label: 'Open' },
                              { value: 'in-progress', label: 'In Progress' },
                              { value: 'resolved', label: 'Resolved' },
                              { value: 'closed', label: 'Closed' }
                            ]}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {showNewTicketForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-lg">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Create New Support Ticket</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <Input
                      value={newTicket.title}
                      onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                      placeholder="Enter ticket title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <Textarea
                      value={newTicket.description}
                      onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                      placeholder="Enter ticket description"
                      rows={4}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <Select
                      value={newTicket.priority}
                      onChange={(value) => setNewTicket({ ...newTicket, priority: value as SupportTicket['priority'] })}
                      options={[
                        { value: 'urgent', label: 'Urgent' },
                        { value: 'high', label: 'High' },
                        { value: 'medium', label: 'Medium' },
                        { value: 'low', label: 'Low' }
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <Select
                      value={newTicket.category}
                      onChange={(value) => setNewTicket({ ...newTicket, category: value })}
                      options={[
                        { value: 'general', label: 'General' },
                        { value: 'technical', label: 'Technical' },
                        { value: 'billing', label: 'Billing' },
                        { value: 'feature', label: 'Feature Request' }
                      ]}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowNewTicketForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleCreateTicket}
                      disabled={!newTicket.title || !newTicket.description}
                    >
                      Create Ticket
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
} 