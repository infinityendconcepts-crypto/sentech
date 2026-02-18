import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { tasksAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  Plus, 
  Search,
  CheckCircle2,
  Clock,
  User,
  Calendar,
  ListTodo,
  LayoutGrid,
  GanttChart,
  Circle,
  CheckCircle,
  XCircle,
  MoreVertical,
  Download,
  FileSpreadsheet,
  FileText,
  Users,
  ClipboardCheck,
  CalendarDays,
  GraduationCap,
} from 'lucide-react';
import { DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors, useDroppable, useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';

// Draggable Training Module Card Component
const DraggableModuleCard = ({ module }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: module.id });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0 : 1,
    touchAction: 'none',
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const attendanceCount = module.attendance?.length || 0;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white border-slate-200 hover:shadow-md transition-shadow duration-200 cursor-grab active:cursor-grabbing"
      data-testid={`kanban-module-${module.id}`}
    >
      <CardContent className="p-4">
        <h4 className="font-semibold text-slate-900 mb-2">{module.title}</h4>
        <p className="text-xs text-slate-600 mb-3 line-clamp-2">{module.description}</p>
        <div className="space-y-2">
          <Badge className={`${getPriorityColor(module.priority)} text-xs`}>{module.priority}</Badge>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <User className="w-3 h-3" />
            {(module.assignee_name || module.assignee || 'Unassigned').split(' ')[0]}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Calendar className="w-3 h-3" />
            {(module.due_date || module.dueDate) ? new Date(module.due_date || module.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No date'}
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-600">
            <ClipboardCheck className="w-3 h-3" />
            {attendanceCount} attendance record{attendanceCount !== 1 ? 's' : ''}
          </div>
          {module.status === 'in_progress' && (
            <div className="pt-2">
              <div className="w-full bg-slate-200 rounded-full h-1.5">
                <div className="bg-primary h-1.5 rounded-full" style={{ width: `${module.progress || 0}%` }} />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Module Card Clone for DragOverlay
const ModuleCardOverlay = ({ module }) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-rose-100 text-rose-700';
      case 'medium': return 'bg-amber-100 text-amber-700';
      case 'low': return 'bg-blue-100 text-blue-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };
  return (
    <Card className="bg-white border-slate-300 shadow-2xl rotate-2 opacity-95 cursor-grabbing w-64">
      <CardContent className="p-4">
        <h4 className="font-semibold text-slate-900 text-sm">{module.title}</h4>
        <Badge className={`${getPriorityColor(module.priority)} text-xs mt-2`}>{module.priority}</Badge>
      </CardContent>
    </Card>
  );
};

// Droppable Column Component
const DroppableColumn = ({ id, title, count, children }) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex flex-col gap-3">
      <Card className="bg-slate-50 border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span>{title}</span>
            <Badge variant="secondary" className="ml-2">{count}</Badge>
          </CardTitle>
        </CardHeader>
      </Card>
      <div
        ref={setNodeRef}
        className={`flex flex-col gap-3 min-h-[200px] rounded-lg p-2 transition-colors duration-150 ${
          isOver ? 'bg-blue-50 border-2 border-dashed border-blue-300' : 'bg-transparent'
        }`}
      >
        {children}
      </div>
    </div>
  );
};

const TrainingTrackPage = () => {
  const { user } = useAuth();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('list');
  const [activeId, setActiveId] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    assignee: 'all',
    search: '',
    dateFrom: '',
    dateTo: '',
  });
  const [exporting, setExporting] = useState(false);
  const [addModuleDialog, setAddModuleDialog] = useState(false);
  const [savingModule, setSavingModule] = useState(false);
  const [newModule, setNewModule] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    assignee_name: '',
    due_date: '',
    project_name: '',
    tags: '',
    progress: 0,
  });

  // Attendance Dialog State
  const [attendanceDialog, setAttendanceDialog] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const [attendanceForm, setAttendanceForm] = useState({
    date: new Date().toISOString().split('T')[0],
    time_in: '',
    time_out: '',
    status: 'present',
    notes: '',
  });
  const [savingAttendance, setSavingAttendance] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    setLoading(true);
    try {
      const response = await tasksAPI.getAll();
      // Initialize attendance array if not present
      const modulesWithAttendance = response.data.map(m => ({
        ...m,
        attendance: m.attendance || []
      }));
      setModules(modulesWithAttendance);
    } catch (error) {
      console.error('Failed to fetch training modules:', error);
      toast.error('Failed to load training modules');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateModule = async () => {
    if (!newModule.title.trim()) {
      toast.error('Training module title is required');
      return;
    }
    setSavingModule(true);
    try {
      const moduleData = {
        title: newModule.title,
        description: newModule.description || null,
        status: newModule.status,
        priority: newModule.priority,
        assignee_name: newModule.assignee_name || null,
        due_date: newModule.due_date ? new Date(newModule.due_date).toISOString() : null,
        project_name: newModule.project_name || null,
        tags: newModule.tags ? newModule.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        progress: parseInt(newModule.progress) || 0,
        attendance: [],
      };
      await tasksAPI.create(moduleData);
      toast.success('Training module created successfully');
      setAddModuleDialog(false);
      setNewModule({ title: '', description: '', status: 'todo', priority: 'medium', assignee_name: '', due_date: '', project_name: '', tags: '', progress: 0 });
      fetchModules();
    } catch (error) {
      toast.error('Failed to create training module');
    } finally {
      setSavingModule(false);
    }
  };

  const handleDeleteModule = async (moduleId) => {
    try {
      await tasksAPI.delete(moduleId);
      toast.success('Training module deleted');
      fetchModules();
    } catch (error) {
      toast.error('Failed to delete training module');
    }
  };

  const handleStatusChange = async (moduleId, newStatus) => {
    try {
      await tasksAPI.update(moduleId, { status: newStatus });
      toast.success('Training module status updated');
      fetchModules();
    } catch (error) {
      toast.error('Failed to update training module');
    }
  };

  // Attendance functions
  const openAttendanceDialog = (module) => {
    setSelectedModule(module);
    setAttendanceForm({
      date: new Date().toISOString().split('T')[0],
      time_in: '',
      time_out: '',
      status: 'present',
      notes: '',
    });
    setAttendanceDialog(true);
  };

  const handleAddAttendance = async () => {
    if (!attendanceForm.date) {
      toast.error('Date is required');
      return;
    }
    if (!attendanceForm.time_in) {
      toast.error('Time in is required');
      return;
    }
    setSavingAttendance(true);
    try {
      const newAttendance = {
        id: `att_${Date.now()}`,
        date: attendanceForm.date,
        time_in: attendanceForm.time_in,
        time_out: attendanceForm.time_out || null,
        status: attendanceForm.status,
        notes: attendanceForm.notes || '',
        marked_by: user?.full_name || user?.email || 'Unknown',
        marked_at: new Date().toISOString(),
      };
      
      const updatedAttendance = [...(selectedModule.attendance || []), newAttendance];
      await tasksAPI.update(selectedModule.id, { attendance: updatedAttendance });
      
      toast.success('Attendance recorded successfully');
      setAttendanceDialog(false);
      fetchModules();
    } catch (error) {
      toast.error('Failed to record attendance');
    } finally {
      setSavingAttendance(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'medium':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'low':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'todo':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'blocked':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'in_progress':
        return <Clock className="w-4 h-4" />;
      case 'todo':
        return <Circle className="w-4 h-4" />;
      case 'blocked':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Circle className="w-4 h-4" />;
    }
  };

  const getAttendanceStatusColor = (status) => {
    switch (status) {
      case 'present':
        return 'bg-emerald-100 text-emerald-700';
      case 'absent':
        return 'bg-rose-100 text-rose-700';
      case 'late':
        return 'bg-amber-100 text-amber-700';
      case 'excused':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const filteredModules = modules.filter(module => {
    const moduleDueDate = module.due_date || module.dueDate || '';
    const moduleAssignee = module.assignee_name || module.assignee || '';
    if (filters.status !== 'all' && module.status !== filters.status) return false;
    if (filters.priority !== 'all' && module.priority !== filters.priority) return false;
    if (filters.assignee !== 'all' && moduleAssignee !== filters.assignee) return false;
    if (filters.search && !module.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.dateFrom && moduleDueDate < filters.dateFrom) return false;
    if (filters.dateTo && moduleDueDate > filters.dateTo) return false;
    return true;
  });

  const handleExport = async (format) => {
    setExporting(true);
    try {
      const params = {};
      if (filters.status !== 'all') params.status = filters.status;
      if (filters.priority !== 'all') params.priority = filters.priority;
      if (filters.dateFrom) params.date_from = filters.dateFrom;
      if (filters.dateTo) params.date_to = filters.dateTo;

      const response = format === 'excel'
        ? await tasksAPI.exportExcel(params)
        : await tasksAPI.exportPdf(params);

      const blob = new Blob([response.data], {
        type: format === 'excel'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'application/pdf',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = format === 'excel' ? 'training_modules_export.xlsx' : 'training_modules_export.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`Training modules exported as ${format.toUpperCase()} successfully`);
    } catch (error) {
      toast.error('Export failed. Please try again.');
      console.error('Export error:', error);
    } finally {
      setExporting(false);
    }
  };

  const kanbanColumns = [
    { id: 'todo', title: 'To Do', status: 'todo' },
    { id: 'in_progress', title: 'In Progress', status: 'in_progress' },
    { id: 'blocked', title: 'Blocked', status: 'blocked' },
    { id: 'completed', title: 'Completed', status: 'completed' }
  ];

  // Gantt chart helper - calculate position
  const getGanttPosition = (startDate, dueDate) => {
    const start = new Date(startDate);
    const end = new Date(dueDate);
    const today = new Date('2026-01-01');
    const daysSinceStart = Math.floor((start - today) / (1000 * 60 * 60 * 24));
    const duration = Math.floor((end - start) / (1000 * 60 * 60 * 24));
    return { left: daysSinceStart * 40, width: duration * 40 };
  };

  const activeModule = activeId ? modules.find(t => t.id === activeId) : null;

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const module = modules.find(t => t.id === active.id);
    if (module && module.status !== over.id) {
      handleStatusChange(active.id, over.id);
    }
  };

  const uniqueAssignees = [...new Set(modules.map(t => t.assignee_name || t.assignee).filter(Boolean))];

  return (
    <div className="space-y-6" data-testid="training-track-page">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-heading font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-primary" />
            Training Track
          </h2>
          <p className="text-slate-600 mt-1">Manage training modules and track attendance</p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2" disabled={exporting} data-testid="export-btn">
                <Download className="w-4 h-4" />
                {exporting ? 'Exporting...' : 'Export'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('excel')} data-testid="export-excel">
                <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
                Export to Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf')} data-testid="export-pdf">
                <FileText className="w-4 h-4 mr-2 text-red-600" />
                Export to PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button className="gap-2" onClick={() => setAddModuleDialog(true)} data-testid="add-module-btn">
            <Plus className="w-4 h-4" />
            Add Training Module
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-white border-slate-200">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search training modules..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10"
                data-testid="search-modules-input"
              />
            </div>
            <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
              <SelectTrigger data-testid="filter-status">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.priority} onValueChange={(value) => setFilters({ ...filters, priority: value })}>
              <SelectTrigger data-testid="filter-priority">
                <SelectValue placeholder="All Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.assignee} onValueChange={(value) => setFilters({ ...filters, assignee: value })}>
              <SelectTrigger data-testid="filter-assignee">
                <SelectValue placeholder="All Assignees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignees</SelectItem>
                {uniqueAssignees.map(assignee => (
                  <SelectItem key={assignee} value={assignee}>{assignee}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-600">Due Date:</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500">From</label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="w-36 text-sm"
                data-testid="filter-date-from"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500">To</label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="w-36 text-sm"
                data-testid="filter-date-to"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters({ status: 'all', priority: 'all', assignee: 'all', search: '', dateFrom: '', dateTo: '' })}
              data-testid="clear-filters-btn"
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* View Tabs */}
      <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="list" className="gap-2" data-testid="view-list">
            <ListTodo className="w-4 h-4" />
            List
          </TabsTrigger>
          <TabsTrigger value="kanban" className="gap-2" data-testid="view-kanban">
            <LayoutGrid className="w-4 h-4" />
            Kanban
          </TabsTrigger>
          <TabsTrigger value="gantt" className="gap-2" data-testid="view-gantt">
            <GanttChart className="w-4 h-4" />
            Gantt
          </TabsTrigger>
        </TabsList>

        {/* List View */}
        <TabsContent value="list" className="space-y-3">
          {filteredModules.length === 0 ? (
            <Card className="bg-white border-slate-200">
              <CardContent className="p-12 text-center">
                <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-heading font-semibold text-slate-900 mb-2">No training modules found</h3>
                <p className="text-slate-600">Try adjusting your filters or create a new training module</p>
              </CardContent>
            </Card>
          ) : (
            filteredModules.map(module => (
              <Card key={module.id} className="bg-white border-slate-200 hover:shadow-md transition-all duration-200" data-testid={`module-card-${module.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="mt-1">
                          {getStatusIcon(module.status)}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-heading font-semibold text-slate-900 mb-1">{module.title}</h3>
                          <p className="text-sm text-slate-600 mb-3">{module.description}</p>
                          <div className="flex flex-wrap items-center gap-3">
                            <Badge className={`${getStatusColor(module.status)} gap-1`}>
                              {module.status.replace('_', ' ')}
                            </Badge>
                            <Badge className={`${getPriorityColor(module.priority)}`}>
                              {module.priority}
                            </Badge>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <User className="w-4 h-4" />
                              {module.assignee_name || module.assignee || 'Unassigned'}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Calendar className="w-4 h-4" />
                              Due: {(module.due_date || module.dueDate) ? new Date(module.due_date || module.dueDate).toLocaleDateString() : 'No date'}
                            </div>
                            {(module.tags || []).map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      {/* Attendance Section */}
                      <div className="ml-7 mt-4 p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <ClipboardCheck className="w-4 h-4" />
                            Attendance Records ({module.attendance?.length || 0})
                          </h4>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={() => openAttendanceDialog(module)}
                            data-testid={`mark-attendance-${module.id}`}
                          >
                            <Plus className="w-3 h-3" />
                            Mark Attendance
                          </Button>
                        </div>
                        {module.attendance && module.attendance.length > 0 ? (
                          <div className="space-y-2">
                            {module.attendance.slice(-3).map((att, idx) => (
                              <div key={att.id || idx} className="flex items-center justify-between text-sm bg-white p-2 rounded border border-slate-200">
                                <div className="flex items-center gap-3">
                                  <CalendarDays className="w-4 h-4 text-slate-400" />
                                  <span className="font-medium">{att.date}</span>
                                  <span className="text-slate-500">{att.time_in} - {att.time_out || 'Ongoing'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge className={`${getAttendanceStatusColor(att.status)} text-xs`}>
                                    {att.status}
                                  </Badge>
                                  {att.notes && (
                                    <span className="text-xs text-slate-500 max-w-[150px] truncate">{att.notes}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                            {module.attendance.length > 3 && (
                              <p className="text-xs text-slate-500 text-center">+ {module.attendance.length - 3} more records</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500">No attendance records yet</p>
                        )}
                      </div>

                      {module.status === 'in_progress' && (
                        <div className="ml-7 mt-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-slate-600">Progress</span>
                            <span className="text-xs font-semibold text-slate-900">{module.progress || 0}%</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all duration-300"
                              style={{ width: `${module.progress || 0}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" data-testid={`module-menu-${module.id}`}>
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openAttendanceDialog(module)}>
                          <ClipboardCheck className="w-4 h-4 mr-2" />
                          Mark Attendance
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(module.id, 'todo')}>
                          <Circle className="w-4 h-4 mr-2" />
                          Mark as To Do
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(module.id, 'in_progress')}>
                          <Clock className="w-4 h-4 mr-2" />
                          Mark as In Progress
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(module.id, 'blocked')}>
                          <XCircle className="w-4 h-4 mr-2" />
                          Mark as Blocked
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(module.id, 'completed')}>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Mark as Completed
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteModule(module.id)} className="text-red-600">
                          <XCircle className="w-4 h-4 mr-2" />
                          Delete Module
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Kanban View */}
        <TabsContent value="kanban">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {kanbanColumns.map(column => {
                const columnModules = filteredModules.filter(module => module.status === column.status);
                return (
                  <DroppableColumn key={column.id} id={column.status} title={column.title} count={columnModules.length}>
                    {columnModules.map(module => (
                      <DraggableModuleCard key={module.id} module={module} />
                    ))}
                  </DroppableColumn>
                );
              })}
            </div>
            <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
              {activeModule ? <ModuleCardOverlay module={activeModule} /> : null}
            </DragOverlay>
          </DndContext>
        </TabsContent>

        {/* Gantt View */}
        <TabsContent value="gantt">
          <Card className="bg-white border-slate-200">
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <div className="min-w-[1200px]">
                  {/* Gantt Header */}
                  <div className="flex border-b border-slate-200 pb-2 mb-4">
                    <div className="w-64 font-semibold text-sm text-slate-700">Training Module</div>
                    <div className="flex-1 grid grid-cols-12 gap-1 text-xs text-slate-600 text-center">
                      {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(month => (
                        <div key={month} className="font-medium">{month}</div>
                      ))}
                    </div>
                  </div>

                  {/* Gantt Rows */}
                  <div className="space-y-3">
                    {filteredModules.map(module => {
                      const startDate = module.start_date || module.startDate;
                      const dueDate = module.due_date || module.dueDate;
                      const position = getGanttPosition(startDate, dueDate);
                      const assignee = module.assignee_name || module.assignee || '';
                      return (
                        <div key={module.id} className="flex items-center" data-testid={`gantt-module-${module.id}`}>
                          <div className="w-64">
                            <div className="text-sm font-medium text-slate-900 truncate">{module.title}</div>
                            <div className="text-xs text-slate-600 flex items-center gap-2 mt-1">
                              <User className="w-3 h-3" />
                              {assignee.split(' ')[0]}
                            </div>
                          </div>
                          <div className="flex-1 relative h-10">
                            <div className="absolute inset-0 grid grid-cols-12">
                              {[...Array(12)].map((_, i) => (
                                <div key={i} className="border-r border-slate-100" />
                              ))}
                            </div>
                            <div
                              className={`absolute top-2 h-6 rounded ${getPriorityColor(module.priority)} flex items-center px-2 text-xs font-medium`}
                              style={{ left: `${position.left}px`, width: `${Math.max(position.width, 60)}px` }}
                            >
                              <span className="truncate">{module.progress || 0}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Training Module Dialog */}
      <Dialog open={addModuleDialog} onOpenChange={setAddModuleDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Training Module</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Title *</Label>
              <Input
                placeholder="Training module title"
                value={newModule.title}
                onChange={(e) => setNewModule({ ...newModule, title: e.target.value })}
                data-testid="new-module-title"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                placeholder="Describe the training module..."
                value={newModule.description}
                onChange={(e) => setNewModule({ ...newModule, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Select value={newModule.status} onValueChange={(v) => setNewModule({ ...newModule, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={newModule.priority} onValueChange={(v) => setNewModule({ ...newModule, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Assignee</Label>
                <Input
                  placeholder="Assignee name"
                  value={newModule.assignee_name}
                  onChange={(e) => setNewModule({ ...newModule, assignee_name: e.target.value })}
                />
              </div>
              <div>
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={newModule.due_date}
                  onChange={(e) => setNewModule({ ...newModule, due_date: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Project</Label>
              <Input
                placeholder="Project name"
                value={newModule.project_name}
                onChange={(e) => setNewModule({ ...newModule, project_name: e.target.value })}
              />
            </div>
            <div>
              <Label>Tags (comma separated)</Label>
              <Input
                placeholder="e.g. urgent, review, compliance"
                value={newModule.tags}
                onChange={(e) => setNewModule({ ...newModule, tags: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddModuleDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateModule} disabled={savingModule} data-testid="save-module-btn">
              {savingModule ? 'Creating...' : 'Create Module'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Attendance Dialog */}
      <Dialog open={attendanceDialog} onOpenChange={setAttendanceDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-primary" />
              Mark Attendance
            </DialogTitle>
          </DialogHeader>
          {selectedModule && (
            <div className="space-y-4 py-2">
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-sm text-slate-600">Training Module:</p>
                <p className="font-semibold text-slate-900">{selectedModule.title}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={attendanceForm.date}
                    onChange={(e) => setAttendanceForm({ ...attendanceForm, date: e.target.value })}
                    data-testid="attendance-date"
                  />
                </div>
                <div>
                  <Label>Status *</Label>
                  <Select 
                    value={attendanceForm.status} 
                    onValueChange={(v) => setAttendanceForm({ ...attendanceForm, status: v })}
                  >
                    <SelectTrigger data-testid="attendance-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="present">Present</SelectItem>
                      <SelectItem value="absent">Absent</SelectItem>
                      <SelectItem value="late">Late</SelectItem>
                      <SelectItem value="excused">Excused</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Time In *</Label>
                  <Input
                    type="time"
                    value={attendanceForm.time_in}
                    onChange={(e) => setAttendanceForm({ ...attendanceForm, time_in: e.target.value })}
                    data-testid="attendance-time-in"
                  />
                </div>
                <div>
                  <Label>Time Out</Label>
                  <Input
                    type="time"
                    value={attendanceForm.time_out}
                    onChange={(e) => setAttendanceForm({ ...attendanceForm, time_out: e.target.value })}
                    data-testid="attendance-time-out"
                  />
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  placeholder="Optional notes about attendance..."
                  value={attendanceForm.notes}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, notes: e.target.value })}
                  rows={2}
                  data-testid="attendance-notes"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAttendanceDialog(false)}>Cancel</Button>
            <Button onClick={handleAddAttendance} disabled={savingAttendance} data-testid="save-attendance-btn">
              {savingAttendance ? 'Saving...' : 'Save Attendance'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrainingTrackPage;
