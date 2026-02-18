import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { applicationsAPI } from '../services/api';
import { FileText, Plus, Search, Clock, CheckCircle2, XCircle, Edit, Eye, AlertCircle, Loader2 } from 'lucide-react';
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

const ApplicationsPage = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [continuingApplication, setContinuingApplication] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await applicationsAPI.getAll();
      setApplications(response.data);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft':
        return 'bg-slate-100 text-slate-700';
      case 'pending':
        return 'bg-amber-100 text-amber-700';
      case 'under_review':
        return 'bg-blue-100 text-blue-700';
      case 'approved':
        return 'bg-emerald-100 text-emerald-700';
      case 'rejected':
        return 'bg-rose-100 text-rose-700';
      case 'on_hold':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'draft':
        return <Edit className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'under_review':
        return <AlertCircle className="w-4 h-4" />;
      case 'approved':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'on_hold':
        return <Loader2 className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const filteredApplications = applications.filter(
    (app) =>
      app.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.status?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      await applicationsAPI.update(selectedApplication.id, { 
        status: newStatus,
        status_note: statusNote,
        status_updated_at: new Date().toISOString()
      });
      toast.success('Application status updated successfully');
      setShowStatusDialog(false);
      fetchApplications();
    } catch (error) {
      toast.error('Failed to update application status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleContinueApplication = async (application) => {
    setContinuingApplication(application.id);
    try {
      // Change status from draft to pending when continuing
      await applicationsAPI.update(application.id, { 
        status: 'pending',
        status_updated_at: new Date().toISOString()
      });
      toast.success('Application status changed to pending');
      // Navigate to the edit page
      navigate(`/applications/${application.id}/edit`);
    } catch (error) {
      toast.error('Failed to update application status');
      setContinuingApplication(null);
    }
  };

  const getSummarySection = (title, data) => {
    if (!data || typeof data !== 'object') return null;
    const entries = Object.entries(data).filter(([key, value]) => value && value !== '');
    if (entries.length === 0) return null;
    
    return (
      <div className="mb-6">
        <h4 className="font-semibold text-slate-900 mb-3 border-b pb-2">{title}</h4>
        <div className="grid grid-cols-2 gap-3">
          {entries.map(([key, value]) => (
            <div key={key}>
              <p className="text-xs text-slate-500 capitalize">{key.replace(/_/g, ' ')}</p>
              <p className="text-sm font-medium text-slate-900">{String(value)}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6" data-testid="applications-page">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-heading font-bold tracking-tight text-slate-900">Applications</h2>
          <p className="text-slate-600 mt-1">Manage and track your bursary applications</p>
        </div>
        <Link to="/applications/new">
          <Button className="gap-2" data-testid="new-application-btn">
            <Plus className="w-4 h-4" />
            New Application
          </Button>
        </Link>
      </div>

      <Card className="bg-white border-slate-200">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search applications by email or status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="search-applications-input"
            />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card className="bg-white border-slate-200">
          <CardContent className="p-12 text-center">
            <p className="text-slate-600">Loading applications...</p>
          </CardContent>
        </Card>
      ) : filteredApplications.length === 0 ? (
        <Card className="bg-white border-slate-200">
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-heading font-semibold text-slate-900 mb-2">No applications found</h3>
            <p className="text-slate-600 mb-4">
              {searchQuery ? 'Try adjusting your search criteria' : 'Start by creating your first application'}
            </p>
            {!searchQuery && (
              <Link to="/applications/new">
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create Application
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredApplications.map((application) => (
            <Card
              key={application.id}
              className="bg-white border-slate-200 hover:shadow-md transition-all duration-200"
              data-testid={`application-card-${application.id}`}
            >
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-heading font-semibold text-slate-900">Application #{application.id.slice(0, 8)}</h3>
                        <p className="text-sm text-slate-600 mt-1">{application.user_email}</p>
                        <div className="flex items-center gap-4 mt-2 flex-wrap">
                          <Badge className={`${getStatusColor(application.status)} gap-1 text-xs`}>
                            {getStatusIcon(application.status)}
                            {application.status?.replace('_', ' ')}
                          </Badge>
                          <span className="text-xs text-slate-500">Step {application.current_step} of 4</span>
                          <span className="text-xs text-slate-500">
                            {new Date(application.created_at).toLocaleDateString()}
                          </span>
                          {application.personal_info?.name && (
                            <span className="text-xs text-slate-600">
                              {application.personal_info.surname} {application.personal_info.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1"
                      onClick={() => openSummaryDialog(application)}
                      data-testid={`view-summary-${application.id}`}
                    >
                      <Eye className="w-4 h-4" />
                      View Summary
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
                    <Link to={`/applications/${application.id}`}>
                      <Button variant="outline" size="sm" data-testid={`view-application-${application.id}`}>
                        View Details
                      </Button>
                    </Link>
                    {application.status === 'draft' && (
                      <Link to={`/applications/${application.id}/edit`}>
                        <Button size="sm" className="gap-2">
                          <Edit className="w-4 h-4" />
                          Continue
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

      {/* Application Summary Dialog */}
      <Dialog open={showSummaryDialog} onOpenChange={setShowSummaryDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Application Summary
            </DialogTitle>
          </DialogHeader>
          {selectedApplication && (
            <div className="py-4">
              <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Application ID</p>
                    <p className="font-mono text-sm">{selectedApplication.id}</p>
                  </div>
                  <Badge className={`${getStatusColor(selectedApplication.status)} gap-1`}>
                    {getStatusIcon(selectedApplication.status)}
                    {selectedApplication.status?.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
              {getSummarySection('Personal Information', selectedApplication.personal_info)}
              {getSummarySection('Employment Details', selectedApplication.employment_info)}
              {getSummarySection('Academic & Bursary Information', selectedApplication.academic_bursary_info)}
              {getSummarySection('Documents', selectedApplication.documents)}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSummaryDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Status Dialog (Admin Only) */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-primary" />
              Change Application Status
            </DialogTitle>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">Application</p>
                <p className="font-semibold">{selectedApplication.user_email}</p>
                <p className="text-xs text-slate-500">ID: {selectedApplication.id.slice(0, 8)}</p>
              </div>
              
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
                    <SelectItem value="on_hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Textarea
                  placeholder="Add any notes about this status change..."
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  rows={3}
                  data-testid="status-change-notes"
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

export default ApplicationsPage;
