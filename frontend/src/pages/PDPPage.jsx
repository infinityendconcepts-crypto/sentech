import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { pdpAPI, usersAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import {
  Plus,
  TrendingUp,
  Target,
  BookOpen,
  Users,
  CheckSquare,
  Calendar,
  MoreVertical,
  Edit2,
  Trash2,
  Search,
  Filter,
  ChevronDown,
  CheckCircle2,
  Clock,
  AlertCircle,
  Circle,
  Eye,
  X,
  User,
  Upload,
  Download,
  FileSpreadsheet,
} from 'lucide-react';
import * as XLSX from 'xlsx';

const STATUS_CONFIG = {
  not_started: { label: 'Not Started', color: 'bg-slate-100 text-slate-600', icon: Circle },
  in_progress:  { label: 'In Progress',  color: 'bg-blue-100 text-blue-700',   icon: Clock },
  completed:    { label: 'Completed',    color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  overdue:      { label: 'Overdue',      color: 'bg-rose-100 text-rose-700',   icon: AlertCircle },
};

const PRIORITY_CONFIG = {
  low:    { label: 'Low',    color: 'bg-slate-100 text-slate-600' },
  medium: { label: 'Medium', color: 'bg-amber-100 text-amber-700' },
  high:   { label: 'High',   color: 'bg-red-100 text-red-700' },
};

const CATEGORIES = [
  'Technical Skills', 'Soft Skills', 'Leadership', 'Communication',
  'Academic', 'Research', 'Industry Knowledge', 'Personal Growth', 'Other',
];

const COLUMN_HEADERS = [
  { key: 'learn_what',        label: 'Skills gap',          icon: BookOpen,    color: 'text-blue-600',    bg: 'bg-blue-50' },
  { key: 'action_plan',       label: 'What will I do to achieve this?',    icon: Target,      color: 'text-purple-600',  bg: 'bg-purple-50' },
  { key: 'resources_support', label: 'What resources or support will I need?', icon: Users,  color: 'text-amber-600',   bg: 'bg-amber-50' },
  { key: 'success_criteria',  label: 'What will my success criteria be?',  icon: CheckSquare, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { key: 'target_date',       label: 'Target dates for review and completion', icon: Calendar, color: 'text-rose-600',  bg: 'bg-rose-50' },
];

const emptyForm = {
  learn_what: '',
  action_plan: '',
  resources_support: '',
  success_criteria: '',
  target_date: '',
  review_date: '',
  status: 'not_started',
  priority: 'medium',
  category: '',
  notes: '',
  assigned_to: '',
  assigned_to_name: '',
};

const PDPPage = () => {
  const { isAdmin, user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [viewEntry, setViewEntry] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterUser, setFilterUser] = useState('all');
  const [activeStep, setActiveStep] = useState(0); // wizard step in dialog
  
  // Excel import state
  const [importDialog, setImportDialog] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importPreview, setImportPreview] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => { 
    fetchEntries(); 
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await pdpAPI.getAll();
      setEntries(res.data);
    } catch {
      toast.error('Failed to load development plan entries');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await usersAPI.getAll();
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  // Excel Import Functions
  const downloadSampleSpreadsheet = () => {
    const sampleData = [
      {
        'Skills Gap': 'Example: Data Analysis using Python',
        'Action Plan': 'Complete online course on Coursera, practice with real datasets',
        'Resources/Support': 'Coursera subscription, mentor guidance, Python documentation',
        'Success Criteria': 'Complete 3 data analysis projects, obtain certification',
        'Target Date': '2025-06-30',
        'Review Date': '2025-03-31',
        'Status': 'not_started',
        'Priority': 'high',
        'Category': 'Technical Skills',
      },
      {
        'Skills Gap': 'Example: Public Speaking',
        'Action Plan': 'Join Toastmasters, present at team meetings monthly',
        'Resources/Support': 'Toastmasters membership, feedback from manager',
        'Success Criteria': 'Deliver 5 presentations without notes',
        'Target Date': '2025-08-31',
        'Review Date': '2025-05-15',
        'Status': 'in_progress',
        'Priority': 'medium',
        'Category': 'Soft Skills',
      },
    ];
    
    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'PDP Template');
    
    // Set column widths
    ws['!cols'] = [
      { wch: 30 }, { wch: 50 }, { wch: 40 }, { wch: 40 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 10 }, { wch: 20 }
    ];
    
    XLSX.writeFile(wb, 'PDP_Import_Template.xlsx');
    toast.success('Sample spreadsheet downloaded');
  };

  const handleFileImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Map Excel columns to form fields
        const mappedData = jsonData.map(row => ({
          learn_what: row['Skills Gap'] || '',
          action_plan: row['Action Plan'] || '',
          resources_support: row['Resources/Support'] || '',
          success_criteria: row['Success Criteria'] || '',
          target_date: row['Target Date'] || '',
          review_date: row['Review Date'] || '',
          status: row['Status'] || 'not_started',
          priority: row['Priority'] || 'medium',
          category: row['Category'] || '',
        }));
        
        setImportPreview(mappedData);
        setImportDialog(true);
      } catch (error) {
        console.error('Error parsing file:', error);
        toast.error('Failed to parse Excel file. Please check the format.');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const handleImportConfirm = async () => {
    if (importPreview.length === 0) {
      toast.error('No data to import');
      return;
    }
    
    setImporting(true);
    try {
      let successCount = 0;
      for (const entry of importPreview) {
        if (entry.learn_what) {
          await pdpAPI.create({
            ...entry,
            assigned_to: user?.id,
            assigned_to_name: user?.full_name || user?.email,
            assigned_to_email: user?.email,
          });
          successCount++;
        }
      }
      toast.success(`Successfully imported ${successCount} entries`);
      setImportDialog(false);
      setImportPreview([]);
      fetchEntries();
    } catch (error) {
      toast.error('Failed to import some entries');
    } finally {
      setImporting(false);
    }
  };

  const openCreate = () => {
    setEditingEntry(null);
    setForm(emptyForm);
    setActiveStep(0);
    setShowDialog(true);
  };

  const openEdit = (entry) => {
    setEditingEntry(entry);
    setForm({
      learn_what: entry.learn_what || '',
      action_plan: entry.action_plan || '',
      resources_support: entry.resources_support || '',
      success_criteria: entry.success_criteria || '',
      target_date: entry.target_date || '',
      review_date: entry.review_date || '',
      status: entry.status || 'not_started',
      priority: entry.priority || 'medium',
      category: entry.category || '',
      notes: entry.notes || '',
      assigned_to: entry.assigned_to || '',
      assigned_to_name: entry.assigned_to_name || '',
    });
    setActiveStep(0);
    setShowDialog(true);
  };

  const openView = (entry) => {
    setViewEntry(entry);
    setViewDialog(true);
  };

  const handleSave = async () => {
    if (!form.learn_what.trim()) { toast.error('Please fill in your skills gap'); return; }
    if (!form.action_plan.trim()) { toast.error('Please fill in your action plan'); return; }
    if (!form.resources_support.trim()) { toast.error('Please fill in resources & support needed'); return; }
    if (!form.success_criteria.trim()) { toast.error('Please fill in your success criteria'); return; }
    if (isAdmin && !form.assigned_to) { toast.error('Please select a user to assign this goal to'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        // If not admin, assign to self
        assigned_to: isAdmin ? form.assigned_to : user?.id,
        assigned_to_name: isAdmin ? form.assigned_to_name : (user?.full_name || user?.email),
        assigned_to_email: isAdmin ? form.assigned_to_email : user?.email,
      };
      if (editingEntry) {
        await pdpAPI.update(editingEntry.id, payload);
        toast.success('Entry updated successfully');
      } else {
        await pdpAPI.create(payload);
        toast.success('Development plan entry added');
      }
      setShowDialog(false);
      fetchEntries();
    } catch {
      toast.error('Failed to save entry');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await pdpAPI.delete(id);
      toast.success('Entry deleted');
      setDeleteConfirm(null);
      fetchEntries();
    } catch {
      toast.error('Failed to delete entry');
    }
  };

  const handleStatusChange = async (entry, newStatus) => {
    try {
      await pdpAPI.update(entry.id, { status: newStatus });
      toast.success('Status updated');
      fetchEntries();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const filtered = entries.filter(e => {
    if (filterStatus !== 'all' && e.status !== filterStatus) return false;
    if (filterPriority !== 'all' && e.priority !== filterPriority) return false;
    if (filterUser !== 'all' && e.assigned_to !== filterUser) return false;
    if (search && !e.learn_what.toLowerCase().includes(search.toLowerCase()) &&
        !e.action_plan.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: entries.length,
    in_progress: entries.filter(e => e.status === 'in_progress').length,
    completed: entries.filter(e => e.status === 'completed').length,
    overdue: entries.filter(e => e.status === 'overdue').length,
  };

  // Wizard steps config
  const steps = [
    { key: 'learn_what',        label: 'Skills Gap',    icon: BookOpen,    question: 'What is your skills gap?', placeholder: 'Describe the skill, knowledge, or competency you need to develop...' },
    { key: 'action_plan',       label: 'Action Plan',      icon: Target,      question: 'What will I do to achieve this?', placeholder: 'Describe specific steps, courses, projects or activities you will undertake...' },
    { key: 'resources_support', label: 'Resources',        icon: Users,       question: 'What resources or support will I need?', placeholder: 'List books, courses, mentors, tools, or colleagues that can help...' },
    { key: 'success_criteria',  label: 'Success Criteria', icon: CheckSquare, question: 'What will my success criteria be?', placeholder: 'Define measurable outcomes that will tell you when you\'ve succeeded...' },
    { key: 'dates',             label: 'Dates & Details',  icon: Calendar,    question: 'Target dates for review and completion' },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-heading font-bold tracking-tight text-slate-900">Personal Development Plan</h2>
          <p className="text-slate-500 mt-1">Track your learning goals, actions, resources, and milestones</p>
        </div>
        <Button onClick={openCreate} className="gap-2 self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          Add Development Goal
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Goals',  value: stats.total,       color: 'text-slate-700',    bg: 'bg-slate-50',    border: 'border-slate-200' },
          { label: 'In Progress',  value: stats.in_progress, color: 'text-blue-700',     bg: 'bg-blue-50',     border: 'border-blue-200' },
          { label: 'Completed',    value: stats.completed,   color: 'text-emerald-700',  bg: 'bg-emerald-50',  border: 'border-emerald-200' },
          { label: 'Overdue',      value: stats.overdue,     color: 'text-rose-700',     bg: 'bg-rose-50',     border: 'border-rose-200' },
        ].map(s => (
          <Card key={s.label} className={`${s.bg} border ${s.border}`}>
            <CardContent className="p-4">
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-sm text-slate-500 mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <Input
            className="pl-9"
            placeholder="Search goals..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {isAdmin && (
          <Select value={filterUser} onValueChange={setFilterUser}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Users" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {users.map(u => (
                <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(filterStatus !== 'all' || filterPriority !== 'all' || filterUser !== 'all' || search) && (
          <Button variant="ghost" size="sm" className="gap-1 text-slate-500" onClick={() => { setFilterStatus('all'); setFilterPriority('all'); setFilterUser('all'); setSearch(''); }}>
            <X className="w-3 h-3" /> Clear
          </Button>
        )}
      </div>

      {/* Table View */}
      {filtered.length === 0 ? (
        <Card className="bg-white border-slate-200">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-1">
              {entries.length === 0 ? 'Start your development journey' : 'No matching goals'}
            </h3>
            <p className="text-slate-500 text-sm text-center max-w-sm mb-6">
              {entries.length === 0
                ? 'Add your first personal development goal and track your progress through each milestone.'
                : 'Try adjusting your search or filters.'}
            </p>
            {entries.length === 0 && (
              <Button onClick={openCreate} className="gap-2">
                <Plus className="w-4 h-4" /> Add Your First Goal
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {isAdmin && (
                    <th className="px-4 py-3 text-left font-semibold text-slate-700 min-w-[150px]">
                      <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-indigo-50 w-fit">
                        <User className="w-4 h-4 text-indigo-600" />
                        <span className="text-xs text-indigo-600">Assigned To</span>
                      </div>
                    </th>
                  )}
                  {COLUMN_HEADERS.map(col => (
                    <th key={col.key} className="px-4 py-3 text-left font-semibold text-slate-700 min-w-[200px]">
                      <div className={`flex items-center gap-2 px-2 py-1 rounded-lg ${col.bg} w-fit`}>
                        <col.icon className={`w-4 h-4 ${col.color}`} />
                        <span className={`text-xs ${col.color}`}>{col.label}</span>
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 min-w-[120px]">Status / Priority</th>
                  <th className="px-4 py-3 w-12" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(entry => {
                  const st = STATUS_CONFIG[entry.status] || STATUS_CONFIG.not_started;
                  const pr = PRIORITY_CONFIG[entry.priority] || PRIORITY_CONFIG.medium;
                  const StIcon = st.icon;
                  return (
                    <tr key={entry.id} className="hover:bg-slate-50/60 transition-colors group">
                      {/* Assigned To */}
                      {isAdmin && (
                        <td className="px-4 py-4 align-top">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-indigo-600" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 text-sm">
                                {entry.assigned_to_name || 'Unassigned'}
                              </p>
                              {entry.assigned_to_email && (
                                <p className="text-xs text-slate-500">{entry.assigned_to_email}</p>
                              )}
                            </div>
                          </div>
                        </td>
                      )}
                      {/* What to learn */}
                      <td className="px-4 py-4 align-top">
                        <div className="space-y-1">
                          <p className="font-medium text-slate-900 line-clamp-2">{entry.learn_what}</p>
                          {entry.category && (
                            <Badge variant="outline" className="text-xs">{entry.category}</Badge>
                          )}
                        </div>
                      </td>
                      {/* Action plan */}
                      <td className="px-4 py-4 align-top">
                        <p className="text-slate-600 line-clamp-3">{entry.action_plan}</p>
                      </td>
                      {/* Resources */}
                      <td className="px-4 py-4 align-top">
                        <p className="text-slate-600 line-clamp-3">{entry.resources_support}</p>
                      </td>
                      {/* Success criteria */}
                      <td className="px-4 py-4 align-top">
                        <p className="text-slate-600 line-clamp-3">{entry.success_criteria}</p>
                      </td>
                      {/* Target dates */}
                      <td className="px-4 py-4 align-top">
                        <div className="space-y-1 text-xs text-slate-500">
                          {entry.review_date && (
                            <div className="flex items-center gap-1">
                              <span className="text-slate-400">Review:</span>
                              <span className="font-medium text-slate-700">{new Date(entry.review_date).toLocaleDateString('en-ZA')}</span>
                            </div>
                          )}
                          {entry.target_date && (
                            <div className="flex items-center gap-1">
                              <span className="text-slate-400">Complete:</span>
                              <span className="font-medium text-slate-700">{new Date(entry.target_date).toLocaleDateString('en-ZA')}</span>
                            </div>
                          )}
                          {!entry.review_date && !entry.target_date && (
                            <span className="text-slate-400 italic">No dates set</span>
                          )}
                        </div>
                      </td>
                      {/* Status / Priority */}
                      <td className="px-4 py-4 align-top">
                        <div className="space-y-1.5">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${st.color} hover:opacity-80`}>
                                <StIcon className="w-3 h-3" />
                                {st.label}
                                <ChevronDown className="w-3 h-3 opacity-60" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                                <DropdownMenuItem key={k} onClick={() => handleStatusChange(entry, k)}>
                                  <v.icon className="w-4 h-4 mr-2" />
                                  {v.label}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${pr.color}`}>
                            {pr.label}
                          </span>
                        </div>
                      </td>
                      {/* Actions */}
                      <td className="px-2 py-4 align-top">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openView(entry)}>
                              <Eye className="w-4 h-4 mr-2" /> View Full
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(entry)}>
                              <Edit2 className="w-4 h-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-rose-600" onClick={() => setDeleteConfirm(entry.id)}>
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add / Edit Dialog — Wizard style */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-slate-900">
              {editingEntry ? 'Edit Development Goal' : 'Add Development Goal'}
            </DialogTitle>
            {/* Step indicators */}
            <div className="flex items-center gap-2 pt-2">
              {steps.map((s, idx) => (
                <button
                  key={s.key}
                  onClick={() => setActiveStep(idx)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                    idx === activeStep
                      ? 'bg-primary text-white'
                      : idx < activeStep
                      ? 'bg-primary/20 text-primary'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <s.icon className="w-3 h-3" />
                  <span className="hidden sm:inline">{s.label}</span>
                  <span className="sm:hidden">{idx + 1}</span>
                </button>
              ))}
            </div>
          </DialogHeader>

          <div className="py-2 min-h-[260px]">
            {activeStep < 4 ? (
              /* Steps 0–3: single text fields */
              <div className="space-y-3">
                <div className={`flex items-center gap-3 p-4 rounded-xl ${COLUMN_HEADERS[activeStep]?.bg || 'bg-slate-50'}`}>
                  {React.createElement(steps[activeStep].icon, { className: `w-6 h-6 ${COLUMN_HEADERS[activeStep]?.color || 'text-primary'}` })}
                  <p className={`font-semibold text-base ${COLUMN_HEADERS[activeStep]?.color || 'text-primary'}`}>
                    {steps[activeStep].question}
                  </p>
                </div>
                <Textarea
                  rows={7}
                  placeholder={steps[activeStep].placeholder}
                  value={form[steps[activeStep].key]}
                  onChange={e => setForm(f => ({ ...f, [steps[activeStep].key]: e.target.value }))}
                  className="resize-none"
                />
              </div>
            ) : (
              /* Step 4: dates + meta */
              <div className="space-y-4">
                <div className={`flex items-center gap-3 p-4 rounded-xl ${COLUMN_HEADERS[4]?.bg || 'bg-rose-50'}`}>
                  <Calendar className={`w-6 h-6 ${COLUMN_HEADERS[4]?.color || 'text-rose-600'}`} />
                  <p className={`font-semibold text-base ${COLUMN_HEADERS[4]?.color || 'text-rose-600'}`}>
                    {steps[4].question}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {/* User Selection - Admin Only */}
                  {isAdmin && (
                    <div className="col-span-2">
                      <Label className="text-xs text-slate-500 uppercase tracking-wide">Assign To User *</Label>
                      <Select 
                        value={form.assigned_to} 
                        onValueChange={v => {
                          const selectedUser = users.find(u => u.id === v);
                          setForm(f => ({ 
                            ...f, 
                            assigned_to: v,
                            assigned_to_name: selectedUser?.full_name || selectedUser?.email || '',
                            assigned_to_email: selectedUser?.email || ''
                          }));
                        }}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select a user" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map(u => (
                            <SelectItem key={u.id} value={u.id}>
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-slate-400" />
                                <span>{u.full_name || u.email}</span>
                                {u.full_name && <span className="text-slate-400 text-xs">({u.email})</span>}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div>
                    <Label className="text-xs text-slate-500 uppercase tracking-wide">Review Date</Label>
                    <Input type="date" className="mt-1" value={form.review_date} onChange={e => setForm(f => ({ ...f, review_date: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500 uppercase tracking-wide">Completion Date</Label>
                    <Input type="date" className="mt-1" value={form.target_date} onChange={e => setForm(f => ({ ...f, target_date: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500 uppercase tracking-wide">Status</Label>
                    <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500 uppercase tracking-wide">Priority</Label>
                    <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500 uppercase tracking-wide">Category</Label>
                    <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500 uppercase tracking-wide">Notes (optional)</Label>
                    <Input className="mt-1" placeholder="Any additional notes..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            {activeStep > 0 && (
              <Button variant="outline" onClick={() => setActiveStep(s => s - 1)}>Back</Button>
            )}
            {activeStep < steps.length - 1 ? (
              <Button onClick={() => setActiveStep(s => s + 1)}>
                Next →
              </Button>
            ) : (
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editingEntry ? 'Update Goal' : 'Save Goal'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full View Dialog */}
      {viewEntry && (
        <Dialog open={viewDialog} onOpenChange={setViewDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-slate-900 pr-6">Development Goal Details</DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                {viewEntry.category && <Badge variant="outline">{viewEntry.category}</Badge>}
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CONFIG[viewEntry.status]?.color}`}>
                  {STATUS_CONFIG[viewEntry.status]?.label}
                </span>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_CONFIG[viewEntry.priority]?.color}`}>
                  {PRIORITY_CONFIG[viewEntry.priority]?.label} Priority
                </span>
              </div>
            </DialogHeader>
            <div className="space-y-4 py-2 max-h-[65vh] overflow-y-auto">
              {COLUMN_HEADERS.map((col, idx) => {
                const value = idx < 4 ? viewEntry[col.key] : null;
                return (
                  <div key={col.key} className={`rounded-xl p-4 ${col.bg}`}>
                    <div className={`flex items-center gap-2 mb-2`}>
                      <col.icon className={`w-4 h-4 ${col.color}`} />
                      <p className={`text-xs font-semibold uppercase tracking-wide ${col.color}`}>{col.label}</p>
                    </div>
                    {idx < 4 ? (
                      <p className="text-slate-700 text-sm whitespace-pre-wrap">{value || '—'}</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-slate-500 text-xs">Review:</span>
                          <p className="font-medium text-slate-800">{viewEntry.review_date ? new Date(viewEntry.review_date).toLocaleDateString('en-ZA') : '—'}</p>
                        </div>
                        <div>
                          <span className="text-slate-500 text-xs">Completion:</span>
                          <p className="font-medium text-slate-800">{viewEntry.target_date ? new Date(viewEntry.target_date).toLocaleDateString('en-ZA') : '—'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {viewEntry.notes && (
                <div className="rounded-xl p-4 bg-slate-50">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Notes</p>
                  <p className="text-slate-700 text-sm whitespace-pre-wrap">{viewEntry.notes}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewDialog(false)}>Close</Button>
              <Button onClick={() => { setViewDialog(false); openEdit(viewEntry); }} className="gap-2">
                <Edit2 className="w-4 h-4" /> Edit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Goal</DialogTitle></DialogHeader>
          <p className="text-slate-600 text-sm">Are you sure you want to delete this development goal? This cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => handleDelete(deleteConfirm)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PDPPage;
