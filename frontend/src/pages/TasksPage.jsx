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
import { tasksAPI } from '../services/api';
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
  MoreVertical
} from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';

const TasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('list');
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    assignee: 'all',
    search: ''
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await tasksAPI.getAll();
      setTasks(response.data);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mock tasks data
  const mockTasks = [
    {
      id: '1',
      title: 'Review bursary applications',
      description: 'Review and approve pending bursary applications for Q1',
      status: 'in_progress',
      priority: 'high',
      assignee: 'John Smith',
      dueDate: '2026-02-15',
      startDate: '2026-01-20',
      progress: 60,
      project: 'Bursary Management',
      tags: ['Review', 'Urgent']
    },
    {
      id: '2',
      title: 'Update sponsor database',
      description: 'Add new sponsor contacts and update existing information',
      status: 'todo',
      priority: 'medium',
      assignee: 'Sarah Johnson',
      dueDate: '2026-02-20',
      startDate: '2026-02-01',
      progress: 0,
      project: 'Sponsor Relations',
      tags: ['Database', 'Maintenance']
    },
    {
      id: '3',
      title: 'Prepare BBBEE compliance report',
      description: 'Compile BBBEE verification documents and scoring reports',
      status: 'completed',
      priority: 'high',
      assignee: 'Michael Chen',
      dueDate: '2026-01-30',
      startDate: '2026-01-15',
      progress: 100,
      project: 'Compliance',
      tags: ['BBBEE', 'Reports']
    },
    {
      id: '4',
      title: 'Schedule sponsor meetings',
      description: 'Organize Q1 review meetings with all active sponsors',
      status: 'in_progress',
      priority: 'medium',
      assignee: 'Lisa Van Der Merwe',
      dueDate: '2026-02-10',
      startDate: '2026-01-25',
      progress: 45,
      project: 'Sponsor Relations',
      tags: ['Meetings', 'Communication']
    },
    {
      id: '5',
      title: 'Create financial aid guidelines',
      description: 'Draft new guidelines for financial aid disbursement',
      status: 'todo',
      priority: 'low',
      assignee: 'David Nkosi',
      dueDate: '2026-03-01',
      startDate: '2026-02-15',
      progress: 0,
      project: 'Documentation',
      tags: ['Guidelines', 'Policy']
    },
    {
      id: '6',
      title: 'Fix application portal bugs',
      description: 'Resolve technical issues in the online application system',
      status: 'in_progress',
      priority: 'high',
      assignee: 'John Smith',
      dueDate: '2026-02-05',
      startDate: '2026-01-28',
      progress: 75,
      project: 'Technical',
      tags: ['Bug Fix', 'Urgent']
    },
    {
      id: '7',
      title: 'Conduct student interviews',
      description: 'Interview shortlisted candidates for premium bursaries',
      status: 'blocked',
      priority: 'medium',
      assignee: 'Sarah Johnson',
      dueDate: '2026-02-18',
      startDate: '2026-02-10',
      progress: 0,
      project: 'Student Affairs',
      tags: ['Interviews', 'Selection']
    },
    {
      id: '8',
      title: 'Update website content',
      description: 'Refresh homepage and program information pages',
      status: 'completed',
      priority: 'low',
      assignee: 'Michael Chen',
      dueDate: '2026-01-25',
      startDate: '2026-01-10',
      progress: 100,
      project: 'Marketing',
      tags: ['Website', 'Content']
    }
  ];

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
    return true;
  });

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

  return (
    <div className="space-y-6" data-testid="tasks-page">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-heading font-bold tracking-tight text-slate-900">Tasks</h2>
          <p className="text-slate-600 mt-1">Manage and track your tasks and projects</p>
        </div>
        <Button className="gap-2" data-testid="add-task-btn">
          <Plus className="w-4 h-4" />
          Add Task
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-white border-slate-200">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
            <Button
              variant="outline"
              onClick={() => setFilters({ status: 'all', priority: 'all', assignee: 'all', search: '' })}
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
                    <Button variant="ghost" size="sm">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Kanban View */}
        <TabsContent value="kanban">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {kanbanColumns.map(column => {
              const columnTasks = filteredTasks.filter(task => task.status === column.status);
              return (
                <div key={column.id} className="space-y-3">
                  <Card className="bg-slate-50 border-slate-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold flex items-center justify-between">
                        <span>{column.title}</span>
                        <Badge variant="secondary" className="ml-2">{columnTasks.length}</Badge>
                      </CardTitle>
                    </CardHeader>
                  </Card>
                  <div className="space-y-3">
                    {columnTasks.map(task => (
                      <Card key={task.id} className="bg-white border-slate-200 hover:shadow-md transition-all duration-200 cursor-move" data-testid={`kanban-task-${task.id}`}>
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
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
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