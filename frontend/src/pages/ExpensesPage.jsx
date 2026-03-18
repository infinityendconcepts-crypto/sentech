import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { expensesAPI, projectsAPI, sponsorsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import {
  Plus, Search, Receipt, DollarSign, TrendingUp, Clock,
  CheckCircle, XCircle, Trash2, Download, CalendarDays, X,
} from 'lucide-react';

const ExpensesPage = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [newExpenseDialog, setNewExpenseDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('additional');
  const [appExpenses, setAppExpenses] = useState({ bursary: [], training: [] });
  const [appExpensesLoading, setAppExpensesLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [newExpense, setNewExpense] = useState({
    title: '', description: '', amount: '', category: 'other',
    date: new Date().toISOString().split('T')[0],
    project_id: '', sponsor_id: '', vendor: '', notes: '',
  });

  const isAdmin = user?.roles?.includes('admin') || user?.roles?.includes('super_admin');

  const categories = [
    { value: 'travel', label: 'Travel' },
    { value: 'equipment', label: 'Equipment' },
    { value: 'software', label: 'Software' },
    { value: 'office', label: 'Office Supplies' },
    { value: 'training', label: 'Training' },
    { value: 'meals', label: 'Meals & Entertainment' },
    { value: 'utilities', label: 'Utilities' },
    { value: 'other', label: 'Other' },
  ];

  useEffect(() => {
    fetchExpenses();
    fetchStats();
    fetchProjects();
    fetchSponsors();
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
    try {
      const response = await expensesAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchProjects = async () => {
    try { const r = await projectsAPI.getAll(); setProjects(r.data); } catch {}
  };
  const fetchSponsors = async () => {
    try { const r = await sponsorsAPI.getAll(); setSponsors(r.data); } catch {}
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

  const handleCreateExpense = async () => {
    try {
      const expenseData = {
        ...newExpense, amount: parseFloat(newExpense.amount),
        date: new Date(newExpense.date).toISOString(),
        project_id: newExpense.project_id || null,
        sponsor_id: newExpense.sponsor_id || null,
      };
      await expensesAPI.create(expenseData);
      toast.success('Expense submitted successfully');
      setNewExpenseDialog(false);
      setNewExpense({ title: '', description: '', amount: '', category: 'other', date: new Date().toISOString().split('T')[0], project_id: '', sponsor_id: '', vendor: '', notes: '' });
      fetchExpenses();
      fetchStats();
    } catch { toast.error('Failed to submit expense'); }
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
      a.href = url;
      a.download = `expenses_${activeTab}_export.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export downloaded');
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = () => {
    setStatusFilter('all'); setCategoryFilter('all'); setSearchTerm('');
    setDateFrom(''); setDateTo('');
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount || 0);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-emerald-100 text-emerald-700';
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'rejected': return 'bg-rose-100 text-rose-700';
      case 'reimbursed': return 'bg-blue-100 text-blue-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      travel: 'bg-blue-100 text-blue-700', equipment: 'bg-purple-100 text-purple-700',
      software: 'bg-indigo-100 text-indigo-700', office: 'bg-amber-100 text-amber-700',
      training: 'bg-emerald-100 text-emerald-700', meals: 'bg-rose-100 text-rose-700',
      utilities: 'bg-slate-100 text-slate-700', other: 'bg-gray-100 text-gray-700',
    };
    return colors[category] || colors.other;
  };

  const filteredExpenses = expenses.filter(expense =>
    (expense.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (expense.vendor || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hasActiveFilters = statusFilter !== 'all' || categoryFilter !== 'all' || dateFrom || dateTo || searchTerm;

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-6" data-testid="expenses-page">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-heading font-bold tracking-tight text-slate-900">Expenses</h2>
          <p className="text-slate-600 mt-1">Track and manage expenses</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={handleExportExcel} disabled={exporting} data-testid="export-xlsx-btn">
            <Download className="w-4 h-4" />
            {exporting ? 'Exporting...' : 'Export XLSX'}
          </Button>
          <Dialog open={newExpenseDialog} onOpenChange={setNewExpenseDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2" data-testid="submit-expense-btn">
                <Plus className="w-4 h-4" /> Submit Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Submit New Expense</DialogTitle></DialogHeader>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={newExpense.title} onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })} placeholder="e.g., Office Supplies" data-testid="input-expense-title" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Amount (ZAR)</Label>
                    <Input type="number" step="0.01" value={newExpense.amount} onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })} placeholder="0.00" data-testid="input-expense-amount" />
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" value={newExpense.date} onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })} data-testid="input-expense-date" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={newExpense.category} onValueChange={(v) => setNewExpense({ ...newExpense, category: v })}>
                    <SelectTrigger data-testid="select-expense-category"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (<SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Vendor</Label>
                  <Input value={newExpense.vendor} onChange={(e) => setNewExpense({ ...newExpense, vendor: e.target.value })} placeholder="Vendor name" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Project (Optional)</Label>
                    <Select value={newExpense.project_id} onValueChange={(v) => setNewExpense({ ...newExpense, project_id: v === 'none' ? '' : v })}>
                      <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No project</SelectItem>
                        {projects.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Sponsor (Optional)</Label>
                    <Select value={newExpense.sponsor_id} onValueChange={(v) => setNewExpense({ ...newExpense, sponsor_id: v === 'none' ? '' : v })}>
                      <SelectTrigger><SelectValue placeholder="Select sponsor" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No sponsor</SelectItem>
                        {sponsors.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={newExpense.description} onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })} placeholder="Additional details..." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setNewExpenseDialog(false)}>Cancel</Button>
                <Button onClick={handleCreateExpense} data-testid="submit-expense-form-btn">Submit Expense</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
      <Tabs defaultValue="additional" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList className="bg-slate-100">
          <TabsTrigger value="additional" data-testid="tab-additional-expenses">Additional Expenses</TabsTrigger>
          <TabsTrigger value="bursary" onClick={fetchApplicationExpenses} data-testid="tab-bursary-expenses">Bursary Application</TabsTrigger>
          <TabsTrigger value="training" onClick={fetchApplicationExpenses} data-testid="tab-training-expenses">Training Application</TabsTrigger>
        </TabsList>

        <TabsContent value="additional">
          {/* Filters */}
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
                  <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="pl-10" placeholder="From" data-testid="filter-date-from" title="Date From" />
                </div>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="pl-10" placeholder="To" data-testid="filter-date-to" title="Date To" />
                </div>
              </div>
              {hasActiveFilters && (
                <div className="mt-3 flex items-center gap-2">
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

          {/* Expenses Table */}
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
                    <TableHead>Project/Sponsor</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-600">No expenses found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredExpenses.map((expense) => (
                      <TableRow key={expense.id} data-testid={`expense-row-${expense.id}`}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{expense.title}</p>
                            {expense.vendor && <p className="text-xs text-slate-500">{expense.vendor}</p>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getCategoryColor(expense.category)}>
                            {categories.find(c => c.value === expense.category)?.label || expense.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">{formatCurrency(expense.amount)}</TableCell>
                        <TableCell>{formatDate(expense.date)}</TableCell>
                        <TableCell><Badge className={getStatusColor(expense.status)}>{expense.status}</Badge></TableCell>
                        <TableCell>
                          {expense.project_id && <Badge variant="outline" className="text-xs">{projects.find(p => p.id === expense.project_id)?.name || 'Project'}</Badge>}
                          {expense.sponsor_id && <Badge variant="outline" className="text-xs ml-1">{sponsors.find(s => s.id === expense.sponsor_id)?.name || 'Sponsor'}</Badge>}
                        </TableCell>
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

        <TabsContent value="bursary">
          <ApplicationExpensesTable expenses={appExpenses.bursary} loading={appExpensesLoading} type="bursary" formatCurrency={formatCurrency} formatDate={formatDate} />
        </TabsContent>
        <TabsContent value="training">
          <ApplicationExpensesTable expenses={appExpenses.training} loading={appExpensesLoading} type="training" formatCurrency={formatCurrency} formatDate={formatDate} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const ApplicationExpensesTable = ({ expenses, loading, type, formatCurrency, formatDate }) => {
  if (loading) {
    return <Card className="bg-white border-slate-200"><CardContent className="p-8 text-center"><p className="text-slate-500">Loading expenses...</p></CardContent></Card>;
  }

  const expenseCategories = [
    { key: 'flights', label: 'Flights' },
    { key: 'accommodation', label: 'Accommodation' },
    { key: 'car_hire_or_shuttle', label: 'Car Hire / Shuttle' },
    { key: 'catering', label: 'Catering' },
  ];

  const grandTotal = expenses.reduce((sum, e) => sum + (e.total || 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total {type === 'bursary' ? 'Bursary' : 'Training'} Expenses</p>
              <p className="text-2xl font-bold text-slate-900" data-testid={`${type}-expenses-total`}>{formatCurrency(grandTotal)}</p>
            </div>
            <div className="p-3 bg-primary/10 rounded-full"><Receipt className="w-6 h-6 text-primary" /></div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Applications with Expenses</p>
              <p className="text-2xl font-bold text-slate-900">{expenses.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full"><TrendingUp className="w-6 h-6 text-blue-600" /></div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white border-slate-200">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applicant</TableHead>
                {type === 'training' && <TableHead>Training Type</TableHead>}
                <TableHead>Status</TableHead>
                <TableHead>Flights</TableHead>
                <TableHead>Accommodation</TableHead>
                <TableHead>Car Hire/Shuttle</TableHead>
                <TableHead>Catering</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={type === 'training' ? 8 : 7} className="text-center py-8">
                    <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">No {type} application expenses found</p>
                    <p className="text-xs text-slate-400 mt-1">Add expenses from the {type === 'bursary' ? 'Bursary' : 'Training'} Applications page</p>
                  </TableCell>
                </TableRow>
              ) : (
                expenses.map((item) => (
                  <TableRow key={item.application_id} data-testid={`app-expense-${item.application_id}`}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{item.applicant_name}</p>
                        <p className="text-xs text-slate-500">#{item.application_id?.slice(0, 8)}</p>
                      </div>
                    </TableCell>
                    {type === 'training' && <TableCell><p className="text-sm">{item.training_type || item.service_provider || '-'}</p></TableCell>}
                    <TableCell>
                      <Badge className={item.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : item.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}>
                        {item.status?.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    {expenseCategories.map(({ key }) => (
                      <TableCell key={key} className="text-sm">
                        {item.expenses?.[key] ? formatCurrency(item.expenses[key]) : '-'}
                        {item.expenses?.[`${key}_notes`] && <p className="text-xs text-slate-400 truncate max-w-[120px]">{item.expenses[`${key}_notes`]}</p>}
                      </TableCell>
                    ))}
                    <TableCell className="text-right font-semibold">{formatCurrency(item.total)}</TableCell>
                  </TableRow>
                ))
              )}
              {expenses.length > 0 && (
                <TableRow className="bg-slate-50 font-semibold">
                  <TableCell colSpan={type === 'training' ? 3 : 2}>Grand Total</TableCell>
                  {expenseCategories.map(({ key }) => (
                    <TableCell key={key}>{formatCurrency(expenses.reduce((s, e) => s + (e.expenses?.[key] || 0), 0))}</TableCell>
                  ))}
                  <TableCell className="text-right">{formatCurrency(grandTotal)}</TableCell>
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
