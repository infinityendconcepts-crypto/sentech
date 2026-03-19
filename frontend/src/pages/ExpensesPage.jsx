import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { expensesAPI, applicationsAPI, trainingApplicationsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import {
  Plus, Search, Receipt, DollarSign, TrendingUp, Clock,
  CheckCircle, XCircle, Trash2, Download, CalendarDays, X,
  Plane, Hotel, Car, UtensilsCrossed, Loader2, GraduationCap, FileText,
  ArrowUpDown,
} from 'lucide-react';

const ExpensesPage = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [activeTab, setActiveTab] = useState('bursary');
  const [appExpenses, setAppExpenses] = useState({ bursary: [], training: [] });
  const [appExpensesLoading, setAppExpensesLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Submit expense dialog
  const [submitDialog, setSubmitDialog] = useState(false);
  const [availableApps, setAvailableApps] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [expForm, setExpForm] = useState({
    flights: '', flights_notes: '',
    accommodation: '', accommodation_notes: '',
    car_hire_or_shuttle: '', car_hire_or_shuttle_notes: '',
    catering: '', catering_notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Bursary/Training tab filters
  const [appStatusFilter, setAppStatusFilter] = useState('all');
  const [appDateFrom, setAppDateFrom] = useState('');
  const [appDateTo, setAppDateTo] = useState('');
  const [appAmountMin, setAppAmountMin] = useState('');
  const [appAmountMax, setAppAmountMax] = useState('');
  const [appSearchTerm, setAppSearchTerm] = useState('');

  const isAdmin = user?.roles?.includes('admin') || user?.roles?.includes('super_admin');

  const categories = [
    { value: 'travel', label: 'Travel' }, { value: 'equipment', label: 'Equipment' },
    { value: 'software', label: 'Software' }, { value: 'office', label: 'Office Supplies' },
    { value: 'training', label: 'Training' }, { value: 'meals', label: 'Meals & Entertainment' },
    { value: 'utilities', label: 'Utilities' }, { value: 'other', label: 'Other' },
  ];

  useEffect(() => {
    fetchExpenses();
    fetchStats();
    fetchApplicationExpenses();
  }, [statusFilter, categoryFilter, dateFrom, dateTo]);

  const fetchExpenses = async () => {
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (categoryFilter !== 'all') params.category = categoryFilter;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const response = await expensesAPI.getAll(params);
      setExpenses(response.data);
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try { const r = await expensesAPI.getStats(); setStats(r.data); } catch {}
  };

  const fetchApplicationExpenses = async () => {
    setAppExpensesLoading(true);
    try {
      const response = await expensesAPI.getApplicationExpenses();
      setAppExpenses(response.data || { bursary: [], training: [] });
    } catch (error) {
      console.error('Failed to fetch application expenses:', error);
    } finally {
      setAppExpensesLoading(false);
    }
  };

  const fetchAvailableApps = async () => {
    setLoadingApps(true);
    try {
      const r = await expensesAPI.getAvailableApplications();
      setAvailableApps(r.data || []);
    } catch { toast.error('Failed to load applications'); }
    finally { setLoadingApps(false); }
  };

  const openSubmitDialog = () => {
    setSelectedApp(null);
    setExpForm({ flights: '', flights_notes: '', accommodation: '', accommodation_notes: '', car_hire_or_shuttle: '', car_hire_or_shuttle_notes: '', catering: '', catering_notes: '' });
    setSubmitDialog(true);
    fetchAvailableApps();
  };

  const selectApplication = (appId) => {
    const app = availableApps.find(a => a.id === appId);
    setSelectedApp(app);
    if (app?.existing_expenses) {
      const e = app.existing_expenses;
      setExpForm({
        flights: e.flights || '', flights_notes: e.flights_notes || '',
        accommodation: e.accommodation || '', accommodation_notes: e.accommodation_notes || '',
        car_hire_or_shuttle: e.car_hire_or_shuttle || '', car_hire_or_shuttle_notes: e.car_hire_or_shuttle_notes || '',
        catering: e.catering || '', catering_notes: e.catering_notes || '',
      });
    } else {
      setExpForm({ flights: '', flights_notes: '', accommodation: '', accommodation_notes: '', car_hire_or_shuttle: '', car_hire_or_shuttle_notes: '', catering: '', catering_notes: '' });
    }
  };

  const handleSubmitExpense = async () => {
    if (!selectedApp) { toast.error('Please select an application'); return; }
    setSubmitting(true);
    try {
      const data = {
        flights: parseFloat(expForm.flights) || 0, flights_notes: expForm.flights_notes,
        accommodation: parseFloat(expForm.accommodation) || 0, accommodation_notes: expForm.accommodation_notes,
        car_hire_or_shuttle: parseFloat(expForm.car_hire_or_shuttle) || 0, car_hire_or_shuttle_notes: expForm.car_hire_or_shuttle_notes,
        catering: parseFloat(expForm.catering) || 0, catering_notes: expForm.catering_notes,
      };
      if (selectedApp.type === 'bursary') {
        await applicationsAPI.addExpenses(selectedApp.id, data);
      } else {
        await trainingApplicationsAPI.addExpenses(selectedApp.id, data);
      }
      toast.success('Expenses submitted successfully');
      setSubmitDialog(false);
      fetchApplicationExpenses();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit expenses');
    } finally { setSubmitting(false); }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const params = {};
      if (activeTab === 'bursary' || activeTab === 'training') {
        params.tab = activeTab;
      } else {
        if (statusFilter !== 'all') params.status = statusFilter;
        if (categoryFilter !== 'all') params.category = categoryFilter;
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;
      }
      const res = await expensesAPI.exportExcel(params);
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url; a.download = `expenses_${activeTab}_export.xlsx`; a.click();
      URL.revokeObjectURL(url);
      toast.success('Export downloaded');
    } catch { toast.error('Export failed'); }
    finally { setExporting(false); }
  };

  const handleApprove = async (id) => {
    try { await expensesAPI.approve(id); toast.success('Approved'); fetchExpenses(); fetchStats(); } catch { toast.error('Failed'); }
  };
  const handleReject = async (id) => {
    try { await expensesAPI.reject(id, 'Rejected by admin'); toast.success('Rejected'); fetchExpenses(); fetchStats(); } catch { toast.error('Failed'); }
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try { await expensesAPI.delete(id); toast.success('Deleted'); fetchExpenses(); fetchStats(); } catch { toast.error('Failed'); }
  };

  const clearFilters = () => { setStatusFilter('all'); setCategoryFilter('all'); setSearchTerm(''); setDateFrom(''); setDateTo(''); };
  const clearAppFilters = () => { setAppStatusFilter('all'); setAppDateFrom(''); setAppDateTo(''); setAppAmountMin(''); setAppAmountMax(''); setAppSearchTerm(''); };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount || 0);
  const formatDate = (dateString) => { if (!dateString) return ''; return new Date(dateString).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }); };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-emerald-100 text-emerald-700';
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'rejected': return 'bg-rose-100 text-rose-700';
      case 'under_review': return 'bg-blue-100 text-blue-700';
      case 'reimbursed': return 'bg-blue-100 text-blue-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };
  const getCategoryColor = (category) => {
    const colors = { travel: 'bg-blue-100 text-blue-700', equipment: 'bg-purple-100 text-purple-700', software: 'bg-indigo-100 text-indigo-700', office: 'bg-amber-100 text-amber-700', training: 'bg-emerald-100 text-emerald-700', meals: 'bg-rose-100 text-rose-700', utilities: 'bg-slate-100 text-slate-700', other: 'bg-gray-100 text-gray-700' };
    return colors[category] || colors.other;
  };

  const filteredExpenses = expenses.filter(expense =>
    (expense.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (expense.vendor || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hasActiveFilters = statusFilter !== 'all' || categoryFilter !== 'all' || dateFrom || dateTo || searchTerm;
  const hasAppFilters = appStatusFilter !== 'all' || appDateFrom || appDateTo || appAmountMin || appAmountMax || appSearchTerm;

  const expenseTotal = useMemo(() => {
    const f = parseFloat(expForm.flights) || 0;
    const a = parseFloat(expForm.accommodation) || 0;
    const c = parseFloat(expForm.car_hire_or_shuttle) || 0;
    const ct = parseFloat(expForm.catering) || 0;
    return f + a + c + ct;
  }, [expForm]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6" data-testid="expenses-page">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-heading font-bold tracking-tight text-slate-900">Expenses</h2>
          <p className="text-slate-600 mt-1">Track and manage application expenses</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={handleExportExcel} disabled={exporting} data-testid="export-xlsx-btn">
            <Download className="w-4 h-4" /> {exporting ? 'Exporting...' : 'Export XLSX'}
          </Button>
          <Button className="gap-2" onClick={openSubmitDialog} data-testid="submit-expense-btn">
            <Plus className="w-4 h-4" /> Submit Expense
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Expenses', value: formatCurrency(stats?.total), icon: DollarSign, iconBg: 'bg-slate-100', iconColor: 'text-slate-600' },
          { label: 'Pending', value: formatCurrency(stats?.pending), icon: Clock, iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
          { label: 'Approved', value: formatCurrency(stats?.approved), icon: CheckCircle, iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
          { label: 'Total Count', value: stats?.count || 0, icon: Receipt, iconBg: 'bg-primary/10', iconColor: 'text-primary' },
        ].map(({ label, value, icon: Icon, iconBg, iconColor }) => (
          <Card key={label} className="bg-white border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">{label}</p>
                  <p className="text-2xl font-bold text-slate-900">{value}</p>
                </div>
                <div className={`p-3 ${iconBg} rounded-full`}><Icon className={`w-6 h-6 ${iconColor}`} /></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="bursary" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList className="bg-slate-100">
          <TabsTrigger value="bursary" data-testid="tab-bursary-expenses">Bursary Application</TabsTrigger>
          <TabsTrigger value="training" data-testid="tab-training-expenses">Training Application</TabsTrigger>
          <TabsTrigger value="additional" data-testid="tab-additional-expenses">Standalone Expenses</TabsTrigger>
        </TabsList>

        <TabsContent value="bursary">
          <ApplicationExpensesTab
            expenses={appExpenses.bursary} loading={appExpensesLoading} type="bursary"
            formatCurrency={formatCurrency} formatDate={formatDate} getStatusColor={getStatusColor}
            filters={{ appStatusFilter, setAppStatusFilter, appDateFrom, setAppDateFrom, appDateTo, setAppDateTo, appAmountMin, setAppAmountMin, appAmountMax, setAppAmountMax, appSearchTerm, setAppSearchTerm, clearAppFilters, hasAppFilters }}
          />
        </TabsContent>
        <TabsContent value="training">
          <ApplicationExpensesTab
            expenses={appExpenses.training} loading={appExpensesLoading} type="training"
            formatCurrency={formatCurrency} formatDate={formatDate} getStatusColor={getStatusColor}
            filters={{ appStatusFilter, setAppStatusFilter, appDateFrom, setAppDateFrom, appDateTo, setAppDateTo, appAmountMin, setAppAmountMin, appAmountMax, setAppAmountMax, appSearchTerm, setAppSearchTerm, clearAppFilters, hasAppFilters }}
          />
        </TabsContent>

        <TabsContent value="additional">
          <Card className="bg-white border-slate-200">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                <div className="relative md:col-span-2">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input placeholder="Search expenses..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" data-testid="search-expenses-input" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger data-testid="filter-status"><SelectValue placeholder="All Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="reimbursed">Reimbursed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger data-testid="filter-category"><SelectValue placeholder="All Categories" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (<SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>))}
                  </SelectContent>
                </Select>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="pl-10" data-testid="filter-date-from" title="Date From" />
                </div>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="pl-10" data-testid="filter-date-to" title="Date To" />
                </div>
              </div>
              {hasActiveFilters && (
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-slate-500">Active filters:</span>
                  {statusFilter !== 'all' && <Badge variant="secondary" className="gap-1 text-xs">{statusFilter} <X className="w-3 h-3 cursor-pointer" onClick={() => setStatusFilter('all')} /></Badge>}
                  {categoryFilter !== 'all' && <Badge variant="secondary" className="gap-1 text-xs">{categoryFilter} <X className="w-3 h-3 cursor-pointer" onClick={() => setCategoryFilter('all')} /></Badge>}
                  {dateFrom && <Badge variant="secondary" className="gap-1 text-xs">From: {dateFrom} <X className="w-3 h-3 cursor-pointer" onClick={() => setDateFrom('')} /></Badge>}
                  {dateTo && <Badge variant="secondary" className="gap-1 text-xs">To: {dateTo} <X className="w-3 h-3 cursor-pointer" onClick={() => setDateTo('')} /></Badge>}
                  <Button variant="ghost" size="sm" className="text-xs h-6" onClick={clearFilters} data-testid="clear-filters-btn">Clear All</Button>
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="bg-white border-slate-200 mt-4">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8"><Receipt className="w-12 h-12 text-slate-300 mx-auto mb-4" /><p className="text-slate-600">No standalone expenses found</p></TableCell></TableRow>
                  ) : (
                    filteredExpenses.map((expense) => (
                      <TableRow key={expense.id} data-testid={`expense-row-${expense.id}`}>
                        <TableCell>
                          <div><p className="font-medium">{expense.title}</p>{expense.vendor && <p className="text-xs text-slate-500">{expense.vendor}</p>}</div>
                        </TableCell>
                        <TableCell><Badge className={getCategoryColor(expense.category)}>{categories.find(c => c.value === expense.category)?.label || expense.category}</Badge></TableCell>
                        <TableCell className="font-semibold">{formatCurrency(expense.amount)}</TableCell>
                        <TableCell>{formatDate(expense.date)}</TableCell>
                        <TableCell><Badge className={getStatusColor(expense.status)}>{expense.status}</Badge></TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {isAdmin && expense.status === 'pending' && (
                              <>
                                <Button variant="ghost" size="sm" className="text-emerald-600" onClick={() => handleApprove(expense.id)}><CheckCircle className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="sm" className="text-rose-600" onClick={() => handleReject(expense.id)}><XCircle className="w-4 h-4" /></Button>
                              </>
                            )}
                            {expense.status === 'pending' && (
                              <Button variant="ghost" size="sm" className="text-rose-600" onClick={() => handleDelete(expense.id)}><Trash2 className="w-4 h-4" /></Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Submit Expense to Application Dialog */}
      <Dialog open={submitDialog} onOpenChange={setSubmitDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Receipt className="w-5 h-5 text-primary" /> Submit Additional Expenses</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-5 pr-1">
            {/* Application Selector */}
            <div className="space-y-2">
              <Label className="font-semibold">Select Application *</Label>
              {loadingApps ? (
                <div className="flex items-center gap-2 text-slate-500 py-3"><Loader2 className="w-4 h-4 animate-spin" /> Loading applications...</div>
              ) : availableApps.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-lg text-center">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No applications available. Submit a bursary or training application first.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto border rounded-lg p-2">
                  {availableApps.map(app => (
                    <button
                      key={app.id}
                      onClick={() => selectApplication(app.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${selectedApp?.id === app.id ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
                      data-testid={`select-app-${app.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${app.type === 'bursary' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                            {app.type === 'bursary' ? <FileText className="w-4 h-4 text-blue-600" /> : <GraduationCap className="w-4 h-4 text-purple-600" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{app.applicant_name}</p>
                            <p className="text-xs text-slate-500">
                              {app.type === 'bursary' ? 'Bursary' : 'Training'} #{app.id.slice(0, 8)}
                              {app.type === 'training' && app.training_type && ` — ${app.training_type}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={`${getStatusColor(app.status)} text-xs`}>{app.status?.replace('_', ' ')}</Badge>
                          {app.requested_amount > 0 && (
                            <p className="text-xs text-slate-500 mt-1">Requested: {formatCurrency(app.requested_amount)}</p>
                          )}
                          {app.has_expenses && <Badge variant="outline" className="text-xs mt-1 ml-1 border-amber-300 text-amber-600">Has expenses</Badge>}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected App Info */}
            {selectedApp && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{selectedApp.applicant_name} — {selectedApp.type === 'bursary' ? 'Bursary' : 'Training'} Application</p>
                    <p className="text-xs text-slate-500">{selectedApp.user_email} | Status: {selectedApp.status}</p>
                  </div>
                  {selectedApp.requested_amount > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Requested Amount</p>
                      <p className="text-lg font-bold text-primary" data-testid="requested-amount">{formatCurrency(selectedApp.requested_amount)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Expense Fields */}
            <div className="space-y-3">
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
                      <Input type="number" placeholder="R 0.00" value={expForm[key]} onChange={(e) => setExpForm(f => ({ ...f, [key]: e.target.value }))} data-testid={`expense-${key}-amount`} />
                    </div>
                    <div className="col-span-2">
                      <Input placeholder="Notes (optional)" value={expForm[`${key}_notes`]} onChange={(e) => setExpForm(f => ({ ...f, [`${key}_notes`]: e.target.value }))} data-testid={`expense-${key}-notes`} />
                    </div>
                  </div>
                </div>
              ))}
              <div className="bg-slate-50 rounded-lg p-3 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Total Expenses</span>
                <span className="text-lg font-bold text-slate-900" data-testid="expenses-total">
                  {formatCurrency(expenseTotal)}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter className="pt-4 border-t">
            <Button variant="outline" onClick={() => setSubmitDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmitExpense} disabled={submitting || !selectedApp} data-testid="submit-expense-form-btn">
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Submitting...</> : <><Receipt className="w-4 h-4 mr-2" /> {selectedApp?.has_expenses ? 'Update Expenses' : 'Submit Expenses'}</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Application Expenses Tab with filters
const ApplicationExpensesTab = ({ expenses, loading, type, formatCurrency, formatDate, getStatusColor, filters }) => {
  const { appStatusFilter, setAppStatusFilter, appDateFrom, setAppDateFrom, appDateTo, setAppDateTo, appAmountMin, setAppAmountMin, appAmountMax, setAppAmountMax, appSearchTerm, setAppSearchTerm, clearAppFilters, hasAppFilters } = filters;

  const filtered = useMemo(() => {
    let data = [...expenses];
    if (appSearchTerm) {
      const s = appSearchTerm.toLowerCase();
      data = data.filter(e => (e.applicant_name || '').toLowerCase().includes(s) || (e.training_type || '').toLowerCase().includes(s) || (e.service_provider || '').toLowerCase().includes(s));
    }
    if (appStatusFilter !== 'all') data = data.filter(e => e.status === appStatusFilter);
    if (appDateFrom) data = data.filter(e => (e.created_at || e.submitted_at || '') >= appDateFrom);
    if (appDateTo) data = data.filter(e => (e.created_at || e.submitted_at || '') <= appDateTo + 'T23:59:59');
    if (appAmountMin) data = data.filter(e => e.total >= parseFloat(appAmountMin));
    if (appAmountMax) data = data.filter(e => e.total <= parseFloat(appAmountMax));
    return data;
  }, [expenses, appSearchTerm, appStatusFilter, appDateFrom, appDateTo, appAmountMin, appAmountMax]);

  const expenseCategories = [
    { key: 'flights', label: 'Flights' },
    { key: 'accommodation', label: 'Accommodation' },
    { key: 'car_hire_or_shuttle', label: 'Car Hire / Shuttle' },
    { key: 'catering', label: 'Catering' },
  ];

  const grandTotal = filtered.reduce((sum, e) => sum + (e.total || 0), 0);
  const grandRequested = filtered.reduce((sum, e) => sum + (e.requested_amount || 0), 0);
  const grandCombined = grandRequested + grandTotal;

  if (loading) {
    return <Card className="bg-white border-slate-200"><CardContent className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /></CardContent></Card>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Requested Amount</p>
              <p className="text-2xl font-bold text-primary" data-testid={`${type}-requested-total`}>{formatCurrency(grandRequested)}</p>
            </div>
            <div className="p-3 bg-primary/10 rounded-full"><DollarSign className="w-6 h-6 text-primary" /></div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Additional Expenses</p>
              <p className="text-2xl font-bold text-slate-900" data-testid={`${type}-expenses-total`}>{formatCurrency(grandTotal)}</p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-full"><Receipt className="w-6 h-6 text-emerald-600" /></div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200 border-2 border-primary/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 font-medium">Combined Total</p>
              <p className="text-2xl font-bold text-slate-900" data-testid={`${type}-combined-total`}>{formatCurrency(grandCombined)}</p>
            </div>
            <div className="p-3 bg-amber-100 rounded-full"><TrendingUp className="w-6 h-6 text-amber-600" /></div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Applications with Expenses</p>
              <p className="text-2xl font-bold text-slate-900">{filtered.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full"><TrendingUp className="w-6 h-6 text-blue-600" /></div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white border-slate-200">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input placeholder="Search by name, type..." value={appSearchTerm} onChange={(e) => setAppSearchTerm(e.target.value)} className="pl-10" data-testid={`${type}-search-input`} />
            </div>
            <Select value={appStatusFilter} onValueChange={setAppStatusFilter}>
              <SelectTrigger data-testid={`${type}-filter-status`}><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative">
              <CalendarDays className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input type="date" value={appDateFrom} onChange={(e) => setAppDateFrom(e.target.value)} className="pl-10" title="Date From" data-testid={`${type}-filter-date-from`} />
            </div>
            <div className="relative">
              <CalendarDays className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input type="date" value={appDateTo} onChange={(e) => setAppDateTo(e.target.value)} className="pl-10" title="Date To" data-testid={`${type}-filter-date-to`} />
            </div>
            <Input type="number" placeholder="Min amount" value={appAmountMin} onChange={(e) => setAppAmountMin(e.target.value)} data-testid={`${type}-filter-amount-min`} />
            <Input type="number" placeholder="Max amount" value={appAmountMax} onChange={(e) => setAppAmountMax(e.target.value)} data-testid={`${type}-filter-amount-max`} />
          </div>
          {hasAppFilters && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500">Active filters:</span>
              {appStatusFilter !== 'all' && <Badge variant="secondary" className="gap-1 text-xs">{appStatusFilter} <X className="w-3 h-3 cursor-pointer" onClick={() => setAppStatusFilter('all')} /></Badge>}
              {appDateFrom && <Badge variant="secondary" className="gap-1 text-xs">From: {appDateFrom} <X className="w-3 h-3 cursor-pointer" onClick={() => setAppDateFrom('')} /></Badge>}
              {appDateTo && <Badge variant="secondary" className="gap-1 text-xs">To: {appDateTo} <X className="w-3 h-3 cursor-pointer" onClick={() => setAppDateTo('')} /></Badge>}
              {appAmountMin && <Badge variant="secondary" className="gap-1 text-xs">Min: R{appAmountMin} <X className="w-3 h-3 cursor-pointer" onClick={() => setAppAmountMin('')} /></Badge>}
              {appAmountMax && <Badge variant="secondary" className="gap-1 text-xs">Max: R{appAmountMax} <X className="w-3 h-3 cursor-pointer" onClick={() => setAppAmountMax('')} /></Badge>}
              <Button variant="ghost" size="sm" className="text-xs h-6" onClick={clearAppFilters} data-testid={`${type}-clear-filters`}>Clear All</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-white border-slate-200">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applicant</TableHead>
                {type === 'training' && <TableHead>Training Type</TableHead>}
                <TableHead>Status</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Flights</TableHead>
                <TableHead>Accommodation</TableHead>
                <TableHead>Car Hire</TableHead>
                <TableHead>Catering</TableHead>
                <TableHead>Add. Expenses</TableHead>
                <TableHead className="text-right">Combined Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={type === 'training' ? 11 : 10} className="text-center py-8">
                    <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">No {type} application expenses found</p>
                    <p className="text-xs text-slate-400 mt-1">Use "Submit Expense" to add expenses to an application</p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item) => (
                  <TableRow key={item.application_id} data-testid={`app-expense-${item.application_id}`}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{item.applicant_name}</p>
                        <p className="text-xs text-slate-500">#{item.application_id?.slice(0, 8)}</p>
                        {item.created_at && <p className="text-xs text-slate-400">{formatDate(item.created_at)}</p>}
                      </div>
                    </TableCell>
                    {type === 'training' && <TableCell><p className="text-sm">{item.training_type || item.service_provider || '-'}</p></TableCell>}
                    <TableCell><Badge className={`${getStatusColor(item.status)} text-xs`}>{item.status?.replace('_', ' ')}</Badge></TableCell>
                    <TableCell className="font-semibold text-primary">{item.requested_amount > 0 ? formatCurrency(item.requested_amount) : '-'}</TableCell>
                    {expenseCategories.map(({ key }) => (
                      <TableCell key={key} className="text-sm">
                        {item.expenses?.[key] ? formatCurrency(item.expenses[key]) : '-'}
                        {item.expenses?.[`${key}_notes`] && <p className="text-xs text-slate-400 truncate max-w-[120px]">{item.expenses[`${key}_notes`]}</p>}
                      </TableCell>
                    ))}
                    <TableCell className="font-semibold">{formatCurrency(item.total)}</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency((item.requested_amount || 0) + (item.total || 0))}</TableCell>
                  </TableRow>
                ))
              )}
              {filtered.length > 0 && (
                <TableRow className="bg-slate-50 font-semibold">
                  <TableCell colSpan={type === 'training' ? 3 : 2}>Grand Total</TableCell>
                  <TableCell className="text-primary">{formatCurrency(grandRequested)}</TableCell>
                  {expenseCategories.map(({ key }) => (
                    <TableCell key={key}>{formatCurrency(filtered.reduce((s, e) => s + (e.expenses?.[key] || 0), 0))}</TableCell>
                  ))}
                  <TableCell>{formatCurrency(grandTotal)}</TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(grandCombined)}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpensesPage;
