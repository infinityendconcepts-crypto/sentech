import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trainingApplicationsAPI, applicationsAPI } from '../services/api';
import { FileText, Plus, Search, Clock, CheckCircle2, XCircle, Edit, Eye, AlertCircle, Loader2, User, Briefcase, GraduationCap, Upload, Calendar, Building, X, Receipt, Plane, Hotel, Car, UtensilsCrossed, Trash2, CheckSquare, Square, Settings2 } from 'lucide-react';
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
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
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

  // Expenses
  const [showExpensesDialog, setShowExpensesDialog] = useState(false);
  const [expensesApp, setExpensesApp] = useState(null);
  const [expensesForm, setExpensesForm] = useState({
    flights: '', flights_notes: '',
    accommodation: '', accommodation_notes: '',
    car_hire_or_shuttle: '', car_hire_or_shuttle_notes: '',
    catering: '', catering_notes: '',
  });
  const [savingExpenses, setSavingExpenses] = useState(false);

  // Batch selection & settings
  const [selectedIds, setSelectedIds] = useState([]);
  const [batchDeleting, setBatchDeleting] = useState(false);
  const [appSettings, setAppSettings] = useState(null);
  const [settingsDialog, setSettingsDialog] = useState(false);
  const [settingsForm, setSettingsForm] = useState({});

  useEffect(() => {
    fetchApplications();
    fetchAppSettings();
  }, []);

  const fetchAppSettings = async () => {
    try {
      const res = await applicationsAPI.getSettings();
      setAppSettings(res.data);
      setSettingsForm(res.data);
    } catch {}
  };

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

  const handleDeleteApp = async (id) => {
    if (!window.confirm('Delete this training application permanently?')) return;
    try {
      await trainingApplicationsAPI.delete(id);
      toast.success('Application deleted');
      fetchApplications();
    } catch { toast.error('Failed to delete'); }
  };

  const handleBatchDelete = async () => {
    if (!selectedIds.length) return;
    if (!window.confirm(`Delete ${selectedIds.length} training application(s)? This cannot be undone.`)) return;
    setBatchDeleting(true);
    try {
      await trainingApplicationsAPI.batchDelete(selectedIds);
      toast.success(`Deleted ${selectedIds.length} application(s)`);
      setSelectedIds([]);
      fetchApplications();
    } catch { toast.error('Batch delete failed'); }
    finally { setBatchDeleting(false); }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    const ids = filteredApplications.map(a => a.id);
    const allSelected = ids.every(id => selectedIds.includes(id));
    setSelectedIds(allSelected ? [] : ids);
  };

  const handleSaveAppSettings = async () => {
    try {
      await applicationsAPI.updateSettings(settingsForm);
      toast.success('Application settings saved');
      setSettingsDialog(false);
      fetchAppSettings();
    } catch { toast.error('Failed to save settings'); }
  };

  // Check if submissions are closed based on deadline
  const isSubmissionClosed = () => {
    if (!appSettings) return false;
    if (!appSettings.training_open) return true;
    if (appSettings.training_deadline && appSettings.training_close_days_before) {
      const deadline = new Date(appSettings.training_deadline);
      const closeDays = appSettings.training_close_days_before || 0;
      const closeDate = new Date(deadline.getTime() - closeDays * 86400000);
      if (new Date() > closeDate) return true;
    }
    return false;
  };

  const openExpensesDialog = (app) => {
    setExpensesApp(app);
    const exp = app.additional_expenses || {};
    setExpensesForm({
      flights: exp.flights || '',
      flights_notes: exp.flights_notes || '',
      accommodation: exp.accommodation || '',
      accommodation_notes: exp.accommodation_notes || '',
      car_hire_or_shuttle: exp.car_hire_or_shuttle || '',
      car_hire_or_shuttle_notes: exp.car_hire_or_shuttle_notes || '',
      catering: exp.catering || '',
      catering_notes: exp.catering_notes || '',
    });
    setShowExpensesDialog(true);
  };

  const handleSaveExpenses = async () => {
    if (!expensesApp) return;
    setSavingExpenses(true);
    try {
      await trainingApplicationsAPI.addExpenses(expensesApp.id, {
        flights: parseFloat(expensesForm.flights) || 0,
        flights_notes: expensesForm.flights_notes,
        accommodation: parseFloat(expensesForm.accommodation) || 0,
        accommodation_notes: expensesForm.accommodation_notes,
        car_hire_or_shuttle: parseFloat(expensesForm.car_hire_or_shuttle) || 0,
        car_hire_or_shuttle_notes: expensesForm.car_hire_or_shuttle_notes,
        catering: parseFloat(expensesForm.catering) || 0,
        catering_notes: expensesForm.catering_notes,
      });
      toast.success('Expenses saved successfully');
      setShowExpensesDialog(false);
      fetchApplications();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save expenses');
    } finally {
      setSavingExpenses(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-emerald-100 text-emerald-700';
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'under_review': return 'bg-blue-100 text-blue-700';
      case 'rejected': return 'bg-rose-100 text-rose-700';
      case 'draft': return 'bg-slate-100 text-slate-700';
      case 'on_hold': return 'bg-purple-100 text-purple-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle2 className="w-3 h-3" />;
      case 'pending': return <Clock className="w-3 h-3" />;
      case 'under_review': return <AlertCircle className="w-3 h-3" />;
      case 'rejected': return <XCircle className="w-3 h-3" />;
      case 'on_hold': return <Loader2 className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
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
    const email = (app.user_email || '').toLowerCase();
    return name.includes(searchLower) || provider.includes(searchLower) || trainingType.includes(searchLower) || email.includes(searchLower) || (app.status || '').toLowerCase().includes(searchLower);
  });

  const getSummarySection = (title, data, icon) => {
    if (!data || typeof data !== 'object') return null;
    const entries = Object.entries(data).filter(([key, value]) => value && value !== '');
    if (entries.length === 0) return null;
    const formatLabel = (key) => key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">{icon}</div>
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

  const submissionClosed = isSubmissionClosed();

  return (
    <div className="space-y-6" data-testid="training-applications-page">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-heading font-bold tracking-tight text-slate-900">Training Applications</h2>
          <p className="text-slate-600 mt-1">Manage and track training applications</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button variant="outline" className="gap-2" onClick={() => { setSettingsForm(appSettings || {}); setSettingsDialog(true); }} data-testid="training-app-settings-btn">
              <Settings2 className="w-4 h-4" /> Period Settings
            </Button>
          )}
          <Link to="/training-applications/new">
            <Button className="gap-2" disabled={submissionClosed && !isAdmin} data-testid="new-training-application-btn">
              <Plus className="w-4 h-4" /> New Application
            </Button>
          </Link>
        </div>
      </div>

      {/* Application Status Banner */}
      {appSettings && (
        <div className={`flex items-center gap-3 p-3 rounded-lg border ${appSettings.training_open ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`} data-testid="training-status-banner">
          {appSettings.training_open ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          <span className="text-sm font-medium">
            Training applications are {appSettings.training_open ? 'open' : 'closed'}
            {appSettings.training_deadline && ` — Deadline: ${new Date(appSettings.training_deadline).toLocaleDateString()}`}
          </span>
        </div>
      )}

      {/* Batch Actions */}
      {selectedIds.length > 0 && isAdmin && (
        <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg" data-testid="training-batch-bar">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium">{selectedIds.length} selected</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-red-600 border-red-200" onClick={handleBatchDelete} disabled={batchDeleting} data-testid="batch-delete-training-btn">
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete Selected
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])}><X className="w-3 h-3 mr-1" /> Clear</Button>
          </div>
        </div>
      )}

      <Card className="bg-white border-slate-200">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search applications by name, provider, email, or status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="search-applications-input"
            />
          </div>
        </CardContent>
      </Card>

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
                  <Plus className="w-4 h-4" /> New Application
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredApplications.map((application) => (
            <ContextMenu key={application.id}>
              <ContextMenuTrigger>
                <Card
                  className={`bg-white border-slate-200 hover:shadow-md transition-all duration-200 ${selectedIds.includes(application.id) ? 'ring-2 ring-primary/30' : ''}`}
                  data-testid={`application-card-${application.id}`}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          {isAdmin && (
                            <button onClick={(e) => { e.stopPropagation(); toggleSelect(application.id); }} className="mt-1 flex-shrink-0" data-testid={`select-training-app-${application.id}`}>
                              {selectedIds.includes(application.id) ? <CheckSquare className="w-5 h-5 text-primary" /> : <Square className="w-5 h-5 text-slate-400" />}
                            </button>
                          )}
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <GraduationCap className="w-5 h-5 text-purple-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-heading font-semibold text-slate-900">Training Application #{application.id?.slice(0, 8)}</h3>
                            <p className="text-sm text-slate-600 mt-1">{application.user_email}</p>
                            <div className="flex items-center gap-4 mt-2 flex-wrap">
                              <Badge className={`${getStatusColor(application.status)} gap-1 text-xs`}>
                                {getStatusIcon(application.status)}
                                {application.status?.replace('_', ' ')}
                              </Badge>
                              <span className="text-xs text-slate-500">Step {application.current_step || 1} of 4</span>
                              <span className="text-xs text-slate-500">{new Date(application.created_at).toLocaleDateString()}</span>
                              {application.personal_info?.surname && (
                                <span className="text-xs text-slate-600">{application.personal_info.surname} {application.personal_info.name}</span>
                              )}
                              {application.additional_expenses && (
                                <Badge className="bg-blue-50 text-blue-700 border-blue-200 gap-1 text-xs">
                                  <Receipt className="w-3 h-3" /> Expenses Added
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button variant="outline" size="sm" className="gap-1" onClick={() => openSummaryDialog(application)} data-testid={`view-application-${application.id}`}>
                          <Eye className="w-4 h-4" /> View
                        </Button>
                        {application.status !== 'draft' && (
                          <Button variant="outline" size="sm" className="gap-1 border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => openExpensesDialog(application)} data-testid={`add-expenses-${application.id}`}>
                            <Receipt className="w-4 h-4" /> {application.additional_expenses ? 'Edit Expenses' : 'Add Expenses'}
                          </Button>
                        )}
                        {isAdmin && (
                          <Button variant="outline" size="sm" className="gap-1" onClick={() => openStatusDialog(application)} data-testid={`change-status-${application.id}`}>
                            <Edit className="w-4 h-4" /> Change Status
                          </Button>
                        )}
                        {isAdmin && (
                          <Link to={`/training-applications/${application.id}/edit`}>
                            <Button variant="outline" size="sm" className="gap-1" data-testid={`admin-edit-training-${application.id}`}>
                              <Edit className="w-4 h-4" /> Edit
                            </Button>
                          </Link>
                        )}
                        {isAdmin && (
                          <Button variant="outline" size="sm" className="gap-1 text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleDeleteApp(application.id)} data-testid={`delete-training-${application.id}`}>
                            <Trash2 className="w-4 h-4" /> Delete
                          </Button>
                        )}
                        {!isAdmin && (application.status === 'draft' || application.status === 'pending') && (
                          <Link to={`/training-applications/${application.id}/edit`}>
                            <Button size="sm" className="gap-2" data-testid={`edit-application-${application.id}`}>
                              <Edit className="w-4 h-4" /> Edit
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem onClick={() => openSummaryDialog(application)}>
                  <Eye className="w-4 h-4 mr-2" /> View Details
                </ContextMenuItem>
                {application.status !== 'draft' && (
                  <ContextMenuItem onClick={() => openExpensesDialog(application)}>
                    <Receipt className="w-4 h-4 mr-2" /> {application.additional_expenses ? 'Edit Expenses' : 'Add Expenses'}
                  </ContextMenuItem>
                )}
                {isAdmin && (
                  <ContextMenuItem onClick={() => openStatusDialog(application)}>
                    <Edit className="w-4 h-4 mr-2" /> Change Status
                  </ContextMenuItem>
                )}
              </ContextMenuContent>
            </ContextMenu>
          ))}
        </div>
      )}

      {/* Application Full View Dialog */}
      <Dialog open={showSummaryDialog} onOpenChange={setShowSummaryDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0">
          {selectedApplication && (
            <>
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
                        <span className="text-white/70 text-sm">Step {selectedApplication.current_step || 1} of 4</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => setShowSummaryDialog(false)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] bg-slate-50">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 text-slate-500 mb-1"><User className="w-4 h-4" /><span className="text-xs font-medium uppercase">Applicant</span></div>
                    <p className="font-semibold text-slate-900">{selectedApplication.personal_info?.surname || ''} {selectedApplication.personal_info?.name || selectedApplication.user_email || 'N/A'}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 text-slate-500 mb-1"><Calendar className="w-4 h-4" /><span className="text-xs font-medium uppercase">Submitted</span></div>
                    <p className="font-semibold text-slate-900">{selectedApplication.created_at ? new Date(selectedApplication.created_at).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 text-slate-500 mb-1"><Building className="w-4 h-4" /><span className="text-xs font-medium uppercase">Service Provider</span></div>
                    <p className="font-semibold text-slate-900">{selectedApplication.training_info?.service_provider || 'N/A'}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 text-slate-500 mb-1"><GraduationCap className="w-4 h-4" /><span className="text-xs font-medium uppercase">Amount Requested</span></div>
                    <p className="font-semibold text-slate-900">{selectedApplication.training_info?.total_amount ? `R ${Number(selectedApplication.training_info.total_amount).toLocaleString()}` : 'N/A'}</p>
                  </div>
                </div>
                <div className="space-y-6">
                  {getSummarySection('Personal Information', selectedApplication.personal_info, <User className="w-5 h-5 text-primary" />)}
                  {getSummarySection('Employment Details', selectedApplication.employment_info, <Briefcase className="w-5 h-5 text-primary" />)}
                  {getSummarySection('Training Information', selectedApplication.training_info, <GraduationCap className="w-5 h-5 text-primary" />)}
                  {getSummarySection('Uploaded Documents', selectedApplication.documents, <Upload className="w-5 h-5 text-primary" />)}
                </div>
              </div>
              <div className="p-4 border-t border-slate-200 bg-white flex justify-between items-center">
                <div className="text-sm text-slate-500">Last updated: {selectedApplication.updated_at ? new Date(selectedApplication.updated_at).toLocaleString() : new Date(selectedApplication.created_at).toLocaleString()}</div>
                <div className="flex gap-2">
                  {isAdmin && (
                    <Button variant="outline" className="gap-2" onClick={() => { setShowSummaryDialog(false); openStatusDialog(selectedApplication); }}>
                      <Edit className="w-4 h-4" /> Change Status
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => setShowSummaryDialog(false)}>Close</Button>
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
            <DialogTitle className="flex items-center gap-2"><Edit className="w-5 h-5 text-primary" /> Change Application Status</DialogTitle>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-4 py-2">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">Application</p>
                <p className="font-semibold">{selectedApplication.user_email}</p>
                <p className="text-xs text-slate-500">ID: {selectedApplication.id?.slice(0, 8)}</p>
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
                <Textarea placeholder="Add a note about this status change..." value={statusNote} onChange={(e) => setStatusNote(e.target.value)} rows={3} data-testid="status-note-input" />
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

      {/* Add/Edit Expenses Dialog */}
      <Dialog open={showExpensesDialog} onOpenChange={setShowExpensesDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Receipt className="w-5 h-5 text-blue-600" /> Additional Expenses</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500 -mt-2">Training Application #{expensesApp?.id?.slice(0, 8)} — Add travel and logistics expenses</p>
          <div className="space-y-4 mt-2">
            {[
              { key: 'flights', label: 'Flights', icon: Plane, color: 'text-sky-600' },
              { key: 'accommodation', label: 'Accommodation', icon: Hotel, color: 'text-amber-600' },
              { key: 'car_hire_or_shuttle', label: 'Car Hire / Shuttle', icon: Car, color: 'text-emerald-600' },
              { key: 'catering', label: 'Catering', icon: UtensilsCrossed, color: 'text-rose-600' },
            ].map(({ key, label, icon: Icon, color }) => (
              <div key={key} className="border border-slate-200 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2"><Icon className={`w-4 h-4 ${color}`} /><Label className="font-medium text-sm">{label}</Label></div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <Input type="number" placeholder="R 0.00" value={expensesForm[key]} onChange={(e) => setExpensesForm({ ...expensesForm, [key]: e.target.value })} data-testid={`expense-${key}-amount`} />
                  </div>
                  <div className="col-span-2">
                    <Input placeholder="Notes (optional)" value={expensesForm[`${key}_notes`]} onChange={(e) => setExpensesForm({ ...expensesForm, [`${key}_notes`]: e.target.value })} data-testid={`expense-${key}-notes`} />
                  </div>
                </div>
              </div>
            ))}
            <div className="bg-slate-50 rounded-lg p-3 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Total Expenses</span>
              <span className="text-lg font-bold text-slate-900" data-testid="expenses-total">
                R {((parseFloat(expensesForm.flights) || 0) + (parseFloat(expensesForm.accommodation) || 0) + (parseFloat(expensesForm.car_hire_or_shuttle) || 0) + (parseFloat(expensesForm.catering) || 0)).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExpensesDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveExpenses} disabled={savingExpenses} className="gap-2" data-testid="save-expenses-btn">
              {savingExpenses ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />}
              {savingExpenses ? 'Saving...' : 'Save Expenses'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Application Period Settings Dialog */}
      <Dialog open={settingsDialog} onOpenChange={setSettingsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Settings2 className="w-5 h-5 text-primary" /> Application Period Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-2">
            <div className="space-y-3 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">Bursary Applications</span>
                <button onClick={() => setSettingsForm(f => ({...f, bursary_open: !f.bursary_open}))}
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${settingsForm.bursary_open ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}
                  data-testid="toggle-bursary-open">
                  {settingsForm.bursary_open ? 'Open' : 'Closed'}
                </button>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Deadline Date</Label>
                <Input type="date" value={settingsForm.bursary_deadline || ''} onChange={(e) => setSettingsForm(f => ({...f, bursary_deadline: e.target.value}))} data-testid="bursary-deadline" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Close submissions X days before deadline</Label>
                <Input type="number" min="0" value={settingsForm.bursary_close_days_before || 8} onChange={(e) => setSettingsForm(f => ({...f, bursary_close_days_before: parseInt(e.target.value)}))} data-testid="bursary-close-days" />
              </div>
            </div>
            <div className="space-y-3 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">Training Applications</span>
                <button onClick={() => setSettingsForm(f => ({...f, training_open: !f.training_open}))}
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${settingsForm.training_open ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}
                  data-testid="toggle-training-open">
                  {settingsForm.training_open ? 'Open' : 'Closed'}
                </button>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Deadline Date</Label>
                <Input type="date" value={settingsForm.training_deadline || ''} onChange={(e) => setSettingsForm(f => ({...f, training_deadline: e.target.value}))} data-testid="training-deadline" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Close submissions X days before deadline</Label>
                <Input type="number" min="0" value={settingsForm.training_close_days_before || 8} onChange={(e) => setSettingsForm(f => ({...f, training_close_days_before: parseInt(e.target.value)}))} data-testid="training-close-days" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveAppSettings} data-testid="save-app-settings-btn">Save Settings</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrainingApplicationsPage;
