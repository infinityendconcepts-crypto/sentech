import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { applicationsAPI } from '../services/api';
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

const ApplicationsPage = () => {
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
                    {!isAdmin && (application.status === 'draft' || application.status === 'pending') && (
                      <Link to={`/applications/${application.id}/edit`}>
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

      {/* Application Full View Dialog - Large Popup */}
      <Dialog open={showSummaryDialog} onOpenChange={setShowSummaryDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0">
          {selectedApplication && (
            <>
              {/* Header */}
              <div className="bg-gradient-to-r from-primary to-blue-600 text-white p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                      <FileText className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Application Details</h2>
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
                      <span className="text-xs font-medium uppercase">Institution</span>
                    </div>
                    <p className="font-semibold text-slate-900">
                      {selectedApplication.academic_bursary_info?.institution || 'N/A'}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <GraduationCap className="w-4 h-4" />
                      <span className="text-xs font-medium uppercase">Amount Requested</span>
                    </div>
                    <p className="font-semibold text-slate-900">
                      {selectedApplication.academic_bursary_info?.total_amount_requested 
                        ? `R ${Number(selectedApplication.academic_bursary_info.total_amount_requested).toLocaleString()}`
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Sections */}
                <div className="space-y-6">
                  {/* Personal Information */}
                  {selectedApplication.personal_info && Object.keys(selectedApplication.personal_info).length > 0 ? (
                    getSummarySection('Personal Information', selectedApplication.personal_info, <User className="w-5 h-5 text-primary" />)
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-slate-400" />
                        </div>
                        <h4 className="text-lg font-semibold text-slate-900">Personal Information</h4>
                      </div>
                      <p className="text-slate-500 italic">No personal information provided yet.</p>
                    </div>
                  )}

                  {/* Employment Details */}
                  {selectedApplication.employment_info && Object.keys(selectedApplication.employment_info).length > 0 ? (
                    getSummarySection('Employment Details', selectedApplication.employment_info, <Briefcase className="w-5 h-5 text-primary" />)
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                          <Briefcase className="w-5 h-5 text-slate-400" />
                        </div>
                        <h4 className="text-lg font-semibold text-slate-900">Employment Details</h4>
                      </div>
                      <p className="text-slate-500 italic">No employment information provided yet.</p>
                    </div>
                  )}

                  {/* Academic & Bursary Information */}
                  {selectedApplication.academic_bursary_info && Object.keys(selectedApplication.academic_bursary_info).length > 0 ? (
                    getSummarySection('Academic & Bursary Information', selectedApplication.academic_bursary_info, <GraduationCap className="w-5 h-5 text-primary" />)
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                          <GraduationCap className="w-5 h-5 text-slate-400" />
                        </div>
                        <h4 className="text-lg font-semibold text-slate-900">Academic & Bursary Information</h4>
                      </div>
                      <p className="text-slate-500 italic">No academic information provided yet.</p>
                    </div>
                  )}

                  {/* Documents */}
                  {selectedApplication.documents && Object.keys(selectedApplication.documents).length > 0 ? (
                    getSummarySection('Uploaded Documents', selectedApplication.documents, <Upload className="w-5 h-5 text-primary" />)
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                          <Upload className="w-5 h-5 text-slate-400" />
                        </div>
                        <h4 className="text-lg font-semibold text-slate-900">Uploaded Documents</h4>
                      </div>
                      <p className="text-slate-500 italic">No documents uploaded yet.</p>
                    </div>
                  )}

                  {/* Status History / Notes */}
                  {selectedApplication.status_note && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                          <AlertCircle className="w-5 h-5 text-amber-600" />
                        </div>
                        <h4 className="text-lg font-semibold text-amber-900">Admin Notes</h4>
                      </div>
                      <p className="text-amber-800">{selectedApplication.status_note}</p>
                      {selectedApplication.status_updated_at && (
                        <p className="text-xs text-amber-600 mt-2">
                          Updated: {new Date(selectedApplication.status_updated_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}
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
                  {!isAdmin && (selectedApplication.status === 'draft' || selectedApplication.status === 'pending') && (
                    <Link to={`/applications/${selectedApplication.id}/edit`}>
                      <Button className="gap-2">
                        <Edit className="w-4 h-4" />
                        Edit Application
                      </Button>
                    </Link>
                  )}
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
