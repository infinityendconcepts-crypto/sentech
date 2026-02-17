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
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  User,
  Calendar,
  ListTodo,
  LayoutGrid,
  GanttChart,
  ChevronRight,
  Circle,
  CheckCircle,
  XCircle,
  MoreVertical,
  Download,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';

// Draggable Task Card Component
const DraggableTaskCard = ({ task }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
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

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white border-slate-200 hover:shadow-md transition-all duration-200 cursor-move"
      data-testid={`kanban-task-${task.id}`}
    >
      <CardContent className="p-4">
        <h4 className="font-semibold text-slate-900 mb-2">{task.title}</h4>
        <p className="text-xs text-slate-600 mb-3 line-clamp-2">{task.description}</p>
        <div className="space-y-2">
          <Badge className={`${getPriorityColor(task.priority)} text-xs`}>
            {task.priority}
          </Badge>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <User className="w-3 h-3" />
            {task.assignee.split(' ')[0]}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Calendar className="w-3 h-3" />
            {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
          {task.status === 'in_progress' && (
            <div className="pt-2">
              <div className="w-full bg-slate-200 rounded-full h-1.5">
                <div
                  className="bg-primary h-1.5 rounded-full"
                  style={{ width: `${task.progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Droppable Column Component
const DroppableColumn = ({ id, title, count, children }) => {
  const { setNodeRef } = useSortable({ id });

  return (
    <div ref={setNodeRef} className="space-y-3">
      <Card className="bg-slate-50 border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span>{title}</span>
            <Badge variant="secondary" className="ml-2">{count}</Badge>
          </CardTitle>
        </CardHeader>
      </Card>
      <SortableContext items={React.Children.map(children, child => child.key)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3 min-h-[200px]">
          {children}
        </div>
      </SortableContext>
    </div>
  );
};

const TasksPage = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('list');
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    assignee: 'all',
    search: '',
    dateFrom: '',
    dateTo: '',
  });
  const [exporting, setExporting] = useState(false);
  const [addTaskDialog, setAddTaskDialog] = useState(false);
  const [savingTask, setSavingTask] = useState(false);
  const [newTask, setNewTask] = useState({
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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await tasksAPI.getAll();
      setTasks(response.data);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) {
      toast.error('Task title is required');
      return;
    }
    setSavingTask(true);
    try {
      const taskData = {
        ...newTask,
        tags: newTask.tags ? newTask.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        progress: parseInt(newTask.progress) || 0,
      };
      await tasksAPI.create(taskData);
      toast.success('Task created successfully');
      setAddTaskDialog(false);
      setNewTask({ title: '', description: '', status: 'todo', priority: 'medium', assignee_name: '', due_date: '', project_name: '', tags: '', progress: 0 });
      fetchTasks();
    } catch (error) {
      toast.error('Failed to create task');
    } finally {
      setSavingTask(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await tasksAPI.delete(taskId);
      toast.success('Task deleted');
      fetchTasks();
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await tasksAPI.update(taskId, { status: newStatus });
      toast.success('Task status updated');
      fetchTasks();
    } catch (error) {
      toast.error('Failed to update task');
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

  const filteredTasks = mockTasks.filter(task => {
    if (filters.status !== 'all' && task.status !== filters.status) return false;
    if (filters.priority !== 'all' && task.priority !== filters.priority) return false;
    if (filters.assignee !== 'all' && task.assignee !== filters.assignee) return false;
    if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.dateFrom && task.dueDate < filters.dateFrom) return false;
    if (filters.dateTo && task.dueDate > filters.dateTo) return false;
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
      a.download = format === 'excel' ? 'tasks_export.xlsx' : 'tasks_export.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`Tasks exported as ${format.toUpperCase()} successfully`);
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

  const uniqueAssignees = [...new Set(mockTasks.map(t => t.assignee))];

  // Gantt chart helper - calculate position
  const getGanttPosition = (startDate, dueDate) => {
    const start = new Date(startDate);
    const end = new Date(dueDate);
    const today = new Date('2026-01-01');
    const daysSinceStart = Math.floor((start - today) / (1000 * 60 * 60 * 24));
    const duration = Math.floor((end - start) / (1000 * 60 * 60 * 24));
    return { left: daysSinceStart * 40, width: duration * 40 };
  };

  const handleStatusChange = (taskId, newStatus) => {
    // In a real app, this would update the backend
    console.log(`Changing task ${taskId} to status ${newStatus}`);
    toast.success(`Task status changed to ${newStatus.replace('_', ' ')}`);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over) return;

    const activeTask = mockTasks.find(t => t.id === active.id);
    const overColumnStatus = over.id;

    if (activeTask && activeTask.status !== overColumnStatus) {
      handleStatusChange(active.id, overColumnStatus);
      toast.success(`Task moved to ${overColumnStatus.replace('_', ' ')}`);
    }
  };

  return (
    <div className="space-y-6" data-testid="tasks-page">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-heading font-bold tracking-tight text-slate-900">Tasks</h2>
          <p className="text-slate-600 mt-1">Manage and track your tasks and projects</p>
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
          <Button className="gap-2" data-testid="add-task-btn">
            <Plus className="w-4 h-4" />
            Add Task
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
                placeholder="Search tasks..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10"
                data-testid="search-tasks-input"
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
          {filteredTasks.length === 0 ? (
            <Card className="bg-white border-slate-200">
              <CardContent className="p-12 text-center">
                <ListTodo className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-heading font-semibold text-slate-900 mb-2">No tasks found</h3>
                <p className="text-slate-600">Try adjusting your filters or create a new task</p>
              </CardContent>
            </Card>
          ) : (
            filteredTasks.map(task => (
              <Card key={task.id} className="bg-white border-slate-200 hover:shadow-md transition-all duration-200" data-testid={`task-card-${task.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="mt-1">
                          {getStatusIcon(task.status)}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-heading font-semibold text-slate-900 mb-1">{task.title}</h3>
                          <p className="text-sm text-slate-600 mb-3">{task.description}</p>
                          <div className="flex flex-wrap items-center gap-3">
                            <Badge className={`${getStatusColor(task.status)} gap-1`}>
                              {task.status.replace('_', ' ')}
                            </Badge>
                            <Badge className={`${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </Badge>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <User className="w-4 h-4" />
                              {task.assignee}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Calendar className="w-4 h-4" />
                              Due: {new Date(task.dueDate).toLocaleDateString()}
                            </div>
                            {task.tags.map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      {task.status === 'in_progress' && (
                        <div className="ml-7">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-slate-600">Progress</span>
                            <span className="text-xs font-semibold text-slate-900">{task.progress}%</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all duration-300"
                              style={{ width: `${task.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" data-testid={`task-menu-${task.id}`}>
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'todo')}>
                          <Circle className="w-4 h-4 mr-2" />
                          Mark as To Do
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'in_progress')}>
                          <Clock className="w-4 h-4 mr-2" />
                          Mark as In Progress
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'blocked')}>
                          <XCircle className="w-4 h-4 mr-2" />
                          Mark as Blocked
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'completed')}>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Mark as Completed
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
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {kanbanColumns.map(column => {
                const columnTasks = filteredTasks.filter(task => task.status === column.status);
                return (
                  <DroppableColumn key={column.id} id={column.status} title={column.title} count={columnTasks.length}>
                    {columnTasks.map(task => (
                      <DraggableTaskCard key={task.id} task={task} />
                    ))}
                  </DroppableColumn>
                );
              })}
            </div>
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
                    <div className="w-64 font-semibold text-sm text-slate-700">Task Name</div>
                    <div className="flex-1 grid grid-cols-12 gap-1 text-xs text-slate-600 text-center">
                      {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(month => (
                        <div key={month} className="font-medium">{month}</div>
                      ))}
                    </div>
                  </div>

                  {/* Gantt Rows */}
                  <div className="space-y-3">
                    {filteredTasks.map(task => {
                      const position = getGanttPosition(task.startDate, task.dueDate);
                      return (
                        <div key={task.id} className="flex items-center" data-testid={`gantt-task-${task.id}`}>
                          <div className="w-64">
                            <div className="text-sm font-medium text-slate-900 truncate">{task.title}</div>
                            <div className="text-xs text-slate-600 flex items-center gap-2 mt-1">
                              <User className="w-3 h-3" />
                              {task.assignee.split(' ')[0]}
                            </div>
                          </div>
                          <div className="flex-1 relative h-10">
                            <div className="absolute inset-0 grid grid-cols-12">
                              {[...Array(12)].map((_, i) => (
                                <div key={i} className="border-r border-slate-100" />
                              ))}
                            </div>
                            <div
                              className={`absolute top-2 h-6 rounded ${getPriorityColor(task.priority)} flex items-center px-2 text-xs font-medium`}
                              style={{ left: `${position.left}px`, width: `${Math.max(position.width, 60)}px` }}
                            >
                              <span className="truncate">{task.progress}%</span>
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
    </div>
  );
};

export default TasksPage;