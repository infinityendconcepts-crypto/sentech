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
import { meetingsAPI, usersAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Calendar,
  Clock,
  Video,
  Users,
  Link as LinkIcon,
  Edit,
  Trash2,
  ExternalLink,
  Copy,
} from 'lucide-react';

const MeetingsPage = () => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [newMeetingDialog, setNewMeetingDialog] = useState(false);
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    description: '',
    meeting_type: 'general',
    meeting_link: '',
    meeting_id: '',
    meeting_password: '',
    start_time: '',
    end_time: '',
    attendee_ids: [],
  });

  useEffect(() => {
    fetchMeetings();
    fetchUsers();
  }, [statusFilter, typeFilter]);

  const fetchMeetings = async () => {
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.meeting_type = typeFilter;
      const response = await meetingsAPI.getAll(params);
      setMeetings(response.data);
    } catch (error) {
      console.error('Failed to fetch meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await usersAPI.getAll();
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleCreateMeeting = async () => {
    try {
      await meetingsAPI.create(newMeeting);
      toast.success('Meeting scheduled successfully');
      setNewMeetingDialog(false);
      setNewMeeting({
        title: '',
        description: '',
        meeting_type: 'general',
        meeting_link: '',
        meeting_id: '',
        meeting_password: '',
        start_time: '',
        end_time: '',
        attendee_ids: [],
      });
      fetchMeetings();
    } catch (error) {
      toast.error('Failed to schedule meeting');
    }
  };

  const handleDeleteMeeting = async (meetingId) => {
    if (!window.confirm('Are you sure you want to delete this meeting?')) return;
    try {
      await meetingsAPI.delete(meetingId);
      toast.success('Meeting deleted');
      fetchMeetings();
    } catch (error) {
      toast.error('Failed to delete meeting');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const filteredMeetings = meetings.filter(meeting =>
    meeting.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-700';
      case 'in_progress': return 'bg-green-100 text-green-700';
      case 'completed': return 'bg-slate-100 text-slate-700';
      case 'cancelled': return 'bg-rose-100 text-rose-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'zoom': return <Video className="w-4 h-4 text-blue-600" />;
      case 'teams': return <Video className="w-4 h-4 text-purple-600" />;
      default: return <Calendar className="w-4 h-4 text-slate-600" />;
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('en-ZA', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const upcomingMeetings = filteredMeetings.filter(m => 
    new Date(m.start_time) > new Date() && m.status === 'scheduled'
  ).sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

  const pastMeetings = filteredMeetings.filter(m => 
    new Date(m.start_time) <= new Date() || m.status !== 'scheduled'
  ).sort((a, b) => new Date(b.start_time) - new Date(a.start_time));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="meetings-page">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-heading font-bold tracking-tight text-slate-900">Meetings</h2>
          <p className="text-slate-600 mt-1">Schedule and manage your meetings</p>
        </div>
        <Dialog open={newMeetingDialog} onOpenChange={setNewMeetingDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="schedule-meeting-btn">
              <Plus className="w-4 h-4" />
              Schedule Meeting
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Schedule New Meeting</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="space-y-2">
                <Label>Meeting Title</Label>
                <Input
                  value={newMeeting.title}
                  onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                  placeholder="e.g., Weekly Team Sync"
                  data-testid="input-meeting-title"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newMeeting.description}
                  onChange={(e) => setNewMeeting({ ...newMeeting, description: e.target.value })}
                  placeholder="Meeting agenda..."
                />
              </div>
              <div className="space-y-2">
                <Label>Meeting Type</Label>
                <Select
                  value={newMeeting.meeting_type}
                  onValueChange={(value) => setNewMeeting({ ...newMeeting, meeting_type: value })}
                >
                  <SelectTrigger data-testid="select-meeting-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Meeting</SelectItem>
                    <SelectItem value="zoom">Zoom Meeting</SelectItem>
                    <SelectItem value="teams">Microsoft Teams</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(newMeeting.meeting_type === 'zoom' || newMeeting.meeting_type === 'teams') && (
                <>
                  <div className="space-y-2">
                    <Label>Meeting Link</Label>
                    <Input
                      value={newMeeting.meeting_link}
                      onChange={(e) => setNewMeeting({ ...newMeeting, meeting_link: e.target.value })}
                      placeholder="https://zoom.us/j/..."
                      data-testid="input-meeting-link"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Meeting ID</Label>
                      <Input
                        value={newMeeting.meeting_id}
                        onChange={(e) => setNewMeeting({ ...newMeeting, meeting_id: e.target.value })}
                        placeholder="123 456 7890"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <Input
                        value={newMeeting.meeting_password}
                        onChange={(e) => setNewMeeting({ ...newMeeting, meeting_password: e.target.value })}
                        placeholder="Meeting password"
                      />
                    </div>
                  </div>
                </>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input
                    type="datetime-local"
                    value={newMeeting.start_time}
                    onChange={(e) => setNewMeeting({ ...newMeeting, start_time: e.target.value })}
                    data-testid="input-start-time"
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input
                    type="datetime-local"
                    value={newMeeting.end_time}
                    onChange={(e) => setNewMeeting({ ...newMeeting, end_time: e.target.value })}
                    data-testid="input-end-time"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewMeetingDialog(false)}>Cancel</Button>
              <Button onClick={handleCreateMeeting} data-testid="submit-meeting-btn">Schedule Meeting</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="bg-white border-slate-200">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search meetings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="search-meetings-input"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger data-testid="filter-status">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger data-testid="filter-type">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="zoom">Zoom</SelectItem>
                <SelectItem value="teams">Teams</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => { setStatusFilter('all'); setTypeFilter('all'); setSearchTerm(''); }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Meetings */}
      <div>
        <h3 className="text-lg font-heading font-semibold text-slate-900 mb-4">Upcoming Meetings</h3>
        {upcomingMeetings.length === 0 ? (
          <Card className="bg-white border-slate-200">
            <CardContent className="p-8 text-center">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No upcoming meetings scheduled</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingMeetings.map((meeting) => (
              <Card key={meeting.id} className="bg-white border-slate-200 hover:shadow-md transition-all duration-200" data-testid={`meeting-card-${meeting.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(meeting.meeting_type)}
                      <Badge className={getStatusColor(meeting.status)}>
                        {meeting.status}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm" className="text-rose-600" onClick={() => handleDeleteMeeting(meeting.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <h4 className="font-semibold text-slate-900 mb-2">{meeting.title}</h4>
                  {meeting.description && (
                    <p className="text-sm text-slate-600 mb-3 line-clamp-2">{meeting.description}</p>
                  )}
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {formatDateTime(meeting.start_time)}
                    </div>
                    {meeting.meeting_link && (
                      <div className="flex items-center gap-2">
                        <LinkIcon className="w-4 h-4" />
                        <a
                          href={meeting.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline truncate"
                        >
                          Join Meeting
                        </a>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1 h-auto"
                          onClick={() => copyToClipboard(meeting.meeting_link)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                    {meeting.meeting_id && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-500">ID:</span> {meeting.meeting_id}
                        {meeting.meeting_password && (
                          <>
                            <span className="text-slate-500 ml-2">Pass:</span> {meeting.meeting_password}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  {meeting.meeting_link && (
                    <Button
                      className="w-full mt-4 gap-2"
                      onClick={() => window.open(meeting.meeting_link, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                      Join Meeting
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Past Meetings */}
      {pastMeetings.length > 0 && (
        <div>
          <h3 className="text-lg font-heading font-semibold text-slate-900 mb-4">Past Meetings</h3>
          <div className="space-y-2">
            {pastMeetings.slice(0, 10).map((meeting) => (
              <Card key={meeting.id} className="bg-slate-50 border-slate-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getTypeIcon(meeting.meeting_type)}
                      <div>
                        <h4 className="font-medium text-slate-900">{meeting.title}</h4>
                        <p className="text-xs text-slate-500">{formatDateTime(meeting.start_time)}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(meeting.status)}>
                      {meeting.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingsPage;
