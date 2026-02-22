import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trainingApplicationsAPI } from '../services/api';
import { FileText, Plus, Search, Clock, CheckCircle2, XCircle, Edit, Eye, AlertCircle, Loader2, User, Briefcase, GraduationCap, Upload, Calendar, Building, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

const TrainingApplicationsPage = () => {
  const { isAdmin } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await trainingApplicationsAPI.getAll();
      setApplications(response.data);
    } catch (error) {
      toast.error('Failed to fetch training applications');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-100 text-emerald-700';
      case 'pending':
        return 'bg-amber-100 text-amber-700';
      case 'under_review':
        return 'bg-blue-100 text-blue-700';
      case 'rejected':
        return 'bg-rose-100 text-rose-700';
      case 'draft':
        return 'bg-slate-100 text-slate-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="w-3 h-3" />;
      case 'pending':
        return <Clock className="w-3 h-3" />;
      case 'under_review':
        return <AlertCircle className="w-3 h-3" />;
      case 'rejected':
        return <XCircle className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const openSummaryDialog = (application) => {
    setSelectedApplication(application);
    setShowSummaryDialog(true);
  };

  const openStatusDialog = (application) => {
    setSelectedApplication(application);
    setNewStatus(application.status);
    setStatusNote('');
    setShowStatusDialog(true);
  };

  const handleStatusChange = async () => {
    if (!newStatus) {
      toast.error('Please select a status');
      return;
    }
    setUpdatingStatus(true);
    try {
      await trainingApplicationsAPI.updateStatus(selectedApplication.id, {
        status: newStatus,
        status_note: statusNote
      });
      toast.success('Status updated successfully');
      setShowStatusDialog(false);
      fetchApplications();
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const filteredApplications = applications.filter(app => {
    const searchLower = searchQuery.toLowerCase();
    const name = `${app.personal_info?.surname || ''} ${app.personal_info?.name || ''}`.toLowerCase();
    const provider = (app.training_info?.service_provider || '').toLowerCase();
    const trainingType = (app.training_info?.training_type || '').toLowerCase();
    return name.includes(searchLower) || provider.includes(searchLower) || trainingType.includes(searchLower) || (app.status || '').toLowerCase().includes(searchLower);
  });

  const getSummarySection = (title, data, icon) => {
    if (!data || typeof data !== 'object') return null;
    const entries = Object.entries(data).filter(([key, value]) => value && value !== '');
    if (entries.length === 0) return null;
    
    const formatLabel = (key) => {
      return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };
    
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            {icon}
          </div>
          <h4 className="text-lg font-semibold text-slate-900">{title}</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {entries.map(([key, value]) => (
            <div key={key} className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{formatLabel(key)}</p>
              <p className="text-sm font-semibold text-slate-900">{String(value)}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="training-applications-page">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-heading font-bold tracking-tight text-slate-900">Training Applications</h2>
          <p className="text-slate-600 mt-1">Manage and track training applications</p>
        </div>
        <Link to="/training-applications/new">
          <Button className="gap-2" data-testid="new-training-application-btn">
            <Plus className="w-4 h-4" />
            New Application
          </Button>
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search applications by name, provider, or status..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-white"
          data-testid="search-applications-input"
        />
      </div>

      {filteredApplications.length === 0 ? (
        <Card className="bg-white border-slate-200">
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-heading font-semibold text-slate-900 mb-2">
              {searchQuery ? 'No applications found' : 'No training applications yet'}
            </h3>
            <p className="text-slate-600">
              {searchQuery ? 'Try adjusting your search criteria' : 'Create your first training application'}
            </p>
            {!searchQuery && (
              <Link to="/training-applications/new" className="inline-block mt-4">
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  New Application
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((application) => (
            <Card
              key={application.id}
              className="bg-white border-slate-200 hover:shadow-md transition-shadow duration-200"
              data-testid={`application-card-${application.id}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <GraduationCap className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">
                        Training Application #{application.id?.slice(0, 8)}
                      </h4>
                      <p className="text-sm text-slate-600">{application.user_email}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        <Badge className={`${getStatusColor(application.status)} gap-1`}>
                          {getStatusIcon(application.status)}
                          {application.status?.replace('_', ' ')}
                        </Badge>
                        <span>Step {application.current_step || 1} of 4</span>
                        <span>{new Date(application.created_at).toLocaleDateString()}</span>
                        {application.personal_info?.surname && (
                          <span>{application.personal_info.surname} {application.personal_info.name}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1"
                      onClick={() => openSummaryDialog(application)}
                      data-testid={`view-application-${application.id}`}
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </Button>
                    {isAdmin && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-1"
                        onClick={() => openStatusDialog(application)}
                        data-testid={`change-status-${application.id}`}
                      >
                        <Edit className="w-4 h-4" />
                        Change Status
                      </Button>
                    )}
                    {!isAdmin && (application.status === 'draft' || application.status === 'pending') && (
                      <Link to={`/training-applications/${application.id}/edit`}>
                        <Button size="sm" className="gap-2" data-testid={`edit-application-${application.id}`}>
                          <Edit className="w-4 h-4" />
                          Edit
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Application Full View Dialog */}
      <Dialog open={showSummaryDialog} onOpenChange={setShowSummaryDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0">
          {selectedApplication && (
            <>
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                      <GraduationCap className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Training Application Details</h2>
                      <p className="text-white/80 font-mono text-sm mt-1">ID: {selectedApplication.id}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <Badge className={`${getStatusColor(selectedApplication.status)} gap-1 text-sm px-3 py-1`}>
                          {getStatusIcon(selectedApplication.status)}
                          {selectedApplication.status?.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <span className="text-white/70 text-sm">
                          Step {selectedApplication.current_step || 1} of 4
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-white hover:bg-white/20"
                    onClick={() => setShowSummaryDialog(false)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] bg-slate-50">
                {/* Meta Information */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <User className="w-4 h-4" />
                      <span className="text-xs font-medium uppercase">Applicant</span>
                    </div>
                    <p className="font-semibold text-slate-900">
                      {selectedApplication.personal_info?.surname || ''} {selectedApplication.personal_info?.name || selectedApplication.user_email || 'N/A'}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs font-medium uppercase">Submitted</span>
                    </div>
                    <p className="font-semibold text-slate-900">
                      {selectedApplication.created_at ? new Date(selectedApplication.created_at).toLocaleDateString('en-ZA', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      }) : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <Building className="w-4 h-4" />
                      <span className="text-xs font-medium uppercase">Service Provider</span>
                    </div>
                    <p className="font-semibold text-slate-900">
                      {selectedApplication.training_info?.service_provider || 'N/A'}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <GraduationCap className="w-4 h-4" />
                      <span className="text-xs font-medium uppercase">Amount Requested</span>
                    </div>
                    <p className="font-semibold text-slate-900">
                      {selectedApplication.training_info?.total_amount 
                        ? `R ${Number(selectedApplication.training_info.total_amount).toLocaleString()}`
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Sections */}
                <div className="space-y-6">
                  {getSummarySection('Personal Information', selectedApplication.personal_info, <User className="w-5 h-5 text-primary" />)}
                  {getSummarySection('Employment Details', selectedApplication.employment_info, <Briefcase className="w-5 h-5 text-primary" />)}
                  {getSummarySection('Training Information', selectedApplication.training_info, <GraduationCap className="w-5 h-5 text-primary" />)}
                  {getSummarySection('Uploaded Documents', selectedApplication.documents, <Upload className="w-5 h-5 text-primary" />)}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-200 bg-white flex justify-between items-center">
                <div className="text-sm text-slate-500">
                  Last updated: {selectedApplication.updated_at 
                    ? new Date(selectedApplication.updated_at).toLocaleString() 
                    : new Date(selectedApplication.created_at).toLocaleString()}
                </div>
                <div className="flex gap-2">
                  {isAdmin && (
                    <Button 
                      variant="outline" 
                      className="gap-2"
                      onClick={() => {
                        setShowSummaryDialog(false);
                        openStatusDialog(selectedApplication);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                      Change Status
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => setShowSummaryDialog(false)}>
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Change Status Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Application Status</DialogTitle>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Current Status</Label>
                <Badge className={`${getStatusColor(selectedApplication.status)} gap-1`}>
                  {getStatusIcon(selectedApplication.status)}
                  {selectedApplication.status?.replace('_', ' ')}
                </Badge>
              </div>
              <div className="space-y-2">
                <Label>New Status *</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger data-testid="select-new-status">
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status Note (Optional)</Label>
                <Textarea
                  placeholder="Add a note about this status change..."
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  rows={3}
                  data-testid="status-note-input"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>Cancel</Button>
            <Button onClick={handleStatusChange} disabled={updatingStatus} data-testid="save-status-btn">
              {updatingStatus ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrainingApplicationsPage;
