import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { expensesAPI, projectsAPI, sponsorsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Receipt,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
  Download,
  Eye,
  Trash2,
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
  const [newExpenseDialog, setNewExpenseDialog] = useState(false);
  // Application expenses
  const [appExpenses, setAppExpenses] = useState({ bursary: [], training: [] });
  const [appExpensesLoading, setAppExpensesLoading] = useState(false);
  const [newExpense, setNewExpense] = useState({
    title: '',
    description: '',
    amount: '',
    category: 'other',
    date: new Date().toISOString().split('T')[0],
    project_id: '',
    sponsor_id: '',
    vendor: '',
    notes: '',
  });

  const isAdmin = user?.roles?.includes('admin');

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
  }, [statusFilter, categoryFilter]);

  const fetchExpenses = async () => {
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (categoryFilter !== 'all') params.category = categoryFilter;
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
    try {
      const response = await projectsAPI.getAll();
      setProjects(response.data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  const fetchSponsors = async () => {
    try {
      const response = await sponsorsAPI.getAll();
      setSponsors(response.data);
    } catch (error) {
      console.error('Failed to fetch sponsors:', error);
    }
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
        ...newExpense,
        amount: parseFloat(newExpense.amount),
        date: new Date(newExpense.date).toISOString(),
        project_id: newExpense.project_id || null,
        sponsor_id: newExpense.sponsor_id || null,
      };
      await expensesAPI.create(expenseData);
      toast.success('Expense submitted successfully');
      setNewExpenseDialog(false);
      setNewExpense({
        title: '',
        description: '',
        amount: '',
        category: 'other',
        date: new Date().toISOString().split('T')[0],
        project_id: '',
        sponsor_id: '',
        vendor: '',
        notes: '',
      });
      fetchExpenses();
      fetchStats();
    } catch (error) {
      toast.error('Failed to submit expense');
    }
  };

  const handleApprove = async (expenseId) => {
    try {
      await expensesAPI.approve(expenseId);
      toast.success('Expense approved');
      fetchExpenses();
      fetchStats();
    } catch (error) {
      toast.error('Failed to approve expense');
    }
  };

  const handleReject = async (expenseId) => {
    try {
      await expensesAPI.reject(expenseId, 'Rejected by admin');
      toast.success('Expense rejected');
      fetchExpenses();
      fetchStats();
    } catch (error) {
      toast.error('Failed to reject expense');
    }
  };

  const handleDelete = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      await expensesAPI.delete(expenseId);
      toast.success('Expense deleted');
      fetchExpenses();
      fetchStats();
    } catch (error) {
      toast.error('Failed to delete expense');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
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
      travel: 'bg-blue-100 text-blue-700',
      equipment: 'bg-purple-100 text-purple-700',
      software: 'bg-indigo-100 text-indigo-700',
      office: 'bg-amber-100 text-amber-700',
      training: 'bg-emerald-100 text-emerald-700',
      meals: 'bg-rose-100 text-rose-700',
      utilities: 'bg-slate-100 text-slate-700',
      other: 'bg-gray-100 text-gray-700',
    };
    return colors[category] || colors.other;
  };

  const filteredExpenses = expenses.filter(expense =>
    expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.vendor?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="expenses-page">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-heading font-bold tracking-tight text-slate-900">Expenses</h2>
          <p className="text-slate-600 mt-1">Track and manage expenses</p>
        </div>
        <Dialog open={newExpenseDialog} onOpenChange={setNewExpenseDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="submit-expense-btn">
              <Plus className="w-4 h-4" />
              Submit Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Submit New Expense</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={newExpense.title}
                  onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                  placeholder="e.g., Office Supplies"
                  data-testid="input-expense-title"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Amount (ZAR)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    placeholder="0.00"
                    data-testid="input-expense-amount"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={newExpense.date}
                    onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                    data-testid="input-expense-date"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={newExpense.category}
                  onValueChange={(value) => setNewExpense({ ...newExpense, category: value })}
                >
                  <SelectTrigger data-testid="select-expense-category">
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
                <Label>Vendor</Label>
                <Input
                  value={newExpense.vendor}
                  onChange={(e) => setNewExpense({ ...newExpense, vendor: e.target.value })}
                  placeholder="Vendor name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Project (Optional)</Label>
                  <Select
                    value={newExpense.project_id}
                    onValueChange={(value) => setNewExpense({ ...newExpense, project_id: value === 'none' ? '' : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No project</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sponsor (Optional)</Label>
                  <Select
                    value={newExpense.sponsor_id}
                    onValueChange={(value) => setNewExpense({ ...newExpense, sponsor_id: value === 'none' ? '' : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select sponsor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No sponsor</SelectItem>
                      {sponsors.map((sponsor) => (
                        <SelectItem key={sponsor.id} value={sponsor.id}>{sponsor.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  placeholder="Additional details..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewExpenseDialog(false)}>Cancel</Button>
              <Button onClick={handleCreateExpense} data-testid="submit-expense-form-btn">Submit Expense</Button>
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
                <p className="text-sm text-slate-600">Total Expenses</p>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(stats?.total)}</p>
              </div>
              <div className="p-3 bg-slate-100 rounded-full">
                <DollarSign className="w-6 h-6 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Pending</p>
                <p className="text-2xl font-bold text-amber-600">{formatCurrency(stats?.pending)}</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-full">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Approved</p>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(stats?.approved)}</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Count</p>
                <p className="text-2xl font-bold text-slate-900">{stats?.count || 0}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <Receipt className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for expense types */}
      <Tabs defaultValue="additional" className="space-y-4">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="additional" data-testid="tab-additional-expenses">Additional Expenses</TabsTrigger>
          <TabsTrigger value="bursary" onClick={fetchApplicationExpenses} data-testid="tab-bursary-expenses">Bursary Application</TabsTrigger>
          <TabsTrigger value="training" onClick={fetchApplicationExpenses} data-testid="tab-training-expenses">Training Application</TabsTrigger>
        </TabsList>

        {/* Additional / Standalone Expenses Tab */}
        <TabsContent value="additional">
      {/* Filters */}
      <Card className="bg-white border-slate-200">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="search-expenses-input"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger data-testid="filter-status">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="reimbursed">Reimbursed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger data-testid="filter-category">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => { setStatusFilter('all'); setCategoryFilter('all'); setSearchTerm(''); }}
            >
              Clear Filters
            </Button>
          </div>
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
                        {expense.vendor && (
                          <p className="text-xs text-slate-500">{expense.vendor}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getCategoryColor(expense.category)}>
                        {categories.find(c => c.value === expense.category)?.label || expense.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(expense.amount)}
                    </TableCell>
                    <TableCell>{formatDate(expense.date)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(expense.status)}>
                        {expense.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {expense.project_id && (
                        <Badge variant="outline" className="text-xs">
                          {projects.find(p => p.id === expense.project_id)?.name || 'Project'}
                        </Badge>
                      )}
                      {expense.sponsor_id && (
                        <Badge variant="outline" className="text-xs ml-1">
                          {sponsors.find(s => s.id === expense.sponsor_id)?.name || 'Sponsor'}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {isAdmin && expense.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-emerald-600"
                              onClick={() => handleApprove(expense.id)}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-rose-600"
                              onClick={() => handleReject(expense.id)}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        {expense.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-rose-600"
                            onClick={() => handleDelete(expense.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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

        {/* Bursary Application Expenses Tab */}
        <TabsContent value="bursary">
          <ApplicationExpensesTable
            expenses={appExpenses.bursary}
            loading={appExpensesLoading}
            type="bursary"
            formatCurrency={formatCurrency}
            formatDate={formatDate}
          />
        </TabsContent>

        {/* Training Application Expenses Tab */}
        <TabsContent value="training">
          <ApplicationExpensesTable
            expenses={appExpenses.training}
            loading={appExpensesLoading}
            type="training"
            formatCurrency={formatCurrency}
            formatDate={formatDate}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const ApplicationExpensesTable = ({ expenses, loading, type, formatCurrency, formatDate }) => {
  if (loading) {
    return (
      <Card className="bg-white border-slate-200">
        <CardContent className="p-8 text-center">
          <p className="text-slate-500">Loading expenses...</p>
        </CardContent>
      </Card>
    );
  }

  const expenseCategories = [
    { key: 'flights', label: 'Flights', icon: '✈️' },
    { key: 'accommodation', label: 'Accommodation', icon: '🏨' },
    { key: 'car_hire_or_shuttle', label: 'Car Hire / Shuttle', icon: '🚗' },
    { key: 'catering', label: 'Catering', icon: '🍽️' },
  ];

  const grandTotal = expenses.reduce((sum, e) => sum + (e.total || 0), 0);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total {type === 'bursary' ? 'Bursary' : 'Training'} Expenses</p>
              <p className="text-2xl font-bold text-slate-900" data-testid={`${type}-expenses-total`}>{formatCurrency(grandTotal)}</p>
            </div>
            <div className="p-3 bg-primary/10 rounded-full">
              <Receipt className="w-6 h-6 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Applications with Expenses</p>
              <p className="text-2xl font-bold text-slate-900">{expenses.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
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
                    {type === 'training' && (
                      <TableCell>
                        <p className="text-sm">{item.training_type || item.service_provider || '-'}</p>
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge className={
                        item.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                        item.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-700'
                      }>
                        {item.status?.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    {expenseCategories.map(({ key }) => (
                      <TableCell key={key} className="text-sm">
                        {item.expenses?.[key] ? formatCurrency(item.expenses[key]) : '-'}
                        {item.expenses?.[`${key}_notes`] && (
                          <p className="text-xs text-slate-400 truncate max-w-[120px]">{item.expenses[`${key}_notes`]}</p>
                        )}
                      </TableCell>
                    ))}
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(item.total)}
                    </TableCell>
                  </TableRow>
                ))
              )}
              {expenses.length > 0 && (
                <TableRow className="bg-slate-50 font-semibold">
                  <TableCell colSpan={type === 'training' ? 3 : 2}>Grand Total</TableCell>
                  {expenseCategories.map(({ key }) => (
                    <TableCell key={key}>
                      {formatCurrency(expenses.reduce((s, e) => s + (e.expenses?.[key] || 0), 0))}
                    </TableCell>
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
