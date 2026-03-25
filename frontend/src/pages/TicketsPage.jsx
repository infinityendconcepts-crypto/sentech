import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ticketsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Ticket,
  Clock,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  Send,
  Filter,
  ArrowUpRight,
  User,
} from 'lucide-react';

const TicketsPage = () => {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [newTicketDialog, setNewTicketDialog] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketDetailDialog, setTicketDetailDialog] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    category: 'training_application',
    priority: 'medium',
  });

  const isAdminUser = isAdmin || isSuperAdmin || user?.roles?.includes('support');

  const categories = [
    { value: 'training_application', label: 'Training Application' },
    { value: 'bursary_application', label: 'Bursary Application' },
    { value: 'hr_query', label: 'HR Query' },
    { value: 'technical_support', label: 'Technical Support' },
  ];

  // Escalation categories (for heads to re-route tickets)
  const escalationCategories = [
    { value: 'hr_query', label: 'Escalate to HR Query (Admin)' },
    { value: 'technical_support', label: 'Escalate to Technical Support (Admin)' },
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'bg-slate-100 text-slate-700' },
    { value: 'medium', label: 'Medium', color: 'bg-amber-100 text-amber-700' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-700' },
    { value: 'urgent', label: 'Urgent', color: 'bg-rose-100 text-rose-700' },
  ];

  const statuses = [
    { value: 'open', label: 'Open', color: 'bg-blue-100 text-blue-700' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-amber-100 text-amber-700' },
    { value: 'waiting', label: 'Waiting', color: 'bg-purple-100 text-purple-700' },
    { value: 'resolved', label: 'Resolved', color: 'bg-emerald-100 text-emerald-700' },
    { value: 'closed', label: 'Closed', color: 'bg-slate-100 text-slate-700' },
  ];

  useEffect(() => {
    fetchTickets();
    fetchStats();
  }, [statusFilter, priorityFilter]);

  const fetchTickets = async () => {
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;
      const response = await ticketsAPI.getAll(params);
      setTickets(response.data);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await ticketsAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchComments = async (ticketId) => {
    try {
      const response = await ticketsAPI.getComments(ticketId);
      setComments(response.data);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const handleCreateTicket = async () => {
    try {
      await ticketsAPI.create(newTicket);
      toast.success('Ticket created successfully');
      setNewTicketDialog(false);
      setNewTicket({ title: '', description: '', category: 'training_application', priority: 'medium' });
      fetchTickets();
      fetchStats();
    } catch (error) {
      toast.error('Failed to create ticket');
    }
  };

  const handleUpdateStatus = async (ticketId, newStatus) => {
    try {
      await ticketsAPI.update(ticketId, { status: newStatus });
      toast.success('Ticket updated');
      fetchTickets();
      fetchStats();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
    } catch (error) {
      toast.error('Failed to update ticket');
    }
  };

  const handleEscalateTicket = async (ticketId, newCategory) => {
    try {
      await ticketsAPI.update(ticketId, { category: newCategory });
      toast.success(`Ticket escalated to ${categories.find(c => c.value === newCategory)?.label}`);
      fetchTickets();
      fetchStats();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, category: newCategory, routed_to: 'admins' });
        fetchComments(ticketId);
      }
    } catch (error) {
      toast.error('Failed to escalate ticket');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedTicket) return;
    try {
      await ticketsAPI.addComment(selectedTicket.id, {
        ticket_id: selectedTicket.id,
        content: newComment,
        is_internal: false,
      });
      toast.success('Comment added');
      setNewComment('');
      fetchComments(selectedTicket.id);
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const openTicketDetail = (ticket) => {
    setSelectedTicket(ticket);
    fetchComments(ticket.id);
    setTicketDetailDialog(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPriorityColor = (priority) => {
    return priorities.find(p => p.value === priority)?.color || 'bg-slate-100 text-slate-700';
  };

  const getStatusColor = (status) => {
    return statuses.find(s => s.value === status)?.color || 'bg-slate-100 text-slate-700';
  };

  const filteredTickets = tickets.filter(ticket =>
    ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="tickets-page">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-heading font-bold tracking-tight text-slate-900">Tickets</h2>
          <p className="text-slate-600 mt-1">Submit and track support tickets</p>
        </div>
        <Dialog open={newTicketDialog} onOpenChange={setNewTicketDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="create-ticket-btn">
              <Plus className="w-4 h-4" />
              New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Ticket</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={newTicket.title}
                  onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                  placeholder="Brief summary of the issue"
                  data-testid="input-ticket-title"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={newTicket.category}
                    onValueChange={(value) => setNewTicket({ ...newTicket, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={newTicket.priority}
                    onValueChange={(value) => setNewTicket({ ...newTicket, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map((p) => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  placeholder="Describe your issue in detail..."
                  rows={5}
                  data-testid="input-ticket-description"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewTicketDialog(false)}>Cancel</Button>
              <Button onClick={handleCreateTicket} data-testid="submit-ticket-btn">Create Ticket</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Tickets</p>
                <p className="text-2xl font-bold text-slate-900">{stats?.total || 0}</p>
              </div>
              <div className="p-3 bg-slate-100 rounded-full">
                <Ticket className="w-6 h-6 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Open</p>
                <p className="text-2xl font-bold text-blue-600">{stats?.open || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">In Progress</p>
                <p className="text-2xl font-bold text-amber-600">{stats?.in_progress || 0}</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Resolved</p>
                <p className="text-2xl font-bold text-emerald-600">{stats?.resolved || 0}</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white border-slate-200">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="search-tickets-input"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {statuses.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                {priorities.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => { setStatusFilter('all'); setPriorityFilter('all'); setSearchTerm(''); }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <div className="space-y-4">
        {filteredTickets.length === 0 ? (
          <Card className="bg-white border-slate-200">
            <CardContent className="p-12 text-center">
              <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-heading font-semibold text-slate-900 mb-2">No tickets found</h3>
              <p className="text-slate-600">Create a new ticket to get help</p>
            </CardContent>
          </Card>
        ) : (
          filteredTickets.map((ticket) => (
            <Card 
              key={ticket.id} 
              className="bg-white border-slate-200 hover:shadow-md transition-all duration-200 cursor-pointer"
              onClick={() => openTicketDetail(ticket)}
              data-testid={`ticket-card-${ticket.id}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-slate-900">{ticket.title}</h3>
                      <Badge className={getPriorityColor(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                      <Badge className={getStatusColor(ticket.status)}>
                        {ticket.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2 mb-3">{ticket.description}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>#{ticket.id.slice(0, 8)}</span>
                      <Badge variant="outline" className="text-xs">
                        {categories.find(c => c.value === ticket.category)?.label || ticket.category}
                      </Badge>
                      {ticket.assigned_to_name && (
                        <span className="flex items-center gap-1 text-blue-600">
                          <User className="w-3 h-3" />
                          Assigned to: {ticket.assigned_to_name}
                        </span>
                      )}
                      {ticket.routed_to === 'admins' && !ticket.assigned_to_name && (
                        <span className="text-indigo-600 font-medium">Routed to Admins</span>
                      )}
                      {ticket.escalated_from && (
                        <span className="flex items-center gap-1 text-amber-600">
                          <ArrowUpRight className="w-3 h-3" />
                          Escalated
                        </span>
                      )}
                      <span>Created: {formatDate(ticket.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {/* Escalation for assigned heads (non-admin, assigned_to = current user) */}
                    {ticket.assigned_to === user?.id && !isAdminUser &&
                      (ticket.category === 'training_application' || ticket.category === 'bursary_application') && (
                      <Select onValueChange={(value) => handleEscalateTicket(ticket.id, value)}>
                        <SelectTrigger className="w-44 text-xs h-8" data-testid={`escalate-ticket-${ticket.id}`}>
                          <SelectValue placeholder="Escalate..." />
                        </SelectTrigger>
                        <SelectContent>
                          {escalationCategories.map((c) => (
                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {isAdminUser && (
                      <Select
                        value={ticket.status}
                        onValueChange={(value) => handleUpdateStatus(ticket.id, value)}
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statuses.map((s) => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Ticket Detail Dialog */}
      <Dialog open={ticketDetailDialog} onOpenChange={setTicketDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedTicket && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  {selectedTicket.title}
                  <Badge className={getStatusColor(selectedTicket.status)}>
                    {selectedTicket.status.replace('_', ' ')}
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge className={getPriorityColor(selectedTicket.priority)}>
                    {selectedTicket.priority}
                  </Badge>
                  <Badge variant="outline">
                    {categories.find(c => c.value === selectedTicket.category)?.label || selectedTicket.category}
                  </Badge>
                  {selectedTicket.assigned_to_name && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {selectedTicket.assigned_to_name}
                    </Badge>
                  )}
                  {selectedTicket.routed_to === 'admins' && !selectedTicket.assigned_to_name && (
                    <Badge className="bg-indigo-100 text-indigo-700">Routed to Admins</Badge>
                  )}
                  {selectedTicket.escalated_from && (
                    <Badge className="bg-amber-100 text-amber-700 flex items-center gap-1">
                      <ArrowUpRight className="w-3 h-3" />
                      Escalated from {categories.find(c => c.value === selectedTicket.escalated_from)?.label || selectedTicket.escalated_from}
                    </Badge>
                  )}
                </div>

                {/* Escalation controls for assigned head */}
                {selectedTicket.assigned_to === user?.id && !isAdminUser &&
                  (selectedTicket.category === 'training_application' || selectedTicket.category === 'bursary_application') && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-sm text-amber-800 mb-2 font-medium flex items-center gap-1">
                      <ArrowUpRight className="w-4 h-4" />
                      Escalate this ticket
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEscalateTicket(selectedTicket.id, 'hr_query')}
                        data-testid="escalate-to-hr"
                      >
                        HR Query
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEscalateTicket(selectedTicket.id, 'technical_support')}
                        data-testid="escalate-to-tech"
                      >
                        Technical Support
                      </Button>
                    </div>
                  </div>
                )}

                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedTicket.description}</p>
                </div>
                <div className="text-xs text-slate-500">
                  Created: {formatDate(selectedTicket.created_at)}
                </div>

                {/* Comments */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Comments ({comments.length})
                  </h4>
                  <div className="space-y-3 max-h-48 overflow-y-auto mb-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3 bg-slate-50 rounded-lg p-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback>{comment.user?.full_name?.charAt(0) || '?'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{comment.user?.full_name}</span>
                            <span className="text-xs text-slate-500">{formatDate(comment.created_at)}</span>
                          </div>
                          <p className="text-sm text-slate-700">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                    />
                    <Button onClick={handleAddComment}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TicketsPage;
